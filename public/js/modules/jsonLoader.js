/**
 * Mòdul per a la gestió de càrrega i desat de fitxers JSON
 * Conté tota la lògica relacionada amb la persistència de dades d'informes
 */
import { ErrorBoundary } from '../utils/errorHandler.js';
import { ValidationService } from '../utils/validationService.js';
import { FileService } from '../utils/fileService.js';
import { Logger } from '../utils/errorHandler.js';
// ELIMINAT: import { Logger } from '../../../utils/logger.js'; // Importa el Logger
    
// Funcionalitat centralitzada en la classe JsonLoader

export class JsonLoader {
    constructor(stateManager, photoComponentManager, notificationManager, imageComponentManager = null) {
        this.stateManager = stateManager;
        this.photoComponentManager = photoComponentManager;
        this.notificationManager = notificationManager;
        this.imageComponentManager = imageComponentManager;
        this.elements = {
            loadBtn: null,
            fileInput: null,
            mobileLoadBtn: null
        };
    }

    init() {
        this.getElements();
        this.setupEventListeners();
    }

    getElements() {
        this.elements.loadBtn = document.getElementById('load-json-btn');
        this.elements.fileInput = document.getElementById('load-json-input');
        this.elements.mobileLoadBtn = document.getElementById('mobile-load-json-btn');
    }

    setupEventListeners() {
        // Botó principal de carregar
        if (this.elements.loadBtn && this.elements.fileInput) {
            this.elements.loadBtn.addEventListener('click', () => {
                this.elements.fileInput.click();
            });

            this.elements.fileInput.addEventListener('change', async (e) => {
                await this.handleFileLoad(e);
            });
        }

        // Botó mòbil de carregar
        if (this.elements.mobileLoadBtn) {
            this.elements.mobileLoadBtn.addEventListener('click', () => {
                this.elements.fileInput.click();
                this.closeMobileMenu();
            });
        }
    }

    /**
     * Comprova si les dades JSON corresponen a un format antic.
     * Un format antic es caracteritza per tenir un objecte 'formData' i un objecte 'fotos'.
     * @param {object} data - Les dades JSON a comprovar.
     * @returns {boolean} - True si és el format antic.
     */
    isOldFormat(data) {
        return data && data.formData && typeof data.fotos === 'object' && !Array.isArray(data.fotos);
    }

    /**
     * Converteix dades del format antic al format modern esperat per l'aplicació.
     * @param {object} oldData - Les dades en format antic.
     * @returns {object} - Les dades convertides al format modern.
     */
    convertOldFormat(oldData) {
        Logger.warn("Detectat format de dades antic. Realitzant conversió...");
        
        const newData = {
            general: oldData.formData || {},
            photos: []
        };

        const peusDeFoto = oldData.formData?.peusDeFoto || '';
        const peusDeFotoArray = peusDeFoto.split('\n').filter(p => p.trim() !== '');

        newData.photos = Object.entries(oldData.fotos).map(([id, src], index) => ({
            foto: src, // El format nou espera el camp 'foto'
            titol: peusDeFotoArray[index] || '', // Es recupera el títol dels antics peus de foto
            originalName: `foto_carregada_${id}.jpg` // El nom original no existia, se n'assigna un
        }));
        
        // S'elimina el camp obsolet per evitar conflictes
        if (newData.general.peusDeFoto) {
            delete newData.general.peusDeFoto;
        }

        return newData;
    }

    /**
     * Gestionar càrrega de fitxer
     */
    async handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            
            // Validar tipus de fitxer
            const fileValidation = ValidationService.validateFile(file, {
                allowedTypes: ['application/json'],
                maxSize: 200 * 1024 * 1024 // 200MB
            });

            if (!fileValidation.isValid) {
                Logger.error('Validació de fitxer JSON fallida:', fileValidation.errors);
                this.notificationManager.error('Hi ha hagut un problema en carregar les dades. Comprova que el fitxer sigui vàlid.');
                event.target.value = '';
                return;
            }

            // Llegir fitxer
            let jsonData = await this.readFile(file);
            
            // Comprovar i convertir si el format de dades és antic
            if (this.isOldFormat(jsonData)) {
                jsonData = this.convertOldFormat(jsonData);
            }
            
            // Validar estructura JSON
            const jsonValidation = this.validateJsonStructure(jsonData);
            if (!jsonValidation.isValid) {
                Logger.error('Validació d\'estructura JSON fallida:', jsonValidation.errors);
                this.notificationManager.error('Hi ha hagut un problema en carregar les dades. Comprova que el fitxer sigui vàlid.');
                event.target.value = '';
                return;
            }

            // Processar dades
            await this.processJsonData(jsonData);
            
            this.notificationManager.success('Fitxer JSON carregat correctament');
            
