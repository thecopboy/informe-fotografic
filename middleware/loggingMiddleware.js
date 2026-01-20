/**
 * Middleware de logging per peticions HTTP
 */

import { logger } from '../utils/logger.js';
import { monitor } from '../utils/monitor.js';

export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Interceptar la resposta per registrar el temps
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - start;
        
        // Log amb el sistema de logging
        logger.request(
            req.method, 
            req.originalUrl, 
            res.statusCode, 
            responseTime,
            {
                userAgent: req.get('User-Agent'),
                ip: req.ip
            }
        );
        
        // Track amb el sistema de monitoring
        monitor.trackRequest(req.method, req.originalUrl, res.statusCode, responseTime, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        originalSend.call(this, data);
    };

    // Log de peticions de seguretat
    if (req.path.includes('/auth/')) {
        logger.security('Auth request', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }

    next();
};

export const errorLogger = (err, req, res, next) => {
    // Log amb el sistema de logging
    logger.error('Unhandled error', {
        method: req.method,
        path: req.path,
        error: err.message,
        stack: err.stack
    });
    
    // Track amb el sistema de monitoring
    monitor.trackError(err, {
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    
    next(err);
}; 