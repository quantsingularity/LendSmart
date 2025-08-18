const { getAuditLogger } = require('../compliance/auditLogger');
const logger = require('../utils/logger');

/**
 * Notification Service
 * Handles all user notifications including email, SMS, and in-app notifications
 */
class NotificationService {
  constructor() {
    this.auditLogger = getAuditLogger();
    
    // Notification templates
    this.templates = {
      email: {
        loanApplicationConfirmation: {
          subject: 'Loan Application Received - LendSmart',
          template: 'loan-application-confirmation'
        },
        loanApproved: {
          subject: 'Loan Application Approved - LendSmart',
          template: 'loan-approved'
        },
        loanFunded: {
          subject: 'Your Loan Has Been Funded - LendSmart',
          template: 'loan-funded'
        },
        repaymentReminder: {
          subject: 'Loan Repayment Reminder - LendSmart',
          template: 'repayment-reminder'
        },
        repaymentConfirmation: {
          subject: 'Repayment Received - LendSmart',
          template: 'repayment-confirmation'
        },
        fundingConfirmation: {
          subject: 'Loan Funding Confirmation - LendSmart',
          template: 'funding-confirmation'
        },
        kycRequired: {
          subject: 'KYC Verification Required - LendSmart',
          template: 'kyc-required'
        },
        accountVerification: {
          subject: 'Verify Your Account - LendSmart',
          template: 'account-verification'
        },
        passwordReset: {
          subject: 'Password Reset Request - LendSmart',
          template: 'password-reset'
        },
        securityAlert: {
          subject: 'Security Alert - LendSmart',
          template: 'security-alert'
        }
      },
      sms: {
        loanApproved: 'Your loan application has been approved! Check your LendSmart account for details.',
        repaymentReminder: 'Reminder: Your loan repayment of ${amount} is due on ${dueDate}.',
        securityAlert: 'Security alert: New login detected on your LendSmart account.',
        mfaCode: 'Your LendSmart verification code is: ${code}'
      }
    };
  }

  /**
   * Send loan application confirmation
   * @param {Object} user - User object
   * @param {Object} loan - Loan object
   */
  async sendLoanApplicationConfirmation(user, loan) {
    try {
      const emailData = {
        to: user.email,
        subject: this.templates.email.loanApplicationConfirmation.subject,
        template: this.templates.email.loanApplicationConfirmation.template,
        data: {
          userName: user.firstName || user.username,
          loanAmount: loan.amount,
          applicationId: loan._id,
          estimatedReviewTime: '24-48 hours'
        }
      };

      await this.sendEmail(emailData);

      // Send in-app notification
      await this.sendInAppNotification(user._id, {
        type: 'loan_application',
        title: 'Loan Application Submitted',
        message: `Your loan application for $${loan.amount} has been submitted and is under review.`,
        data: { loanId: loan._id }
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'loan_application_confirmation_sent',
        userId: user._id,
        loanId: loan._id,
        notificationType: 'email',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send loan application confirmation', {
        error: error.message,
        userId: user._id,
        loanId: loan._id
      });
    }
  }

  /**
   * Send loan funded notification to borrower
   * @param {Object} borrower - Borrower user object
   * @param {Object} loan - Loan object
   * @param {Object} lender - Lender user object
   */
  async sendLoanFundedNotification(borrower, loan, lender) {
    try {
      const emailData = {
        to: borrower.email,
        subject: this.templates.email.loanFunded.subject,
        template: this.templates.email.loanFunded.template,
        data: {
          borrowerName: borrower.firstName || borrower.username,
          loanAmount: loan.amount,
          interestRate: loan.interestRate,
          term: `${loan.term} ${loan.termUnit}`,
          lenderName: lender.firstName || lender.username,
          fundedDate: loan.fundedDate
        }
      };

      await this.sendEmail(emailData);

      // Send SMS notification
      await this.sendSMS(borrower.phoneNumber, 
        `Great news! Your loan of $${loan.amount} has been funded and will be disbursed shortly.`
      );

      // Send in-app notification
      await this.sendInAppNotification(borrower._id, {
        type: 'loan_funded',
        title: 'Loan Funded Successfully',
        message: `Your loan of $${loan.amount} has been funded by ${lender.firstName || lender.username}.`,
        data: { loanId: loan._id }
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'loan_funded_notification_sent',
        userId: borrower._id,
        loanId: loan._id,
        lenderId: lender._id,
        notificationType: 'email_sms_inapp',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send loan funded notification', {
        error: error.message,
        borrowerId: borrower._id,
        loanId: loan._id
      });
    }
  }

