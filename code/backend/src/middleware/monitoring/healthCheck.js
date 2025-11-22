const { databaseManager } = require('../../config/database');
const { logger } = require('../../utils/logger');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

/**
 * Health Check Middleware
 * Provides comprehensive system health monitoring endpoints
 */

class HealthCheckService {
    constructor() {
        this.startTime = Date.now();
        this.healthChecks = new Map();
        this.registerDefaultChecks();
    }

    /**
     * Register default health checks
     */
    registerDefaultChecks() {
        this.healthChecks.set('database', this.checkDatabase.bind(this));
        this.healthChecks.set('cache', this.checkCache.bind(this));
        this.healthChecks.set('memory', this.checkMemory.bind(this));
        this.healthChecks.set('disk', this.checkDisk.bind(this));
        this.healthChecks.set('cpu', this.checkCPU.bind(this));
        this.healthChecks.set('external_services', this.checkExternalServices.bind(this));
    }

    /**
     * Register custom health check
     */
    registerCheck(name, checkFunction) {
        this.healthChecks.set(name, checkFunction);
    }

    /**
     * Basic health endpoint - lightweight check
     */
    async basicHealth(req, res) {
        try {
            const uptime = Date.now() - this.startTime;

            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: uptime,
                service: 'lendsmart-backend',
                version: process.env.APP_VERSION || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            });
        } catch (error) {
            logger.error('Basic health check failed', { error: error.message });

            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
            });
        }
    }

    /**
     * Detailed health endpoint - comprehensive system check
     */
    async detailedHealth(req, res) {
        const startTime = Date.now();
        const health = {
            status: 'unknown',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            service: 'lendsmart-backend',
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {},
            summary: {
                healthy: 0,
                unhealthy: 0,
                degraded: 0,
                total: 0,
            },
        };

        // Run all health checks in parallel
        const checkPromises = Array.from(this.healthChecks.entries()).map(
            async ([name, checkFn]) => {
                try {
                    const checkResult = await Promise.race([
                        checkFn(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Health check timeout')), 5000),
                        ),
                    ]);

                    health.checks[name] = {
                        status: checkResult.status || 'healthy',
                        ...checkResult,
                    };
                } catch (error) {
                    health.checks[name] = {
                        status: 'unhealthy',
                        error: error.message,
                        timestamp: new Date().toISOString(),
                    };
                }
            },
        );

        await Promise.allSettled(checkPromises);

        // Calculate summary
        Object.values(health.checks).forEach((check) => {
            health.summary.total++;
            if (check.status === 'healthy') {
                health.summary.healthy++;
            } else if (check.status === 'degraded') {
                health.summary.degraded++;
            } else {
                health.summary.unhealthy++;
            }
        });

        // Determine overall status
        if (health.summary.unhealthy > 0) {
            health.status = 'unhealthy';
        } else if (health.summary.degraded > 0) {
            health.status = 'degraded';
        } else {
            health.status = 'healthy';
        }

        health.duration = Date.now() - startTime;

        // Log health check results
        logger.info('Detailed health check completed', {
            status: health.status,
            duration: health.duration,
            summary: health.summary,
        });

        // Return appropriate HTTP status
        const statusCode =
            health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(health);
    }

    /**
     * Readiness probe - check if service is ready to accept traffic
     */
    async readiness(req, res) {
        try {
            // Check critical dependencies
            const dbHealth = await this.checkDatabase();

            if (dbHealth.status !== 'healthy') {
                return res.status(503).json({
                    status: 'not_ready',
                    timestamp: new Date().toISOString(),
                    reason: 'Database not available',
                });
            }

            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
                service: 'lendsmart-backend',
            });
        } catch (error) {
            logger.error('Readiness check failed', { error: error.message });

            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                error: error.message,
            });
        }
    }

    /**
     * Liveness probe - check if service is alive
     */
    async liveness(req, res) {
        try {
            // Simple check to ensure the process is responsive
            const memUsage = process.memoryUsage();

            // Check if memory usage is reasonable (less than 1GB)
            if (memUsage.heapUsed > 1024 * 1024 * 1024) {
                return res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    reason: 'High memory usage detected',
                });
            }

            res.status(200).json({
                status: 'alive',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime,
                memory: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024),
                },
            });
        } catch (error) {
            logger.error('Liveness check failed', { error: error.message });

            res.status(503).json({
                status: 'dead',
                timestamp: new Date().toISOString(),
                error: error.message,
            });
        }
    }

    /**
     * Database health check
     */
    async checkDatabase() {
        try {
            const dbHealth = await databaseManager.healthCheck();

            return {
                status: dbHealth.overall,
                mongodb: dbHealth.mongodb,
                redis: dbHealth.redis,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Cache health check
     */
    async checkCache() {
        try {
            const redisStatus = databaseManager.getRedisStatus();

            return {
                status: redisStatus.connected ? 'healthy' : 'unhealthy',
                connected: redisStatus.connected,
                redis_status: redisStatus.status,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Memory health check
     */
    async checkMemory() {
        try {
            const memUsage = process.memoryUsage();
            const systemMem = {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
            };

            const memoryStatus = {
                process: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                    external: Math.round(memUsage.external / 1024 / 1024), // MB
                    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                },
                system: {
                    total: Math.round(systemMem.total / 1024 / 1024), // MB
                    free: Math.round(systemMem.free / 1024 / 1024), // MB
                    used: Math.round(systemMem.used / 1024 / 1024), // MB
                    usagePercent: Math.round((systemMem.used / systemMem.total) * 100),
                },
            };

            // Determine status based on memory usage
            let status = 'healthy';
            if (memoryStatus.system.usagePercent > 90 || memoryStatus.process.heapUsed > 512) {
                status = 'unhealthy';
            } else if (
                memoryStatus.system.usagePercent > 80 ||
                memoryStatus.process.heapUsed > 256
            ) {
                status = 'degraded';
            }

            return {
                status,
                ...memoryStatus,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Disk health check
     */
    async checkDisk() {
        try {
            const stats = await fs.stat(process.cwd());

            // Simple disk check - in production, you'd want more sophisticated monitoring
            return {
                status: 'healthy',
                accessible: true,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                accessible: false,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * CPU health check
     */
    async checkCPU() {
        try {
            const cpus = os.cpus();
            const loadAvg = os.loadavg();

            const cpuInfo = {
                cores: cpus.length,
                model: cpus[0]?.model || 'unknown',
                loadAverage: {
                    '1min': Math.round(loadAvg[0] * 100) / 100,
                    '5min': Math.round(loadAvg[1] * 100) / 100,
                    '15min': Math.round(loadAvg[2] * 100) / 100,
                },
            };

            // Determine status based on load average
            let status = 'healthy';
            const loadPerCore = loadAvg[0] / cpus.length;

            if (loadPerCore > 1.5) {
                status = 'unhealthy';
            } else if (loadPerCore > 1.0) {
                status = 'degraded';
            }

            return {
                status,
                ...cpuInfo,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * External services health check
     */
    async checkExternalServices() {
        try {
            // In a real implementation, you'd check actual external services
            // For now, we'll simulate checks for common financial services

            const services = {
                payment_processor: { status: 'healthy', latency: 150 },
                credit_bureau: { status: 'healthy', latency: 300 },
                blockchain_node: { status: 'healthy', latency: 200 },
                notification_service: { status: 'healthy', latency: 100 },
            };

            const overallStatus = Object.values(services).every((s) => s.status === 'healthy')
                ? 'healthy'
                : 'degraded';

            return {
                status: overallStatus,
                services,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * System metrics endpoint
     */
    async metrics(req, res) {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime,
                process: {
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                },
                system: {
                    hostname: os.hostname(),
                    type: os.type(),
                    release: os.release(),
                    uptime: os.uptime(),
                    loadavg: os.loadavg(),
                    totalmem: os.totalmem(),
                    freemem: os.freemem(),
                    cpus: os.cpus().length,
                },
                environment: {
                    node_env: process.env.NODE_ENV,
                    app_version: process.env.APP_VERSION || '1.0.0',
                },
            };

            res.status(200).json(metrics);
        } catch (error) {
            logger.error('Metrics collection failed', { error: error.message });

            res.status(500).json({
                error: 'Failed to collect metrics',
                timestamp: new Date().toISOString(),
            });
        }
    }
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

// Express middleware functions
const healthCheckMiddleware = {
    basic: (req, res) => healthCheckService.basicHealth(req, res),
    detailed: (req, res) => healthCheckService.detailedHealth(req, res),
    readiness: (req, res) => healthCheckService.readiness(req, res),
    liveness: (req, res) => healthCheckService.liveness(req, res),
    metrics: (req, res) => healthCheckService.metrics(req, res),
};

module.exports = {
    healthCheckService,
    healthCheckMiddleware,
};
