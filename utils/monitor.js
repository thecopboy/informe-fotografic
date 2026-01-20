import { logger } from './logger.js';
import { config } from '../config/config.js';

/**
 * Sistema de monitoring en temps real
 */
class Monitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                avgResponseTime: 0
            },
            performance: {
                memoryUsage: [],
                cpuUsage: [],
                responseTimes: []
            },
            business: {
                reportsGenerated: 0,
                photosUploaded: 0,
                usersActive: 0,
                logins: 0
            },
            errors: {
                total: 0,
                byType: {},
                recent: []
            }
        };

        this.alerts = [];
        this.thresholds = config.monitoring.thresholds;

        this.startTime = Date.now();
        this.timers = []; // Array per gestionar timers
        this.isDestroyed = false;
        
        // Configurar cleanup automàtic al tancar l'aplicació
        this.setupGracefulShutdown();
        this.setupMonitoring();
    }

    /**
     * Configurar shutdown graceful
     */
    setupGracefulShutdown() {
        const cleanup = () => {
            if (!this.isDestroyed) {
                process.exit(0);
                this.destroy();
            }
        };

        // Capturar senyals de tancament
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('exit', cleanup);
    }

    /**
     * Configurar monitoring automàtic
     */
    setupMonitoring() {
        // Monitoring de memòria (cada 2 minuts en lloc de 30 segons)
        const memoryTimer = setInterval(() => {
            if (!this.isDestroyed) {
            this.trackMemoryUsage();
            }
        }, 120000); // 2 minuts
        this.timers.push(memoryTimer);

        // Monitoring de CPU (cada 5 minuts en lloc d'1 minut)
        const cpuTimer = setInterval(() => {
            if (!this.isDestroyed) {
            this.trackCpuUsage();
            }
        }, 300000); // 5 minuts
        this.timers.push(cpuTimer);

        // Netejar mètriques antigues (cada 30 minuts en lloc d'1 hora)
        const cleanupTimer = setInterval(() => {
            if (!this.isDestroyed) {
            this.cleanupOldMetrics();
            }
        }, 1800000); // 30 minuts
        this.timers.push(cleanupTimer);

        // Generar report de monitoring (cada 12 hores en lloc de 6)
        const reportTimer = setInterval(() => {
            if (!this.isDestroyed) {
            this.generateMonitoringReport();
            }
        }, 43200000); // 12 hores
        this.timers.push(reportTimer);
    }

    /**
     * Netejar timers al destruir
     */
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        this.timers.forEach(timer => {
            clearInterval(timer);
            clearTimeout(timer);
        });
        this.timers = [];
        
        // Netejar dades per alliberar memòria
        this.metrics.performance.memoryUsage = [];
        this.metrics.performance.cpuUsage = [];
        this.metrics.performance.responseTimes = [];
        this.alerts = [];
        
        logger.info('Monitor destroyed and memory cleaned up');
    }

    /**
     * Track de petició HTTP
     */
    trackRequest(method, path, statusCode, duration, context = {}) {
        if (this.isDestroyed) return null;

        const request = {
            method,
            path,
            statusCode,
            duration,
            timestamp: Date.now(),
            ...context
        };

        // Actualitzar mètriques
        this.metrics.requests.total++;
        
        if (statusCode >= 200 && statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }

        // Actualitzar temps de resposta mitjà (limitar a 50 entrades)
        this.metrics.performance.responseTimes.push(duration);
        if (this.metrics.performance.responseTimes.length > 50) {
            this.metrics.performance.responseTimes.shift();
        }

        // Calcular mitjana només si hi ha dades
        if (this.metrics.performance.responseTimes.length > 0) {
            this.metrics.requests.avgResponseTime = 
                this.metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / 
                this.metrics.performance.responseTimes.length;
        }

        // Verificar alertes
        this.checkAlerts('responseTime', duration);

        // Log de la petició (només en mode debug)
        if (process.env.NODE_ENV === 'development') {
        logger.request(method, path, statusCode, duration, context);
        }

        return request;
    }

    /**
     * Track d'error
     */
    trackError(error, context = {}) {
        if (this.isDestroyed) return null;

        // Validar que error no sigui null o undefined
        if (!error) {
            error = new Error('Unknown error');
        }

        const errorInfo = {
            name: error.name || 'UnknownError',
            message: error.message || 'Unknown error occurred',
            stack: error.stack || '',
            timestamp: Date.now(),
            context
        };

        // Actualitzar mètriques d'errors
        this.metrics.errors.total++;
        
        if (!this.metrics.errors.byType[errorInfo.name]) {
            this.metrics.errors.byType[errorInfo.name] = 0;
        }
        this.metrics.errors.byType[errorInfo.name]++;

        // Afegir a errors recents (limitar a 25 entrades)
        this.metrics.errors.recent.push(errorInfo);
        if (this.metrics.errors.recent.length > 25) {
            this.metrics.errors.recent.shift();
        }

        // Verificar alertes
        this.checkAlerts('errorRate', this.getErrorRate());

        // Log de l'error
        logger.appError(error, context);
    }

    /**
     * Track d'operació de negoci
     */
    trackBusinessOperation(operation, details = {}) {
        if (this.isDestroyed) return null;

        const businessOp = {
            operation,
            details,
            timestamp: Date.now()
        };

        // Actualitzar mètriques segons l'operació
        switch (operation) {
            case 'report_generated':
                this.metrics.business.reportsGenerated++;
                break;
            case 'photo_uploaded':
                this.metrics.business.photosUploaded++;
                break;
            case 'user_login':
                this.metrics.business.logins++;
                break;
            case 'user_active':
                this.metrics.business.usersActive = Math.max(
                    this.metrics.business.usersActive,
                    details.activeUsers || 0
                );
                break;
        }

        // Log de l'operació
        logger.business(operation, details);

        return businessOp;
    }

    /**
     * Track d'activitat d'usuari
     */
    trackUserActivity(userId, action, details = {}) {
        if (this.isDestroyed) return null;

        const activity = {
            userId,
            action,
            details,
            timestamp: Date.now()
        };

        // Log de l'activitat
        logger.userActivity(userId, action, details);

        return activity;
    }

    /**
     * Track d'ús de memòria
     */
    trackMemoryUsage() {
        if (this.isDestroyed) return;

        const usage = process.memoryUsage();
        const memoryInfo = {
            rss: usage.rss,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            timestamp: Date.now()
        };

        this.metrics.performance.memoryUsage.push(memoryInfo);
        
        // Mantenir només les últimes 50 entrades (en lloc de 100)
        if (this.metrics.performance.memoryUsage.length > 50) {
            this.metrics.performance.memoryUsage.shift();
        }

        // Verificar alertes
        const memoryUsagePercent = usage.heapUsed / usage.heapTotal;
        this.checkAlerts('memoryUsage', memoryUsagePercent);

        // Log de rendiment (només si hi ha alerta)
        if (memoryUsagePercent > this.thresholds.memoryUsage) {
        logger.performance('Memory usage tracked', memoryInfo);
        }
    }

    /**
     * Track d'ús de CPU
     */
    trackCpuUsage() {
        if (this.isDestroyed) return;

        const startUsage = process.cpuUsage();
        
        const cpuTimer = setTimeout(() => {
            if (this.isDestroyed) return;

            const endUsage = process.cpuUsage(startUsage);
            const cpuInfo = {
                user: endUsage.user,
                system: endUsage.system,
                timestamp: Date.now()
            };

            this.metrics.performance.cpuUsage.push(cpuInfo);
            
            // Mantenir només les últimes 30 entrades (en lloc de 60)
            if (this.metrics.performance.cpuUsage.length > 30) {
                this.metrics.performance.cpuUsage.shift();
            }

            // Log de rendiment (només si hi ha alerta)
            const cpuUsagePercent = (endUsage.user + endUsage.system) / 1000000; // Convertir a segons
            if (cpuUsagePercent > this.thresholds.cpuUsage) {
            logger.performance('CPU usage tracked', cpuInfo);
            }
        }, 100);
        
        // Afegir el timer a la llista per netejar-lo després
        this.timers.push(cpuTimer);
    }

    /**
     * Verificar alertes
     */
    checkAlerts(type, value) {
        if (this.isDestroyed) return;

        const threshold = this.thresholds[type];
        
        if (value > threshold) {
            const alert = {
                type,
                value,
                threshold,
                timestamp: Date.now(),
                message: `${type} exceeded threshold: ${value} > ${threshold}`
            };

            this.alerts.push(alert);
            
            // Mantenir només les últimes 50 alertes (en lloc de 100)
            if (this.alerts.length > 50) {
                this.alerts.shift();
            }

            // Log de l'alerta
            logger.warn(`Alert triggered: ${alert.message}`, alert);
        }
    }

    /**
     * Obtenir taxa d'errors
     */
    getErrorRate() {
        if (this.metrics.requests.total === 0) return 0;
        return this.metrics.errors.total / this.metrics.requests.total;
    }

    /**
     * Obtenir estadístiques de rendiment
     */
    getPerformanceStats() {
        const memoryUsage = this.metrics.performance.memoryUsage;
        const responseTimes = this.metrics.performance.responseTimes;

        return {
            uptime: Date.now() - this.startTime,
            memory: {
                current: memoryUsage.length > 0 ? memoryUsage[memoryUsage.length - 1] : null,
                average: memoryUsage.length > 0 ? 
                    memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / memoryUsage.length : 0
            },
            responseTime: {
                current: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
                average: this.metrics.requests.avgResponseTime,
                min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
                max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
            },
            requests: {
                total: this.metrics.requests.total,
                success: this.metrics.requests.success,
                errors: this.metrics.requests.errors,
                successRate: this.metrics.requests.total > 0 ? 
                    this.metrics.requests.success / this.metrics.requests.total : 0
            }
        };
    }

    /**
     * Obtenir estadístiques de negoci
     */
    getBusinessStats() {
        return {
            reportsGenerated: this.metrics.business.reportsGenerated,
            photosUploaded: this.metrics.business.photosUploaded,
            usersActive: this.metrics.business.usersActive,
            logins: this.metrics.business.logins
        };
    }

    /**
     * Obtenir alertes actives
     */
    getActiveAlerts() {
        const now = Date.now();
        const activeAlerts = this.alerts.filter(alert => 
            now - alert.timestamp < 3600000 // Última hora
        );

        return activeAlerts;
    }

    /**
     * Generar report de monitoring
     */
    generateMonitoringReport() {
        if (this.isDestroyed) return null;

        const report = {
            timestamp: new Date().toISOString(),
            performance: this.getPerformanceStats(),
            business: this.getBusinessStats(),
            alerts: this.getActiveAlerts(),
            errors: {
                total: this.metrics.errors.total,
                byType: this.metrics.errors.byType,
                recent: this.metrics.errors.recent.slice(-10) // Últims 10 errors
            }
        };

        logger.info('Monitoring report generated', report);
        return report;
    }

    /**
     * Netejar mètriques antigues
     */
    cleanupOldMetrics() {
        if (this.isDestroyed) return;

        const now = Date.now();
        const thirtyMinutes = 1800000; // 30 minuts en lloc d'1 hora

        // Netejar mètriques de memòria antigues
        this.metrics.performance.memoryUsage = 
            this.metrics.performance.memoryUsage.filter(m => now - m.timestamp < thirtyMinutes);

        // Netejar mètriques de CPU antigues
        this.metrics.performance.cpuUsage = 
            this.metrics.performance.cpuUsage.filter(c => now - c.timestamp < thirtyMinutes);

        // Netejar alertes antigues
        this.alerts = this.alerts.filter(a => now - a.timestamp < thirtyMinutes);

        // Forçar garbage collection si està disponible
        if (global.gc) {
            global.gc();
        }

        logger.debug('Old metrics cleaned up');
    }

    /**
     * Obtenir dashboard de monitoring
     */
    getDashboard() {
        return {
            summary: {
                uptime: Date.now() - this.startTime,
                totalRequests: this.metrics.requests.total,
                totalErrors: this.metrics.errors.total,
                activeAlerts: this.getActiveAlerts().length
            },
            performance: this.getPerformanceStats(),
            business: this.getBusinessStats(),
            recentAlerts: this.alerts.slice(-10),
            recentErrors: this.metrics.errors.recent.slice(-5)
        };
    }

    /**
     * Configurar thresholds
     */
    setThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        logger.info('Monitoring thresholds updated', this.thresholds);
    }

    /**
     * Reset de mètriques
     */
    resetMetrics() {
        this.metrics = {
            requests: { total: 0, success: 0, errors: 0, avgResponseTime: 0 },
            performance: { memoryUsage: [], cpuUsage: [], responseTimes: [] },
            business: { reportsGenerated: 0, photosUploaded: 0, usersActive: 0, logins: 0 },
            errors: { total: 0, byType: {}, recent: [] }
        };
        this.alerts = [];
        this.startTime = Date.now();
        
        logger.info('Monitoring metrics reset');
    }
}

// Exportar instància singleton
export const monitor = new Monitor();

// Exportar classe per a ús directe
export { Monitor }; 