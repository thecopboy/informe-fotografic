import { monitor } from '../utils/monitor.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware de monitoring per Express
 */
export const monitoringMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Interceptar resposta per mesurar temps
    res.send = function(data) {
        const duration = Date.now() - startTime;
        trackResponse(req, res, duration, data);
        return originalSend.call(this, data);
    };

    res.json = function(data) {
        const duration = Date.now() - startTime;
        trackResponse(req, res, duration, data);
        return originalJson.call(this, data);
    };

    // Track de la petició
    const context = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        userId: req.user?.id || 'anonymous'
    };

    // Log de la petició entrant
    logger.info(`Request started: ${req.method} ${req.path}`, context);

    next();
};

/**
 * Track de resposta HTTP
 */
function trackResponse(req, res, duration, data) {
    const context = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        userId: req.user?.id || 'anonymous',
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
    };

    // Track amb el monitor
    monitor.trackRequest(req.method, req.path, res.statusCode, duration, context);

    // Log de la resposta (només per errors, ja que requestLogger ja fa el logging general)
    if (res.statusCode >= 400) {
        logger.warn(`Request completed: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, context);
    }
}

/**
 * Middleware d'errors per monitoring
 */
export const errorMonitoringMiddleware = (error, req, res, next) => {
    const context = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        userId: req.user?.id || 'anonymous',
        body: req.body,
        query: req.query,
        params: req.params
    };

    // Track de l'error amb el monitor
    monitor.trackError(error, context);

    // Log de l'error
    logger.error(`Unhandled error: ${error.message}`, context);

    next(error);
};

/**
 * Middleware de seguretat per monitoring
 */
export const securityMonitoringMiddleware = (req, res, next) => {
    const securityContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    };

    // Detectar activitat sospitosa
    const suspiciousPatterns = [
        /\.\.\//, // Path traversal
        /<script/i, // XSS
        /union\s+select/i, // SQL injection
        /eval\s*\(/i, // Code injection
    ];

    const userInput = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(userInput)) {
            logger.security(`Suspicious activity detected: ${pattern.source}`, securityContext);
            monitor.trackError(new Error(`Security threat: ${pattern.source}`), securityContext);
        }
    }

    // Detectar rate limiting
    const clientIP = req.ip;
    const currentTime = Date.now();
    
    if (!req.app.locals.rateLimit) {
        req.app.locals.rateLimit = {};
    }
    
    if (!req.app.locals.rateLimit[clientIP]) {
        req.app.locals.rateLimit[clientIP] = { count: 0, resetTime: currentTime + 60000 };
    }
    
    if (currentTime > req.app.locals.rateLimit[clientIP].resetTime) {
        req.app.locals.rateLimit[clientIP] = { count: 0, resetTime: currentTime + 60000 };
    }
    
    req.app.locals.rateLimit[clientIP].count++;
    
    if (req.app.locals.rateLimit[clientIP].count > 100) {
        logger.security(`Rate limit exceeded for IP: ${clientIP}`, securityContext);
        monitor.trackError(new Error('Rate limit exceeded'), securityContext);
    }

    next();
};

/**
 * Middleware de rendiment per monitoring
 */
export const performanceMonitoringMiddleware = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convertir a mil·lisegons
        
        const performanceContext = {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('Content-Length') || 0
        };

        // Track de rendiment (només per operacions lentes, ja que requestLogger ja fa el logging general)
        if (duration > 1000) { // Més d'1 segon
            logger.warn(`Slow request detected: ${duration}ms`, performanceContext);
        }
    });

    next();
};

/**
 * Middleware de tracing per monitoring
 */
export const tracingMiddleware = (req, res, next) => {
    // Generar ID de trace únic
    const traceId = generateTraceId();
    
    // Afegir a l'objecte request
    req.traceId = traceId;
    
    // Afegir header de trace
    res.setHeader('X-Trace-ID', traceId);
    
    // Log de trace
    logger.debug(`Trace started: ${traceId}`, {
        traceId,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    next();
};

/**
 * Generar ID de trace únic
 */
function generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware de mètriques de negoci
 */
export const businessMetricsMiddleware = (req, res, next) => {
    // Detectar operacions de negoci basades en la ruta
    const businessOperations = {
        '/api/reports': 'report_operation',
        '/api/photos': 'photo_operation',
        '/api/auth/login': 'user_login',
        '/api/auth/register': 'user_register',
        '/api/reports/generate': 'report_generated',
        '/api/photos/upload': 'photo_uploaded'
    };

    const operation = businessOperations[req.path];
    
    if (operation) {
        const businessContext = {
            operation,
            path: req.path,
            method: req.method,
            userId: req.user?.id || 'anonymous'
        };

        // Track de l'operació de negoci
        monitor.trackBusinessOperation(operation, businessContext);
    }

    next();
};

// Middleware de cleanup eliminat - no feia cap operació útil

/**
 * Configurar tots els middlewares de monitoring
 */
export const setupMonitoring = (app) => {
    // Middlewares de monitoring
    app.use(tracingMiddleware);
    app.use(securityMonitoringMiddleware);
    app.use(performanceMonitoringMiddleware);
    app.use(businessMetricsMiddleware);
    app.use(monitoringMiddleware);
    // cleanupMonitoringMiddleware eliminat
    
    // Middleware d'errors (ha d'anar després dels altres)
    app.use(errorMonitoringMiddleware);
    
    logger.info('Monitoring middleware configured');
};

/**
 * Obtenir estadístiques de monitoring
 */
export const getMonitoringStats = () => {
    return {
        dashboard: monitor.getDashboard(),
        performance: monitor.getPerformanceStats(),
        business: monitor.getBusinessStats(),
        alerts: monitor.getActiveAlerts(),
        logs: logger.getStats()
    };
}; 