  /**
   * Send funding confirmation to lender
   * @param {Object} lender - Lender user object
   * @param {Object} loan - Loan object
   */
  async sendFundingConfirmation(lender, loan) {
    try {
      const emailData = {
        to: lender.email,
        subject: this.templates.email.fundingConfirmation.subject,
        template: this.templates.email.fundingConfirmation.template,
        data: {
          lenderName: lender.firstName || lender.username,
          loanAmount: loan.amount,
          interestRate: loan.interestRate,
          term: `${loan.term} ${loan.termUnit}`,
          borrowerCreditScore: loan.creditAssessment?.score,
          expectedReturn: this.calculateExpectedReturn(loan),
          maturityDate: loan.maturityDate
        }
      };

      await this.sendEmail(emailData);

      // Send in-app notification
      await this.sendInAppNotification(lender._id, {
        type: 'funding_confirmation',
        title: 'Loan Funding Confirmed',
        message: `You have successfully funded a loan of $${loan.amount}. Expected return: $${this.calculateExpectedReturn(loan)}.`,
        data: { loanId: loan._id }
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'funding_confirmation_sent',
        userId: lender._id,
        loanId: loan._id,
        notificationType: 'email_inapp',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send funding confirmation', {
        error: error.message,
        lenderId: lender._id,
        loanId: loan._id
      });
    }
  }

  /**
   * Send repayment confirmation
   * @param {Object} borrower - Borrower user object
   * @param {Object} loan - Loan object
   * @param {number} amount - Repayment amount
   */
  async sendRepaymentConfirmation(borrower, loan, amount) {
    try {
      const remainingBalance = this.calculateRemainingBalance(loan);
      
      const emailData = {
        to: borrower.email,
        subject: this.templates.email.repaymentConfirmation.subject,
        template: this.templates.email.repaymentConfirmation.template,
        data: {
          borrowerName: borrower.firstName || borrower.username,
          repaymentAmount: amount,
          loanAmount: loan.amount,
          remainingBalance,
          isFullyRepaid: loan.status === 'repaid',
          nextDueDate: this.calculateNextDueDate(loan)
        }
      };

      await this.sendEmail(emailData);

      // Send in-app notification
      const message = loan.status === 'repaid' 
        ? `Congratulations! You have fully repaid your loan of $${loan.amount}.`
        : `Repayment of $${amount} received. Remaining balance: $${remainingBalance}.`;

      await this.sendInAppNotification(borrower._id, {
        type: 'repayment_confirmation',
        title: 'Repayment Processed',
        message,
        data: { loanId: loan._id, amount }
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'repayment_confirmation_sent',
        userId: borrower._id,
        loanId: loan._id,
        repaymentAmount: amount,
        notificationType: 'email_inapp',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send repayment confirmation', {
        error: error.message,
        borrowerId: borrower._id,
        loanId: loan._id
      });
    }
  }

