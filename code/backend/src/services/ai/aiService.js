const axios = require('axios');
const { logger } = require('../../utils/logger');
const { AppError } = require('../../middleware/monitoring/errorHandler');

/**
 * AI Service for LendSmart
 * Handles all AI-related operations including risk assessment, credit scoring,
 * and model inference with comprehensive error handling and monitoring
 */
class AIService {
  constructor() {
    this.modelEndpoints = {
      riskAssessment: process.env.AI_RISK_MODEL_ENDPOINT || 'http://localhost:8001/predict/risk',
      creditScoring: process.env.AI_CREDIT_MODEL_ENDPOINT || 'http://localhost:8002/predict/credit',
      fraudDetection: process.env.AI_FRAUD_MODEL_ENDPOINT || 'http://localhost:8003/predict/fraud'
    };
    
    this.timeout = parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000; // 30 seconds
    this.retryAttempts = parseInt(process.env.AI_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.AI_RETRY_DELAY) || 1000; // 1 second
  }

  /**
   * Assess borrower risk using AI model
   * @param {Object} borrowerData - Borrower information
   * @param {string} borrowerData.income - Annual income
   * @param {number} borrowerData.creditScore - Credit score (300-850)
   * @param {number} borrowerData.loanAmount - Requested loan amount
   * @param {number} borrowerData.employmentYears - Years of employment
   * @param {number} borrowerData.existingDebt - Existing debt amount
   * @param {number} borrowerData.age - Borrower age
   * @param {string} borrowerData.education - Education level
   * @param {string} borrowerData.homeOwnership - Home ownership status
   * @param {string} borrowerData.loanPurpose - Purpose of the loan
   * @returns {Promise<Object>} Risk assessment result
   */
  async assessRisk(borrowerData) {
    try {
      logger.info('Starting risk assessment', { 
        borrowerId: borrowerData.borrowerId,
        loanAmount: borrowerData.loanAmount 
      });

      // Validate input data
      this._validateBorrowerData(borrowerData);

      // Prepare data for AI model
      const modelInput = this._prepareBorrowerDataForModel(borrowerData);

      // Call AI model with retry logic
      const response = await this._callModelWithRetry(
        this.modelEndpoints.riskAssessment,
        modelInput,
        'risk_assessment'
      );

      // Process and validate response
      const riskResult = this._processRiskAssessmentResponse(response.data);

      logger.info('Risk assessment completed', {
        borrowerId: borrowerData.borrowerId,
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel
      });

      return riskResult;

    } catch (error) {
      logger.error('Risk assessment failed', {
        borrowerId: borrowerData.borrowerId,
        error: error.message,
        stack: error.stack
      });

      throw new AppError(
        'Risk assessment service unavailable',
        500,
        'AI_SERVICE_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Calculate credit score using AI model
   * @param {Object} borrowerData - Borrower information
   * @returns {Promise<Object>} Credit score result
   */
  async calculateCreditScore(borrowerData) {
    try {
      logger.info('Starting credit score calculation', { 
        borrowerId: borrowerData.borrowerId 
      });

      // Validate input data
      this._validateBorrowerData(borrowerData);

      // Prepare data for AI model
      const modelInput = this._prepareBorrowerDataForModel(borrowerData);

      // Call AI model with retry logic
      const response = await this._callModelWithRetry(
        this.modelEndpoints.creditScoring,
        modelInput,
        'credit_scoring'
      );

      // Process and validate response
      const creditResult = this._processCreditScoreResponse(response.data);

      logger.info('Credit score calculation completed', {
        borrowerId: borrowerData.borrowerId,
        creditScore: creditResult.creditScore,
        confidence: creditResult.confidence
      });

      return creditResult;

    } catch (error) {
      logger.error('Credit score calculation failed', {
        borrowerId: borrowerData.borrowerId,
        error: error.message,
        stack: error.stack
      });

      throw new AppError(
        'Credit scoring service unavailable',
        500,
        'AI_SERVICE_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Detect potential fraud using AI model
   * @param {Object} transactionData - Transaction information
   * @returns {Promise<Object>} Fraud detection result
   */
  async detectFraud(transactionData) {
    try {
      logger.info('Starting fraud detection', { 
        transactionId: transactionData.transactionId,
        amount: transactionData.amount
      });

      // Validate input data
      this._validateTransactionData(transactionData);

      // Prepare data for AI model
      const modelInput = this._prepareTransactionDataForModel(transactionData);

      // Call AI model with retry logic
      const response = await this._callModelWithRetry(
        this.modelEndpoints.fraudDetection,
        modelInput,
        'fraud_detection'
      );

      // Process and validate response
      const fraudResult = this._processFraudDetectionResponse(response.data);

      logger.info('Fraud detection completed', {
        transactionId: transactionData.transactionId,
        fraudScore: fraudResult.fraudScore,
        isFraudulent: fraudResult.isFraudulent
      });

      return fraudResult;

    } catch (error) {
      logger.error('Fraud detection failed', {
        transactionId: transactionData.transactionId,
        error: error.message,
        stack: error.stack
      });

      throw new AppError(
        'Fraud detection service unavailable',
        500,
        'AI_SERVICE_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Get model health status
   * @returns {Promise<Object>} Health status of all AI models
   */
  async getModelHealth() {
    const healthStatus = {
      riskAssessment: { status: 'unknown', latency: null, error: null },
      creditScoring: { status: 'unknown', latency: null, error: null },
      fraudDetection: { status: 'unknown', latency: null, error: null }
    };

    const healthChecks = Object.entries(this.modelEndpoints).map(async ([modelName, endpoint]) => {
      try {
        const startTime = Date.now();
        
        await axios.get(`${endpoint}/health`, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LendSmart-Backend/1.0'
          }
        });

        const latency = Date.now() - startTime;
        healthStatus[modelName] = {
          status: 'healthy',
          latency,
          error: null
        };

      } catch (error) {
        healthStatus[modelName] = {
          status: 'unhealthy',
          latency: null,
          error: error.message
        };
      }
    });

    await Promise.all(healthChecks);
    return healthStatus;
  }

  /**
   * Validate borrower data
   * @private
   */
  _validateBorrowerData(data) {
    const required = ['income', 'creditScore', 'loanAmount', 'employmentYears', 'age'];
    const missing = required.filter(field => data[field] === undefined || data[field] === null);
    
    if (missing.length > 0) {
      throw new AppError(
        `Missing required borrower data fields: ${missing.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate ranges
    if (data.creditScore < 300 || data.creditScore > 850) {
      throw new AppError('Credit score must be between 300 and 850', 400, 'VALIDATION_ERROR');
    }

    if (data.income <= 0) {
      throw new AppError('Income must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    if (data.loanAmount <= 0) {
      throw new AppError('Loan amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    if (data.age < 18 || data.age > 100) {
      throw new AppError('Age must be between 18 and 100', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate transaction data
   * @private
   */
  _validateTransactionData(data) {
    const required = ['transactionId', 'amount', 'timestamp', 'userId'];
    const missing = required.filter(field => data[field] === undefined || data[field] === null);
    
    if (missing.length > 0) {
      throw new AppError(
        `Missing required transaction data fields: ${missing.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    if (data.amount <= 0) {
      throw new AppError('Transaction amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Prepare borrower data for AI model
   * @private
   */
  _prepareBorrowerDataForModel(data) {
    return {
      income: parseFloat(data.income),
      credit_score: parseInt(data.creditScore),
      loan_amount: parseFloat(data.loanAmount),
      employment_years: parseFloat(data.employmentYears),
      existing_debt: parseFloat(data.existingDebt || 0),
      age: parseInt(data.age),
      education: data.education || 'Unknown',
      home_ownership: data.homeOwnership || 'Unknown',
      loan_purpose: data.loanPurpose || 'Other',
      debt_to_income: data.existingDebt ? data.existingDebt / data.income : 0,
      loan_to_income: data.loanAmount / data.income
    };
  }

  /**
   * Prepare transaction data for AI model
   * @private
   */
  _prepareTransactionDataForModel(data) {
    return {
      transaction_id: data.transactionId,
      amount: parseFloat(data.amount),
      timestamp: data.timestamp,
      user_id: data.userId,
      merchant_category: data.merchantCategory || 'Unknown',
      location: data.location || 'Unknown',
      device_info: data.deviceInfo || {},
      previous_transactions: data.previousTransactions || []
    };
  }

  /**
   * Call AI model with retry logic
   * @private
   */
  async _callModelWithRetry(endpoint, data, modelType) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(endpoint, data, {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LendSmart-Backend/1.0',
            'X-Request-ID': `${modelType}_${Date.now()}_${attempt}`
          }
        });

        return response;

      } catch (error) {
        lastError = error;
        
        logger.warn(`AI model call attempt ${attempt} failed`, {
          endpoint,
          modelType,
          error: error.message,
          attempt,
          maxAttempts: this.retryAttempts
        });

        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Process risk assessment response
   * @private
   */
  _processRiskAssessmentResponse(data) {
    if (!data || typeof data.risk_score !== 'number') {
      throw new AppError('Invalid risk assessment response format', 500, 'AI_RESPONSE_ERROR');
    }

    const riskScore = Math.max(0, Math.min(100, data.risk_score));
    let riskLevel;

    if (riskScore <= 30) {
      riskLevel = 'LOW';
    } else if (riskScore <= 60) {
      riskLevel = 'MEDIUM';
    } else if (riskScore <= 80) {
      riskLevel = 'HIGH';
    } else {
      riskLevel = 'VERY_HIGH';
    }

    return {
      riskScore,
      riskLevel,
      confidence: data.confidence || 0.8,
      factors: data.factors || [],
      explanation: data.explanation || 'Risk assessment completed',
      modelVersion: data.model_version || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process credit score response
   * @private
   */
  _processCreditScoreResponse(data) {
    if (!data || typeof data.credit_score !== 'number') {
      throw new AppError('Invalid credit score response format', 500, 'AI_RESPONSE_ERROR');
    }

    const creditScore = Math.max(300, Math.min(850, data.credit_score));

    return {
      creditScore,
      confidence: data.confidence || 0.8,
      factors: data.factors || [],
      explanation: data.explanation || 'Credit score calculated',
      modelVersion: data.model_version || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process fraud detection response
   * @private
   */
  _processFraudDetectionResponse(data) {
    if (!data || typeof data.fraud_score !== 'number') {
      throw new AppError('Invalid fraud detection response format', 500, 'AI_RESPONSE_ERROR');
    }

    const fraudScore = Math.max(0, Math.min(100, data.fraud_score));
    const isFraudulent = fraudScore > 70; // Threshold for fraud detection

    return {
      fraudScore,
      isFraudulent,
      confidence: data.confidence || 0.8,
      factors: data.factors || [],
      explanation: data.explanation || 'Fraud detection completed',
      modelVersion: data.model_version || 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AIService();

