const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');
const { AppError } = require('../../middleware/monitoring/errorHandler');

/**
 * Compliance Service for LendSmart
 * Handles KYC/AML, sanctions screening, regulatory reporting,
 * and compliance monitoring with comprehensive audit trails
 */
class ComplianceService {
    constructor() {
        this.kycProviders = {
            primary: {
                name: 'Jumio',
                baseUrl: process.env.JUMIO_BASE_URL || 'https://api.jumio.com',
                apiKey: process.env.JUMIO_API_KEY,
                apiSecret: process.env.JUMIO_API_SECRET,
            },
            secondary: {
                name: 'Onfido',
                baseUrl: process.env.ONFIDO_BASE_URL || 'https://api.onfido.com',
                apiKey: process.env.ONFIDO_API_KEY,
            },
        };

        this.sanctionsProviders = {
            primary: {
                name: 'Dow Jones',
                baseUrl: process.env.DOWJONES_BASE_URL || 'https://api.dowjones.com',
                apiKey: process.env.DOWJONES_API_KEY,
            },
            secondary: {
                name: 'Refinitiv',
                baseUrl: process.env.REFINITIV_BASE_URL || 'https://api.refinitiv.com',
                apiKey: process.env.REFINITIV_API_KEY,
            },
        };

        this.amlThresholds = {
            transactionAmount: parseFloat(process.env.AML_TRANSACTION_THRESHOLD) || 10000,
            dailyAmount: parseFloat(process.env.AML_DAILY_THRESHOLD) || 50000,
            monthlyAmount: parseFloat(process.env.AML_MONTHLY_THRESHOLD) || 200000,
        };

        this.retryAttempts = 3;
        this.retryDelay = 2000;
    }

    /**
     * Perform KYC verification for a user
     * @param {Object} userData - User data for verification
     * @param {string} userData.userId - User ID
     * @param {string} userData.firstName - First name
     * @param {string} userData.lastName - Last name
     * @param {string} userData.dateOfBirth - Date of birth (YYYY-MM-DD)
     * @param {string} userData.nationality - Nationality
     * @param {string} userData.documentType - Document type (passport, drivers_license, etc.)
     * @param {string} userData.documentNumber - Document number
     * @param {Object} userData.address - Address information
     * @returns {Promise<Object>} KYC verification result
     */
    async performKYC(userData) {
        try {
            logger.info('Starting KYC verification', {
                userId: userData.userId,
                documentType: userData.documentType,
            });

            // Validate input data
            this._validateKYCData(userData);

            // Create audit trail entry
            await this._createAuditEntry('KYC_INITIATED', userData.userId, {
                documentType: userData.documentType,
                nationality: userData.nationality,
            });

            // Attempt KYC with primary provider
            let kycResult;
            try {
                kycResult = await this._performKYCWithJumio(userData);
            } catch (error) {
                logger.warn('Primary KYC provider failed, trying secondary', {
                    userId: userData.userId,
                    error: error.message,
                });

                // Fallback to secondary provider
                kycResult = await this._performKYCWithOnfido(userData);
            }

            // Process and validate result
            const processedResult = this._processKYCResult(kycResult, userData.userId);

            // Create audit trail entry for completion
            await this._createAuditEntry('KYC_COMPLETED', userData.userId, {
                status: processedResult.status,
                verificationId: processedResult.verificationId,
                provider: processedResult.provider,
            });

            logger.info('KYC verification completed', {
                userId: userData.userId,
                status: processedResult.status,
                provider: processedResult.provider,
            });

            return processedResult;
        } catch (error) {
            logger.error('KYC verification failed', {
                userId: userData.userId,
                error: error.message,
                stack: error.stack,
            });

            // Create audit trail entry for failure
            await this._createAuditEntry('KYC_FAILED', userData.userId, {
                error: error.message,
            });

            throw new AppError('KYC verification failed', 500, 'KYC_ERROR', {
                originalError: error.message,
                userId: userData.userId,
            });
        }
    }

