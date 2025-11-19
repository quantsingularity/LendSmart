const { logger } = require('./logger');
const crypto = require('crypto');

/**
 * Comprehensive Compliance Monitoring System for LendSmart
 * Implements financial industry compliance standards including
 * SOX, PCI DSS, GDPR, CCPA, and banking regulations
 */
class ComplianceMonitor {
  constructor() {
    this.complianceEvents = new Map();
    this.violations = new Map();
    this.auditTrail = [];
    this.retentionPolicies = new Map();

    // Compliance configuration
    this.config = {
      dataRetentionPeriod: parseInt(process.env.DATA_RETENTION_PERIOD) || 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION) || 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      piiEncryptionRequired: process.env.PII_ENCRYPTION_REQUIRED !== 'false',
      gdprEnabled: process.env.GDPR_ENABLED !== 'false',
      ccpaEnabled: process.env.CCPA_ENABLED !== 'false',
      soxCompliance: process.env.SOX_COMPLIANCE !== 'false',
      pciDssCompliance: process.env.PCI_DSS_COMPLIANCE !== 'false'
    };

    // Initialize compliance rules
    this.initializeComplianceRules();

    // Start monitoring tasks
    this.startMonitoringTasks();
  }

  /**
   * Initialize compliance rules and policies
   * @private
   */
  initializeComplianceRules() {
    // Data classification rules
    this.dataClassification = {
      'PUBLIC': { encryption: false, retention: 365, access: 'unrestricted' },
      'INTERNAL': { encryption: true, retention: 1095, access: 'authenticated' },
      'CONFIDENTIAL': { encryption: true, retention: 2555, access: 'authorized' },
      'RESTRICTED': { encryption: true, retention: 3650, access: 'privileged' },
      'PII': { encryption: true, retention: 2555, access: 'privileged', gdpr: true },
      'FINANCIAL': { encryption: true, retention: 3650, access: 'privileged', sox: true },
      'PAYMENT': { encryption: true, retention: 1095, access: 'privileged', pci: true }
    };

    // Access control policies
    this.accessPolicies = {
      'financial_data': ['admin', 'finance', 'compliance'],
      'customer_pii': ['admin', 'customer_service', 'compliance'],
      'payment_data': ['admin', 'payment_processor', 'compliance'],
      'audit_logs': ['admin', 'compliance', 'auditor'],
      'system_config': ['admin', 'system_admin']
    };

    // Compliance frameworks
    this.frameworks = {
      SOX: {
        name: 'Sarbanes-Oxley Act',
        requirements: ['financial_controls', 'audit_trail', 'segregation_of_duties'],
        applicableData: ['FINANCIAL']
      },
      PCI_DSS: {
        name: 'Payment Card Industry Data Security Standard',
        requirements: ['encryption', 'access_control', 'monitoring', 'testing'],
        applicableData: ['PAYMENT']
      },
      GDPR: {
        name: 'General Data Protection Regulation',
        requirements: ['consent', 'right_to_erasure', 'data_portability', 'breach_notification'],
        applicableData: ['PII']
      },
      CCPA: {
        name: 'California Consumer Privacy Act',
        requirements: ['disclosure', 'opt_out', 'data_deletion', 'non_discrimination'],
        applicableData: ['PII']
      }
    };

    logger.info('Compliance rules initialized', {
      frameworks: Object.keys(this.frameworks),
      dataClassifications: Object.keys(this.dataClassification)
    });
  }

  /**
   * Monitor data access for compliance
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data accessed
   * @param {string} operation - Operation performed
   * @param {Object} context - Additional context
   */
  monitorDataAccess(userId, dataType, operation, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      const accessId = crypto.randomUUID();

      // Check if access is authorized
      const authorizationResult = this._checkDataAccessAuthorization(userId, dataType, operation);

      // Log the access event
      const accessEvent = {
        id: accessId,
        timestamp,
        userId,
        dataType,
        operation,
        authorized: authorizationResult.authorized,
        reason: authorizationResult.reason,
        context,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      };

      this.complianceEvents.set(accessId, accessEvent);

      // Log to audit trail
      logger.audit.dataAccess(userId, dataType, operation, context.ipAddress, context.userAgent);

      // Check for compliance violations
      this._checkComplianceViolations(accessEvent);

      // Apply data classification policies
      this._applyDataClassificationPolicies(dataType, accessEvent);

      return {
        accessId,
        authorized: authorizationResult.authorized,
        complianceStatus: 'monitored'
      };

    } catch (error) {
      logger.error('Compliance monitoring failed', {
        error: error.message,
        userId,
        dataType,
        operation
      });

      throw new Error('Compliance monitoring failed');
    }
  }

  /**
   * Monitor financial transactions for compliance
   * @param {Object} transaction - Transaction details
   */
  monitorFinancialTransaction(transaction) {
    try {
      const timestamp = new Date().toISOString();
      const monitoringId = crypto.randomUUID();

      // Validate required fields
      this._validateTransactionData(transaction);

      // Check AML compliance
      const amlResult = this._checkAMLCompliance(transaction);

      // Check SOX compliance
      const soxResult = this._checkSOXCompliance(transaction);

      // Create monitoring record
      const monitoringRecord = {
        id: monitoringId,
        timestamp,
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        amlStatus: amlResult.status,
        soxStatus: soxResult.status,
        riskLevel: this._calculateTransactionRiskLevel(transaction),
        complianceFlags: [...amlResult.flags, ...soxResult.flags]
      };

      this.complianceEvents.set(monitoringId, monitoringRecord);

      // Log business event
      logger.business.payment(
        transaction.userId,
        transaction.loanId,
        transaction.amount,
        transaction.paymentMethod,
        transaction.id
      );

      // Generate alerts if necessary
      if (monitoringRecord.riskLevel === 'HIGH' || monitoringRecord.complianceFlags.length > 0) {
        this._generateComplianceAlert(monitoringRecord);
      }

      return {
        monitoringId,
        complianceStatus: monitoringRecord.complianceFlags.length === 0 ? 'compliant' : 'flagged',
        riskLevel: monitoringRecord.riskLevel
      };

    } catch (error) {
      logger.error('Financial transaction monitoring failed', {
        error: error.message,
        transactionId: transaction.id
      });

      throw new Error('Financial transaction monitoring failed');
    }
  }

  /**
   * Monitor user consent and privacy preferences
   * @param {string} userId - User ID
   * @param {Object} consentData - Consent information
   */
  monitorUserConsent(userId, consentData) {
    try {
      const timestamp = new Date().toISOString();
      const consentId = crypto.randomUUID();

      // Validate consent data
      this._validateConsentData(consentData);

      // Check GDPR compliance
      const gdprResult = this._checkGDPRCompliance(consentData);

      // Check CCPA compliance
      const ccpaResult = this._checkCCPACompliance(consentData);

      // Create consent record
      const consentRecord = {
        id: consentId,
        timestamp,
        userId,
        consentType: consentData.type,
        granted: consentData.granted,
        purpose: consentData.purpose,
        gdprCompliant: gdprResult.compliant,
        ccpaCompliant: ccpaResult.compliant,
        expiryDate: consentData.expiryDate,
        withdrawalMethod: consentData.withdrawalMethod
      };

      this.complianceEvents.set(consentId, consentRecord);

      // Log audit event
      logger.audit.userAction(userId, 'consent_update', 'privacy_preferences', null, consentData);

      return {
        consentId,
        gdprCompliant: gdprResult.compliant,
        ccpaCompliant: ccpaResult.compliant,
        complianceStatus: 'recorded'
      };

    } catch (error) {
      logger.error('User consent monitoring failed', {
        error: error.message,
        userId
      });

      throw new Error('User consent monitoring failed');
    }
  }

  /**
   * Generate compliance report
   * @param {Object} reportParams - Report parameters
   */
  async generateComplianceReport(reportParams) {
    try {
      const {
        startDate,
        endDate,
        framework,
        dataTypes,
        includeViolations = true,
        includeMetrics = true
      } = reportParams;

      const reportId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Filter events by date range
      const filteredEvents = this._filterEventsByDateRange(startDate, endDate);

      // Generate framework-specific report
      const frameworkReport = this._generateFrameworkReport(framework, filteredEvents);

      // Generate metrics
      const metrics = includeMetrics ? this._generateComplianceMetrics(filteredEvents) : null;

      // Generate violations summary
      const violations = includeViolations ? this._generateViolationsSummary(filteredEvents) : null;

      const report = {
        id: reportId,
        timestamp,
        period: { startDate, endDate },
        framework,
        dataTypes,
        summary: {
          totalEvents: filteredEvents.length,
          complianceScore: this._calculateComplianceScore(filteredEvents),
          violationCount: violations?.length || 0
        },
        frameworkReport,
        metrics,
        violations,
        recommendations: this._generateRecommendations(filteredEvents, framework)
      };

      // Log report generation
      logger.audit.systemAction('compliance_report_generated', 'compliance_system', {
        reportId,
        framework,
        period: { startDate, endDate }
      });

      return report;

    } catch (error) {
      logger.error('Compliance report generation failed', {
        error: error.message,
        reportParams
      });

      throw new Error('Compliance report generation failed');
    }
  }

  /**
   * Handle data subject rights requests (GDPR/CCPA)
   * @param {string} userId - User ID
   * @param {string} requestType - Type of request
   * @param {Object} requestData - Request details
   */
  async handleDataSubjectRequest(userId, requestType, requestData) {
    try {
      const requestId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Validate request
      this._validateDataSubjectRequest(requestType, requestData);

      // Create request record
      const request = {
        id: requestId,
        timestamp,
        userId,
        type: requestType,
        status: 'received',
        data: requestData,
        framework: requestData.framework || 'GDPR',
        deadline: this._calculateRequestDeadline(requestType, requestData.framework)
      };

      this.complianceEvents.set(requestId, request);

      // Process request based on type
      let result;
      switch (requestType) {
        case 'access':
          result = await this._processDataAccessRequest(userId, requestData);
          break;
        case 'portability':
          result = await this._processDataPortabilityRequest(userId, requestData);
          break;
        case 'erasure':
          result = await this._processDataErasureRequest(userId, requestData);
          break;
        case 'rectification':
          result = await this._processDataRectificationRequest(userId, requestData);
          break;
        case 'opt_out':
          result = await this._processOptOutRequest(userId, requestData);
          break;
        default:
          throw new Error(`Unsupported request type: ${requestType}`);
      }

      // Update request status
      request.status = 'processed';
      request.result = result;
      request.completedAt = new Date().toISOString();

      // Log audit event
      logger.audit.userAction(userId, `data_subject_${requestType}`, 'privacy_rights', null, {
        requestId,
        framework: requestData.framework
      });

      return {
        requestId,
        status: 'processed',
        result,
        deadline: request.deadline
      };

    } catch (error) {
      logger.error('Data subject request processing failed', {
        error: error.message,
        userId,
        requestType
      });

      throw new Error('Data subject request processing failed');
    }
  }

  /**
   * Check data access authorization
   * @private
   */
  _checkDataAccessAuthorization(userId, dataType, operation) {
    // Implementation would check user roles and permissions
    // against data classification and access policies

    const classification = this.dataClassification[dataType];
    if (!classification) {
      return { authorized: false, reason: 'Unknown data type' };
    }

    // Check if user has required access level
    // This is a simplified check - real implementation would be more complex
    return { authorized: true, reason: 'Access granted' };
  }

  /**
   * Check for compliance violations
   * @private
   */
  _checkComplianceViolations(accessEvent) {
    const violations = [];

    // Check for unauthorized access
    if (!accessEvent.authorized) {
      violations.push({
        type: 'unauthorized_access',
        severity: 'high',
        description: 'Unauthorized data access attempt',
        event: accessEvent
      });
    }

    // Check for suspicious patterns
    if (this._detectSuspiciousAccessPattern(accessEvent)) {
      violations.push({
        type: 'suspicious_pattern',
        severity: 'medium',
        description: 'Suspicious data access pattern detected',
        event: accessEvent
      });
    }

    // Record violations
    violations.forEach(violation => {
      const violationId = crypto.randomUUID();
      this.violations.set(violationId, {
        ...violation,
        id: violationId,
        timestamp: new Date().toISOString()
      });

      logger.security.suspiciousActivity(
        accessEvent.userId,
        violation.type,
        accessEvent.ipAddress,
        accessEvent.userAgent,
        violation
      );
    });
  }

  /**
   * Apply data classification policies
   * @private
   */
  _applyDataClassificationPolicies(dataType, accessEvent) {
    const classification = this.dataClassification[dataType];
    if (!classification) return;

    // Check encryption requirements
    if (classification.encryption && !accessEvent.context.encrypted) {
      logger.warn('Unencrypted access to classified data', {
        dataType,
        classification: classification,
        accessEvent: accessEvent.id
      });
    }

    // Check retention policies
    this._checkRetentionPolicy(dataType, accessEvent);

    // Apply framework-specific policies
    if (classification.gdpr && this.config.gdprEnabled) {
      this._applyGDPRPolicies(accessEvent);
    }

    if (classification.sox && this.config.soxCompliance) {
      this._applySOXPolicies(accessEvent);
    }

    if (classification.pci && this.config.pciDssCompliance) {
      this._applyPCIPolicies(accessEvent);
    }
  }

  /**
   * Validate transaction data
   * @private
   */
  _validateTransactionData(transaction) {
    const required = ['id', 'userId', 'amount', 'type'];
    const missing = required.filter(field => !transaction[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required transaction fields: ${missing.join(', ')}`);
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }
  }

  /**
   * Check AML compliance
   * @private
   */
  _checkAMLCompliance(transaction) {
    const flags = [];

    // Check transaction amount thresholds
    if (transaction.amount >= 10000) {
      flags.push('large_transaction');
    }

    // Check for suspicious patterns
    if (this._detectSuspiciousTransactionPattern(transaction)) {
      flags.push('suspicious_pattern');
    }

    return {
      status: flags.length === 0 ? 'compliant' : 'flagged',
      flags
    };
  }

  /**
   * Check SOX compliance
   * @private
   */
  _checkSOXCompliance(transaction) {
    const flags = [];

    // Check for proper authorization
    if (!transaction.authorizedBy) {
      flags.push('missing_authorization');
    }

    // Check for segregation of duties
    if (transaction.userId === transaction.authorizedBy) {
      flags.push('segregation_violation');
    }

    return {
      status: flags.length === 0 ? 'compliant' : 'flagged',
      flags
    };
  }

  /**
   * Calculate transaction risk level
   * @private
   */
  _calculateTransactionRiskLevel(transaction) {
    let riskScore = 0;

    // Amount-based risk
    if (transaction.amount > 50000) riskScore += 3;
    else if (transaction.amount > 10000) riskScore += 2;
    else if (transaction.amount > 1000) riskScore += 1;

    // Type-based risk
    if (transaction.type === 'wire_transfer') riskScore += 2;
    else if (transaction.type === 'international') riskScore += 3;

    // Return risk level
    if (riskScore >= 5) return 'HIGH';
    if (riskScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate compliance alert
   * @private
   */
  _generateComplianceAlert(record) {
    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'compliance_violation',
      severity: record.riskLevel,
      record,
      requiresAction: true
    };

    logger.security.suspiciousActivity(
      record.userId,
      'compliance_violation',
      'system',
      'system',
      alert
    );

    // In production, this would trigger external alerting
    console.warn('[COMPLIANCE ALERT]', alert);
  }

  /**
   * Validate consent data
   * @private
   */
  _validateConsentData(consentData) {
    const required = ['type', 'granted', 'purpose'];
    const missing = required.filter(field => consentData[field] === undefined);

    if (missing.length > 0) {
      throw new Error(`Missing required consent fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Check GDPR compliance
   * @private
   */
  _checkGDPRCompliance(consentData) {
    const requirements = [
      'explicit_consent',
      'specific_purpose',
      'withdrawal_method',
      'data_minimization'
    ];

    const compliant = requirements.every(req =>
      this._checkGDPRRequirement(req, consentData)
    );

    return { compliant };
  }

  /**
   * Check CCPA compliance
   * @private
   */
  _checkCCPACompliance(consentData) {
    const requirements = [
      'opt_out_available',
      'disclosure_provided',
      'non_discrimination'
    ];

    const compliant = requirements.every(req =>
      this._checkCCPARequirement(req, consentData)
    );

    return { compliant };
  }

  /**
   * Start monitoring tasks
   * @private
   */
  startMonitoringTasks() {
    // Clean up old events periodically
    setInterval(() => {
      this._cleanupOldEvents();
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    // Generate daily compliance metrics
    setInterval(() => {
      this._generateDailyMetrics();
    }, 24 * 60 * 60 * 1000); // Daily metrics

    logger.info('Compliance monitoring tasks started');
  }

  /**
   * Cleanup old events based on retention policies
   * @private
   */
  _cleanupOldEvents() {
    const now = Date.now();
    const cutoff = now - this.config.auditLogRetention;

    for (const [id, event] of this.complianceEvents.entries()) {
      if (new Date(event.timestamp).getTime() < cutoff) {
        this.complianceEvents.delete(id);
      }
    }

    logger.info('Compliance events cleanup completed', {
      remainingEvents: this.complianceEvents.size
    });
  }

  /**
   * Generate daily compliance metrics
   * @private
   */
  _generateDailyMetrics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const events = this._filterEventsByDateRange(startDate, endDate);
    const metrics = this._generateComplianceMetrics(events);

    logger.audit.systemAction('daily_compliance_metrics', 'compliance_system', metrics);
  }

  /**
   * Filter events by date range
   * @private
   */
  _filterEventsByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return Array.from(this.complianceEvents.values()).filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Generate compliance metrics
   * @private
   */
  _generateComplianceMetrics(events) {
    return {
      totalEvents: events.length,
      dataAccessEvents: events.filter(e => e.dataType).length,
      financialTransactions: events.filter(e => e.transactionId).length,
      consentEvents: events.filter(e => e.consentType).length,
      violations: events.filter(e => !e.authorized || e.complianceFlags?.length > 0).length,
      complianceScore: this._calculateComplianceScore(events)
    };
  }

  /**
   * Calculate compliance score
   * @private
   */
  _calculateComplianceScore(events) {
    if (events.length === 0) return 100;

    const violations = events.filter(e =>
      !e.authorized || e.complianceFlags?.length > 0
    ).length;

    return Math.max(0, Math.round((1 - violations / events.length) * 100));
  }

  /**
   * Detect suspicious access patterns
   * @private
   */
  _detectSuspiciousAccessPattern(accessEvent) {
    // Implementation would analyze access patterns
    // This is a simplified placeholder
    return false;
  }

  /**
   * Detect suspicious transaction patterns
   * @private
   */
  _detectSuspiciousTransactionPattern(transaction) {
    // Implementation would analyze transaction patterns
    // This is a simplified placeholder
    return false;
  }

  /**
   * Get compliance statistics
   */
  getComplianceStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = Array.from(this.complianceEvents.values())
      .filter(event => new Date(event.timestamp) > last24Hours);

    return {
      totalEvents: this.complianceEvents.size,
      recentEvents: recentEvents.length,
      violations: this.violations.size,
      complianceScore: this._calculateComplianceScore(recentEvents),
      frameworks: Object.keys(this.frameworks),
      dataClassifications: Object.keys(this.dataClassification)
    };
  }
}

module.exports = new ComplianceMonitor();
