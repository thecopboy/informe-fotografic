/**
 * Mòdul per gestionar els components d'imatge unificats
 * Reemplaça la gestió actual dels components d'escut i imatge de fons
 */

import { ImageUploadComponent } from '../components/ImageUploadComponent.js';
import { ValidationService } from '../utils/validationService.js';
import { Logger } from '../utils/errorHandler.js';

export class ImageComponentManager {
    constructor(stateManager, notificationManager) {
        this.stateManager = stateManager;
        this.notificationManager = notificationManager;
        this.components = new Map(); // Guarda referències als components
        this.isInitialized = false; // Flag per evitar inicialitzacions múltiples
        this.eventListeners = new Map(); // Guardar referències als event listeners
    }

    /**
     * Inicialitzar el mòdul
     */
    init() {
        // Evitar inicialitzacions múltiples
        if (this.isInitialized) {
            Logger.debug('ImageComponentManager ja està inicialitzat, saltant...');
            return;
        }
        
        Logger.info('ImageComponentManager inicialitzat correctament');
        
        // Netejar event listeners anteriors si n'hi ha
        this._cleanupEventListeners();
        
        // Configurar components
        this._replaceImageComponents();
        this._setupEventListeners();
        this._setupStateSubscriptions();
        
        this.isInitialized = true;
    }

