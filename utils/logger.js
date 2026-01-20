import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sistema de logging estructurat amb rotació automàtica
 */
class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = process.env.LOG_LEVEL || 'INFO';
        this.logDir = path.join(__dirname, '../logs');
        this.maxFileSize = config.files.logs.maxFileSize;
        this.maxFiles = config.files.logs.maxFiles;
        
        this.ensureLogDirectory();
        this.setupLogRotation();
    }

    /**
     * Assegurar que existeix el directori de logs
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Configurar rotació de logs
     */
    setupLogRotation() {
        // Rotació diària a mitjanit
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        this.rotationTimer = setTimeout(() => {
            this.rotateLogs();
            // Configurar rotació diària
            this.dailyRotationTimer = setInterval(() => this.rotateLogs(), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
    }

    /**
     * Rotar logs quan superen la mida màxima
     */
    rotateLogs() {
        const logFiles = ['app.log', 'error.log', 'security.log', 'performance.log'];
        
        logFiles.forEach(filename => {
            const filePath = path.join(this.logDir, filename);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                
                if (stats.size > this.maxFileSize) {
                    this.rotateFile(filePath);
                }
            }
        });
    }

    /**
     * Rotar un fitxer específic
     */
    rotateFile(filePath) {
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        
        // Eliminar fitxers antics
        for (let i = this.maxFiles - 1; i >= 0; i--) {
            const oldFile = path.join(dir, `${base}.${i}${ext}`);
            if (fs.existsSync(oldFile)) {
                if (i === this.maxFiles - 1) {
                    fs.unlinkSync(oldFile);
                } else {
                    fs.renameSync(oldFile, path.join(dir, `${base}.${i + 1}${ext}`));
                }
            }
        }
        
        // Renombrar fitxer actual
        fs.renameSync(filePath, path.join(dir, `${base}.1${ext}`));
    }

    /**
     * Escriure log amb format estructurat
     */
    writeLog(level, message, context = {}, logFile = 'app.log') {
        if (this.logLevels[level] > this.logLevels[this.currentLevel]) {
            return;
        }

        // Filtrar dades sensibles
        const sanitizedContext = this.sanitizeContext(context);

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            context: {
                ...sanitizedContext,
                pid: process.pid,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        const filePath = path.join(this.logDir, logFile);

        try {
            fs.appendFileSync(filePath, logLine);
        } catch (error) {
            console.error('Error escrivint log:', error);
        }
    }

    /**
     * Sanititzar context per eliminar dades sensibles
     */
    sanitizeContext(context) {
        const sensitiveFields = ['password', 'token', 'creditCard', 'secret', 'key', 'auth'];
        const sanitized = { ...context };
        
        for (const field of sensitiveFields) {
            if (sanitized.hasOwnProperty(field)) {
                delete sanitized[field];
            }
        }
        
        return sanitized;
    }

    /**
     * Log d'errors
     */
    error(message, context = {}) {
        this.writeLog('ERROR', message, context, 'error.log');
        console.error(`[ERROR] ${message}`, context);
    }

    /**
     * Log d'advertències
     */
    warn(message, context = {}) {
        this.writeLog('WARN', message, context, 'app.log');
        console.warn(`[WARN] ${message}`, context);
    }

    /**
     * Log d'informació
     */
    info(message, context = {}) {
        this.writeLog('INFO', message, context, 'app.log');
        console.info(`[INFO] ${message}`, context);
    }

    /**
     * Log de debug
     */
    debug(message, context = {}) {
        this.writeLog('DEBUG', message, context, 'app.log');
        console.log(`[DEBUG] ${message}`, context);
    }

    /**
     * Log de seguretat
     */
    security(message, context = {}) {
        this.writeLog('INFO', message, context, 'security.log');
        console.info(`[SECURITY] ${message}`, context);
    }

    /**
     * Log de rendiment
     */
    performance(message, context = {}) {
        this.writeLog('INFO', message, context, 'performance.log');
        console.info(`[PERFORMANCE] ${message}`, context);
    }

    /**
     * Log d'activitat d'usuari
     */
    userActivity(userId, action, details = {}) {
        this.info(`User activity: ${action}`, {
            userId,
            action,
            details,
            type: 'user_activity'
        });
    }

    /**
     * Log d'operacions de negoci
     */
    business(operation, details = {}) {
        this.info(`Business operation: ${operation}`, {
            operation,
            details,
            type: 'business'
        });
    }

    /**
     * Log d'errors d'aplicació
     */
    appError(error, context = {}) {
        this.error(`Application error: ${error.message}`, {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context,
            type: 'application_error'
        });
    }

    /**
     * Log de peticions HTTP
     */
    request(method, path, statusCode, duration, context = {}) {
        const level = statusCode >= 400 ? 'WARN' : 'INFO';
        this.writeLog(level, `HTTP ${method} ${path}`, {
            method,
            path,
            statusCode,
            duration,
            ...context,
            type: 'http_request'
        });
    }

    /**
     * Obtenir estadístiques de logs
     */
    getStats() {
        const stats = {
            totalLogs: 0,
            errors: 0,
            warnings: 0,
            info: 0,
            debug: 0
        };

        const logFiles = ['app.log', 'error.log', 'security.log', 'performance.log'];
        
        logFiles.forEach(filename => {
            const filePath = path.join(this.logDir, filename);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                
                lines.forEach(line => {
                    try {
                        const logEntry = JSON.parse(line);
                        stats.totalLogs++;
                        
                        switch (logEntry.level) {
                            case 'ERROR':
                                stats.errors++;
                                break;
                            case 'WARN':
                                stats.warnings++;
                                break;
                            case 'INFO':
                                stats.info++;
                                break;
                            case 'DEBUG':
                                stats.debug++;
                                break;
                        }
                    } catch (error) {
                        // Ignorar línies mal formatejades
                    }
                });
            }
        });

        return stats;
    }

    /**
     * Netejar logs antics
     */
    cleanup() {
        const logFiles = ['app.log', 'error.log', 'security.log', 'performance.log'];
        
        logFiles.forEach(filename => {
            for (let i = this.maxFiles; i <= 10; i++) {
                const filePath = path.join(this.logDir, filename.replace('.log', `.${i}.log`));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });
    }

    /**
     * Netejar timers al destruir
     */
    destroy() {
        if (this.rotationTimer) {
            clearTimeout(this.rotationTimer);
        }
        if (this.dailyRotationTimer) {
            clearInterval(this.dailyRotationTimer);
        }
    }
}

// Exportar instància singleton
export const logger = new Logger();

// Exportar classe per a ús directe
export { Logger }; 