            // Netejar input per permetre carregar el mateix fitxer de nou
            event.target.value = '';
            
        } catch (error) {
            Logger.error('Error general en handleFileLoad:', error);
            ErrorBoundary.handleError(error, {}, 'json-file-load');
            this.notificationManager.error('Hi ha hagut un problema en carregar les dades. Comprova que el fitxer sigui vàlid.');
            event.target.value = '';
        }
    }

    /**
     * Llegir fitxer
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    resolve(jsonData);
                } catch (error) {
                    Logger.error('Error en parsejar JSON al llegir fitxer:', error);
                    reject(new Error('Format JSON invàlid'));
                }
            };
            
            reader.onerror = () => {
                Logger.error('Error en llegir el fitxer amb FileReader:', reader.error);
                reject(new Error('Error en llegir el fitxer'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Validar estructura JSON
     */
    validateJsonStructure(data) {
        const errors = [];
        // Comprovar que existeixen 'general' i 'photos'
        if (typeof data !== 'object' || data === null) {
            errors.push('Les dades han de ser un objecte JSON');
            Logger.warn('Validació JSON: Les dades no són un objecte', data);
            return { isValid: false, errors };
        }
        if (!data.hasOwnProperty('general') || typeof data.general !== 'object' || data.general === null) {
            errors.push("Falta l'objecte 'general' amb les dades de l'informe");
            Logger.warn('Validació JSON: Falta o és invàlid l\'objecte \'general\'', data.general);
        }
        if (!data.hasOwnProperty('photos') || !Array.isArray(data.photos)) {
            errors.push("Falta l'array 'photos' amb les fotos de l'informe");
            Logger.warn('Validació JSON: Falta o és invàlid l\'array \'photos\'', data.photos);
        }
        // Validar camps obligatoris dins de 'general'
        if (data.general && typeof data.general === 'object') {
            const requiredFields = ['tipus', 'numero', 'data', 'hora', 'adreca', 'assumpte', 'signants'];
        requiredFields.forEach(field => {
                if (!data.general.hasOwnProperty(field)) {
                    errors.push(`Camp obligatori faltant a 'general': ${field}`);
                    Logger.warn(`Validació JSON: Camp obligatori faltant a 'general': ${field}`, data.general[field]);
            }
        });
            // Validar format de data
            if (data.general['data'] && !ValidationService.validateDate(data.general['data'])) {
                errors.push('Format de data invàlid (data)');
                Logger.warn('Validació JSON: Format de data invàlid (data)', data.general['data']);
        }
            // Validar format d'hora
            if (data.general['hora'] && !ValidationService.validateTime(data.general['hora'])) {
                errors.push("Format d'hora invàlid (hora)");
                Logger.warn('Validació JSON: Format d\'hora invàlid (hora)', data.general['hora']);
        }
        }
        if (errors.length > 0) {
            Logger.error('Errors de validació d\'estructura JSON trobats:', errors);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Processar dades JSON
     */
    async processJsonData(data) {
        try {
            Logger.debug('Processant dades JSON:', data);
            await this.populateForm(data);
            this.updateUI(); // Forcem l'actualització de la UI de les fotos
        } catch (error) {
            Logger.error('Error en processar dades JSON (processJsonData):', error);
            ErrorBoundary.handleError(error, {}, 'json-process-data');
            throw error;
        }
    }
    
    async populateForm(data) {
        try {
            Logger.debug('Poblant formulari amb dades:', data);
            // Netejar estat actual abans de carregar noves dades
            this.stateManager.set('formData', {});
            this.stateManager.set('photos', []);
            this.stateManager.set('shield', { file: null, url: null });
            this.stateManager.set('backgroundImage', { file: null, url: null });
            
            // Carregar dades generals
            if (data.general) {
                this.stateManager.set('formData', data.general);
                Logger.debug('Dades generals carregades:', data.general);
            }

            // Carregar escut
            if (data.general && data.general.escut) {
                try {
                    const file = FileService.base64ToFile(data.general.escut, 'escut.jpg');
                    this.stateManager.set('shield', { file, url: URL.createObjectURL(file) });
                    Logger.debug('Escut carregat des de Base64');
                    
                    // Carregar al component d'imatge si està disponible
                    if (this.imageComponentManager) {
                        this.imageComponentManager.setShieldFile(file);
                    }
                } catch (error) {
                    Logger.error("No s'ha pogut carregar l'escut des de base64:", error);
                    this.stateManager.set('shield', { file: null, url: null });
                }
            }

            // Carregar imatge de fons
            if (data.general && data.general.backgroundImage) {
                try {
                    const file = FileService.base64ToFile(data.general.backgroundImage, 'background.jpg');
                    const url = URL.createObjectURL(file);
                    this.stateManager.set('backgroundImage', { file, url });
                    Logger.debug('Imatge de fons carregada des de Base64');
                    
                    // Carregar al component d'imatge si està disponible
                    if (this.imageComponentManager) {
                        this.imageComponentManager.setBackgroundFile(file);
                    }
                } catch (error) {
                    Logger.error("No s'ha pogut carregar la imatge de fons des de base64:", error);
                    this.stateManager.set('backgroundImage', { file: null, url: null });
                }
            }

            // Carregar fotos
            if (data.photos && Array.isArray(data.photos)) {
                let photos = data.photos.map((photoData, index) => {
                    try {
                        if (!photoData.foto || typeof photoData.foto !== 'string' || !photoData.foto.startsWith('data:image')) {
                            Logger.warn(`Dades de la foto invàlides o inexistents per a l'element a l'índex ${index}. S'ometrà aquesta foto.`, photoData);
                            return null;
                        }

                        const originalName = photoData.originalName || `foto_${index + 1}.jpg`;
                        const fileType = photoData.format || 'image/jpeg';
                        const file = FileService.base64ToFile(photoData.foto, originalName, fileType);

                        return {
                            id: index + 1, // Temporal, s'assignarà correctament amb ensurePhotoIds
                            file,
                            imageUrl: URL.createObjectURL(file), // Aquest camp ja no és necessari per FotoComponent directament
                            filename: originalName,
                            title: photoData.titol || '', // Mapear titol -> title
                            description: photoData.descripcio || '', // Mapear descripcio -> description
                            number: photoData.number || index + 1,
                            originalName,
                            isActive: photoData.isActive !== false
                        };
                    } catch (error) {
                        Logger.error(`Error en processar la foto a l'índex ${index}:`, error, photoData);
                        return null;
                    }
                }).filter(p => p !== null);

                photos = FileService.ensurePhotoIds(photos);
                this.stateManager.set('photos', photos);
                Logger.debug('Fotos carregades:', photos.length);
            }
            
        } catch (error) {
            Logger.error('Error en populateForm:', error);
            ErrorBoundary.handleError(error, {}, 'populate-form-json');
            throw error;
        }
    }

    /**
     * Actualitzar UI després de carregar dades
     */
    updateUI() {
        this.photoComponentManager.renderPhotosFromState();
        
        // Els components d'imatge ara es gestionen automàticament a través del ImageComponentManager
        // No cal forçar l'actualització manualment
    }

    /**
     * Tancar menú mòbil
     */
    closeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('active');
        }
        
        if (mobileNav) {
            mobileNav.classList.remove('active');
        }
        
        document.body.style.overflow = '';
    }

    /**
     * Carregar dades des d'una URL
     */
    async loadJsonFromUrl(url) {
        try {
            this.notificationManager.info('Carregant JSON des de URL...');
            Logger.debug('Intentant carregar JSON des de URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                Logger.error(`Error HTTP ${response.status} en carregar JSON des de URL:`, response);
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const jsonData = await response.json();
            
            // Validar estructura
            const validation = this.validateJsonStructure(jsonData);
            if (!validation.isValid) {
                Logger.error(`Validació d'estructura JSON fallida al carregar des de URL: ${validation.errors.join(', ')}`, validation.errors);
                this.notificationManager.error(`Error en l'estructura JSON: ${validation.errors.join(', ')}`);
                return;
            }
            
            // Processar dades
            await this.processJsonData(jsonData);
            
            this.notificationManager.success('JSON carregat des de URL correctament');
            
        } catch (error) {
            Logger.error('Error en carregar JSON des de URL (loadJsonFromUrl):', error);
            ErrorBoundary.handleError(error, {}, 'json-url-load');
            this.notificationManager.error('Error en carregar JSON des de URL');
        }
    }

    /**
     * Carregar JSON des de localStorage
     */
    async loadJsonFromStorage(key = 'savedFormData') {
        try {
            this.notificationManager.info('Carregant JSON des de localStorage...');
            Logger.debug('Intentant carregar JSON des de localStorage amb clau:', key);
            
            const savedData = localStorage.getItem(key);
            
            if (!savedData) {
                this.notificationManager.warning('No hi ha dades guardades');
                Logger.warn('No hi ha dades guardades a localStorage per la clau:', key);
                return;
            }
            
            const jsonData = JSON.parse(savedData);
            
            // Validar estructura
            const validation = this.validateJsonStructure(jsonData);
            if (!validation.isValid) {
                Logger.error(`Validació d'estructura JSON fallida al carregar des de localStorage: ${validation.errors.join(', ')}`, validation.errors);
                this.notificationManager.error(`Error en l'estructura JSON: ${validation.errors.join(', ')}`);
                return;
            }
            
            // Processar dades
            await this.processJsonData(jsonData);
            
            this.notificationManager.success('JSON carregat des de localStorage correctament');
            
        } catch (error) {
            Logger.error('Error en carregar JSON des de localStorage (loadJsonFromStorage):', error);
            ErrorBoundary.handleError(error, {}, 'json-storage-load');
            this.notificationManager.error('Error en carregar JSON des de localStorage');
        }
    }
}
