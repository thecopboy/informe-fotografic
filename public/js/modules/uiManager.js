/**
 * Mòdul de gestió d'interfície
 * Centralitza tota la lògica relacionada amb UI, modals i navegació
 */

import { ErrorBoundary, Logger } from '../utils/errorHandler.js';
import { ValidationService } from '../utils/validationService.js';
import { FORM_FIELDS } from './formManager.js';

export class UIManager {
    constructor(stateManager) {
        // Validació de dependències bàsiques
        if (!stateManager || typeof stateManager.subscribe !== 'function') {
            throw new Error('UIManager: stateManager és obligatori i ha de tenir el mètode subscribe');
        }

        this.stateManager = stateManager;
        this.authManager = null; // S'assignarà posteriorment
        this.reportManager = null; // S'assignarà posteriorment
        this.elements = {};
    }

    /**
     * Assigna els gestors d'autenticació i informes a UIManager i configura els esdeveniments.
     * Aquest mètode s'ha de cridar un cop tots els gestors hagin estat instanciats.
     */
    setAuthAndReportManagers(authManager, reportManager) {
        // Validació estricta aquí
        if (!authManager || typeof authManager.showLoginModal !== 'function') {
            throw new Error('UIManager: authManager és obligatori i ha de tenir els mètodes d\'autenticació');
        }
        if (!reportManager || typeof reportManager.updateGenerateButtonText !== 'function') {
            throw new Error('UIManager: reportManager és obligatori i ha de tenir els mètodes de gestió d\'informes');
        }

        this.authManager = authManager;
        this.reportManager = reportManager;

        // Ara que els gestors estan assignats, podem lligar esdeveniments i subscripcions
        this._getElements(); // Captura els elements del DOM, que necessita authManager pel check de botons
        this._bindEvents(); // Lliga events que fan servir authManager i reportManager
        this._setupStateSubscriptions(); // Configura subscripcions que poden dependre d'aquests managers
        this._renderAuthState(); // Crida inicial per garantir l'estat correcte basat en l'autenticació
    }

    // Renombro init a _init per ser un mètode intern
    init() {
        // Aquest mètode ja no serà la funció principal d'inicialització externa
        // La lògica s'ha mogut a setAuthAndReportManagers
        Logger.warn("UIManager.init() ha estat refactoritzat i la seva lògica d'inicialització principal s'ha mogut a setAuthAndReportManagers.");
    }

    /**
     * Captura els elements del DOM.
     */
    _getElements() {
        this.elements = {
            // Elements de navegació mòbil
            mobileMenuBtn: document.getElementById('mobile-menu-btn'),
            mobileNav: document.getElementById('mobile-nav'),
            navIndicatorLeft: document.getElementById('nav-indicator-left'),
            navIndicatorRight: document.getElementById('nav-indicator-right'),
            
            // Elements de modals
            infoModal: document.getElementById('info-modal-overlay'), // Corregit ID
            closeInfoModal: document.getElementById('info-modal-close-btn'), // Corregit ID
            infoModalContent: document.getElementById('info-modal-text'), // Corregit ID
            
            temporaryModal: document.getElementById('temporary-modal'), // Aquest no existeix en HTML, caldrà revisar-ho si es vol usar
            temporaryModalContent: document.getElementById('temporary-modal-content'), // Aquest no existeix en HTML, caldrà revisar-ho si es vol usar
            
            confirmModal: document.getElementById('confirm-modal'),
            closeConfirmModal: document.getElementById('close-confirm-modal'),
            confirmModalContent: document.getElementById('confirm-modal-content'),
            confirmModalTitle: document.getElementById('confirm-modal-title'),
            confirmModalMessage: document.getElementById('confirm-modal-message'),
            confirmModalYesBtn: document.getElementById('confirm-modal-yes-btn'),
            confirmModalNoBtn: document.getElementById('confirm-modal-no-btn'),

            // Els components d'imatge ara gestionen els seus propis elements via Shadow DOM
            
            // Elements d'autenticació
            loginBtn: document.getElementById('login-btn'),
            userInfo: document.getElementById('user-info'),
            userName: document.getElementById('user-name'),
            logoutBtn: document.getElementById('logout-btn'),
            loginModal: document.getElementById('login-modal'),
            closeLoginModal: document.getElementById('close-login-modal'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            showRegisterForm: document.getElementById('show-register-form'),
            showLoginForm: document.getElementById('show-login-form'),
            emailInput: document.getElementById('login-email'),
            passwordInput: document.getElementById('login-password'),
            
            // Elements de perfil
            profileModal: document.getElementById('profile-modal'),
            closeProfileModal: document.getElementById('close-profile-modal'),
            cancelProfileBtn: document.getElementById('cancel-profile-btn'),

            // Elements mòbils d'autenticació
            mobileLoginBtn: document.getElementById('mobile-login-btn'),
            mobileUserInfo: document.getElementById('mobile-user-info'),
            mobileUserName: document.getElementById('mobile-user-name'),
            mobileLogoutBtn: document.getElementById('mobile-logout-btn'),
            
            // Elements dels botons "Els meus informes"
            myReportsBtn: document.getElementById('my-reports-btn'),
            mobileMyReportsBtn: document.getElementById('mobile-my-reports-btn'),
            
            // Altres
            generatePdfBtn: document.getElementById('generate-pdf-btn'),
            mobileGeneratePdfBtn: document.getElementById('mobile-generate-pdf-btn'),
            
            // Elements de la modal d'instruccions
            instruccionsBtn: document.getElementById('instruccions-btn'),
            mobileInstruccionsBtn: document.getElementById('mobile-instruccions-btn'),
            instruccionsModal: document.getElementById('instruccions-modal'),
            closeInstruccionsModal: document.getElementById('close-instruccions-modal'),
        };
    }

    /**
     * Assigna els esdeveniments als elements del DOM.
     */
    _bindEvents() {
        // Navegació mòbil
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => {
                if (this.elements.mobileNav.classList.contains('active')) {
                    this.closeMobileMenu();
                } else {
                    this.openMobileMenu();
                }
            });
        }

