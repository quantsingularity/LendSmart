const { logger } = require('../../utils/logger');
const { cache } = require('../../config/database');

/**
 * Metrics Collection System
 * Collects and aggregates application metrics for monitoring and alerting
 */

class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.counters = new Map();
        this.histograms = new Map();
        this.gauges = new Map();
        this.timers = new Map();

        this.startTime = Date.now();
        this.resetInterval = 60000; // Reset metrics every minute

        this.initializeMetrics();
        this.startPeriodicReset();
    }

    /**
     * Initialize default metrics
     */
    initializeMetrics() {
        // HTTP Request metrics
        this.createCounter('http_requests_total', 'Total HTTP requests');
        this.createHistogram('http_request_duration', 'HTTP request duration in milliseconds');
        this.createCounter('http_errors_total', 'Total HTTP errors');

        // Database metrics
        this.createCounter('db_queries_total', 'Total database queries');
        this.createHistogram('db_query_duration', 'Database query duration in milliseconds');
        this.createCounter('db_errors_total', 'Total database errors');

        // Authentication metrics
        this.createCounter('auth_attempts_total', 'Total authentication attempts');
        this.createCounter('auth_failures_total', 'Total authentication failures');
        this.createCounter('auth_successes_total', 'Total successful authentications');

        // Business metrics
        this.createCounter('loan_applications_total', 'Total loan applications');
        this.createCounter('loan_approvals_total', 'Total loan approvals');
        this.createCounter('loan_rejections_total', 'Total loan rejections');
        this.createCounter('payments_total', 'Total payments processed');
        this.createHistogram('payment_amount', 'Payment amounts');

        // System metrics
        this.createGauge('memory_usage', 'Memory usage in bytes');
        this.createGauge('cpu_usage', 'CPU usage percentage');
        this.createGauge('active_connections', 'Active database connections');

        // Cache metrics
        this.createCounter('cache_hits_total', 'Total cache hits');
        this.createCounter('cache_misses_total', 'Total cache misses');

        logger.info('Metrics collector initialized with default metrics');
    }

    /**
     * Create a counter metric
     */
    createCounter(name, description) {
        this.counters.set(name, {
            value: 0,
            description,
            type: 'counter',
            labels: new Map(),
        });
    }

    /**
     * Create a histogram metric
     */
    createHistogram(
        name,
        description,
        buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    ) {
        this.histograms.set(name, {
            buckets: new Map(buckets.map((b) => [b, 0])),
            sum: 0,
            count: 0,
            description,
            type: 'histogram',
            labels: new Map(),
        });
    }

    /**
     * Create a gauge metric
     */
    createGauge(name, description) {
        this.gauges.set(name, {
            value: 0,
            description,
            type: 'gauge',
            labels: new Map(),
        });
    }

    /**
     * Increment a counter
     */
    incrementCounter(name, labels = {}, value = 1) {
        const counter = this.counters.get(name);
        if (!counter) {
            logger.warn(`Counter ${name} not found`);
            return;
        }

        const labelKey = this.getLabelKey(labels);
        const currentValue = counter.labels.get(labelKey) || 0;
        counter.labels.set(labelKey, currentValue + value);
        counter.value += value;
    }

    /**
     * Record a value in a histogram
     */
    recordHistogram(name, value, labels = {}) {
        const histogram = this.histograms.get(name);
        if (!histogram) {
            logger.warn(`Histogram ${name} not found`);
            return;
        }

        const labelKey = this.getLabelKey(labels);
        if (!histogram.labels.has(labelKey)) {
            histogram.labels.set(labelKey, {
                buckets: new Map(Array.from(histogram.buckets.keys()).map((b) => [b, 0])),
                sum: 0,
                count: 0,
            });
        }

        const labelData = histogram.labels.get(labelKey);

        // Update buckets
        for (const [bucket, count] of labelData.buckets) {
            if (value <= bucket) {
                labelData.buckets.set(bucket, count + 1);
            }
        }

        labelData.sum += value;
        labelData.count += 1;

        histogram.sum += value;
        histogram.count += 1;
    }

    /**
     * Set a gauge value
     */
    setGauge(name, value, labels = {}) {
        const gauge = this.gauges.get(name);
        if (!gauge) {
            logger.warn(`Gauge ${name} not found`);
            return;
        }

        const labelKey = this.getLabelKey(labels);
        gauge.labels.set(labelKey, value);
        gauge.value = value;
    }

    /**
     * Start a timer
     */
    startTimer(name, labels = {}) {
        const timerKey = `${name}_${this.getLabelKey(labels)}`;
        this.timers.set(timerKey, Date.now());

        return () => {
            const startTime = this.timers.get(timerKey);
            if (startTime) {
                const duration = Date.now() - startTime;
                this.recordHistogram(name, duration, labels);
                this.timers.delete(timerKey);
                return duration;
            }
            return 0;
        };
    }

    /**
     * Get label key for grouping
     */
    getLabelKey(labels) {
        if (!labels || Object.keys(labels).length === 0) {
            return 'default';
        }

        return Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
    }

    /**
     * HTTP request middleware
     */
    httpMetricsMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            // Increment request counter
            this.incrementCounter('http_requests_total', {
                method: req.method,
                route: req.route?.path || req.path,
            });

            // Override res.end to capture response metrics
            const originalEnd = res.end;
            res.end = (...args) => {
                const duration = Date.now() - startTime;

                // Record request duration
                this.recordHistogram('http_request_duration', duration, {
                    method: req.method,
                    route: req.route?.path || req.path,
                    status_code: res.statusCode.toString(),
                });

                // Count errors
                if (res.statusCode >= 400) {
                    this.incrementCounter('http_errors_total', {
                        method: req.method,
                        route: req.route?.path || req.path,
                        status_code: res.statusCode.toString(),
                    });
                }

                originalEnd.apply(res, args);
            };

            next();
        };
    }

    /**
     * Database query metrics
     */
    recordDatabaseQuery(operation, collection, duration, success = true) {
        this.incrementCounter('db_queries_total', {
            operation,
            collection,
        });

        this.recordHistogram('db_query_duration', duration, {
            operation,
            collection,
        });

        if (!success) {
            this.incrementCounter('db_errors_total', {
                operation,
                collection,
            });
        }
    }

    /**
     * Authentication metrics
     */
    recordAuthAttempt(success, method = 'password', reason = null) {
        this.incrementCounter('auth_attempts_total', { method });

        if (success) {
            this.incrementCounter('auth_successes_total', { method });
        } else {
            this.incrementCounter('auth_failures_total', {
                method,
                reason: reason || 'unknown',
            });
        }
    }

    /**
     * Business metrics
     */
    recordLoanApplication(amount, purpose) {
        this.incrementCounter('loan_applications_total', { purpose });
        this.recordHistogram('loan_application_amount', amount, { purpose });
    }

    recordLoanDecision(decision, amount, purpose) {
        if (decision === 'approved') {
            this.incrementCounter('loan_approvals_total', { purpose });
        } else {
            this.incrementCounter('loan_rejections_total', { purpose });
        }
    }

    recordPayment(amount, method, success = true) {
        this.incrementCounter('payments_total', {
            method,
            status: success ? 'success' : 'failed',
        });

        if (success) {
            this.recordHistogram('payment_amount', amount, { method });
        }
    }

    /**
     * Cache metrics
     */
    recordCacheHit(key) {
        this.incrementCounter('cache_hits_total');
    }

    recordCacheMiss(key) {
        this.incrementCounter('cache_misses_total');
    }

    /**
     * System metrics collection
     */
    async collectSystemMetrics() {
        try {
            // Memory metrics
            const memUsage = process.memoryUsage();
            this.setGauge('memory_usage', memUsage.heapUsed, { type: 'heap_used' });
            this.setGauge('memory_usage', memUsage.heapTotal, { type: 'heap_total' });
            this.setGauge('memory_usage', memUsage.external, { type: 'external' });
            this.setGauge('memory_usage', memUsage.rss, { type: 'rss' });

            // CPU metrics (simplified)
            const cpuUsage = process.cpuUsage();
            this.setGauge('cpu_usage', cpuUsage.user + cpuUsage.system);
        } catch (error) {
            logger.error('Failed to collect system metrics', {
                error: error.message,
            });
        }
    }

    /**
     * Get all metrics in Prometheus format
     */
    getPrometheusMetrics() {
        let output = '';

        // Counters
        for (const [name, counter] of this.counters) {
            output += `# HELP ${name} ${counter.description}\n`;
            output += `# TYPE ${name} counter\n`;

            if (counter.labels.size === 0) {
                output += `${name} ${counter.value}\n`;
            } else {
                for (const [labelKey, value] of counter.labels) {
                    const labels = labelKey === 'default' ? '' : `{${labelKey}}`;
                    output += `${name}${labels} ${value}\n`;
                }
            }
            output += '\n';
        }

        // Histograms
        for (const [name, histogram] of this.histograms) {
            output += `# HELP ${name} ${histogram.description}\n`;
            output += `# TYPE ${name} histogram\n`;

            if (histogram.labels.size === 0) {
                for (const [bucket, count] of histogram.buckets) {
                    output += `${name}_bucket{le="${bucket}"} ${count}\n`;
                }
                output += `${name}_sum ${histogram.sum}\n`;
                output += `${name}_count ${histogram.count}\n`;
            } else {
                for (const [labelKey, labelData] of histogram.labels) {
                    const baseLabels = labelKey === 'default' ? '' : labelKey;

                    for (const [bucket, count] of labelData.buckets) {
                        const labels = baseLabels
                            ? `{${baseLabels},le="${bucket}"}`
                            : `{le="${bucket}"}`;
                        output += `${name}_bucket${labels} ${count}\n`;
                    }

                    const labels = baseLabels ? `{${baseLabels}}` : '';
                    output += `${name}_sum${labels} ${labelData.sum}\n`;
                    output += `${name}_count${labels} ${labelData.count}\n`;
                }
            }
            output += '\n';
        }

        // Gauges
        for (const [name, gauge] of this.gauges) {
            output += `# HELP ${name} ${gauge.description}\n`;
            output += `# TYPE ${name} gauge\n`;

            if (gauge.labels.size === 0) {
                output += `${name} ${gauge.value}\n`;
            } else {
                for (const [labelKey, value] of gauge.labels) {
                    const labels = labelKey === 'default' ? '' : `{${labelKey}}`;
                    output += `${name}${labels} ${value}\n`;
                }
            }
            output += '\n';
        }

        return output;
    }

    /**
     * Get metrics in JSON format
     */
    getJSONMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            counters: {},
            histograms: {},
            gauges: {},
        };

        // Convert counters
        for (const [name, counter] of this.counters) {
            metrics.counters[name] = {
                value: counter.value,
                description: counter.description,
                labels: Object.fromEntries(counter.labels),
            };
        }

        // Convert histograms
        for (const [name, histogram] of this.histograms) {
            metrics.histograms[name] = {
                sum: histogram.sum,
                count: histogram.count,
                description: histogram.description,
                labels: {},
            };

            for (const [labelKey, labelData] of histogram.labels) {
                metrics.histograms[name].labels[labelKey] = {
                    sum: labelData.sum,
                    count: labelData.count,
                    buckets: Object.fromEntries(labelData.buckets),
                };
            }
        }

        // Convert gauges
        for (const [name, gauge] of this.gauges) {
            metrics.gauges[name] = {
                value: gauge.value,
                description: gauge.description,
                labels: Object.fromEntries(gauge.labels),
            };
        }

        return metrics;
    }

    /**
     * Reset metrics periodically
     */
    startPeriodicReset() {
        setInterval(() => {
            this.collectSystemMetrics();

            // Store metrics in cache for persistence
            if (cache) {
                cache.set('metrics_snapshot', this.getJSONMetrics(), 300); // 5 minutes TTL
            }
        }, this.resetInterval);
    }

    /**
     * Get metrics endpoint handler
     */
    getMetricsHandler() {
        return async (req, res) => {
            try {
                const format = req.query.format || req.headers.accept;

                if (format && format.includes('application/json')) {
                    res.setHeader('Content-Type', 'application/json');
                    res.json(this.getJSONMetrics());
                } else {
                    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
                    res.send(this.getPrometheusMetrics());
                }
            } catch (error) {
                logger.error('Failed to generate metrics', { error: error.message });
                res.status(500).json({ error: 'Failed to generate metrics' });
            }
        };
    }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

module.exports = {
    metricsCollector,
    httpMetricsMiddleware: metricsCollector.httpMetricsMiddleware.bind(metricsCollector),
    getMetricsHandler: metricsCollector.getMetricsHandler.bind(metricsCollector),
};