    /**
     * Perform sanctions screening
     * @param {Object} screeningData - Data for sanctions screening
     * @param {string} screeningData.userId - User ID
     * @param {string} screeningData.fullName - Full name
     * @param {string} screeningData.dateOfBirth - Date of birth
     * @param {string} screeningData.nationality - Nationality
     * @param {Array} screeningData.aliases - Known aliases
     * @returns {Promise<Object>} Sanctions screening result
     */
    async performSanctionsScreening(screeningData) {
        try {
            logger.info('Starting sanctions screening', {
                userId: screeningData.userId,
                fullName: screeningData.fullName,
            });

            // Validate input data
            this._validateSanctionsData(screeningData);

            // Create audit trail entry
            await this._createAuditEntry('SANCTIONS_SCREENING_INITIATED', screeningData.userId, {
                fullName: screeningData.fullName,
                nationality: screeningData.nationality,
            });

            // Perform screening with primary provider
            let screeningResult;
            try {
                screeningResult = await this._performSanctionsScreeningWithDowJones(screeningData);
            } catch (error) {
                logger.warn('Primary sanctions provider failed, trying secondary', {
                    userId: screeningData.userId,
                    error: error.message,
                });

                // Fallback to secondary provider
                screeningResult = await this._performSanctionsScreeningWithRefinitiv(screeningData);
            }

            // Process and validate result
            const processedResult = this._processSanctionsResult(
                screeningResult,
                screeningData.userId,
            );

            // Create audit trail entry for completion
            await this._createAuditEntry('SANCTIONS_SCREENING_COMPLETED', screeningData.userId, {
                status: processedResult.status,
                matchCount: processedResult.matches.length,
                provider: processedResult.provider,
            });

            logger.info('Sanctions screening completed', {
                userId: screeningData.userId,
                status: processedResult.status,
                matchCount: processedResult.matches.length,
            });

            return processedResult;
        } catch (error) {
            logger.error('Sanctions screening failed', {
                userId: screeningData.userId,
                error: error.message,
                stack: error.stack,
            });

            // Create audit trail entry for failure
            await this._createAuditEntry('SANCTIONS_SCREENING_FAILED', screeningData.userId, {
                error: error.message,
            });

            throw new AppError('Sanctions screening failed', 500, 'SANCTIONS_ERROR', {
                originalError: error.message,
                userId: screeningData.userId,
            });
        }
    }

    /**
     * Monitor transaction for AML compliance
     * @param {Object} transactionData - Transaction data
     * @param {string} transactionData.transactionId - Transaction ID
     * @param {string} transactionData.userId - User ID
     * @param {number} transactionData.amount - Transaction amount
     * @param {string} transactionData.type - Transaction type
     * @param {string} transactionData.counterparty - Counterparty information
     * @returns {Promise<Object>} AML monitoring result
     */
    async monitorTransaction(transactionData) {
        try {
            logger.info('Starting AML transaction monitoring', {
                transactionId: transactionData.transactionId,
                userId: transactionData.userId,
                amount: transactionData.amount,
            });

            // Validate input data
            this._validateTransactionData(transactionData);

            // Create audit trail entry
            await this._createAuditEntry('AML_MONITORING_INITIATED', transactionData.userId, {
                transactionId: transactionData.transactionId,
                amount: transactionData.amount,
                type: transactionData.type,
            });

            // Perform various AML checks
            const checks = await Promise.all([
                this._checkTransactionThresholds(transactionData),
                this._checkUserTransactionHistory(transactionData),
                this._checkCounterpartyRisk(transactionData),
                this._checkSuspiciousPatterns(transactionData),
            ]);

            // Aggregate results
            const amlResult = this._aggregateAMLResults(checks, transactionData);

            // Create audit trail entry for completion
            await this._createAuditEntry('AML_MONITORING_COMPLETED', transactionData.userId, {
                transactionId: transactionData.transactionId,
                riskLevel: amlResult.riskLevel,
                flagged: amlResult.flagged,
                alerts: amlResult.alerts.length,
            });

            // Generate SAR if necessary
            if (amlResult.flagged && amlResult.riskLevel === 'HIGH') {
                await this._generateSAR(transactionData, amlResult);
            }

            logger.info('AML transaction monitoring completed', {
                transactionId: transactionData.transactionId,
                riskLevel: amlResult.riskLevel,
                flagged: amlResult.flagged,
            });

            return amlResult;
        } catch (error) {
            logger.error('AML transaction monitoring failed', {
                transactionId: transactionData.transactionId,
                error: error.message,
                stack: error.stack,
            });

            // Create audit trail entry for failure
            await this._createAuditEntry('AML_MONITORING_FAILED', transactionData.userId, {
                transactionId: transactionData.transactionId,
                error: error.message,
            });

            throw new AppError('AML transaction monitoring failed', 500, 'AML_ERROR', {
                originalError: error.message,
                transactionId: transactionData.transactionId,
            });
        }
    }