        if (this.elements.mobileNav) {
            this.elements.mobileNav.addEventListener('click', (e) => {
                if (e.target === this.elements.mobileNav) {
                    this.closeMobileMenu();
                }
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.elements.mobileNav.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.mobileNav && this.elements.mobileNav.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });

        // Modals
        if (this.elements.closeInfoModal) this.elements.closeInfoModal.addEventListener('click', () => this.hideInfoModal());
        if (this.elements.closeConfirmModal) this.elements.closeConfirmModal.addEventListener('click', () => this.hideConfirmModal());
        if (this.elements.confirmModalNoBtn) this.elements.confirmModalNoBtn.addEventListener('click', () => this.hideConfirmModal());
        
        // Modal d'instruccions
        if (this.elements.closeInstruccionsModal) this.elements.closeInstruccionsModal.addEventListener('click', () => this.hideInstruccionsModal());
        if (this.elements.instruccionsBtn) this.elements.instruccionsBtn.addEventListener('click', () => this.showInstruccionsModal());
        if (this.elements.mobileInstruccionsBtn) this.elements.mobileInstruccionsBtn.addEventListener('click', () => {
            this.showInstruccionsModal();
            this.closeMobileMenu();
        });
        if (this.elements.closeLoginModal) {
            this.elements.closeLoginModal.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.hideLoginModal === 'function') {
                    this.authManager.hideLoginModal();
                } else {
                    Logger.error('AuthManager no disponible o mètode hideLoginModal no trobat');
                }
            });
        }
        if (this.elements.closeProfileModal) {
            this.elements.closeProfileModal.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.hideProfileModal === 'function') {
                    this.authManager.hideProfileModal();
                } else {
                    Logger.error('AuthManager no disponible o mètode hideProfileModal no trobat');
                }
            });
        }
        // if (this.elements.cancelProfileBtn) {
        //     this.elements.cancelProfileBtn.addEventListener('click', () => {
        //         if (this.authManager && typeof this.authManager.hideProfileModal === 'function') {
        //             this.authManager.hideProfileModal();
        //         } else {
        //             Logger.error('AuthManager no disponible o mètode hideProfileModal no trobat');
        //         }
        //     });
        // }

        // Esdeveniments del teclat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideInfoModal();
                this.hideConfirmModal();
                this.hideInstruccionsModal();
                if (this.authManager) {
                    this.authManager.hideLoginModal();
                    this.authManager.hideProfileModal();
                }
            }
        });

        // Esdeveniments d'autenticació
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => {
                if (this.authManager && typeof this.authManager.handleLogin === 'function') {
                    this.authManager.handleLogin(e);
                } else {
                    Logger.error('AuthManager no disponible o mètode handleLogin no trobat');
                    e.preventDefault();
                }
            });
        }
        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => {
                if (this.authManager && typeof this.authManager.handleRegister === 'function') {
                    this.authManager.handleRegister(e);
                } else {
                    Logger.error('AuthManager no disponible o mètode handleRegister no trobat');
                    e.preventDefault();
                }
            });
        }
        if (this.elements.showRegisterForm) {
            this.elements.showRegisterForm.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.showRegisterForm === 'function') {
                    this.authManager.showRegisterForm();
                } else {
                    Logger.error('AuthManager no disponible o mètode showRegisterForm no trobat');
                }
            });
        }
        if (this.elements.showLoginForm) {
            this.elements.showLoginForm.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.showLoginForm === 'function') {
                    this.authManager.showLoginForm();
                } else {
                    Logger.error('AuthManager no disponible o mètode showLoginForm no trobat');
                }
            });
        }
        
        // Botons de login i logout
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.showLoginModal === 'function') {
                    this.authManager.showLoginModal();
                } else {
                    Logger.error('AuthManager no disponible o mètode showLoginModal no trobat');
                }
            });
        }
        if (this.elements.mobileLoginBtn) {
            this.elements.mobileLoginBtn.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.showLoginModal === 'function') {
                    this.authManager.showLoginModal();
                    this.closeMobileMenu();
                } else {
                    Logger.error('AuthManager no disponible o mètode showLoginModal no trobat');
                }
            });
        }
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.handleLogout === 'function') {
                    this.authManager.handleLogout();
                } else {
                    Logger.error('AuthManager no disponible o mètode handleLogout no trobat');
                }
            });
        }
        if (this.elements.mobileLogoutBtn) {
            this.elements.mobileLogoutBtn.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.handleLogout === 'function') {
                    this.authManager.handleLogout();
                    this.closeMobileMenu();
                } else {
                    Logger.error('AuthManager no disponible o mètode handleLogout no trobat');
                }
            });
        }
        
        // Botons de perfil
        if (this.elements.userName) {
            this.elements.userName.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.showProfileModal === 'function') {
                    this.authManager.showProfileModal();
                } else {
                    Logger.error('AuthManager no disponible o mètode showProfileModal no trobat');
                }
            });
        }
        if (this.elements.mobileUserName) {
            this.elements.mobileUserName.addEventListener('click', () => {
                if (this.authManager && typeof this.authManager.showProfileModal === 'function') {
                    this.authManager.showProfileModal();
                    this.closeMobileMenu();
                } else {
                    Logger.error('AuthManager no disponible o mètode showProfileModal no trobat');
                }
            });
        }
    }

    /**
     * Configura les subscripcions a canvis d'estat.
     */
    _setupStateSubscriptions() {
        if (!this.stateManager || typeof this.stateManager.subscribe !== 'function') {
            Logger.error('UIManager: stateManager no disponible per configurar subscripcions');
            return;
        }

        try {
            this.stateManager.subscribe('user', this._renderAuthState.bind(this));
            this.stateManager.subscribe('user', this.updateGenerateButtonText.bind(this));
            this.stateManager.subscribe('currentReport', this.updateGenerateButtonText.bind(this));
            // Aquesta subscripció ara controlarà TOTES les modals
            this.stateManager.subscribe('ui.modals', this._renderModalState.bind(this));
        } catch (error) {
            Logger.error('UIManager: Error configurant subscripcions d\'estat:', error);
        }
    }

    /**
     * Captura els elements del DOM.
     */
    getElements() {
        // Elements de navegació mòbil
        this.elements.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.elements.mobileNav = document.getElementById('mobile-nav');
        this.elements.navIndicatorLeft = document.getElementById('nav-indicator-left');
        this.elements.navIndicatorRight = document.getElementById('nav-indicator-right');
        
        // Elements de modals
        this.elements.infoModal = document.getElementById('info-modal-overlay');
        this.elements.closeInfoModal = document.getElementById('info-modal-close-btn');
        this.elements.infoModalContent = document.getElementById('info-modal-text');
        
        // Elements de notificacions temporals (check if they exist in HTML, otherwise remove references)
        this.elements.temporaryModal = document.getElementById('temporary-modal');
        this.elements.temporaryModalContent = document.getElementById('temporary-modal-content');
        
        this.elements.confirmModal = document.getElementById('confirm-modal');
        this.elements.closeConfirmModal = document.getElementById('close-confirm-modal');
        this.elements.confirmModalContent = document.getElementById('confirm-modal-content');
        this.elements.confirmModalTitle = document.getElementById('confirm-modal-title');
        this.elements.confirmModalMessage = document.getElementById('confirm-modal-message');
        this.elements.confirmModalYesBtn = document.getElementById('confirm-modal-yes-btn');
        this.elements.confirmModalNoBtn = document.getElementById('confirm-modal-no-btn');
        
        // Els components d'imatge ara gestionen els seus propis elements via Shadow DOM
        
        // Elements d'autenticació
        this.elements.loginBtn = document.getElementById('login-btn');
        this.elements.userInfo = document.getElementById('user-info');
        this.elements.userName = document.getElementById('user-name');
        this.elements.logoutBtn = document.getElementById('logout-btn');
        this.elements.loginModal = document.getElementById('login-modal');
        this.elements.closeLoginModal = document.getElementById('close-login-modal');
        this.elements.loginForm = document.getElementById('login-form');
        this.elements.registerForm = document.getElementById('register-form');
        this.elements.showRegisterForm = document.getElementById('show-register-form');
        this.elements.showLoginForm = document.getElementById('show-login-form');
        this.elements.emailInput = document.getElementById('login-email');
        this.elements.passwordInput = document.getElementById('login-password');
        
        // Elements de perfil
        this.elements.profileModal = document.getElementById('profile-modal');
        this.elements.closeProfileModal = document.getElementById('close-profile-modal');
        this.elements.cancelProfileBtn = document.getElementById('cancel-profile-btn');

        // Elements mòbils d'autenticació
        this.elements.mobileLoginBtn = document.getElementById('mobile-login-btn');
        this.elements.mobileUserInfo = document.getElementById('mobile-user-info');
        this.elements.mobileUserName = document.getElementById('mobile-user-name');
        this.elements.mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        
        // Elements dels botons "Els meus informes"
        this.elements.myReportsBtn = document.getElementById('my-reports-btn');
        this.elements.mobileMyReportsBtn = document.getElementById('mobile-my-reports-btn');
        
        // Altres
        this.elements.generatePdfBtn = document.getElementById('generate-pdf-btn');
        this.elements.mobileGeneratePdfBtn = document.getElementById('mobile-generate-pdf-btn');
        
        // Elements de la modal d'instruccions
        this.elements.instruccionsBtn = document.getElementById('instruccions-btn');
        this.elements.mobileInstruccionsBtn = document.getElementById('mobile-instruccions-btn');
        this.elements.instruccionsModal = document.getElementById('instruccions-modal');
        this.elements.closeInstruccionsModal = document.getElementById('close-instruccions-modal');
    }
    
    /**
     * Configurar sistema de validació de formularis
     */
    setupFormValidation() {
        // Configurar validació per als camps del formulari
        const formFields = ['tipus', 'numero', 'data', 'hora', 'adreca', 'assumpte', 'signants'];
        formFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                            // Validació eliminada - els camps són completament lliures
            }
        });
    }

    /**
     * Configurar menú mòbil
     */
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileNavLinks = document.querySelectorAll('#mobile-nav a');
        
        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuBtn.classList.toggle('active');
                mobileNav.classList.toggle('active');
                // Gestió d'estat del menú mòbil simplificada
        });

            // Tancar menú quan es clica un enllaç
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    mobileNav.classList.remove('active');
                    // Gestió d'estat del menú mòbil simplificada
                });
            });
        }
    }

    /**
     * Configurar gestors de modals
     */
    setupModalHandlers() {
        // Modal d'informació
        if (this.elements.closeInfoModal) {
            this.elements.closeInfoModal.addEventListener('click', () => this.hideInfoModal());
        }
        
        // Modal de confirmació
        if (this.elements.closeConfirmModal) {
            this.elements.closeConfirmModal.addEventListener('click', () => this.hideConfirmModal());
        }
        
        if (this.elements.confirmModalNoBtn) {
            this.elements.confirmModalNoBtn.addEventListener('click', () => this.hideConfirmModal());
        }
        
        // Tancar modals amb Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideInfoModal();
                this.hideConfirmModal();
                this.hideInstruccionsModal();
                if (this.authManager) {
                    this.authManager.hideLoginModal();
                    this.authManager.hideProfileModal();
                }
            }
        });

        // Escoltar esdeveniments de modals
        document.addEventListener('showInfoModal', (event) => {
            this.showInfoModal(event.detail);
        });

        document.addEventListener('hideInfoModal', () => {
            this.hideInfoModal();
        });

        document.addEventListener('showTemporaryModal', (event) => {
            this.showTemporaryModal(event.detail.message, event.detail.duration);
        });

        // Tancar modals d'autenticació
        if (this.elements.closeLoginModal) {
            this.elements.closeLoginModal.addEventListener('click', () => this.authManager.hideLoginModal());
        }
        if (this.elements.closeProfileModal) {
            this.elements.closeProfileModal.addEventListener('click', () => this.authManager.hideProfileModal());
        }
        if (this.elements.cancelProfileBtn) {
            this.elements.cancelProfileBtn.addEventListener('click', () => this.authManager.hideProfileModal());
        }
    }

    /**
     * Configurar event listeners del formulari
     */
    setupFormEventListeners() {
        // Configurar event listeners per als camps del formulari
        FORM_FIELDS.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                            // Validació eliminada - els camps són completament lliures
            }
        });
    }

    /**
     * Obrir menú mòbil
     */
    openMobileMenu() {
        try {
            if (this.elements.mobileMenuBtn) {
                this.elements.mobileMenuBtn.classList.add('active');
            }
            
            if (this.elements.mobileNav) {
                this.elements.mobileNav.classList.add('active');
            }
            
            document.body.style.overflow = 'hidden'; // Prevenir scroll del body
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'open-mobile-menu');
        }
    }

    /**
     * Tancar menú mòbil
     */
    closeMobileMenu() {
        try {
            if (this.elements.mobileMenuBtn) {
                this.elements.mobileMenuBtn.classList.remove('active');
            }
            
            if (this.elements.mobileNav) {
                this.elements.mobileNav.classList.remove('active');
            }
            
            document.body.style.overflow = ''; // Restaurar scroll
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'close-mobile-menu');
        }
    }

    /**
     * Funció estàtica per tancar el menú mòbil des de qualsevol mòdul
     */
    static closeMobileMenuGlobal() {
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
     * Mostrar modal informatiu
     */
    showInfoModal(message) {
        this.stateManager.set('ui.modals.info', {
            visible: true,
            message: message
        });
    }

    /**
     * Amagar modal informatiu
     */
    hideInfoModal() {
        this.stateManager.set('ui.modals.info.visible', false);
    }

    /**
     * Mostrar modal temporal
     */
    showTemporaryModal(message, duration = 3000) {
        this.stateManager.set('ui.modals.temporary', {
            visible: true,
            message: message
        });

        if (duration > 0) {
            setTimeout(() => {
                this.hideTemporaryModal();
            }, duration);
        }
    }

    /**
     * Amagar modal temporal
     */
    hideTemporaryModal() {
        this.stateManager.set('ui.modals.temporary.visible', false);
    }

    /**
     * Mostrar modal de confirmació
     */
    showConfirmModal(title, message, onConfirm, onCancel = null) {
        this.stateManager.set('ui.modals.confirm', {
            visible: true,
            title: title,
            message: message
        });

        if (onConfirm) {
            const confirmHandler = () => {
                onConfirm();
                    this.hideConfirmModal();
                this.elements.confirmModalYesBtn.removeEventListener('click', confirmHandler);
                };
            this.elements.confirmModalYesBtn.addEventListener('click', confirmHandler, { once: true });
            }
            
        if (onCancel) {
            const cancelHandler = () => {
                onCancel();
                    this.hideConfirmModal();
                this.elements.confirmModalNoBtn.removeEventListener('click', cancelHandler);
                };
            this.elements.confirmModalNoBtn.addEventListener('click', cancelHandler, { once: true });
        }
    }


    hideConfirmModal() {
        this.stateManager.set('ui.modals.confirm.visible', false);
    }

    showInstruccionsModal() {
        if (this.elements.instruccionsModal) {
            this.elements.instruccionsModal.style.display = 'flex';
            this.elements.instruccionsModal.classList.add('show');
        }
    }

    hideInstruccionsModal() {
        if (this.elements.instruccionsModal) {
            this.elements.instruccionsModal.style.display = 'none';
            this.elements.instruccionsModal.classList.remove('show');
        }
    }

    /**
     * Mostrar error
     */
    showError(message, context = '') {
        const fullMessage = context ? `${context}: ${message}` : message;
        this.showInfoModal(fullMessage);
        this.notificationManager.error(fullMessage);
    }

    /**
     * Mostrar èxit
     */
    showSuccess(message) {
        this.showTemporaryModal(message, 2000);
        this.notificationManager.success(message);
    }

    /**
     * Mostrar avís
     */
    showWarning(message) {
        this.showTemporaryModal(message, 3000);
        this.notificationManager.warning(message);
    }

    /**
     * Mostrar informació
     */
    showInfo(message) {
        this.showTemporaryModal(message, 2500);
        this.notificationManager.info(message);
    }

    /**
     * Validar el formulari
     */
    validateForm(formData) {
        // Implementar validació si cal
        return true;
    }

    /**
     * Mostrar progrés
     */
    showProgress(message) {
        this.showTemporaryModal(message, 0); // 0 = no auto-hide
    }

    /**
     * Amagar progrés
     */
    hideProgress() {
        this.hideTemporaryModal();
    }

    /**
     * Validar camp de data
     */
    validateDateInput(input) {
        try {
            const value = input.value;
            const validation = ValidationService.validateDate(value);
            if (!validation.isValid) {
                this.showFormError(input, 'Format de data incorrecte. Utilitza AAAA-MM-DD');
            } else {
            this.hideFormError(input);
            }
        } catch (error) {
            ErrorBoundary.handleError(error, { input: input.id }, 'validate-date-input');
            this.notificationManager.error('Error validant la data');
        }
    }

    /**
     * Validar camp d'hora
     */
    validateTimeInput(input) {
        try {
            const value = input.value;
            const validation = ValidationService.validateTime(value);
            if (!validation.isValid) {
                this.showFormError(input, 'Format d\'hora incorrecte. Utilitza HH:MM');
            } else {
            this.hideFormError(input);
            }
        } catch (error) {
            ErrorBoundary.handleError(error, { input: input.id }, 'validate-time-input');
            this.notificationManager.error('Error validant l\'hora');
        }
    }

    /**
     * Mostrar error en un camp de formulari
     */
    showFormError(input, message) {
        input.classList.add('error');
        let errorElement = input.parentNode.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
            errorElement.className = 'field-error';
                input.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
            errorElement.style.display = 'block';
    }

    /**
     * Amagar error d'un camp de formulari
     */
    hideFormError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.style.display = 'none';
        }
    }

    /**
     * Mostrar èxit en un camp de formulari
     */
    showFormSuccess(input, message) {
        input.classList.remove('error');
        input.classList.add('success');
        let successElement = input.parentNode.querySelector('.field-success');
            if (!successElement) {
                successElement = document.createElement('div');
            successElement.className = 'field-success';
                input.parentNode.appendChild(successElement);
            }
            successElement.textContent = message;
            successElement.style.display = 'block';
    }

    /**
     * Amagar èxit d'un camp de formulari
     */
    hideFormSuccess(input) {
        input.classList.remove('is-valid');
    }

    /**
     * Mètode de renderitzat principal per a la UI.
     * Aquest mètode s'executa quan l'estat canvia.
     */
    render() {
        // Podem afegir aquí la lògica de renderitzat global si cal
    }

    /**
     * Actualitzar el text del botó de generar PDF segons l'estat
     */
    updateGenerateButtonText() {
        if (!this.reportManager || typeof this.reportManager.updateGenerateButtonText !== 'function') {
            Logger.error('UIManager: reportManager no disponible o mètode updateGenerateButtonText no trobat');
            return;
        }

        const user = this.stateManager.get('user');
        const reportData = this.stateManager.get('currentReport.data');
        const isAuthenticated = user && user.isAuthenticated;
            
        let text = 'Descarregar'; // Text per defecte
        if (isAuthenticated) {
            if (reportData && reportData.id) {
                text = 'Actualitzar i descarregar';
            } else {
                text = 'Guardar i descarregar';
            }
        }

        // Actualitzar botons
        if (this.elements.generatePdfBtn) {
            this.elements.generatePdfBtn.textContent = text;
        }
        if (this.elements.mobileGeneratePdfBtn) {
            // Mantenir la icona per al botó mòbil
            this.elements.mobileGeneratePdfBtn.innerHTML = `<i class="fas fa-file-pdf"></i> ${text}`;
        }
    }

    /**
     * Configurar drag & drop
     */
    setupDragAndDrop() {
        // Funcions de drag & drop gestionades per DragDropManager
    }

    /**
     * Configurar prevenció global de drag & drop
     */
    setupGlobalDragPrevention() {
        // Funcions de drag & drop gestionades per DragDropManager
    }

    /**
     * Renderitzar estat d'autenticació
     */
    _renderAuthState() {
        try {
            const user = this.stateManager.get('user');
            const isAuthenticated = user && user.isAuthenticated;
            const userData = user && user.data;
            
            // Elements d'escriptori
            if (this.elements.loginBtn) {
                this.elements.loginBtn.style.display = isAuthenticated ? 'none' : 'block';
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = isAuthenticated ? 'block' : 'none';
            }
            
            // Mostrar nom d'usuari
            if (isAuthenticated && userData && this.elements.userName) {
                const displayName = userData.name || userData.email || 'Usuari';
                this.elements.userName.textContent = displayName;
            }
            
            // Elements mòbils
            if (this.elements.mobileLoginBtn) {
                this.elements.mobileLoginBtn.style.display = isAuthenticated ? 'none' : 'block';
            }
            if (this.elements.mobileUserInfo) {
                this.elements.mobileUserInfo.style.display = isAuthenticated ? 'flex' : 'none';
            }
            
            // Mostrar nom d'usuari mòbil
            if (isAuthenticated && userData && this.elements.mobileUserName) {
                const mobileDisplayName = userData.name || userData.email || 'Usuari';
                this.elements.mobileUserName.textContent = mobileDisplayName;
            }
            
            // Mostrar/amagar botons "Els meus informes"
            if (this.elements.myReportsBtn) {
                this.elements.myReportsBtn.style.display = isAuthenticated ? 'block' : 'none';
            }
            
        } catch (error) {
            Logger.error('Error renderitzant estat d\'autenticació:', error);
        }
    }

    /**
     * Renderitzar estat de les modals
     */
    _renderModalState() {
        if (!this.stateManager || typeof this.stateManager.get !== 'function') {
            Logger.error('UIManager: stateManager no disponible per renderitzar estat de modals');
            return;
        }

        try {
            const modalState = this.stateManager.get('ui.modals');
            if (!modalState) return;

            // Modal de login
            if (modalState.login !== undefined) {
                const loginModal = this.elements.loginModal;
                if (loginModal) {
                    if (modalState.login) {
                        loginModal.style.display = 'flex';
                        loginModal.classList.add('show');
                    } else {
                        loginModal.style.display = 'none';
                        loginModal.classList.remove('show');
                    }
                }
            }

            // Modal de perfil
            if (modalState.profile !== undefined) {
                const profileModal = this.elements.profileModal;
                if (profileModal) {
                    if (modalState.profile) {
                        profileModal.style.display = 'flex';
                        profileModal.classList.add('show');
                    } else {
                        profileModal.style.display = 'none';
                        profileModal.classList.remove('show');
                    }
                }
            }

            // Modal d'informació
            if (modalState.info && modalState.info.visible !== undefined) {
                const infoModal = this.elements.infoModal;
                if (infoModal) {
                    if (modalState.info.visible) {
                        if (this.elements.infoModalContent) {
                            this.elements.infoModalContent.textContent = modalState.info.message || '';
                        }
                        infoModal.style.display = 'flex';
                        infoModal.classList.add('show');
                    } else {
                        infoModal.style.display = 'none';
                        infoModal.classList.remove('show');
                    }
                }
            }

            // Modal de confirmació
            if (modalState.confirm && modalState.confirm.visible !== undefined) {
                const confirmModal = this.elements.confirmModal;
                if (confirmModal) {
                    if (modalState.confirm.visible) {
                        if (this.elements.confirmModalTitle) {
                            this.elements.confirmModalTitle.textContent = modalState.confirm.title || 'Confirmació';
                        }
                        if (this.elements.confirmModalMessage) {
                            this.elements.confirmModalMessage.textContent = modalState.confirm.message || '';
                        }
                        confirmModal.style.display = 'flex';
                        confirmModal.classList.add('show');
                    } else {
                        confirmModal.style.display = 'none';
                        confirmModal.classList.remove('show');
                    }
                }
            }
        } catch (error) {
            Logger.error('UIManager: Error renderitzant estat de modals:', error);
    }
}

    /**
     * Neteja d'event listeners
     */
    cleanup() {
        // Eliminar event listeners per evitar memory leaks
    }
} 