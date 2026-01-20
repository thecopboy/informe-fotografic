import express from 'express';
import { getMonitoringStats } from '../../middleware/monitoringMiddleware.js';
import { monitor } from '../../utils/monitor.js';
import { logger } from '../../utils/logger.js';
import { authMiddleware } from '../../auth/middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/monitoring/dashboard
 * @desc Obtenir dashboard complet de monitoring
 * @access Private (Admin)
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        // Verificar si l'usuari és admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden accedir al monitoring.'
            });
        }

        const stats = getMonitoringStats();
        
        logger.info('Dashboard monitoring accessed', {
            userId: req.user.id,
            userEmail: req.user.email
        });

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error accessing monitoring dashboard', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error accedint al dashboard de monitoring',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/performance
 * @desc Obtenir estadístiques de rendiment
 * @access Private (Admin)
 */
router.get('/performance', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden accedir al monitoring.'
            });
        }

        const performanceStats = monitor.getPerformanceStats();
        
        res.json({
            success: true,
            data: performanceStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error accessing performance stats', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error accedint a les estadístiques de rendiment',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/business
 * @desc Obtenir estadístiques de negoci
 * @access Private (Admin)
 */
router.get('/business', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden accedir al monitoring.'
            });
        }

        const businessStats = monitor.getBusinessStats();
        
        res.json({
            success: true,
            data: businessStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error accessing business stats', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error accedint a les estadístiques de negoci',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/alerts
 * @desc Obtenir alertes actives
 * @access Private (Admin)
 */
router.get('/alerts', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden accedir al monitoring.'
            });
        }

        const activeAlerts = monitor.getActiveAlerts();
        
        res.json({
            success: true,
            data: activeAlerts,
            count: activeAlerts.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error accessing alerts', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error accedint a les alertes',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/logs
 * @desc Obtenir estadístiques de logs
 * @access Private (Admin)
 */
router.get('/logs', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden accedir al monitoring.'
            });
        }

        const logStats = logger.getStats();
        
        res.json({
            success: true,
            data: logStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error accessing log stats', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error accedint a les estadístiques de logs',
            error: error.message
        });
    }
});

/**
 * @route POST /api/monitoring/thresholds
 * @desc Configurar thresholds de monitoring
 * @access Private (Admin)
 */
router.post('/thresholds', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden configurar thresholds.'
            });
        }

        const { thresholds } = req.body;
        
        if (!thresholds || typeof thresholds !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Thresholds invàlids'
            });
        }

        monitor.setThresholds(thresholds);
        
        logger.info('Monitoring thresholds updated', {
            userId: req.user.id,
            thresholds
        });

        res.json({
            success: true,
            message: 'Thresholds actualitzats correctament',
            data: monitor.thresholds,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error updating thresholds', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error actualitzant els thresholds',
            error: error.message
        });
    }
});

/**
 * @route POST /api/monitoring/reset
 * @desc Reset de mètriques de monitoring
 * @access Private (Admin)
 */
router.post('/reset', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden resetar mètriques.'
            });
        }

        monitor.resetMetrics();
        
        logger.info('Monitoring metrics reset', {
            userId: req.user.id
        });

        res.json({
            success: true,
            message: 'Mètriques resetades correctament',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error resetting metrics', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error resetant les mètriques',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/health
 * @desc Health check del sistema
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            environment: process.env.NODE_ENV || 'development'
        };

        // Verificar si hi ha alertes crítiques
        const activeAlerts = monitor.getActiveAlerts();
        const criticalAlerts = activeAlerts.filter(alert => 
            alert.type === 'errorRate' || alert.type === 'memoryUsage'
        );

        if (criticalAlerts.length > 0) {
            health.status = 'warning';
            health.alerts = criticalAlerts.length;
        }

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('Health check failed', {
            error: error.message
        });

        res.status(503).json({
            success: false,
            status: 'unhealthy',
            message: 'Sistema no disponible',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/report
 * @desc Generar report de monitoring
 * @access Private (Admin)
 */
router.get('/report', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accés denegat. Només administradors poden generar reports.'
            });
        }

        const report = monitor.generateMonitoringReport();
        
        logger.info('Monitoring report generated', {
            userId: req.user.id
        });

        res.json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generating monitoring report', {
            error: error.message,
            userId: req.user?.id
        });

        res.status(500).json({
            success: false,
            message: 'Error generant el report de monitoring',
            error: error.message
        });
    }
});

export default router; 