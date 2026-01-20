/**
 * Mòdul per gestionar el comportament de la tecla Enter a camps de text
 * Segueix els patrons del projecte: Dependency Injection, gestió d'estat centralitzada
 * 
 * @copyright 2025 themacboy72@gmail.com
 * @license Apache-2.0
 */

import { ErrorBoundary } from '../utils/errorHandler.js';
import { Logger } from '../utils/errorHandler.js';

export class EnterKeyManager {
    constructor(stateManager, notificationManager) {
        this.stateManager = stateManager;
        this.notificationManager = notificationManager;
        this.elements = {};
        this.observers = [];
        this.isInitialized = false;
    }

    /**
     * Inicialitzar el mòdul
     */
    init() {
        try {
            this.getElements();
            this.setupEventListeners();
            this.setupStateSubscriptions();
            this.setupMutationObservers();
            this.isInitialized = true;
            
            Logger.info('EnterKeyManager inicialitzat correctament');
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'enter-key-manager-init');
        }
    }

    /**
     * Obtenir referències als elements
     */
    getElements() {
        // Elements del formulari principal
        this.elements.formInputs = document.querySelectorAll('input[type="text"], textarea');
        
        // Elements dels modals
        this.elements.loginModal = document.getElementById('login-modal');
        this.elements.registerModal = document.getElementById('register-modal');
        this.elements.profileModal = document.getElementById('profile-modal');
        
        // Elements de web components
        this.elements.fotoComponents = document.querySelectorAll('foto-component');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Aplicar a tots els camps del formulari principal
        this.elements.formInputs.forEach(input => {
            this.applyEnterBehavior(input, {
                type: 'form',
                onEnter: this.handleFormFieldEnter.bind(this),
                onValidation: this.validateFormField.bind(this)
            });
        });

        // Aplicar als FotoComponents existents
        this.elements.fotoComponents.forEach(component => {
            this.setupFotoComponentEnter(component);
        });
    }

    /**
     * Configurar subscripcions d'estat
     */
    setupStateSubscriptions() {
        // Subscriure's a canvis en l'estat d'autenticació per configurar modals
        this.stateManager.subscribe('user.isAuthenticated', (isAuthenticated) => {
            if (isAuthenticated) {
                this.setupModalEnterKeys();
            }
        });

        // Subscriure's a canvis en l'estat de modals
        this.stateManager.subscribe('ui.modals', (modalsState) => {
            if (modalsState) {
                this.handleModalStateChange(modalsState);
            }
        });
    }

    /**
     * Configurar observers per detectar nous elements
     */
    setupMutationObservers() {
        // Observer per detectar nous FotoComponents
        const fotoObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const fotoComponents = node.tagName === 'FOTO-COMPONENT' ? 
                            [node] : 
                            node.querySelectorAll('foto-component');
                        
                        fotoComponents.forEach(component => {
                            this.setupFotoComponentEnter(component);
                        });
                    }
                });
            });
        });

        fotoObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.push(fotoObserver);

        // Observer per detectar nous modals
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id === 'login-modal' || node.id === 'register-modal' || node.id === 'profile-modal') {
                            this.setupModalEnterKeys();
                        }
                    }
                });
            });
        });

        modalObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.push(modalObserver);
    }

    /**
     * Aplicar comportament Enter a un element
     */
    applyEnterBehavior(input, options = {}) {
        const {
            type = 'generic',
            onEnter = null,
            onValidation = null,
            preventDefault = true
        } = options;

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                if (preventDefault) {
                    event.preventDefault();
                }

                // Validació
                if (onValidation && typeof onValidation === 'function') {
                    const isValid = onValidation(input);
                    if (!isValid) {
                        return;
                    }
                }

                // Acció personalitzada
                if (onEnter && typeof onEnter === 'function') {
                    onEnter(input, event);
                }

                // Sortir del camp
                input.blur();
            }
        });
    }

    /**
     * Gestionar Enter en camps del formulari principal
     */
    handleFormFieldEnter(input, event) {
        // Actualitzar l'estat
        const fieldId = input.id;
        const value = input.value;
        
        this.stateManager.set(`formData.${fieldId}`, value);
        
        // Log per debugging
        Logger.debug('Enter premut a camp de formulari', { 
            fieldId, 
            value 
        });
    }

    /**
     * Validar camp del formulari
     */
    validateFormField(input) {
        if (input.hasAttribute('required') && input.value.trim() === '') {
            const fieldName = input.name || input.id;
            this.notificationManager.warning(`El camp "${fieldName}" és obligatori`);
            return false;
        }
        return true;
    }

    /**
     * Configurar Enter per a FotoComponent
     */
    setupFotoComponentEnter(component) {
        setTimeout(() => {
            const shadowRoot = component.shadowRoot;
            if (!shadowRoot) return;

            const titleInput = shadowRoot.querySelector('.image-title-input');
            const descriptionTextarea = shadowRoot.querySelector('.image-description');

            if (titleInput) {
                this.applyEnterBehavior(titleInput, {
                    type: 'foto-title',
                    onEnter: (input, event) => {
                        // Disparar event de component-updated
                        component.dispatchEvent(new CustomEvent('component-updated', {
                            detail: component.getData(),
                            bubbles: true,
                            composed: true
                        }));
                    }
                });
            }

            if (descriptionTextarea) {
                this.applyEnterBehavior(descriptionTextarea, {
                    type: 'foto-description',
                    onEnter: (input, event) => {
                        // Disparar event de component-updated
                        component.dispatchEvent(new CustomEvent('component-updated', {
                            detail: component.getData(),
                            bubbles: true,
                            composed: true
                        }));
                    }
                });
            }
        }, 100);
    }

    /**
     * Configurar Enter per als modals
     */
    setupModalEnterKeys() {
        // Modal de login
        if (this.elements.loginModal) {
            const loginInputs = this.elements.loginModal.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            loginInputs.forEach((input, index) => {
                this.applyEnterBehavior(input, {
                    type: 'login',
                    onEnter: (input, event) => {
                        if (input.type === 'password') {
                            // Enviar formulari
                            const loginForm = document.getElementById('login-form');
                            if (loginForm) {
                                loginForm.dispatchEvent(new Event('submit'));
                            }
                        } else {
                            // Anar al següent camp
                            const inputs = Array.from(loginInputs);
                            if (index < inputs.length - 1) {
                                inputs[index + 1].focus();
                            }
                        }
                    }
                });
            });
        }

        // Modal de registre
        if (this.elements.registerModal) {
            const registerInputs = this.elements.registerModal.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            registerInputs.forEach((input, index) => {
                this.applyEnterBehavior(input, {
                    type: 'register',
                    onEnter: (input, event) => {
                        if (input.type === 'password') {
                            // Enviar formulari
                            const registerForm = document.getElementById('register-form');
                            if (registerForm) {
                                registerForm.dispatchEvent(new Event('submit'));
                            }
                        } else {
                            // Anar al següent camp
                            const inputs = Array.from(registerInputs);
                            if (index < inputs.length - 1) {
                                inputs[index + 1].focus();
                            }
                        }
                    }
                });
            });
        }

        // Modal de perfil
        if (this.elements.profileModal) {
            const profileInputs = this.elements.profileModal.querySelectorAll('input[type="text"], textarea');
            profileInputs.forEach(input => {
                this.applyEnterBehavior(input, {
                    type: 'profile',
                    onEnter: (input, event) => {
                        // Només sortir del camp
                        input.blur();
                    }
                });
            });
        }
    }

    /**
     * Gestionar canvis en l'estat dels modals
     */
    handleModalStateChange(modalsState) {
        // Configurar Enter quan es mostrin els modals
        if (modalsState.login?.visible || modalsState.register?.visible || modalsState.profile?.visible) {
            setTimeout(() => {
                this.setupModalEnterKeys();
            }, 100);
        }
    }

    /**
     * Netejar recursos
     */
    cleanup() {
        // Aturar observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers = [];

        // Marcar com no inicialitzat
        this.isInitialized = false;
    }
} 