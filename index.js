/**
 * Servidor principal de l'aplicació d'informes fotogràfics
 * Punt d'entrada del backend amb configuració de seguretat i middleware
 * 
 * @copyright 2025 themacboy72@gmail.com
 * @license Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { saveAsJson } from './middleware/jsonReportHandler.js';
import { requestLogger, errorLogger } from './middleware/loggingMiddleware.js';
import { setupMonitoring } from './middleware/monitoringMiddleware.js';
import { monitor } from './utils/monitor.js';
import { logger } from './utils/logger.js';
import authRoutes from './auth/routes/authRoutes.js';
import reportsRoutes from './reports/routes/reportsRoutes.js';
import profileRoutes from './auth/routes/profileRoutes.js';
import monitoringRoutes from './reports/routes/monitoringRoutes.js';
import configRoutes from './routes/configRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import config from './config/config.js';

// __dirname no està disponible per defecte en ES Modules, així el definim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuració del servidor
const port = config.server.port;

const app = express();

// Middleware de seguretat amb configuració adaptada a l'entorn
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "data:"]
        }
    },
    // Desactivar headers que poden causar problemes amb IPs externes via HTTP
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
};

// Aplicar Helmet amb configuració personalitzada
app.use(helmet(helmetConfig));

// Configuració CORS
app.use(cors({
    origin: config.server.environment === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:33333', 'http://127.0.0.1:33333', 'http://187.33.157.180:33333'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minut
    max: 100, // límit de 100 peticions per finestra
    message: {
        error: 'Massa peticions des d\'aquesta IP',
        message: 'Si us plau, torna-ho a provar en 1 minuts'
    }
});
app.use('/api/', limiter);

// Rate limiting més estricte per autenticació
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuts
    max: 5, // límit de 5 intents de login per finestra
    message: {
        error: 'Massa intents de login',
        message: 'Si us plau, torna-ho a provar en 15 minuts'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Configurar sistema de monitoring
setupMonitoring(app);

// Habilitar garbage collection en mode development per ajudar amb la gestió de memòria
if (config.server.environment === 'development') {
    // Forçar garbage collection cada 5 minuts en development
    setInterval(() => {
        if (global.gc) {
            global.gc();
            logger.debug('Garbage collection forced');
        }
    }, 300000); // 5 minuts
}

// Middleware de logging
app.use(requestLogger);

// Servim els fitxers estàtics de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware per parsejar cossos de petició JSON sense límit de mida
app.use(express.json({ 
    limit: '1gb',
    verify: (req, res, buf) => {
        // Log de la mida de la petició
        if (req.headers['content-length']) {
            const sizeInMB = (parseInt(req.headers['content-length']) / (1024 * 1024)).toFixed(2);
            logger.info(`Rebent petició de ${sizeInMB} MB`);
        }
    }
}));

// Middleware per gestionar errors de mida de petició
app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') {
        console.error('Petició massa gran rebutjada per Express');
        return res.status(413).json({ 
            error: 'Petició massa gran',
            message: 'El fitxer supera el límit del servidor'
        });
    }
    next(error);
});

// Ruta per guardar les dades de l'informe en format JSON
app.post('/save-json', saveAsJson);

// Ruta per a logging d'errors del client
app.post('/api/log-error', (req, res) => {
    try {
        const errorData = req.body;
        
        // Log detallat de l'error
        console.error('=== ERROR DEL CLIENT ===');
        console.error('Context:', errorData.context);
        console.error('Message:', errorData.message);
        console.error('Stack:', errorData.stack);
        console.error('Timestamp:', errorData.timestamp);
        console.error('User Agent:', errorData.userAgent);
        console.error('URL:', errorData.url);
        console.error('========================');
        
        // En un entorn de producció, aquí enviaríem l'error a un servei de logging
        // com ara Sentry, LogRocket, o un sistema propi
        
        res.status(200).json({ success: true, message: 'Error registrat' });
    } catch (error) {
        console.error('Error en processar el log d\'error:', error);
        res.status(500).json({ error: 'Error en processar el log' });
    }
});

// Rutes d'autenticació
app.use('/api/auth', authRoutes);

// Rutes d'informes
app.use('/api/reports', reportsRoutes);

// Rutes de perfil d'usuari
app.use('/api/user', profileRoutes);

// Rutes de monitoring
app.use('/api/monitoring', monitoringRoutes);

// Rutes de configuració
app.use('/api', configRoutes);

// Ruta per accedir al dashboard de monitoring
app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

// Middleware per gestionar rutes no trobades
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Ruta no trobada',
        message: `La ruta ${req.method} ${req.path} no existeix`
    });
});

// Middleware per gestionar errors (ha de ser l'últim)
app.use(errorLogger);
app.use(errorHandler);

app.listen(port, () => {
    logger.info(`🚀 Servidor arrencat en mode ${config.server.environment}`);
    logger.info(`📍 Port: ${port}`);
    logger.info(`🌐 URL: http://localhost:${port}`);
    logger.info(`🔒 Seguretat: Helmet, CORS i Rate Limiting actius`);
    logger.info(`📊 Base de dades: ${config.database.path}`);
    logger.info(`📈 Monitoring: http://localhost:${port}/monitoring`);
    
    // Inicialitzar monitoring
    monitor.trackBusinessOperation('server_started', {
        environment: config.server.environment,
        port: port
    });
});