    /**
     * Generate compliance report
     * @param {Object} reportParams - Report parameters
     * @param {string} reportParams.type - Report type (KYC, AML, SANCTIONS)
     * @param {string} reportParams.startDate - Start date (YYYY-MM-DD)
     * @param {string} reportParams.endDate - End date (YYYY-MM-DD)
     * @param {Array} reportParams.filters - Additional filters
     * @returns {Promise<Object>} Compliance report
     */
    async generateComplianceReport(reportParams) {
        try {
            logger.info('Generating compliance report', {
                type: reportParams.type,
                startDate: reportParams.startDate,
                endDate: reportParams.endDate,
            });

            // Validate report parameters
            this._validateReportParams(reportParams);

            // Create audit trail entry
            await this._createAuditEntry('COMPLIANCE_REPORT_INITIATED', 'SYSTEM', {
                reportType: reportParams.type,
                startDate: reportParams.startDate,
                endDate: reportParams.endDate,
            });

            // Generate report based on type
            let reportData;
            switch (reportParams.type) {
                case 'KYC':
                    reportData = await this._generateKYCReport(reportParams);
                    break;
                case 'AML':
                    reportData = await this._generateAMLReport(reportParams);
                    break;
                case 'SANCTIONS':
                    reportData = await this._generateSanctionsReport(reportParams);
                    break;
                case 'COMPREHENSIVE':
                    reportData = await this._generateComprehensiveReport(reportParams);
                    break;
                default:
                    throw new AppError('Invalid report type', 400, 'VALIDATION_ERROR');
            }

            // Create audit trail entry for completion
            await this._createAuditEntry('COMPLIANCE_REPORT_COMPLETED', 'SYSTEM', {
                reportType: reportParams.type,
                recordCount: reportData.recordCount,
                reportId: reportData.reportId,
            });

            logger.info('Compliance report generated', {
                type: reportParams.type,
                reportId: reportData.reportId,
                recordCount: reportData.recordCount,
            });

            return reportData;
        } catch (error) {
            logger.error('Compliance report generation failed', {
                type: reportParams.type,
                error: error.message,
                stack: error.stack,
            });

            throw new AppError('Compliance report generation failed', 500, 'REPORT_ERROR', {
                originalError: error.message,
                reportType: reportParams.type,
            });
        }
    }

    /**
     * Validate KYC data
     * @private
     */
    _validateKYCData(data) {
        const required = [
            'userId',
            'firstName',
            'lastName',
            'dateOfBirth',
            'nationality',
            'documentType',
            'documentNumber',
        ];
        const missing = required.filter((field) => !data[field]);

        if (missing.length > 0) {
            throw new AppError(
                `Missing required KYC fields: ${missing.join(', ')}`,
                400,
                'VALIDATION_ERROR',
            );
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
            throw new AppError(
                'Invalid date of birth format (YYYY-MM-DD)',
                400,
                'VALIDATION_ERROR',
            );
        }

        // Validate document type
        const validDocTypes = ['passport', 'drivers_license', 'national_id', 'residence_permit'];
        if (!validDocTypes.includes(data.documentType)) {
            throw new AppError('Invalid document type', 400, 'VALIDATION_ERROR');
        }
    }

    /**
     * Validate sanctions screening data
     * @private
     */
    _validateSanctionsData(data) {
        const required = ['userId', 'fullName', 'nationality'];
        const missing = required.filter((field) => !data[field]);

        if (missing.length > 0) {
            throw new AppError(
                `Missing required sanctions screening fields: ${missing.join(', ')}`,
                400,
                'VALIDATION_ERROR',
            );
        }
    }

