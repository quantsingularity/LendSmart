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

  async sendLoanApplicationConfirmation(user, loan) {
    logger.info("Sending loan application confirmation", {
      userId: user._id,
      loanId: loan._id,
      amount: loan.amount,
    });
    return await this.sendEmail(
      user.email,
      "Loan Application Received - LendSmart",
      `Dear ${user.firstName || user.username}, your loan application for $${loan.amount} has been received and is under review.`,
    );
  }

  async notifyAdminNewLoanApplication(loan) {
    logger.info("Notifying admin of new loan application", {
      loanId: loan._id,
      amount: loan.amount,
    });
    const adminEmail = process.env.ADMIN_EMAIL || "admin@lendsmart.com";
    return await this.sendEmail(
      adminEmail,
      "New Loan Application Submitted",
      `A new loan application (ID: ${loan._id}) for $${loan.amount} requires review.`,
    );
  }

  async sendLoanApprovalNotification(user, loan) {
    logger.info("Sending loan approval notification", {
      userId: user._id,
      loanId: loan._id,
    });
    return await this.sendEmail(
      user.email,
      "Loan Application Approved - LendSmart",
      `Congratulations! Your loan application for $${loan.amount} has been approved.`,
    );
  }

  async sendLoanRejectionNotification(user, loan, reason) {
    logger.info("Sending loan rejection notification", {
      userId: user._id,
      loanId: loan._id,
    });
    return await this.sendEmail(
      user.email,
      "Loan Application Update - LendSmart",
      `We regret to inform you that your loan application for $${loan.amount} was not approved. Reason: ${reason}`,
    );
  }

  async sendRepaymentConfirmation(user, loan, repaymentAmount) {
    logger.info("Sending repayment confirmation", {
      userId: user._id,
      loanId: loan._id,
      amount: repaymentAmount,
    });
    return await this.sendEmail(
      user.email,
      "Payment Received - LendSmart",
      `Your payment of $${repaymentAmount} for loan ID ${loan._id} has been processed successfully.`,
    );
  }

  async sendPaymentReminderNotification(user, loan, daysUntilDue) {
    logger.info("Sending payment reminder", {
      userId: user._id,
      loanId: loan._id,
      daysUntilDue,
    });
    return await this.sendEmail(
      user.email,
      "Payment Reminder - LendSmart",
      `Reminder: Your loan payment of $${loan.repaymentSchedule?.paymentAmount} is due in ${daysUntilDue} day(s).`,
    );
  }
}

module.exports = new NotificationService();