    /**
     * Netejar event listeners anteriors
     */
    _cleanupEventListeners() {
        this.eventListeners.forEach((listeners, component) => {
            listeners.forEach(({ event, handler }) => {
                component.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
    }

    /**
     * Afegir event listener amb gestió de referències
     */
    _addEventListener(component, event, handler) {
        component.addEventListener(event, handler);
        
        if (!this.eventListeners.has(component)) {
            this.eventListeners.set(component, []);
        }
        this.eventListeners.get(component).push({ event, handler });
        
        Logger.debug(`Event listener afegit: ${event} per a component ${component.id || 'sense ID'}`);
    }

    /**
     * Obtenir referències als components d'imatge existents
     */
    _replaceImageComponents() {
        // Netejar referències anteriors
        this.components.clear();
        
        // Obtenir referències als components existents
        this._getShieldComponent();
        this._getBackgroundComponent();
        this._getProfileComponents();
        
        Logger.debug('Components d\'imatge obtinguts:', {
            shield: !!this.components.get('shield'),
            background: !!this.components.get('background'),
            profileShield: !!this.components.get('profile-shield'),
            profileBackground: !!this.components.get('profile-background')
        });
    }

    /**
     * Obtenir referència al component d'escut
     */
    _getShieldComponent() {
        const shieldComponent = document.getElementById('shield-upload');
        if (!shieldComponent) {
            Logger.warn('No s\'ha trobat el component d\'escut');
            return;
        }

        // Guardar referència
        this.components.set('shield', shieldComponent);
    }

    /**
     * Obtenir referència al component d'imatge de fons
     */
    _getBackgroundComponent() {
        const backgroundComponent = document.getElementById('background-upload');
        if (!backgroundComponent) {
            Logger.warn('No s\'ha trobat el component d\'imatge de fons');
            return;
        }

        // Guardar referència
        this.components.set('background', backgroundComponent);
    }

    /**
     * Obtenir referències als components del perfil
     */
    _getProfileComponents() {
        const profileShieldComponent = document.getElementById('profile-shield-upload');
        const profileBackgroundComponent = document.getElementById('profile-background-upload');
        const profileSignatureComponent = document.getElementById('profile-signature-upload'); // Nou
        
        if (profileShieldComponent) {
            this.components.set('profile-shield', profileShieldComponent);
        }
        
        if (profileBackgroundComponent) {
            this.components.set('profile-background', profileBackgroundComponent);
        }

        if (profileSignatureComponent) {
            this.components.set('profile-signature', profileSignatureComponent);
        }
    }

    /**
     * Configurar els event listeners dels components
     */
    _setupEventListeners() {
        Logger.debug('Configurant event listeners per a components d\'imatge');
        
        // Event listeners per a l'escut
        const shieldComponent = this.components.get('shield');
        if (shieldComponent) {
            Logger.debug('Configurant event listeners per a escut');
            this._addEventListener(shieldComponent, 'file-selected', (e) => {
                Logger.debug('Event file-selected rebut per a escut');
                this._handleShieldFileSelected(e.detail.file);
            });

            this._addEventListener(shieldComponent, 'file-removed', () => {
                Logger.debug('Event file-removed rebut per a escut');
                this._handleShieldFileRemoved();
            });

            this._addEventListener(shieldComponent, 'error', (e) => {
                Logger.debug('Event error rebut per a escut');
                this.notificationManager.error(e.detail.errors.join(', '));
            });
        }

        // Event listeners per a la imatge de fons
        const backgroundComponent = this.components.get('background');
        if (backgroundComponent) {
            Logger.debug('Configurant event listeners per a imatge de fons');
            this._addEventListener(backgroundComponent, 'file-selected', (e) => {
                Logger.debug('Event file-selected rebut per a imatge de fons');
                this._handleBackgroundFileSelected(e.detail.file);
            });

            this._addEventListener(backgroundComponent, 'file-removed', () => {
                Logger.debug('Event file-removed rebut per a imatge de fons');
                this._handleBackgroundFileRemoved();
            });

            this._addEventListener(backgroundComponent, 'error', (e) => {
                Logger.debug('Event error rebut per a imatge de fons');
                this.notificationManager.error(e.detail.errors.join(', '));
            });
        }

        // Event listeners per als components del perfil
        const profileShieldComponent = this.components.get('profile-shield');
        if (profileShieldComponent) {
            Logger.debug('Configurant event listeners per a escut del perfil');
            this._addEventListener(profileShieldComponent, 'file-selected', (e) => {
                Logger.debug('Event file-selected rebut per a escut del perfil');
                this._handleProfileShieldFileSelected(e.detail.file);
            });

            this._addEventListener(profileShieldComponent, 'file-removed', () => {
                Logger.debug('Event file-removed rebut per a escut del perfil');
                this._handleProfileShieldFileRemoved();
            });

            this._addEventListener(profileShieldComponent, 'error', (e) => {
                Logger.debug('Event error rebut per a escut del perfil');
                this.notificationManager.error(e.detail.errors.join(', '));
            });
        }

        const profileBackgroundComponent = this.components.get('profile-background');
        if (profileBackgroundComponent) {
            Logger.debug('Configurant event listeners per a imatge de fons del perfil');
            this._addEventListener(profileBackgroundComponent, 'file-selected', (e) => {
                Logger.debug('Event file-selected rebut per a imatge de fons del perfil');
                this._handleProfileBackgroundFileSelected(e.detail.file);
            });

            this._addEventListener(profileBackgroundComponent, 'file-removed', () => {
                Logger.debug('Event file-removed rebut per a imatge de fons del perfil');
                this._handleProfileBackgroundFileRemoved();
            });

            this._addEventListener(profileBackgroundComponent, 'error', (e) => {
                Logger.debug('Event error rebut per a imatge de fons del perfil');
                this.notificationManager.error(e.detail.errors.join(', '));
            });
        }
        
        // Event listeners per al component de signatura del perfil
        const profileSignatureComponent = this.components.get('profile-signature');
        if (profileSignatureComponent) {
            Logger.debug('Configurant event listeners per a signatura del perfil');
            this._addEventListener(profileSignatureComponent, 'file-selected', (e) => {
                Logger.debug('Event file-selected rebut per a signatura del perfil');
                this._handleProfileSignatureFileSelected(e.detail.file);
            });

            this._addEventListener(profileSignatureComponent, 'file-removed', () => {
                Logger.debug('Event file-removed rebut per a signatura del perfil');
                this._handleProfileSignatureFileRemoved();
            });

            this._addEventListener(profileSignatureComponent, 'error', (e) => {
                Logger.debug('Event error rebut per a signatura del perfil');
                this.notificationManager.error(e.detail.errors.join(', '));
            });
        }
        
        Logger.debug('Event listeners configurats per a tots els components');
    }

    /**
     * Configurar subscripcions d'estat
     */
    _setupStateSubscriptions() {
        // Subscriure's als canvis d'estat per actualitzar la UI
        this.stateManager.subscribe('shield', this._updateShieldFromState.bind(this));
        this.stateManager.subscribe('backgroundImage', this._updateBackgroundFromState.bind(this));
        this.stateManager.subscribe('user.data.signatureImage', this._updateSignatureFromState.bind(this)); // Nova subscripció
    }

    /**
     * Gestionar fitxer d'escut seleccionat
     */
    _handleShieldFileSelected(file) {
        // Evitar bucles quan es carrega des de l'estat
        if (this.stateManager.isUpdatingFromState()) {
            return;
        }

        try {
            // Validar fitxer
            const validation = ValidationService.validateFile(file, {
                allowedTypes: ['image/jpeg', 'image/png'],
                maxSize: 5 * 1024 * 1024
            });
            
            if (!validation.isValid) {
                this.notificationManager.error(validation.errors.join(', '));
                return;
            }

            // Guardar a l'estat
            this.stateManager.set('shield', {
                file: file,
                previewUrl: this.components.get('shield').getPreviewUrl()
            });

            Logger.debug('Escut seleccionat:', { fileName: file.name });
        } catch (error) {
            this.notificationManager.error('Error en processar l\'escut');
            Logger.error('Error processant escut:', error);
        }
    }

    /**
     * Gestionar eliminació d'escut
     */
    _handleShieldFileRemoved() {
        Logger.debug('_handleShieldFileRemoved cridat');
        // Evitar duplicació: només actualitzar l'estat si no està ja en procés d'actualització
        if (!this.stateManager.isUpdatingFromState()) {
            this.stateManager.set('shield', null);
            Logger.debug('Escut eliminat');
        }
    }

    /**
     * Gestionar fitxer d'imatge de fons seleccionat
     */
    _handleBackgroundFileSelected(file) {
        // Evitar bucles quan es carrega des de l'estat
        if (this.stateManager.isUpdatingFromState()) {
            return;
        }

        try {
            // Validar fitxer
            const validation = ValidationService.validateFile(file, {
                allowedTypes: ['image/jpeg', 'image/png'],
                maxSize: 5 * 1024 * 1024
            });
            
            if (!validation.isValid) {
                this.notificationManager.error(validation.errors.join(', '));
                return;
            }

            // Guardar a l'estat
            this.stateManager.set('backgroundImage', {
                file: file,
                previewUrl: this.components.get('background').getPreviewUrl()
            });

            Logger.debug('Imatge de fons seleccionada:', { fileName: file.name });
        } catch (error) {
            this.notificationManager.error('Error en processar la imatge de fons');
            Logger.error('Error processant imatge de fons:', error);
        }
    }

    /**
     * Gestionar eliminació d'imatge de fons
     */
    _handleBackgroundFileRemoved() {
        Logger.debug('_handleBackgroundFileRemoved cridat');
        // Evitar duplicació: només actualitzar l'estat si no està ja en procés d'actualització
        if (!this.stateManager.isUpdatingFromState()) {
            this.stateManager.set('backgroundImage', null);
            Logger.debug('Imatge de fons eliminada');
        }
    }

    /**
     * Actualitzar component d'escut des de l'estat
     */
    _updateShieldFromState(shieldData) {
        Logger.debug('_updateShieldFromState cridat:', { hasFile: !!(shieldData && shieldData.file) });
        this.stateManager.withStateUpdate(() => {
            const shieldComponent = this.components.get('shield');
            if (!shieldComponent) {
                Logger.debug('No s\'ha trobat el component d\'escut');
                return;
            }

            if (shieldData && shieldData.file) {
                Logger.debug('Establint fitxer d\'escut des de l\'estat');
                shieldComponent.setFile(shieldData.file);
            } else {
                Logger.debug('Netejant component d\'escut des de l\'estat');
                shieldComponent.clear();
            }
        }, 'update-shield-from-state');
    }

    /**
     * Actualitzar component d'imatge de fons des de l'estat
     */
    _updateBackgroundFromState(backgroundData) {
        Logger.debug('_updateBackgroundFromState cridat:', { hasFile: !!(backgroundData && backgroundData.file) });
        this.stateManager.withStateUpdate(() => {
            const backgroundComponent = this.components.get('background');
            if (!backgroundComponent) {
                Logger.debug('No s\'ha trobat el component d\'imatge de fons');
                return;
            }

            if (backgroundData && backgroundData.file) {
                Logger.debug('Establint fitxer d\'imatge de fons des de l\'estat');
                backgroundComponent.setFile(backgroundData.file);
            } else {
                Logger.debug('Netejant component d\'imatge de fons des de l\'estat');
                backgroundComponent.clear();
            }
        }, 'update-background-from-state');
    }

    /**
     * Actualitzar component de signatura des de l'estat
     */
    _updateSignatureFromState(signatureData) {
        Logger.debug('_updateSignatureFromState cridat:', { hasFile: !!(signatureData && signatureData.file) });
        // NO cridem withStateUpdate aquí, ja estem en un context de canvi d'estat des del stateManager
        const signatureComponent = this.components.get('profile-signature');
        if (!signatureComponent) {
            Logger.debug('No s\'ha trobat el component de signatura del perfil');
            return;
        }

        const currentFile = signatureComponent.getFile();
        const newFile = signatureData ? signatureData.file : null;

        // Només actualitzar si el fitxer ha canviat
        if (currentFile !== newFile) {
            if (newFile) {
                Logger.debug('Establint fitxer de signatura des de l\'estat');
                signatureComponent.setFile(newFile);
            } else {
                Logger.debug('Netejant component de signatura des de l\'estat');
                signatureComponent.clear();
            }
        }
    }

    /**
     * Netejar tots els components
     */
    clearAll() {
        Logger.debug('clearAll() cridat per ImageComponentManager');
        this.components.forEach(component => {
            Logger.debug(`Cridant clear() per a component: ${component.title || 'sense títol'} (ID: ${component.id})`);
            component.clear();
        });
        Logger.debug('clearAll() completat');
    }

    /**
     * Reinicialitzar el manager (útil per a canvis d'estat)
     */
    reset() {
        this.isInitialized = false;
        this._cleanupEventListeners();
        this.components.clear();
        this.init();
    }

    /**
     * Destruir el manager i netejar recursos
     */
    destroy() {
        this._cleanupEventListeners();
        this.components.clear();
        this.isInitialized = false;
    }

    /**
     * Obtenir fitxer d'escut
     */
    getShieldFile() {
        const shieldComponent = this.components.get('shield');
        return shieldComponent ? shieldComponent.getFile() : null;
    }

    /**
     * Obtenir fitxer d'imatge de fons
     */
    getBackgroundFile() {
        const backgroundComponent = this.components.get('background');
        return backgroundComponent ? backgroundComponent.getFile() : null;
    }

    /**
     * Establir fitxer d'escut
     */
    setShieldFile(file) {
        this.stateManager.withStateUpdate(() => {
            const shieldComponent = this.components.get('shield');
            if (shieldComponent) {
                shieldComponent.setFile(file);
            }
        }, 'set-shield-file');
    }

    /**
     * Establir fitxer d'imatge de fons
     */
    setBackgroundFile(file) {
        this.stateManager.withStateUpdate(() => {
            const backgroundComponent = this.components.get('background');
            if (backgroundComponent) {
                backgroundComponent.setFile(file);
            }
        }, 'set-background-file');
    }

    /**
     * Gestionar fitxer d'escut del perfil seleccionat
     */
    _handleProfileShieldFileSelected(file) {
        try {
            // Validar fitxer
            const validation = ValidationService.validateFile(file, {
                allowedTypes: ['image/jpeg', 'image/png'],
                maxSize: 5 * 1024 * 1024
            });
            
            if (!validation.isValid) {
                this.notificationManager.error(validation.errors.join(', '));
                return;
            }

            // Guardar a l'estat del perfil
            this.stateManager.set('profile.shield', {
                file: file,
                previewUrl: this.components.get('profile-shield').getPreviewUrl()
            });

            Logger.info('Escut del perfil seleccionat:', file.name);
        } catch (error) {
            this.notificationManager.error('Error en processar l\'escut del perfil');
            Logger.error('Error processant escut del perfil:', error);
        }
    }

    /**
     * Gestionar eliminació d'escut del perfil
     */
    _handleProfileShieldFileRemoved() {
        // Evitar duplicació: només actualitzar l'estat si no està ja en procés d'actualització
        if (!this.stateManager.isUpdatingFromState()) {
            this.stateManager.set('profile.shield', null);
        }
    }

    /**
     * Gestionar fitxer d'imatge de fons del perfil seleccionat
     */
    _handleProfileBackgroundFileSelected(file) {
        try {
            // Validar fitxer
            const validation = ValidationService.validateFile(file, {
                allowedTypes: ['image/jpeg', 'image/png'],
                maxSize: 5 * 1024 * 1024
            });
            
            if (!validation.isValid) {
                this.notificationManager.error(validation.errors.join(', '));
                return;
            }

            // Guardar a l'estat del perfil
            this.stateManager.set('profile.backgroundImage', {
                file: file,
                previewUrl: this.components.get('profile-background').getPreviewUrl()
            });

            Logger.info('Imatge de fons del perfil seleccionada:', file.name);
        } catch (error) {
            this.notificationManager.error('Error en processar la imatge de fons del perfil');
            Logger.error('Error processant imatge de fons del perfil:', error);
        }
    }

    /**
     * Gestionar eliminació d'imatge de fons del perfil
     */
    _handleProfileBackgroundFileRemoved() {
        // Evitar duplicació: només actualitzar l'estat si no està ja en procés d'actualització
        if (!this.stateManager.isUpdatingFromState()) {
            this.stateManager.set('profile.backgroundImage', null);
        }
    }

    /**
     * Gestionar fitxer de signatura del perfil seleccionat
     */
    _handleProfileSignatureFileSelected(file) {
        try {
            // Validar fitxer
            const validation = ValidationService.validateFile(file, {
                allowedTypes: ['image/jpeg', 'image/png'],
                maxSize: 5 * 1024 * 1024
            });
            
            if (!validation.isValid) {
                this.notificationManager.error(validation.errors.join(', '));
                return;
            }

            // Guardar a l'estat del perfil
            this.stateManager.set('user.data.signatureImage', {
                file: file,
                previewUrl: this.components.get('profile-signature').getPreviewUrl()
            });

        } catch (error) {
            this.notificationManager.error('Error en processar la signatura del perfil');
            Logger.error('Error processant signatura del perfil:', error);
        }
    }

    /**
     * Gestionar eliminació de signatura del perfil
     */
    _handleProfileSignatureFileRemoved() {
        // Evitar duplicació: només actualitzar l'estat si no està ja en procés d'actualització
        if (!this.stateManager.isUpdatingFromState()) {
            this.stateManager.set('user.data.signatureImage', null);
        }
    }

    /**
     * Establir fitxer de signatura
     */
    setSignatureFile(file) {
        this.stateManager.withStateUpdate(() => {
            const signatureComponent = this.components.get('profile-signature');
            if (signatureComponent) {
                signatureComponent.setFile(file);
            }
        }, 'set-signature-file');
    }

    /**
     * Obtenir tots els components
     */
    getComponents() {
        return this.components;
    }
} 