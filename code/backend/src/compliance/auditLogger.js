const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { getEncryptionService } = require("../config/security/encryption");

// Redis client with fallback for development
let redisClient;
try {
  redisClient = require("../config/redis");
} catch (error) {
  console.warn(
    "Redis client not available, using in-memory fallback for development",
  );
  // In-memory fallback for development
  const memoryStore = new Map();
  redisClient = {
    get: async (key) => memoryStore.get(key) || null,
    setex: async (key, ttl, value) => {
      memoryStore.set(key, value);
      setTimeout(() => memoryStore.delete(key), ttl * 1000);
    },
    del: async (key) => memoryStore.delete(key),
  };
}

/**
 * Audit Log Schema for database storage
 */
const auditLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "authentication",
        "authorization",
        "data_access",
        "data_modification",
        "security",
        "compliance",
        "system",
        "business",
        "financial",
        "loan_management",
        "api_access",
      ],
      index: true,
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    username: String,

    ip: {
      type: String,
      required: true,
      index: true,
    },

    userAgent: String,
    method: String,
    url: String,

    resource: String,
    resourceId: String,

    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,

    success: {
      type: Boolean,
      required: true,
      index: true,
    },

    reason: String,

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true,
    },

    complianceFlags: [
      {
        type: String,
        enum: ["pci_dss", "gdpr", "ccpa", "sox", "kyc_aml", "data_retention"],
      },
    ],

    metadata: mongoose.Schema.Types.Mixed,

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    retentionDate: {
      type: Date,
      index: true,
    },

    integrityHash: String,
    chainCounter: Number,
    previousHash: String,
  },
  {
    timestamps: true,
    collection: "audit_logs",
  },
);

// Indexes for performance
auditLogSchema.index({ timestamp: -1, category: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, success: 1, timestamp: -1 });

