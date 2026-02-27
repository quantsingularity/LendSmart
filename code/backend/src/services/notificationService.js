/**
 * Notification Service Stub
 * Provides notification functionality via email, SMS, and push notifications
 * Note: This is a simplified implementation for backend startup
 * Full notification integration requires additional configuration
 */

const { logger } = require("../utils/logger");

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    logger.info("Notification service initialized (stub mode)");
    this.isInitialized = true;
  }

  async sendEmail(to, subject, body, options = {}) {
    logger.info("Sending email (stub)", { to, subject });
    return { success: true, messageId: `email_${Date.now()}` };
  }

  async sendSMS(to, message) {
    logger.info("Sending SMS (stub)", { to });
    return { success: true, messageId: `sms_${Date.now()}` };
  }

  async sendPushNotification(userId, title, body, data = {}) {
    logger.info("Sending push notification (stub)", { userId, title });
    return { success: true, messageId: `push_${Date.now()}` };
  }

  async sendLoanNotification(userId, loanId, type, data = {}) {
    logger.info("Sending loan notification (stub)", { userId, loanId, type });
    return { success: true };
  }
}

module.exports = new NotificationService();
