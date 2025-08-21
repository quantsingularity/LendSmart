const express = require('express');
const httpProxy = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/monitoring/errorHandler');
const authMiddleware = require('../middleware/security/authMiddleware');

/**
 * API Gateway for LendSmart
 * Provides centralized routing, authentication, rate limiting, and monitoring
 * for all microservices with comprehensive security and observability features
 */
class APIGateway {
  constructor() {
    this.app = express();
    this.services = new Map();
    this.healthChecks = new Map();
    this.circuitBreakers = new Map();
    
    // Gateway configuration
    this.config = {
      port: process.env.GATEWAY_PORT || 3000,
      timeout: parseInt(process.env.GATEWAY_TIMEOUT) || 30000,
      retries: parseInt(process.env.GATEWAY_RETRIES) || 3,
      circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5,
      circuitBreakerTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 60000
    };

    // Rate limiting configurations
    this.rateLimiters = {
      global: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requests per window
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false,
        handler: this._rateLimitHandler.bind(this)
      }),
      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 auth requests per window
        message: 'Too many authentication attempts',
        skipSuccessfulRequests: true
      }),
      api: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 API requests per minute
        message: 'API rate limit exceeded'
      })
    };

    this.initialize();
  }

  /**
   * Initialize API Gateway
   */
  initialize() {
    this._setupMiddleware();
    this._registerServices();
    this._setupRoutes();
    this._setupErrorHandling();
    this._startHealthChecks();
  }

  /**
   * Setup middleware
   * @private
   */
  _setupMiddleware() {
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://lendsmart.com']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
        'X-Correlation-ID'
      ],
      exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and correlation ID
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] || this._generateRequestId();
      req.correlationId = req.headers['x-correlation-id'] || req.id;
      
      res.setHeader('X-Request-ID', req.id);
      res.setHeader('X-Correlation-ID', req.correlationId);
      
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        logger.info('Gateway request', {
          requestId: req.id,
          correlationId: req.correlationId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id
        });
      });
      
      next();
    });

    // Global rate limiting
    this.app.use(this.rateLimiters.global);

    logger.info('API Gateway middleware configured');
  }

  /**
   * Register microservices
   * @private
   */
  _registerServices() {
    // Register services with their configurations
    this.registerService('auth', {
      target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      pathRewrite: { '^/api/auth': '' },
      timeout: 10000,
      retries: 2
    });

    this.registerService('users', {
      target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      pathRewrite: { '^/api/users': '' },
      timeout: 15000,
      retries: 3,
      requireAuth: true
    });

    this.registerService('loans', {
      target: process.env.LOAN_SERVICE_URL || 'http://localhost:3003',
      pathRewrite: { '^/api/loans': '' },
      timeout: 20000,
      retries: 3,
      requireAuth: true
    });

    this.registerService('payments', {
      target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
      pathRewrite: { '^/api/payments': '' },
      timeout: 30000,
      retries: 2,
      requireAuth: true
    });

    this.registerService('ai', {
      target: process.env.AI_SERVICE_URL || 'http://localhost:3005',
      pathRewrite: { '^/api/ai': '' },
      timeout: 45000,
      retries: 2,
      requireAuth: true,
      roles: ['admin', 'system']
    });

    this.registerService('blockchain', {
      target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3006',
      pathRewrite: { '^/api/blockchain': '' },
      timeout: 60000,
      retries: 1,
      requireAuth: true,
      roles: ['admin', 'system']
    });

    this.registerService('compliance', {
      target: process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:3007',
      pathRewrite: { '^/api/compliance': '' },
      timeout: 30000,
      retries: 2,
      requireAuth: true,
      roles: ['admin', 'compliance']
    });

    this.registerService('notifications', {
      target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
      pathRewrite: { '^/api/notifications': '' },
      timeout: 15000,
      retries: 3,
      requireAuth: true
    });

    logger.info('Microservices registered', {
      serviceCount: this.services.size,
      services: Array.from(this.services.keys())
    });
  }

  /**
   * Register a microservice
   * @param {string} name - Service name
   * @param {Object} config - Service configuration
   */
  registerService(name, config) {
    const serviceConfig = {
      name,
      target: config.target,
      timeout: config.timeout || this.config.timeout,
      retries: config.retries || this.config.retries,
      requireAuth: config.requireAuth || false,
      roles: config.roles || [],
      permissions: config.permissions || [],
      pathRewrite: config.pathRewrite || {},
      ...config
    };

    this.services.set(name, serviceConfig);
    this._initializeCircuitBreaker(name);

    logger.info('Service registered', {
      service: name,
      target: config.target,
      requireAuth: serviceConfig.requireAuth
    });
  }

  /**
   * Setup routes
   * @private
   */
  _setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = this._getGatewayHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Detailed health check
    this.app.get('/health/detailed', (req, res) => {
      const health = this._getDetailedHealth();
      const statusCode = health.overall === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = this._getMetrics();
      res.json(metrics);
    });

    // Service discovery endpoint
    this.app.get('/services', authMiddleware.authorize(['admin']), (req, res) => {
      const services = Array.from(this.services.entries()).map(([name, config]) => ({
        name,
        target: config.target,
        status: this._getServiceStatus(name),
        requireAuth: config.requireAuth,
        roles: config.roles
      }));
      
      res.json({ services });
    });

    // Setup service routes
    for (const [serviceName, serviceConfig] of this.services) {
      this._setupServiceRoute(serviceName, serviceConfig);
    }

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.originalUrl
      });
    });

    logger.info('API Gateway routes configured');
  }

  /**
   * Setup route for a specific service
   * @private
   */
  _setupServiceRoute(serviceName, serviceConfig) {
    const routePath = `/api/${serviceName}`;
    
    // Create middleware chain
    const middlewares = [];

    // Add rate limiting for specific services
    if (serviceName === 'auth') {
      middlewares.push(this.rateLimiters.auth);
    } else {
      middlewares.push(this.rateLimiters.api);
    }

    // Add authentication if required
    if (serviceConfig.requireAuth) {
      middlewares.push(authMiddleware.authenticate);
      
      // Add authorization if roles/permissions specified
      if (serviceConfig.roles.length > 0 || serviceConfig.permissions.length > 0) {
        middlewares.push(authMiddleware.authorize(serviceConfig.roles, serviceConfig.permissions));
      }
    }

    // Add circuit breaker check
    middlewares.push(this._circuitBreakerMiddleware(serviceName));

    // Create proxy middleware
    const proxyMiddleware = this._createProxyMiddleware(serviceName, serviceConfig);
    middlewares.push(proxyMiddleware);

    // Apply middleware chain
    this.app.use(routePath, ...middlewares);

    logger.info('Service route configured', {
      service: serviceName,
      path: routePath,
      middlewareCount: middlewares.length
    });
  }

  /**
   * Create proxy middleware for a service
   * @private
   */
  _createProxyMiddleware(serviceName, serviceConfig) {
    return httpProxy.createProxyMiddleware({
      target: serviceConfig.target,
      changeOrigin: true,
      pathRewrite: serviceConfig.pathRewrite,
      timeout: serviceConfig.timeout,
      proxyTimeout: serviceConfig.timeout,
      
      // Add headers
      onProxyReq: (proxyReq, req, res) => {
        // Add correlation headers
        proxyReq.setHeader('X-Request-ID', req.id);
        proxyReq.setHeader('X-Correlation-ID', req.correlationId);
        proxyReq.setHeader('X-Gateway-Service', serviceName);
        
        // Add user context if authenticated
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
          proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
        }

        logger.debug('Proxying request', {
          service: serviceName,
          target: serviceConfig.target,
          path: req.path,
          requestId: req.id
        });
      },

      // Handle responses
      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        res.setHeader('X-Service', serviceName);
        res.setHeader('X-Gateway', 'LendSmart-Gateway/1.0');

        logger.debug('Received response', {
          service: serviceName,
          statusCode: proxyRes.statusCode,
          requestId: req.id
        });
      },

      // Handle errors
      onError: (err, req, res) => {
        logger.error('Proxy error', {
          service: serviceName,
          error: err.message,
          requestId: req.id,
          path: req.path
        });

        // Update circuit breaker
        this._recordServiceFailure(serviceName);

        // Return error response
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE',
            service: serviceName,
            requestId: req.id
          });
        }
      }
    });
  }

  /**
   * Initialize circuit breaker for a service
   * @private
   */
  _initializeCircuitBreaker(serviceName) {
    this.circuitBreakers.set(serviceName, {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    });
  }

  /**
   * Circuit breaker middleware
   * @private
   */
  _circuitBreakerMiddleware(serviceName) {
    return (req, res, next) => {
      const circuitBreaker = this.circuitBreakers.get(serviceName);
      
      if (!circuitBreaker) {
        return next();
      }

      const now = Date.now();

      switch (circuitBreaker.state) {
        case 'OPEN':
          // Check if timeout has passed
          if (now - circuitBreaker.lastFailureTime > this.config.circuitBreakerTimeout) {
            circuitBreaker.state = 'HALF_OPEN';
            circuitBreaker.successCount = 0;
            logger.info('Circuit breaker half-open', { service: serviceName });
            return next();
          } else {
            logger.warn('Circuit breaker open', { service: serviceName });
            return res.status(503).json({
              error: 'Service circuit breaker is open',
              code: 'CIRCUIT_BREAKER_OPEN',
              service: serviceName
            });
          }

        case 'HALF_OPEN':
          // Allow limited requests through
          if (circuitBreaker.successCount >= 3) {
            circuitBreaker.state = 'CLOSED';
            circuitBreaker.failureCount = 0;
            logger.info('Circuit breaker closed', { service: serviceName });
          }
          return next();

        case 'CLOSED':
        default:
          return next();
      }
    };
  }

  /**
   * Record service failure
   * @private
   */
  _recordServiceFailure(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();

      if (circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
        circuitBreaker.state = 'OPEN';
        logger.warn('Circuit breaker opened', {
          service: serviceName,
          failureCount: circuitBreaker.failureCount
        });
      }
    }
  }

  /**
   * Record service success
   * @private
   */
  _recordServiceSuccess(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker) {
      if (circuitBreaker.state === 'HALF_OPEN') {
        circuitBreaker.successCount++;
      } else if (circuitBreaker.state === 'CLOSED') {
        circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1);
      }
    }
  }

  /**
   * Setup error handling
   * @private
   */
  _setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Gateway error', {
        error: error.message,
        stack: error.stack,
        requestId: req.id,
        path: req.path,
        method: req.method
      });

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          requestId: req.id
        });
      }

      res.status(500).json({
        error: 'Internal gateway error',
        code: 'GATEWAY_ERROR',
        requestId: req.id
      });
    });
  }

  /**
   * Start health checks for services
   * @private
   */
  _startHealthChecks() {
    // Check service health every 30 seconds
    setInterval(() => {
      this._performHealthChecks();
    }, 30000);

    // Initial health check
    this._performHealthChecks();
  }

  /**
   * Perform health checks on all services
   * @private
   */
  async _performHealthChecks() {
    for (const [serviceName, serviceConfig] of this.services) {
      try {
        const response = await fetch(`${serviceConfig.target}/health`, {
          method: 'GET',
          timeout: 5000
        });

        const isHealthy = response.ok;
        this.healthChecks.set(serviceName, {
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime: response.headers.get('x-response-time') || null
        });

        if (isHealthy) {
          this._recordServiceSuccess(serviceName);
        } else {
          this._recordServiceFailure(serviceName);
        }

      } catch (error) {
        this.healthChecks.set(serviceName, {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: error.message
        });

        this._recordServiceFailure(serviceName);
      }
    }
  }

  /**
   * Get gateway health status
   * @private
   */
  _getGatewayHealth() {
    const unhealthyServices = Array.from(this.healthChecks.entries())
      .filter(([, health]) => health.status !== 'healthy')
      .map(([name]) => name);

    return {
      status: unhealthyServices.length === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: this.services.size,
      unhealthyServices: unhealthyServices.length,
      uptime: process.uptime()
    };
  }

  /**
   * Get detailed health status
   * @private
   */
  _getDetailedHealth() {
    const serviceHealth = {};
    
    for (const [serviceName] of this.services) {
      const health = this.healthChecks.get(serviceName);
      const circuitBreaker = this.circuitBreakers.get(serviceName);
      
      serviceHealth[serviceName] = {
        status: health?.status || 'unknown',
        lastCheck: health?.lastCheck || null,
        circuitBreakerState: circuitBreaker?.state || 'UNKNOWN',
        failureCount: circuitBreaker?.failureCount || 0
      };
    }

    const healthyCount = Object.values(serviceHealth)
      .filter(health => health.status === 'healthy').length;

    return {
      overall: healthyCount === this.services.size ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      },
      services: serviceHealth
    };
  }

  /**
   * Get service status
   * @private
   */
  _getServiceStatus(serviceName) {
    const health = this.healthChecks.get(serviceName);
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    return {
      health: health?.status || 'unknown',
      circuitBreaker: circuitBreaker?.state || 'UNKNOWN',
      lastCheck: health?.lastCheck || null
    };
  }

  /**
   * Get gateway metrics
   * @private
   */
  _getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        total: this.services.size,
        healthy: Array.from(this.healthChecks.values())
          .filter(health => health.status === 'healthy').length
      },
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [
          name,
          { state: cb.state, failures: cb.failureCount }
        ])
      )
    };
  }

  /**
   * Rate limit handler
   * @private
   */
  _rateLimitHandler(req, res) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });

    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }

  /**
   * Generate request ID
   * @private
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the API Gateway
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.config.port, '0.0.0.0', () => {
          logger.info('API Gateway started', {
            port: this.config.port,
            services: this.services.size,
            environment: process.env.NODE_ENV || 'development'
          });
          resolve(server);
        });

        server.on('error', (error) => {
          logger.error('Gateway startup error', { error: error.message });
          reject(error);
        });

      } catch (error) {
        logger.error('Failed to start API Gateway', { error: error.message });
        reject(error);
      }
    });
  }
}

module.exports = APIGateway;