    /**
     * Validate transaction data
     * @private
     */
    _validateTransactionData(data) {
        const required = ['transactionId', 'userId', 'amount', 'type'];
        const missing = required.filter(
            (field) => data[field] === undefined || data[field] === null,
        );

        if (missing.length > 0) {
            throw new AppError(
                `Missing required transaction fields: ${missing.join(', ')}`,
                400,
                'VALIDATION_ERROR',
            );
        }

        if (data.amount <= 0) {
            throw new AppError(
                'Transaction amount must be greater than 0',
                400,
                'VALIDATION_ERROR',
            );
        }
    }

    /**
     * Validate report parameters
     * @private
     */
    _validateReportParams(params) {
        const required = ['type', 'startDate', 'endDate'];
        const missing = required.filter((field) => !params[field]);

        if (missing.length > 0) {
            throw new AppError(
                `Missing required report parameters: ${missing.join(', ')}`,
                400,
                'VALIDATION_ERROR',
            );
        }

        // Validate date formats
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(params.startDate) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(params.endDate)
        ) {
            throw new AppError('Invalid date format (YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
        }

        // Validate date range
        if (new Date(params.startDate) > new Date(params.endDate)) {
            throw new AppError('Start date must be before end date', 400, 'VALIDATION_ERROR');
        }
    }