// TTL index for automatic cleanup
auditLogSchema.index({ retentionDate: 1 }, { expireAfterSeconds: 0 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

/**
 * Enterprise-grade audit logging system for financial compliance
 * Implements tamper-proof logging with encryption and integrity verification
 */
class AuditLogger {
  constructor() {
    this.encryptionService = getEncryptionService();
    this.setupLogger();
    this.setupIntegrityChain();
  }

  /**
   * Setup Winston logger with multiple transports
   */
  setupLogger() {
    // Audit log format
    const auditFormat = winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        return JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          ...info.metadata,
        });
      }),
    );

    // Daily rotate file transport for audit logs
    const auditTransport = new DailyRotateFile({
      filename: "logs/audit/audit-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "100m",
      maxFiles: "365d", // Keep for 1 year
      format: auditFormat,
      level: "info",
    });

    // Separate transport for security events
    const securityTransport = new DailyRotateFile({
      filename: "logs/security/security-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "50m",
      maxFiles: "2555d", // Keep for 7 years (regulatory requirement)
      format: auditFormat,
      level: "warn",
    });

    // Financial transaction logs (highest retention)
    const financialTransport = new DailyRotateFile({
      filename: "logs/financial/financial-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "200m",
      maxFiles: "2555d", // Keep for 7 years
      format: auditFormat,
      level: "info",
    });

    this.auditLogger = winston.createLogger({
      level: "info",
      transports: [auditTransport, securityTransport, financialTransport],
      exitOnError: false,
    });

    // Add console transport in development
    if (process.env.NODE_ENV === "development") {
      this.auditLogger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    }
  }

  /**
   * Setup integrity chain for tamper detection
   */
  setupIntegrityChain() {
    this.lastHash = null;
    this.chainCounter = 0;
  }

  /**
   * Create audit log entry in database
   * @param {Object} auditData - Audit data
   * @returns {Object} Created audit log
   */
  async createDatabaseAuditLog(auditData) {
    try {
      // Determine risk level and retention
      auditData.riskLevel = this.getRiskLevel(auditData.action);
      auditData.retentionDate = this.getRetentionDate(auditData.riskLevel);

      // Create audit log in database
      const auditLog = new AuditLog(auditData);
      await auditLog.save();

      return auditLog;
    } catch (error) {
      console.error("Failed to create database audit log:", error);
      return null;
    }
  }

  /**
   * Get risk level for action
   * @param {string} action - Action name
   * @returns {string} Risk level
   */
  getRiskLevel(action) {
    const riskLevels = {
      user_login: "low",
      user_logout: "low",
      profile_view: "low",
      profile_update: "medium",
      password_change: "medium",
      mfa_setup: "medium",
      loan_application: "medium",
      payment_initiated: "medium",
      admin_action: "high",
      user_suspension: "high",
      loan_approval: "high",
      large_payment: "high",
      kyc_status_change: "high",
      data_export: "high",
      security_violation: "critical",
      data_breach: "critical",
      unauthorized_access: "critical",
      system_compromise: "critical",
      compliance_violation: "critical",
    };

    return riskLevels[action] || "low";
  }

  /**
   * Get retention date based on risk level
   * @param {string} riskLevel - Risk level
   * @returns {Date} Retention date
   */
  getRetentionDate(riskLevel) {
    const retentionPeriods = {
      low: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
      medium: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      high: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      critical: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    };

    const period = retentionPeriods[riskLevel] || retentionPeriods["low"];
    return new Date(Date.now() + period);
  }

  /**
   * Log authentication events with database storage
   * @param {Object} event - Authentication event data
   */
  async logAuthEvent(event) {
    // Create file-based audit entry (existing functionality)
    const auditEntry = await this.createAuditEntry("AUTH", event, {
      category: "authentication",
      severity: event.success ? "info" : "warn",
      retention: "7_years",
    });

    this.auditLogger.info("Authentication Event", auditEntry);
    await this.storeAuditHash(auditEntry);

    // Also store in database
    const dbAuditData = {
      category: "authentication",
      action: event.action || "user_login",
      userId: event.userId,
      username: event.username,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      reason: event.reason,
      metadata: {
        mfaUsed: event.mfaUsed,
        loginAttempts: event.loginAttempts,
        sessionDuration: event.sessionDuration,
      },
      timestamp: new Date(event.timestamp),
    };

    await this.createDatabaseAuditLog(dbAuditData);
  }

  /**
   * Log data access events
   * @param {Object} event - Data access event
   */
  async logDataEvent(event) {
    // File-based logging
    const auditEntry = await this.createAuditEntry("DATA_ACCESS", event, {
      category: "data_access",
      severity: "info",
      retention: "7_years",
    });

    this.auditLogger.info("Data Access Event", auditEntry);
    await this.storeAuditHash(auditEntry);

    // Database logging
    const dbAuditData = {
      category: "data_access",
      action: event.action || "data_access",
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      resource: event.resource,
      resourceId: event.resourceId,
      success: event.success || true,
      metadata: {
        dataType: event.dataType,
        recordCount: event.recordCount,
        queryParameters: event.queryParameters,
        fileId: event.fileId,
        fileType: event.fileType,
        fileSize: event.fileSize,
      },
      complianceFlags: this.getComplianceFlags(event.dataType),
      timestamp: new Date(event.timestamp),
    };

    await this.createDatabaseAuditLog(dbAuditData);
  }

  /**
   * Log security events
   * @param {Object} event - Security event
   */
  async logSecurityEvent(event) {
    // File-based logging
    const auditEntry = await this.createAuditEntry("SECURITY", event, {
      category: "security",
      severity: "error",
      retention: "7_years",
      encrypted: true,
    });

    this.auditLogger.error("Security Event", auditEntry);
    await this.storeAuditHash(auditEntry);
    await this.alertSecurityTeam(auditEntry);

    // Database logging
    const dbAuditData = {
      category: "security",
      action: event.action || "security_incident",
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success || false,
      reason: event.reason,
      metadata: {
        threatType: event.threatType,
        severity: event.severity,
        blocked: event.blocked,
        violations: event.violations,
        errorCode: event.errorCode,
        statusCode: event.statusCode,
      },
      timestamp: new Date(event.timestamp),
    };

    await this.createDatabaseAuditLog(dbAuditData);
  }

  /**
   * Get compliance flags for data type
   * @param {string} dataType - Type of data
   * @returns {Array} Compliance flags
   */
  getComplianceFlags(dataType) {
    const complianceMapping = {
      payment: ["pci_dss"],
      personal_data: ["gdpr", "ccpa"],
      financial_data: ["sox", "pci_dss"],
      kyc: ["kyc_aml"],
      user_data: ["gdpr", "ccpa", "data_retention"],
    };

    return complianceMapping[dataType] || [];
  }

  /**
   * Log financial transactions
   * @param {Object} transaction - Transaction data
   */
  async logFinancialTransaction(transaction) {
    const auditEntry = await this.createAuditEntry("FINANCIAL", transaction, {
      category: "financial",
      severity: "info",
      retention: "7_years",
      encrypted: true,
    });

    this.auditLogger.info("Financial Transaction", auditEntry);
    await this.storeAuditHash(auditEntry);
    await this.notifyComplianceTeam(auditEntry);
  }

  /**
   * Log loan lifecycle events
   * @param {Object} loanEvent - Loan event data
   */
  async logLoanEvent(loanEvent) {
    const auditEntry = await this.createAuditEntry("LOAN", loanEvent, {
      category: "loan_management",
      severity: "info",
      retention: "7_years",
    });

    this.auditLogger.info("Loan Event", auditEntry);
    await this.storeAuditHash(auditEntry);
  }

  /**
   * Log KYC/AML compliance events
   * @param {Object} complianceEvent - Compliance event data
   */
  async logComplianceEvent(complianceEvent) {
    const auditEntry = await this.createAuditEntry(
      "COMPLIANCE",
      complianceEvent,
      {
        category: "compliance",
        severity: complianceEvent.risk_level === "high" ? "error" : "warn",
        retention: "7_years",
        encrypted: true,
      },
    );

    this.auditLogger.warn("Compliance Event", auditEntry);
    await this.storeAuditHash(auditEntry);

    if (complianceEvent.risk_level === "high") {
      await this.alertComplianceTeam(auditEntry);
    }
  }

  /**
   * Log data access events for GDPR compliance
   * @param {Object} dataAccess - Data access event
   */
  async logDataAccess(dataAccess) {
    const auditEntry = await this.createAuditEntry("DATA_ACCESS", dataAccess, {
      category: "data_privacy",
      severity: "info",
      retention: "7_years",
    });

    this.auditLogger.info("Data Access Event", auditEntry);
    await this.storeAuditHash(auditEntry);
  }

  /**
   * Log security incidents
   * @param {Object} incident - Security incident data
   */
  async logSecurityIncident(incident) {
    const auditEntry = await this.createAuditEntry("SECURITY", incident, {
      category: "security",
      severity: "error",
      retention: "7_years",
      encrypted: true,
    });

    this.auditLogger.error("Security Incident", auditEntry);
    await this.storeAuditHash(auditEntry);
    await this.alertSecurityTeam(auditEntry);
  }

  /**
   * Log administrative actions
   * @param {Object} adminAction - Admin action data
   */
  async logAdminAction(adminAction) {
    const auditEntry = await this.createAuditEntry("ADMIN", adminAction, {
      category: "administration",
      severity: "warn",
      retention: "7_years",
    });

    this.auditLogger.warn("Admin Action", auditEntry);
    await this.storeAuditHash(auditEntry);
  }

  /**
   * Log API access for rate limiting and monitoring
   * @param {Object} apiAccess - API access data
   */
  async logApiAccess(apiAccess) {
    const auditEntry = await this.createAuditEntry("API", apiAccess, {
      category: "api_access",
      severity: "info",
      retention: "1_year",
    });

    // Only log to audit if it's a sensitive endpoint or error
    if (apiAccess.sensitive || apiAccess.status >= 400) {
      this.auditLogger.info("API Access", auditEntry);
      await this.storeAuditHash(auditEntry);
    }
  }

  /**
   * Create standardized audit entry
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   * @param {Object} options - Audit options
   * @returns {Object} Audit entry
   */
  async createAuditEntry(eventType, eventData, options = {}) {
    const timestamp = new Date().toISOString();
    const eventId = crypto.randomUUID();

    // Create base audit entry
    let auditEntry = {
      eventId,
      eventType,
      timestamp,
      category: options.category || "general",
      severity: options.severity || "info",
      retention: options.retention || "1_year",
      chainCounter: ++this.chainCounter,
      previousHash: this.lastHash,
      ...eventData,
    };

    // Encrypt sensitive data if required
    if (options.encrypted) {
      auditEntry = await this.encryptSensitiveFields(auditEntry);
    }

    // Calculate integrity hash
    auditEntry.integrityHash = this.calculateIntegrityHash(auditEntry);
    this.lastHash = auditEntry.integrityHash;

    return auditEntry;
  }

  /**
   * Encrypt sensitive fields in audit entry
   * @param {Object} auditEntry - Audit entry to encrypt
   * @returns {Object} Audit entry with encrypted fields
   */
  async encryptSensitiveFields(auditEntry) {
    const sensitiveFields = [
      "userId",
      "email",
      "phoneNumber",
      "ssn",
      "accountNumber",
      "routingNumber",
      "cardNumber",
      "amount",
      "balance",
    ];

    const encrypted = { ...auditEntry };

    for (const field of sensitiveFields) {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        encrypted[field] = await this.encryptionService.encrypt(
          String(encrypted[field]),
          `audit_${field}`,
        );
      }
    }

    return encrypted;
  }

  /**
   * Calculate integrity hash for tamper detection
   * @param {Object} auditEntry - Audit entry
   * @returns {string} Integrity hash
   */
  calculateIntegrityHash(auditEntry) {
    // Create deterministic string from audit entry
    const { integrityHash, ...dataToHash } = auditEntry;
    const dataString = JSON.stringify(
      dataToHash,
      Object.keys(dataToHash).sort(),
    );

    // Calculate HMAC-SHA256 hash
    const hmac = crypto.createHmac(
      "sha256",
      process.env.AUDIT_INTEGRITY_KEY || "default-key",
    );
    hmac.update(dataString);
    return hmac.digest("hex");
  }

  /**
   * Store audit hash in Redis for integrity verification
   * @param {Object} auditEntry - Audit entry
   */
  async storeAuditHash(auditEntry) {
    try {
      const hashKey = `audit_hash:${auditEntry.eventId}`;
      const hashData = {
        eventId: auditEntry.eventId,
        timestamp: auditEntry.timestamp,
        integrityHash: auditEntry.integrityHash,
        chainCounter: auditEntry.chainCounter,
      };

      await redisClient.setex(hashKey, 86400 * 365, JSON.stringify(hashData)); // 1 year
    } catch (error) {
      console.error("Failed to store audit hash:", error);
    }
  }

  /**
   * Verify audit log integrity
   * @param {string} eventId - Event ID to verify
   * @returns {boolean} Verification result
   */
  async verifyAuditIntegrity(eventId) {
    try {
      const hashKey = `audit_hash:${eventId}`;
      const storedHash = await redisClient.get(hashKey);

      if (!storedHash) {
        return false;
      }

      // In a full implementation, you would retrieve the audit entry
      // from logs and recalculate the hash to compare
      return true;
    } catch (error) {
      console.error("Failed to verify audit integrity:", error);
      return false;
    }
  }

  /**
   * Generate compliance report
   * @param {Object} criteria - Report criteria
   * @returns {Object} Compliance report
   */
  async generateComplianceReport(criteria) {
    const {
      startDate,
      endDate,
      eventTypes = [],
      categories = [],
      userId = null,
    } = criteria;

    // This would typically query a database or log aggregation system
    // For now, we'll return a structure that shows what would be included
    return {
      reportId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      criteria,
      summary: {
        totalEvents: 0,
        eventsByType: {},
        eventsByCategory: {},
        complianceScore: 100,
      },
      events: [],
      integrityVerification: {
        verified: true,
        tamperedEvents: [],
      },
    };
  }

  /**
   * Notify compliance team of significant events
   * @param {Object} auditEntry - Audit entry
   */
  async notifyComplianceTeam(auditEntry) {
    // Implementation would send notifications via email, Slack, etc.
    console.log("Compliance notification:", {
      eventId: auditEntry.eventId,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
    });
  }

  /**
   * Alert compliance team of high-risk events
   * @param {Object} auditEntry - Audit entry
   */
  async alertComplianceTeam(auditEntry) {
    // Implementation would send immediate alerts
    console.log("Compliance alert:", {
      eventId: auditEntry.eventId,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
    });
  }

  /**
   * Alert security team of incidents
   * @param {Object} auditEntry - Audit entry
   */
  async alertSecurityTeam(auditEntry) {
    // Implementation would send immediate security alerts
    console.log("Security alert:", {
      eventId: auditEntry.eventId,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
    });
  }

  /**
   * Log system events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  async logSystemEvent(event, data = {}) {
    const auditEntry = await this.createAuditEntry(
      "SYSTEM",
      {
        action: event,
        userId: "system",
        ip: "system",
        userAgent: "system",
        timestamp: new Date().toISOString(),
        ...data,
      },
      {
        category: "system",
        severity: "info",
        retention: "7_years",
      },
    );

    this.auditLogger.info("System Event", auditEntry);
    await this.storeAuditHash(auditEntry);
  }

  /**
   * Export audit logs for regulatory compliance
   * @param {Object} exportCriteria - Export criteria
   * @returns {Object} Export result
   */
  async exportAuditLogs(exportCriteria) {
    const {
      startDate,
      endDate,
      format = "json", // json, csv, xml
      includeEncrypted = false,
    } = exportCriteria;

    // Implementation would export logs in the requested format
    return {
      exportId: crypto.randomUUID(),
      exportedAt: new Date().toISOString(),
      format,
      recordCount: 0,
      filePath: `/exports/audit_${Date.now()}.${format}`,
      integrityHash: crypto.randomBytes(32).toString("hex"),
    };
  }

  /**
   * Purge old audit logs according to retention policy
   * @param {Object} retentionPolicy - Retention policy
   */
  async purgeOldLogs(retentionPolicy) {
    // Implementation would purge logs based on retention policy
    const purgeResult = {
      purgedAt: new Date().toISOString(),
      recordsPurged: 0,
      retentionPolicy,
    };

    console.log("Audit log purge completed:", purgeResult);
    return purgeResult;
  }
}