  /**
   * Send repayment received notification to lender
   * @param {Object} lender - Lender user object
   * @param {Object} loan - Loan object
   * @param {number} amount - Repayment amount
   */
  async sendRepaymentReceived(lender, loan, amount) {
    try {
      const emailData = {
        to: lender.email,
        subject: 'Repayment Received - LendSmart',
        template: 'repayment-received',
        data: {
          lenderName: lender.firstName || lender.username,
          repaymentAmount: amount,
          loanAmount: loan.amount,
          borrowerName: loan.borrower.firstName || loan.borrower.username,
          isFullyRepaid: loan.status === 'repaid',
          totalReceived: loan.amountRepaid || amount
        }
      };

      await this.sendEmail(emailData);

      // Send in-app notification
      const message = loan.status === 'repaid'
        ? `Loan fully repaid! You received $${loan.amountRepaid} total for your $${loan.amount} investment.`
        : `Repayment of $${amount} received from your borrower.`;

      await this.sendInAppNotification(lender._id, {
        type: 'repayment_received',
        title: 'Repayment Received',
        message,
        data: { loanId: loan._id, amount }
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'repayment_received_notification_sent',
        userId: lender._id,
        loanId: loan._id,
        repaymentAmount: amount,
        notificationType: 'email_inapp',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send repayment received notification', {
        error: error.message,
        lenderId: lender._id,
        loanId: loan._id
      });
    }
  }

  /**
   * Send repayment reminder
   * @param {Object} borrower - Borrower user object
   * @param {Object} loan - Loan object
   * @param {Date} dueDate - Due date
   * @param {number} amount - Amount due
   */
  async sendRepaymentReminder(borrower, loan, dueDate, amount) {
    try {
      const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
      
      const emailData = {
        to: borrower.email,
        subject: this.templates.email.repaymentReminder.subject,
        template: this.templates.email.repaymentReminder.template,
        data: {
          borrowerName: borrower.firstName || borrower.username,
          loanAmount: loan.amount,
          dueAmount: amount,
          dueDate: dueDate.toLocaleDateString(),
          daysUntilDue,
          loanId: loan._id
        }
      };

      await this.sendEmail(emailData);

      // Send SMS reminder
      const smsMessage = this.templates.sms.repaymentReminder
        .replace('${amount}', `$${amount}`)
        .replace('${dueDate}', dueDate.toLocaleDateString());
      
      await this.sendSMS(borrower.phoneNumber, smsMessage);

      // Send in-app notification
      await this.sendInAppNotification(borrower._id, {
        type: 'repayment_reminder',
        title: 'Repayment Reminder',
        message: `Your loan repayment of $${amount} is due on ${dueDate.toLocaleDateString()}.`,
        data: { loanId: loan._id, dueDate, amount },
        priority: 'high'
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'repayment_reminder_sent',
        userId: borrower._id,
        loanId: loan._id,
        dueAmount: amount,
        dueDate: dueDate.toISOString(),
        notificationType: 'email_sms_inapp',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send repayment reminder', {
        error: error.message,
        borrowerId: borrower._id,
        loanId: loan._id
      });
    }
  }

  /**
   * Notify admin of new loan application
   * @param {Object} loan - Loan object
   */
  async notifyAdminNewLoanApplication(loan) {
    try {
      // Send email to admin team
      const emailData = {
        to: process.env.ADMIN_EMAIL || 'admin@lendsmart.com',
        subject: 'New Loan Application Requires Review',
        template: 'admin-loan-review',
        data: {
          loanId: loan._id,
          borrowerName: loan.borrower.firstName || loan.borrower.username,
          loanAmount: loan.amount,
          interestRate: loan.interestRate,
          creditScore: loan.creditAssessment?.score,
          riskLevel: loan.creditAssessment?.riskLevel,
          applicationDate: loan.applicationDate
        }
      };

      await this.sendEmail(emailData);

      // Audit log
      await this.auditLogger.logNotification({
        action: 'admin_loan_review_notification_sent',
        loanId: loan._id,
        notificationType: 'email',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to notify admin of new loan application', {
        error: error.message,
        loanId: loan._id
      });
    }
  }

