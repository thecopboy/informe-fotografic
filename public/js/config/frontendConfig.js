/**
 * Configuració del frontend sincronitzada amb el servidor
 * Aquest fitxer s'actualitza automàticament des del servidor
 * 
 * @copyright 2025 themacboy72@gmail.com
 * @license Apache-2.0
 */

// Configuració per defecte (fallback si no es pot carregar del servidor)
const defaultConfig = {
    ui: {
        mobile: {
            menu: {
                spacing: '20px',
                firstElementExtraMargin: '20px',
                dividerWidth: '80%',
                dividerMaxWidth: '250px',
                dividerOpacity: 0.2
            },
            buttons: {
                activeTransitionDuration: '0.2s',
                hoverTransformY: '1px'
            },
            breakpoints: {
                mobile: '768px'
            }
        },
        desktop: {
            menu: {
                spacing: '15px'
            }
        },
        modals: {
            transitionDuration: '0.3s',
            backdropOpacity: 0.6
        },
        animations: {
            fadeInDuration: '0.2s',
            slideInDuration: '0.3s'
        }
    },
    files: {
        default: {
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png']
        },
        images: {
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'],
            quality: {
                default: 0.8,
                high: 0.9,
                low: 0.6,
                thumbnail: 0.7
            },
            dimensions: {
                maxWidth: 1920,
                maxHeight: 1080,
                thumbnail: 150,
                preview: 800
            },
            compression: {
                enabled: true,
                autoResize: true,
                maintainAspectRatio: true
            }
        },
        documents: {
            maxSize: 100 * 1024 * 1024, // 100MB
            allowedTypes: ['application/json', 'text/plain']
        },
        profiles: {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png'],
            quality: {
                default: 0.75,
                high: 0.9,
                thumbnail: 0.6
            },
            dimensions: {
                maxWidth: 800,
                maxHeight: 800,
                thumbnail: 100
            }
        },
        events: {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png'],
            quality: {
                default: 0.7,
                high: 0.85,
                thumbnail: 0.6
            },
            dimensions: {
                maxWidth: 1200,
                maxHeight: 800,
                thumbnail: 120
            }
        }
    },
    validation: {
        maxFilesPerRequest: 50,
        maxConcurrentValidations: 10
    },
    sanitization: {
        text: {
            maxLength: 500,
            removeScriptTags: true,
            removeJavaScript: true,
            removeEventHandlers: true,
            removeDataUrls: true,
            removeVbScript: true,
            removeHtmlTags: true,
            removeControlChars: true, // Afegit: eliminar caràcters de control
            trimWhitespace: true
        },
        expedientNumber: {
            maxLength: 50,
            allowedChars: /[^A-Za-z0-9\-_]/g, // Només lletres, números, guions i guions baixos
            removeControlChars: true, // Afegit
            trimWhitespace: true
        },
        address: {
            maxLength: 200,
            removeScriptTags: true,
            removeJavaScript: true,
            removeEventHandlers: true,
            removeControlChars: true, // Afegit
            trimWhitespace: true
        },
        fileName: {
            maxLength: 100,
            invalidFileChars: /[<>:"/\\|?*]/g,
            removeParentDirRefs: true,
            removeLeadingDot: true,
            removeControlChars: true, // Afegit
            trimWhitespace: true
        },
        expedientType: {
            maxLength: 100,
            removeScriptTags: true,
            removeJavaScript: true,
            removeControlChars: true, // Afegit
            trimWhitespace: true
        },
        signers: {
            maxLength: 300,
            removeScriptTags: true,
            removeJavaScript: true,
            removeEventHandlers: true,
            removeControlChars: true, // Afegit
            trimWhitespace: true
        },
        description: {
            maxLength: 1000,
            removeScriptTags: true,
            removeJavaScript: true,
            removeEventHandlers: true,
            removeControlChars: true, // Afegit
            trimWhitespace: true
        },
        dangerousPatterns: [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /data:/i,
            /vbscript:/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
        ]
    },
    imageQuality: {
        images: {
            quality: {
                default: 0.8,
                high: 0.9,
                low: 0.6,
                thumbnail: 0.7
            },
            dimensions: {
                maxWidth: 1920,
                maxHeight: 1080,
                thumbnail: 150,
                preview: 800
            },
            compression: {
                enabled: true,
                autoResize: true,
                maintainAspectRatio: true
            }
        },
        profiles: {
            quality: {
                default: 0.75,
                high: 0.9,
                thumbnail: 0.6
            },
            dimensions: {
                maxWidth: 800,
                maxHeight: 800,
                thumbnail: 100
            }
        },
        events: {
            quality: {
                default: 0.7,
                high: 0.85,
                thumbnail: 0.6
            },
            dimensions: {
                maxWidth: 1200,
                maxHeight: 800,
                thumbnail: 120
            }
        }
    }
};

// Variable global per la configuració
let frontendConfig = { ...defaultConfig };

/**
 * Aplicar configuració d'UI com a variables CSS
 */
export const applyUIConfigToCSS = () => {
    if (typeof document === 'undefined') return; // SSR safety
    
    const root = document.documentElement;
    const mobileMenuConfig = getMobileMenuConfig();
    const buttonsConfig = getMobileButtonsConfig();
    const modalsConfig = getModalsConfig();
    const animationsConfig = getAnimationsConfig();
    const breakpoints = getBreakpoints();
    
    // Aplicar configuració del menú mòbil
    root.style.setProperty('--mobile-menu-spacing', mobileMenuConfig.spacing);
    root.style.setProperty('--mobile-menu-first-element-extra-margin', mobileMenuConfig.firstElementExtraMargin);
    root.style.setProperty('--mobile-menu-divider-width', mobileMenuConfig.dividerWidth);
    root.style.setProperty('--mobile-menu-divider-max-width', mobileMenuConfig.dividerMaxWidth);
    root.style.setProperty('--mobile-menu-divider-opacity', mobileMenuConfig.dividerOpacity);
    
    // Aplicar configuració de botons mòbils
    root.style.setProperty('--mobile-button-active-transition', buttonsConfig.activeTransitionDuration);
    root.style.setProperty('--mobile-button-hover-transform', buttonsConfig.hoverTransformY);
    
    // Aplicar configuració de modals
    root.style.setProperty('--modal-transition-duration', modalsConfig.transitionDuration);
    root.style.setProperty('--modal-backdrop-opacity', modalsConfig.backdropOpacity);
    
    // Aplicar configuració d'animacions
    root.style.setProperty('--animation-fade-in-duration', animationsConfig.fadeInDuration);
    root.style.setProperty('--animation-slide-in-duration', animationsConfig.slideInDuration);
    
    // Aplicar breakpoints
    root.style.setProperty('--mobile-breakpoint', breakpoints.mobile);
};

/**
 * Obtenir configuració de fitxers per tipus
 */
export const getFileConfig = (type = 'default') => {
    return frontendConfig.files[type] || frontendConfig.files.default;
};

/**
 * Obtenir tipus permesos per tipus de fitxer
 */
export const getAllowedTypes = (type = 'default') => {
    return getFileConfig(type).allowedTypes;
};

/**
 * Obtenir mida màxima per tipus de fitxer
 */
export const getMaxSize = (type = 'default') => {
    return getFileConfig(type).maxSize;
};

/**
 * Obtenir opcions de validació per tipus de fitxer
 */
export const getValidationOptions = (type = 'default') => {
    const fileConfig = getFileConfig(type);
    return {
        maxSize: fileConfig.maxSize,
        allowedTypes: fileConfig.allowedTypes,
    };
};

/**
 * Obtenir tota la configuració
 */
export const getConfig = () => {
    return { ...frontendConfig };
};

/**
 * Obtenir configuració de qualitat d'imatges per tipus
 */
export const getImageQualityConfig = (type = 'images') => {
    return frontendConfig.imageQuality[type] || frontendConfig.imageQuality.images;
};

/**
 * Obtenir qualitat específica per tipus i nivell
 */
export const getImageQuality = (type = 'images', qualityLevel = 'default') => {
    const qualityConfig = getImageQualityConfig(type);
    return qualityConfig.quality[qualityLevel] || qualityConfig.quality.default;
};

/**
 * Obtenir dimensions per tipus
 */
export const getImageDimensions = (type = 'images') => {
    const qualityConfig = getImageQualityConfig(type);
    return qualityConfig.dimensions;
};

/**
 * Obtenir opcions de processament d'imatges
 */
export const getImageProcessingOptions = (type = 'images', qualityLevel = 'default') => {
    const qualityConfig = getImageQualityConfig(type);
    return {
        maxWidth: qualityConfig.dimensions.maxWidth,
        maxHeight: qualityConfig.dimensions.maxHeight,
        quality: qualityConfig.quality[qualityLevel] || qualityConfig.quality.default,
        compression: qualityConfig.compression || { enabled: true, autoResize: true }
    };
};

/**
 * Obtenir configuració d'UI per tipus
 */
export const getUIConfig = (type = 'mobile') => {
    return frontendConfig.ui[type] || frontendConfig.ui.mobile;
};

/**
 * Obtenir configuració del menú mòbil
 */
export const getMobileMenuConfig = () => {
    return frontendConfig.ui.mobile.menu;
};

/**
 * Obtenir configuració de botons mòbils
 */
export const getMobileButtonsConfig = () => {
    return frontendConfig.ui.mobile.buttons;
};

/**
 * Obtenir configuració de modals
 */
export const getModalsConfig = () => {
    return frontendConfig.ui.modals;
};

/**
 * Obtenir configuració d'animacions
 */
export const getAnimationsConfig = () => {
    return frontendConfig.ui.animations;
};

/**
 * Obtenir breakpoints responsius
 */
export const getBreakpoints = () => {
    return frontendConfig.ui.mobile.breakpoints;
};

/**
 * Obtenir configuració de PDF
 */
export const getPDFConfig = () => {
    return frontendConfig.pdf;
};

/**
 * Obtenir configuració de sanitització per tipus
 */
export const getSanitizationConfig = (type = 'text') => {
    return frontendConfig.sanitization[type] || frontendConfig.sanitization.text;
};

// Eliminem les funcions de sanitització - ara utilitzen DataSanitizer

/**
 * Carregar configuració del servidor
 */
export const loadConfig = async () => {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const serverConfig = await response.json();
            frontendConfig = { ...defaultConfig, ...serverConfig };
            // Debug condicional per desenvolupament
            if (frontendConfig.ui?.debugMode) {
                console.log('frontendConfig.js: Configuració final carregada:', frontendConfig); // Log detallat
                console.log('frontendConfig.js: Secció PDF carregada:', frontendConfig.pdf);
                console.info('Configuració de frontend carregada.');
                console.log('Configuració carregada del servidor:', frontendConfig);
            }
            
            // Aplicar configuració d'UI com a variables CSS
            applyUIConfigToCSS();
        } else {
            console.warn('No s\'ha pogut carregar la configuració del servidor, usant configuració per defecte');
            applyUIConfigToCSS();
        }
    } catch (error) {
        console.error('Error en carregar la configuració del frontend:', error);
        // En cas d'error, utilitzar la configuració per defecte
        frontendConfig = defaultConfig;
        console.log('frontendConfig.js: Configuració per defecte aplicada (en error):', frontendConfig);
    }
};

export default frontendConfig; 