    /**
     * Perform KYC with Jumio
     * @private
     */
    async _performKYCWithJumio(userData) {
        // Implementation would integrate with Jumio API
        // This is a placeholder for the actual implementation
        return {
            provider: 'Jumio',
            verificationId: `jumio_${Date.now()}`,
            status: 'APPROVED',
            confidence: 0.95,
            extractedData: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                dateOfBirth: userData.dateOfBirth,
                documentNumber: userData.documentNumber,
            },
        };
    }

    /**
     * Perform KYC with Onfido
     * @private
     */
    async _performKYCWithOnfido(userData) {
        // Implementation would integrate with Onfido API
        // This is a placeholder for the actual implementation
        return {
            provider: 'Onfido',
            verificationId: `onfido_${Date.now()}`,
            status: 'APPROVED',
            confidence: 0.92,
            extractedData: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                dateOfBirth: userData.dateOfBirth,
                documentNumber: userData.documentNumber,
            },
        };
    }

    /**
     * Perform sanctions screening with Dow Jones
     * @private
     */
    async _performSanctionsScreeningWithDowJones(screeningData) {
        // Implementation would integrate with Dow Jones API
        // This is a placeholder for the actual implementation
        return {
            provider: 'Dow Jones',
            screeningId: `dj_${Date.now()}`,
            matches: [],
            status: 'CLEAR',
        };
    }

    /**
     * Perform sanctions screening with Refinitiv
     * @private
     */
    async _performSanctionsScreeningWithRefinitiv(screeningData) {
        // Implementation would integrate with Refinitiv API
        // This is a placeholder for the actual implementation
        return {
            provider: 'Refinitiv',
            screeningId: `ref_${Date.now()}`,
            matches: [],
            status: 'CLEAR',
        };
    }

    /**
     * Process KYC result
     * @private
     */
    _processKYCResult(result, userId) {
        return {
            userId,
            verificationId: result.verificationId,
            provider: result.provider,
            status: result.status,
            confidence: result.confidence,
            extractedData: result.extractedData,
            timestamp: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        };
    }

    /**
     * Process sanctions result
     * @private
     */
    _processSanctionsResult(result, userId) {
        return {
            userId,
            screeningId: result.screeningId,
            provider: result.provider,
            status: result.status,
            matches: result.matches || [],
            timestamp: new Date().toISOString(),
            nextScreeningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        };
    }

    /**
     * Check transaction thresholds
     * @private
     */
    async _checkTransactionThresholds(transactionData) {
        const alerts = [];

        if (transactionData.amount >= this.amlThresholds.transactionAmount) {
            alerts.push({
                type: 'THRESHOLD_EXCEEDED',
                severity: 'HIGH',
                message: `Transaction amount ${transactionData.amount} exceeds threshold ${this.amlThresholds.transactionAmount}`,
            });
        }

        return {
            checkType: 'THRESHOLD_CHECK',
            passed: alerts.length === 0,
            alerts,
        };
    }

    /**
     * Check user transaction history
     * @private
     */
    async _checkUserTransactionHistory(transactionData) {
        // Implementation would check user's transaction history
        // This is a placeholder for the actual implementation
        return {
            checkType: 'HISTORY_CHECK',
            passed: true,
            alerts: [],
        };
    }

    /**
     * Check counterparty risk
     * @private
     */
    async _checkCounterpartyRisk(transactionData) {
        // Implementation would check counterparty risk
        // This is a placeholder for the actual implementation
        return {
            checkType: 'COUNTERPARTY_CHECK',
            passed: true,
            alerts: [],
        };
    }

    /**
     * Check suspicious patterns
     * @private
     */
    async _checkSuspiciousPatterns(transactionData) {
        // Implementation would check for suspicious patterns
        // This is a placeholder for the actual implementation
        return {
            checkType: 'PATTERN_CHECK',
            passed: true,
            alerts: [],
        };
    }

    /**
     * Aggregate AML results
     * @private
     */
    _aggregateAMLResults(checks, transactionData) {
        const allAlerts = checks.flatMap((check) => check.alerts);
        const highSeverityAlerts = allAlerts.filter((alert) => alert.severity === 'HIGH');

        let riskLevel = 'LOW';
        let flagged = false;

        if (highSeverityAlerts.length > 0) {
            riskLevel = 'HIGH';
            flagged = true;
        } else if (allAlerts.length > 0) {
            riskLevel = 'MEDIUM';
            flagged = true;
        }

        return {
            transactionId: transactionData.transactionId,
            userId: transactionData.userId,
            riskLevel,
            flagged,
            alerts: allAlerts,
            checks,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Generate SAR (Suspicious Activity Report)
     * @private
     */
    async _generateSAR(transactionData, amlResult) {
        const sarId = `SAR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        logger.info('Generating SAR', {
            sarId,
            transactionId: transactionData.transactionId,
            userId: transactionData.userId,
        });

        // Create audit trail entry
        await this._createAuditEntry('SAR_GENERATED', transactionData.userId, {
            sarId,
            transactionId: transactionData.transactionId,
            riskLevel: amlResult.riskLevel,
            alertCount: amlResult.alerts.length,
        });

        // Implementation would submit SAR to regulatory authorities
        // This is a placeholder for the actual implementation
    }

    /**
     * Generate KYC report
     * @private
     */
    async _generateKYCReport(params) {
        // Implementation would generate KYC report
        // This is a placeholder for the actual implementation
        return {
            reportId: `KYC_REPORT_${Date.now()}`,
            type: 'KYC',
            startDate: params.startDate,
            endDate: params.endDate,
            recordCount: 0,
            data: [],
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Generate AML report
     * @private
     */
    async _generateAMLReport(params) {
        // Implementation would generate AML report
        // This is a placeholder for the actual implementation
        return {
            reportId: `AML_REPORT_${Date.now()}`,
            type: 'AML',
            startDate: params.startDate,
            endDate: params.endDate,
            recordCount: 0,
            data: [],
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Generate sanctions report
     * @private
     */
    async _generateSanctionsReport(params) {
        // Implementation would generate sanctions report
        // This is a placeholder for the actual implementation
        return {
            reportId: `SANCTIONS_REPORT_${Date.now()}`,
            type: 'SANCTIONS',
            startDate: params.startDate,
            endDate: params.endDate,
            recordCount: 0,
            data: [],
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Generate comprehensive report
     * @private
     */
    async _generateComprehensiveReport(params) {
        // Implementation would generate comprehensive report
        // This is a placeholder for the actual implementation
        return {
            reportId: `COMPREHENSIVE_REPORT_${Date.now()}`,
            type: 'COMPREHENSIVE',
            startDate: params.startDate,
            endDate: params.endDate,
            recordCount: 0,
            data: [],
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Create audit trail entry
     * @private
     */
    async _createAuditEntry(action, userId, details) {
        const auditEntry = {
            id: crypto.randomUUID(),
            action,
            userId,
            details,
            timestamp: new Date().toISOString(),
            ipAddress: 'system', // Would be actual IP in real implementation
            userAgent: 'LendSmart-Backend/1.0',
        };

        // Implementation would store audit entry in immutable storage
        logger.info('Audit entry created', auditEntry);
    }
}

module.exports = new ComplianceService();
