/**
 * Configuració centralitzada de l'aplicació
 * 
 * @copyright 2025 themacboy72@gmail.com
 * @license Apache-2.0
 */

export const config = {
    // Configuració del servidor
    server: {
        port: process.env.PORT || 33333,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development'
    },

    // Configuració de la base de dades
    database: {
        path: process.env.DB_PATH || './database/app.db',
        timeout: 30000
    },

    // Configuració JWT
    jwt: {
        accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
    },

    // Configuració de seguretat
    security: {
        bcryptRounds: 10,
        passwordMinLength: 8,
        maxLoginAttempts: 5
    },

    // Configuració centralitzada de fitxers
    files: {
        // Configuració general per defecte
        default: {
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png']
        },

        // Configuració específica per tipus de fitxers
        images: {
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'],
            description: 'Imatges per a informes fotogràfics',
            // Configuració de qualitat i redimensionament
            quality: {
                default: 1, // Qualitat per defecte (80%)
                high: 0.9,    // Qualitat alta (90%)
                low: 0.7,     // Qualitat baixa (60%)
                thumbnail: 0.7 // Qualitat per miniatures (70%)
            },
            dimensions: {
                maxWidth: 1920,   // Amplada màxima
                maxHeight: 1080,  // Alçada màxima
                thumbnail: 150,   // Mida de miniatura
                preview: 800      // Mida de previsualització
            },
            compression: {
                enabled: true,    // Habilita compressió
                autoResize: true, // Redimensionament automàtic
                maintainAspectRatio: true // Mantenir proporció
            }
        },

        documents: {
            maxSize: 100 * 1024 * 1024, // 100MB
            allowedTypes: ['application/json', 'text/plain'],
            description: 'Documents JSON i text'
        },

        profiles: {
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'],
            description: 'Fotos de perfil d\'usuari',
            // Configuració de qualitat per perfils
            quality: {
                default: 1,   // Qualitat per defecte (100%)
                high: 0.9,       // Qualitat alta (90%)
                thumbnail: 0.7   // Qualitat per miniatures (60%)
            },
            dimensions: {
                maxWidth: 800,   // Amplada màxima
                maxHeight: 800,  // Alçada màxima
                thumbnail: 100   // Mida de miniatura
            }
        },

        events: {
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'],
            description: 'Imatges per a events',
            // Configuració de qualitat per events
            quality: {
                default: 1,    // Qualitat per defecte (100%)
                high: 0.9,      // Qualitat alta (90%)
                thumbnail: 0.7   // Qualitat per miniatures (60%)
            },
            dimensions: {
                maxWidth: 1200,  // Amplada màxima
                maxHeight: 800,  // Alçada màxima
                thumbnail: 120   // Mida de miniatura
            }
        },

        // Configuració per a logs
        logs: {
            maxFileSize: 10 * 1024 * 1024, // 10MB per fitxer de log
            maxFiles: 5, // Màxim 5 fitxers rotats
            maxAge: 30 // 30 dies
        },

        // Configuració per a memòria local
        storage: {
            maxSize: 200 * 1024 * 1024, // 200MB per localStorage
            cleanupInterval: 24 * 60 * 60 * 1000 // 24 hores
        },

        // Rutes de pujada
        uploadPath: './uploads/',
        tempPath: './temp/'
    },

    // Configuració de generació de PDF
    pdf: {
        signatureImage: {
            maxWidth: 70, // mm (7cm)
            maxHeight: 30 // mm (3cm)
        }
    },

    // Configuració de validació
    validation: {
        // Límits de validació
        maxFilesPerRequest: 50,
        maxConcurrentValidations: 10
    },

    // Configuració de monitoring
    monitoring: {
        // Thresholds per alertes
        thresholds: {
            responseTime: 5000, // 5 segons
            memoryUsage: 0.8, // 80%
            errorRate: 0.1, // 10%
            cpuUsage: 0.9 // 90%
        },

        // Intervals de monitoring (optimitzats per evitar fuites de memòria)
        intervals: {
            memory: 120000, // 2 minuts (en lloc de 30 segons)
            cpu: 300000, // 5 minuts (en lloc d'1 minut)
            cleanup: 1800000, // 30 minuts (en lloc d'1 hora)
            report: 43200000 // 12 hores (en lloc de 6 hores)
        }
    }
};

// Funcions d'ajuda per obtenir configuració
export const getFileConfig = (type = 'default') => {
    return config.files[type] || config.files.default;
};

export const getAllowedTypes = (type = 'default') => {
    return getFileConfig(type).allowedTypes;
};

export const getMaxSize = (type = 'default') => {
    return getFileConfig(type).maxSize;
};

export const getValidationOptions = (type = 'default') => {
    const fileConfig = getFileConfig(type);
    return {
        maxSize: fileConfig.maxSize,
        allowedTypes: fileConfig.allowedTypes,
    };
};

export const getImageQualityConfig = (type = 'images') => {
    const fileConfig = getFileConfig(type);
    return {
        quality: fileConfig.quality || config.files.images.quality,
        dimensions: fileConfig.dimensions || config.files.images.dimensions,
        compression: fileConfig.compression || config.files.images.compression
    };
};

export const getImageQuality = (type = 'images', qualityLevel = 'default') => {
    const qualityConfig = getImageQualityConfig(type);
    return qualityConfig.quality[qualityLevel] || qualityConfig.quality.default;
};

export const getImageDimensions = (type = 'images') => {
    const qualityConfig = getImageQualityConfig(type);
    return qualityConfig.dimensions;
};

export default config; 