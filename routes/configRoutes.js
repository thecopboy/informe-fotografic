import express from 'express';
import { config } from '../config/config.js';

const router = express.Router();

/**
 * GET /api/config
 * Retorna la configuració pública per al frontend
 */
router.get('/config', (req, res) => {
    try {
        // Retornar només la configuració necessària per al frontend
        const publicConfig = {
            files: {
                default: config.files.default,
                images: config.files.images,
                documents: config.files.documents,
                profiles: config.files.profiles,
                events: config.files.events
            },
            validation: {
                maxFilesPerRequest: config.validation.maxFilesPerRequest,
                maxConcurrentValidations: config.validation.maxConcurrentValidations
            },
            imageQuality: {
                // Configuració de qualitat per tipus
                images: {
                    quality: config.files.images.quality,
                    dimensions: config.files.images.dimensions,
                    compression: config.files.images.compression
                },
                profiles: {
                    quality: config.files.profiles.quality,
                    dimensions: config.files.profiles.dimensions
                },
                events: {
                    quality: config.files.events.quality,
                    dimensions: config.files.events.dimensions
                }
            },
            pdf: config.pdf // Afegir la configuració del PDF
        };

        res.json(publicConfig);
    } catch (error) {
        console.error('Error servint configuració:', error);
        res.status(500).json({ 
            error: 'Error servint configuració',
            message: error.message 
        });
    }
});

/**
 * GET /api/config/files/:type
 * Retorna la configuració específica per un tipus de fitxer
 */
router.get('/config/files/:type', (req, res) => {
    try {
        const { type } = req.params;
        const fileConfig = config.files[type] || config.files.default;
        
        res.json(fileConfig);
    } catch (error) {
        console.error('Error servint configuració de fitxers:', error);
        res.status(500).json({ 
            error: 'Error servint configuració de fitxers',
            message: error.message 
        });
    }
});

/**
 * GET /api/config/validation
 * Retorna la configuració de validació
 */
router.get('/config/validation', (req, res) => {
    try {
        res.json(config.validation);
    } catch (error) {
        console.error('Error servint configuració de validació:', error);
        res.status(500).json({ 
            error: 'Error servint configuració de validació',
            message: error.message 
        });
    }
});

/**
 * GET /api/config/image-quality/:type
 * Retorna la configuració de qualitat d'imatges per tipus
 */
router.get('/config/image-quality/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { qualityLevel = 'default' } = req.query;
        
        const fileConfig = config.files[type] || config.files.images;
        const qualityConfig = {
            quality: fileConfig.quality || config.files.images.quality,
            dimensions: fileConfig.dimensions || config.files.images.dimensions,
            compression: fileConfig.compression || config.files.images.compression
        };
        
        // Si es demana una qualitat específica, retornar només aquesta
        if (qualityLevel && qualityLevel !== 'default') {
            qualityConfig.currentQuality = qualityConfig.quality[qualityLevel] || qualityConfig.quality.default;
        }
        
        res.json(qualityConfig);
    } catch (error) {
        console.error('Error servint configuració de qualitat d\'imatges:', error);
        res.status(500).json({ 
            error: 'Error servint configuració de qualitat d\'imatges',
            message: error.message 
        });
    }
});

export default router; 