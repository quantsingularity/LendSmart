const nodemailer = require('nodemailer');
const twilio = require('twilio');
const webpush = require('web-push');
const { logger } = require('../../utils/logger');
const { AppError } = require('../../middleware/monitoring/errorHandler');

/**
 * Notification Service for LendSmart
 * Handles email, SMS, push notifications, and in-app notifications
 * with comprehensive delivery tracking and retry mechanisms
 */
class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.retryAttempts = 3;
    this.retryDelay = 2000;

    // Notification templates
    this.templates = {
      email: {
        loanApproved: {
          subject: 'Loan Application Approved - LendSmart',
          template: 'loan-approved'
        },
        loanRejected: {
          subject: 'Loan Application Update - LendSmart',
          template: 'loan-rejected'
        },
        paymentReminder: {
          subject: 'Payment Reminder - LendSmart',
          template: 'payment-reminder'
        },
        paymentReceived: {
          subject: 'Payment Confirmation - LendSmart',
          template: 'payment-received'
        },
        kycRequired: {
          subject: 'Identity Verification Required - LendSmart',
          template: 'kyc-required'
        },
        accountSuspended: {
          subject: 'Account Security Alert - LendSmart',
          template: 'account-suspended'
        }
      },
      sms: {
        loanApproved: 'Your loan application has been approved! Check your LendSmart account for details.',
        paymentReminder: 'Payment reminder: Your loan payment of ${amount} is due on ${dueDate}.',
        paymentReceived: 'Payment received: Thank you for your payment of ${amount}.',
        securityAlert: 'Security alert: Unusual activity detected on your LendSmart account.'
      }
    };

    this.initialize();
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      // Initialize email transporter
      if (process.env.SMTP_HOST) {
        this.emailTransporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100
        });

        // Verify email connection
        await this.emailTransporter.verify();
        logger.info('Email transporter initialized successfully');
      }

      // Initialize Twilio client
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        logger.info('Twilio client initialized successfully');
      }

      // Initialize web push
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          'mailto:' + (process.env.VAPID_EMAIL || 'admin@lendsmart.com'),
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        logger.info('Web push initialized successfully');
      }

      logger.info('Notification service initialized');

    } catch (error) {
      logger.error('Failed to initialize notification service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Send email notification
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.template - Template name
   * @param {Object} emailData.data - Template data
   * @param {Object} emailData.options - Additional options
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailData) {
    try {
      logger.info('Sending email notification', {
        to: emailData.to,
        template: emailData.template
      });

      if (!this.emailTransporter) {
        throw new AppError('Email service not configured', 500, 'EMAIL_CONFIG_ERROR');
      }

      // Validate email data
      this._validateEmailData(emailData);

      // Get template configuration
      const templateConfig = this.templates.email[emailData.template];
      if (!templateConfig) {
        throw new AppError(`Email template not found: ${emailData.template}`, 400, 'TEMPLATE_ERROR');
      }

      // Generate email content
      const emailContent = await this._generateEmailContent(templateConfig, emailData.data);

      // Prepare email options
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@lendsmart.com',
        to: emailData.to,
        subject: this._processTemplate(templateConfig.subject, emailData.data),
        html: emailContent.html,
        text: emailContent.text,
        ...emailData.options
      };

      // Send email with retry logic
      const result = await this._executeWithRetry(async () => {
        return await this.emailTransporter.sendMail(mailOptions);
      });

      // Log successful delivery
      await this._logNotificationDelivery('EMAIL', {
        to: emailData.to,
        template: emailData.template,
        messageId: result.messageId,
        status: 'SENT'
      });

      logger.info('Email sent successfully', {
        to: emailData.to,
        template: emailData.template,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'SMTP',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to send email', {
        to: emailData.to,
        template: emailData.template,
        error: error.message,
        stack: error.stack
      });

      // Log failed delivery
      await this._logNotificationDelivery('EMAIL', {
        to: emailData.to,
        template: emailData.template,
        status: 'FAILED',
        error: error.message
      });

      throw new AppError(
        'Failed to send email notification',
        500,
        'EMAIL_SEND_ERROR',
        { originalError: error.message, to: emailData.to }
      );
    }
  }

  /**
   * Send SMS notification
   * @param {Object} smsData - SMS data
   * @param {string} smsData.to - Recipient phone number
   * @param {string} smsData.template - Template name
   * @param {Object} smsData.data - Template data
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(smsData) {
    try {
      logger.info('Sending SMS notification', {
        to: smsData.to,
        template: smsData.template
      });

      if (!this.twilioClient) {
        throw new AppError('SMS service not configured', 500, 'SMS_CONFIG_ERROR');
      }

      // Validate SMS data
      this._validateSMSData(smsData);

      // Get template
      const template = this.templates.sms[smsData.template];
      if (!template) {
        throw new AppError(`SMS template not found: ${smsData.template}`, 400, 'TEMPLATE_ERROR');
      }

      // Process template
      const message = this._processTemplate(template, smsData.data);

      // Send SMS with retry logic
      const result = await this._executeWithRetry(async () => {
        return await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: smsData.to
        });
      });

      // Log successful delivery
      await this._logNotificationDelivery('SMS', {
        to: smsData.to,
        template: smsData.template,
        messageId: result.sid,
        status: 'SENT'
      });

      logger.info('SMS sent successfully', {
        to: smsData.to,
        template: smsData.template,
        messageId: result.sid
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'TWILIO',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to send SMS', {
        to: smsData.to,
        template: smsData.template,
        error: error.message,
        stack: error.stack
      });

      // Log failed delivery
      await this._logNotificationDelivery('SMS', {
        to: smsData.to,
        template: smsData.template,
        status: 'FAILED',
        error: error.message
      });

      throw new AppError(
        'Failed to send SMS notification',
        500,
        'SMS_SEND_ERROR',
        { originalError: error.message, to: smsData.to }
      );
    }
  }

  /**
   * Send push notification
   * @param {Object} pushData - Push notification data
   * @param {string} pushData.subscription - Push subscription
   * @param {string} pushData.title - Notification title
   * @param {string} pushData.body - Notification body
   * @param {Object} pushData.data - Additional data
   * @returns {Promise<Object>} Send result
   */
  async sendPushNotification(pushData) {
    try {
      logger.info('Sending push notification', {
        title: pushData.title,
        hasSubscription: !!pushData.subscription
      });

      // Validate push data
      this._validatePushData(pushData);

      // Prepare notification payload
      const payload = JSON.stringify({
        title: pushData.title,
        body: pushData.body,
        icon: pushData.icon || '/icons/icon-192x192.png',
        badge: pushData.badge || '/icons/badge-72x72.png',
        data: pushData.data || {},
        timestamp: Date.now()
      });

      // Send push notification with retry logic
      const result = await this._executeWithRetry(async () => {
        return await webpush.sendNotification(pushData.subscription, payload);
      });

      // Log successful delivery
      await this._logNotificationDelivery('PUSH', {
        title: pushData.title,
        status: 'SENT',
        statusCode: result.statusCode
      });

      logger.info('Push notification sent successfully', {
        title: pushData.title,
        statusCode: result.statusCode
      });

      return {
        success: true,
        statusCode: result.statusCode,
        provider: 'WEB_PUSH',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to send push notification', {
        title: pushData.title,
        error: error.message,
        stack: error.stack
      });

      // Log failed delivery
      await this._logNotificationDelivery('PUSH', {
        title: pushData.title,
        status: 'FAILED',
        error: error.message
      });

      throw new AppError(
        'Failed to send push notification',
        500,
        'PUSH_SEND_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Send multi-channel notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.userId - User ID
   * @param {string} notificationData.template - Template name
   * @param {Object} notificationData.data - Template data
   * @param {Array} notificationData.channels - Channels to use
   * @param {Object} notificationData.userPreferences - User preferences
   * @returns {Promise<Object>} Send results
   */
  async sendMultiChannelNotification(notificationData) {
    try {
      logger.info('Sending multi-channel notification', {
        userId: notificationData.userId,
        template: notificationData.template,
        channels: notificationData.channels
      });

      // Validate notification data
      this._validateMultiChannelData(notificationData);

      const results = {};
      const promises = [];

      // Send email if requested and user has email
      if (notificationData.channels.includes('EMAIL') && notificationData.userPreferences.email) {
        promises.push(
          this.sendEmail({
            to: notificationData.userPreferences.email,
            template: notificationData.template,
            data: notificationData.data
          }).then(result => {
            results.email = result;
          }).catch(error => {
            results.email = { success: false, error: error.message };
          })
        );
      }

      // Send SMS if requested and user has phone
      if (notificationData.channels.includes('SMS') && notificationData.userPreferences.phone) {
        promises.push(
          this.sendSMS({
            to: notificationData.userPreferences.phone,
            template: notificationData.template,
            data: notificationData.data
          }).then(result => {
            results.sms = result;
          }).catch(error => {
            results.sms = { success: false, error: error.message };
          })
        );
      }

      // Send push notification if requested and user has subscription
      if (notificationData.channels.includes('PUSH') && notificationData.userPreferences.pushSubscription) {
        const pushTitle = this._getPushTitle(notificationData.template, notificationData.data);
        const pushBody = this._getPushBody(notificationData.template, notificationData.data);

        promises.push(
          this.sendPushNotification({
            subscription: notificationData.userPreferences.pushSubscription,
            title: pushTitle,
            body: pushBody,
            data: notificationData.data
          }).then(result => {
            results.push = result;
          }).catch(error => {
            results.push = { success: false, error: error.message };
          })
        );
      }

      // Wait for all notifications to complete
      await Promise.all(promises);

      // Log multi-channel delivery
      await this._logNotificationDelivery('MULTI_CHANNEL', {
        userId: notificationData.userId,
        template: notificationData.template,
        channels: notificationData.channels,
        results: Object.keys(results).map(channel => ({
          channel,
          success: results[channel].success
        }))
      });

      logger.info('Multi-channel notification completed', {
        userId: notificationData.userId,
        template: notificationData.template,
        results: Object.keys(results).map(channel => ({
          channel,
          success: results[channel].success
        }))
      });

      return {
        success: Object.values(results).some(result => result.success),
        results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to send multi-channel notification', {
        userId: notificationData.userId,
        template: notificationData.template,
        error: error.message,
        stack: error.stack
      });

      throw new AppError(
        'Failed to send multi-channel notification',
        500,
        'MULTI_CHANNEL_ERROR',
        { originalError: error.message, userId: notificationData.userId }
      );
    }
  }

  /**
   * Get notification delivery status
   * @param {string} messageId - Message ID
   * @param {string} provider - Provider name
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId, provider) {
    try {
      let status = 'UNKNOWN';

      switch (provider) {
        case 'TWILIO':
          if (this.twilioClient) {
            const message = await this.twilioClient.messages(messageId).fetch();
            status = message.status.toUpperCase();
          }
          break;
        case 'SMTP':
          // SMTP doesn't provide delivery status tracking
          status = 'SENT';
          break;
        default:
          throw new AppError(`Unsupported provider: ${provider}`, 400, 'PROVIDER_ERROR');
      }

      return {
        messageId,
        provider,
        status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get delivery status', {
        messageId,
        provider,
        error: error.message
      });

      throw new AppError(
        'Failed to get delivery status',
        500,
        'STATUS_ERROR',
        { originalError: error.message, messageId, provider }
      );
    }
  }

  /**
   * Validate email data
   * @private
   */
  _validateEmailData(data) {
    if (!data.to || !data.template) {
      throw new AppError('Missing required email fields: to, template', 400, 'VALIDATION_ERROR');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      throw new AppError('Invalid email address', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate SMS data
   * @private
   */
  _validateSMSData(data) {
    if (!data.to || !data.template) {
      throw new AppError('Missing required SMS fields: to, template', 400, 'VALIDATION_ERROR');
    }

    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.to)) {
      throw new AppError('Invalid phone number format (E.164)', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate push data
   * @private
   */
  _validatePushData(data) {
    if (!data.subscription || !data.title || !data.body) {
      throw new AppError('Missing required push fields: subscription, title, body', 400, 'VALIDATION_ERROR');
    }

    if (typeof data.subscription !== 'object' || !data.subscription.endpoint) {
      throw new AppError('Invalid push subscription format', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate multi-channel data
   * @private
   */
  _validateMultiChannelData(data) {
    if (!data.userId || !data.template || !data.channels || !data.userPreferences) {
      throw new AppError(
        'Missing required multi-channel fields: userId, template, channels, userPreferences',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!Array.isArray(data.channels) || data.channels.length === 0) {
      throw new AppError('Channels must be a non-empty array', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Generate email content
   * @private
   */
  async _generateEmailContent(templateConfig, data) {
    // In a real implementation, this would use a template engine like Handlebars
    // For now, we'll return basic HTML and text content
    const html = `
      <html>
        <body>
          <h1>LendSmart Notification</h1>
          <p>Template: ${templateConfig.template}</p>
          <p>Data: ${JSON.stringify(data, null, 2)}</p>
        </body>
      </html>
    `;

    const text = `LendSmart Notification\nTemplate: ${templateConfig.template}\nData: ${JSON.stringify(data, null, 2)}`;

    return { html, text };
  }

  /**
   * Process template with data
   * @private
   */
  _processTemplate(template, data) {
    let processed = template;

    // Simple template variable replacement
    Object.keys(data || {}).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      processed = processed.replace(regex, data[key]);
    });

    return processed;
  }

  /**
   * Get push notification title
   * @private
   */
  _getPushTitle(template, data) {
    const titles = {
      loanApproved: 'Loan Approved!',
      loanRejected: 'Loan Application Update',
      paymentReminder: 'Payment Reminder',
      paymentReceived: 'Payment Confirmed',
      kycRequired: 'Verification Required',
      accountSuspended: 'Security Alert'
    };

    return titles[template] || 'LendSmart Notification';
  }

  /**
   * Get push notification body
   * @private
   */
  _getPushBody(template, data) {
    const bodies = {
      loanApproved: `Your loan application for $${data.amount} has been approved!`,
      loanRejected: 'Your loan application has been reviewed. Please check your account.',
      paymentReminder: `Payment of $${data.amount} is due on ${data.dueDate}`,
      paymentReceived: `Thank you for your payment of $${data.amount}`,
      kycRequired: 'Please complete identity verification to continue.',
      accountSuspended: 'Unusual activity detected. Please review your account.'
    };

    return bodies[template] || 'You have a new notification from LendSmart.';
  }

  /**
   * Execute operation with retry logic
   * @private
   */
  async _executeWithRetry(operation) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(`Notification attempt ${attempt} failed, retrying in ${delay}ms`, {
            error: error.message,
            attempt,
            maxAttempts: this.retryAttempts
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Log notification delivery
   * @private
   */
  async _logNotificationDelivery(type, details) {
    const logEntry = {
      type,
      details,
      timestamp: new Date().toISOString()
    };

    // Implementation would store delivery log in database
    logger.info('Notification delivery logged', logEntry);
  }
}

module.exports = new NotificationService();