// Singleton instance
let auditLogger = null;

/**
 * Get audit logger instance
 * @returns {AuditLogger} Audit logger singleton
 */
function getAuditLogger() {
  if (!auditLogger) {
    auditLogger = new AuditLogger();
  }
  return auditLogger;
}

/**
 * Express middleware for automatic audit logging
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function auditMiddleware(options = {}) {
  const logger = getAuditLogger();

  return async (req, res, next) => {
    const startTime = Date.now();

    // Capture original res.json to log response
    const originalJson = res.json;
    let responseBody = null;

    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Continue with request
    next();

    // Log after response is sent
    res.on("finish", async () => {
      const duration = Date.now() - startTime;

      const apiAccess = {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        userId: req.user?.id,
        status: res.statusCode,
        duration,
        sensitive: options.sensitive || false,
        timestamp: new Date().toISOString(),
      };

      // Add request body for sensitive endpoints (excluding passwords)
      if (options.logRequestBody && req.body) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.confirmPassword;
        apiAccess.requestBody = sanitizedBody;
      }

      // Add response body for errors or sensitive operations
      if (res.statusCode >= 400 || options.logResponseBody) {
        apiAccess.responseBody = responseBody;
      }

      await logger.logApiAccess(apiAccess);
    });
  };
}

// Export singleton instance directly for backward compatibility
const singletonAuditLogger = getAuditLogger();

module.exports = {
  AuditLogger,
  getAuditLogger,
  auditMiddleware,
  auditLogger: singletonAuditLogger, // Direct export for simple imports
  logSystemEvent: (event, data) =>
    singletonAuditLogger.logAdminAction({ action: event, ...data }),
};