  /**
   * Send security alert
   * @param {Object} user - User object
   * @param {string} alertType - Type of security alert
   * @param {Object} details - Alert details
   */
  async sendSecurityAlert(user, alertType, details = {}) {
    try {
      const emailData = {
        to: user.email,
        subject: this.templates.email.securityAlert.subject,
        template: this.templates.email.securityAlert.template,
        data: {
          userName: user.firstName || user.username,
          alertType,
          details,
          timestamp: new Date().toISOString(),
          ipAddress: details.ip,
          userAgent: details.userAgent
        }
      };

      await this.sendEmail(emailData);

      // Send SMS for critical security alerts
      if (['login_from_new_device', 'password_changed', 'mfa_disabled'].includes(alertType)) {
        await this.sendSMS(user.phoneNumber, this.templates.sms.securityAlert);
      }

      // Send in-app notification
      await this.sendInAppNotification(user._id, {
        type: 'security_alert',
        title: 'Security Alert',
        message: `Security alert: ${alertType}. If this wasn't you, please contact support immediately.`,
        data: { alertType, details },
        priority: 'high'
      });

      // Audit log
      await this.auditLogger.logNotification({
        action: 'security_alert_sent',
        userId: user._id,
        alertType,
        details,
        notificationType: 'email_sms_inapp',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send security alert', {
        error: error.message,
        userId: user._id,
        alertType
      });
    }
  }

  /**
   * Send MFA code
   * @param {Object} user - User object
   * @param {string} code - MFA code
   */
  async sendMFACode(user, code) {
    try {
      const smsMessage = this.templates.sms.mfaCode.replace('${code}', code);
      await this.sendSMS(user.phoneNumber, smsMessage);

      // Audit log
      await this.auditLogger.logNotification({
        action: 'mfa_code_sent',
        userId: user._id,
        notificationType: 'sms',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send MFA code', {
        error: error.message,
        userId: user._id
      });
    }
  }

  /**
   * Send email notification
   * @param {Object} emailData - Email data
   */
  async sendEmail(emailData) {
    try {
      // In production, integrate with email service provider (SendGrid, AWS SES, etc.)
      logger.info('Email notification sent', {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template
      });

      // Mock implementation - replace with actual email service
      return {
        success: true,
        messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      logger.error('Email sending failed', {
        error: error.message,
        emailData
      });
      throw error;
    }
  }

  /**
   * Send SMS notification
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   */
  async sendSMS(phoneNumber, message) {
    try {
      if (!phoneNumber) {
        logger.warn('SMS not sent - no phone number provided');
        return;
      }

      // In production, integrate with SMS service provider (Twilio, AWS SNS, etc.)
      logger.info('SMS notification sent', {
        to: phoneNumber,
        message: message.substring(0, 50) + '...'
      });

      // Mock implementation - replace with actual SMS service
      return {
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      logger.error('SMS sending failed', {
        error: error.message,
        phoneNumber,
        message
      });
      throw error;
    }
  }

  /**
   * Send in-app notification
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  async sendInAppNotification(userId, notification) {
    try {
      // In production, store in database and use WebSocket/Server-Sent Events for real-time delivery
      logger.info('In-app notification sent', {
        userId,
        type: notification.type,
        title: notification.title
      });

      // Mock implementation - replace with actual in-app notification system
      return {
        success: true,
        notificationId: `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      logger.error('In-app notification failed', {
        error: error.message,
        userId,
        notification
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Calculate expected return for a loan
   * @param {Object} loan - Loan object
   * @returns {number} Expected return amount
   */
  calculateExpectedReturn(loan) {
    const principal = loan.amount;
    const rate = loan.interestRate / 100;
    const timeInYears = loan.term / (loan.termUnit === 'months' ? 12 : 365);
    
    return principal + (principal * rate * timeInYears);
  }

  /**
   * Calculate remaining balance for a loan
   * @param {Object} loan - Loan object
   * @returns {number} Remaining balance
   */
  calculateRemainingBalance(loan) {
    const totalAmount = this.calculateExpectedReturn(loan);
    const amountRepaid = loan.amountRepaid || 0;
    return Math.max(0, totalAmount - amountRepaid);
  }

  /**
   * Calculate next due date for a loan
   * @param {Object} loan - Loan object
   * @returns {Date} Next due date
   */
  calculateNextDueDate(loan) {
    // Simplified calculation - in production, use proper repayment schedule
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return nextMonth;
  }
}

module.exports = new NotificationService();

