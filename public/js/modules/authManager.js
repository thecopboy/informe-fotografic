/**
 * Mòdul de gestió d'autenticació
 * Centralitza tota la lògica relacionada amb autenticació d'usuaris
 */

import { authService } from '../auth/authService.js';
import { ValidationService } from '../utils/validationService.js';
import { ErrorBoundary } from '../utils/errorHandler.js';
import { NotificationManager } from './notificationManager.js';
import { FormManager } from './formManager.js';
import { FileService } from '../utils/fileService.js';
import { StateManager } from './stateManager.js';
import { Logger } from '../utils/errorHandler.js';

// Afegim gestió d'escut de perfil com a File a l'stateManager

export class AuthManager {
    constructor(stateManager, notificationManager, formManager, reportManager = null) {
        this.stateManager = stateManager;
        this.notificationManager = notificationManager;
        this.formManager = formManager;
        this.reportManager = reportManager;
        this.lastAuthCheck = 0;
        this.currentProfileShield = null;
        this.currentProfileBackground = null;
        this.currentProfileSignature = null; // Nou: per a la imatge de signatura del perfil
        this.isUpdatingProfile = false; // Flag per evitar múltiples crides simultànies
    }

    /**
     * Inicialitzar el mòdul
     */
    async init() {
        await this.checkAuthStatus();
    }

    /**
     * Mostrar modal de login
     */
    showLoginModal() {
        this.stateManager.set('ui.modals.login', true);
    }

    /**
     * Amagar modal de login
     */
    hideLoginModal() {
        this.stateManager.set('ui.modals.login', false);
    }

    /**
     * Mostrar formulari de registre
     */
    showRegisterForm() {
        // Aquesta lògica ara es podria gestionar dins d'un component de formulari més complex
        // o mantenir-se al UIManager. Per ara, la deixem aquí per simplicitat,
        // ja que no depèn de l'estat global, sinó de l'estat intern del modal.
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm && registerForm) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    /**
     * Mostrar formulari de login
     */
    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm && registerForm) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        }
    }

    /**
     * Gestionar inici de sessió
     */
    async handleLogin(event) {
        event.preventDefault();
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const user = await authService.login(email, password);
            if (user) {
                this.notificationManager.success('Sessió iniciada correctament');
                this.stateManager.set('user', { isAuthenticated: true, data: user });
                this.hideLoginModal();
                await this.loadUserDefaults(true);
            }
        } catch (error) {
            this.notificationManager.error(error.message || 'Error en iniciar sessió');
        }
    }

    /**
     * Gestionar registre
     */
    async handleRegister(event) {
        event.preventDefault();
        try {
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const username = document.getElementById('register-username').value;
            const validation = ValidationService.validatePassword(password);
            if (!validation.isValid) {
                this.notificationManager.error(validation.message);
                return;
            }
            const user = await authService.register({ email, password, username });
            if (user) {
                this.notificationManager.success('Compte creat! Ara pots iniciar sessió.');
                // Neteja els camps després del registre
                document.getElementById('register-form').reset();
                this.showLoginForm(); // Mostra el formulari de login automàticament
            }
        } catch (error) {
            this.notificationManager.error(error.message || 'Error en el registre');
        }
    }

    /**
     * Gestionar tancament de sessió
     */
    async handleLogout() {
        try {
            await authService.logout();
            this.stateManager.set('user', { isAuthenticated: false, data: null });
            
            // Netejar els camps del formulari de login
            this.clearLoginForm();

            // Netejar dades d'usuari local
            authService.clearUser();

            // Netejar informe en memòria
            if (this.reportManager && typeof this.reportManager.handleNewReport === 'function') {
                this.reportManager.handleNewReport();
            }

            this.notificationManager.success('Sessió tancada correctament');
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'logout-handler');
            this.notificationManager.error('Error en tancar la sessió');
        }
    }

    /**
     * Netejar els camps del formulari de login
     */
    clearLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const inputs = loginForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
        }
    }

    /**
     * Comprovar l'estat d'autenticació
     */
    async checkAuthStatus() {
        const now = Date.now();
        if (now - this.lastAuthCheck < 5000) { // Evitar crides massa freqüents
                return;
            }
        this.lastAuthCheck = now;
            
        try {
            // Primer comprovar si hi ha tokens locals vàlids
            if (authService.isAuthenticated()) {
                // Intentar obtenir les dades de l'usuari del servidor
                const userData = await authService.getCurrentUser();
                if (userData) {
                    this.stateManager.set('user', { isAuthenticated: true, data: userData });
                    await this.loadUserDefaults(false);
                    return;
                }
            }
            
            // Si no hi ha tokens vàlids o no es poden obtenir dades, marcar com no autenticat
            this.stateManager.set('user', { isAuthenticated: false, data: null });
        } catch (error) {
            Logger.warn('Error comprovant estat d\'autenticació:', error);
            this.stateManager.set('user', { isAuthenticated: false, data: null });
        }
    }

    /**
     * Carregar valors per defecte de l'usuari al formulari
     */
    async loadUserDefaults(force = false) {
        try {
            const user = this.stateManager.get('user.data');
            
            if (!user) return; // No hi ha usuari, no es fa res

            let profile = user;
            
            // Si les dades de l'usuari no tenen signants o escut, es carrega el perfil complet
            if (force || !user.signants || !user.shield) {
                try {
                    profile = await authService.getProfile();
                    this.stateManager.set('user.data', profile); // Actualitza l'estat amb el perfil complet
                } catch (error) {
                    Logger.warn("No s'ha pogut carregar el perfil complet, s'utilitzen les dades d'usuari existents.");
                }
            }
            
            if (!profile) return;

            const currentFormData = { ...this.stateManager.get('formData') };
            let hasChanges = false;
            
            // Carregar signants per defecte si el camp està buit
            if (profile.signants && !currentFormData.signants) {
                currentFormData.signants = profile.signants;
                hasChanges = true;
            }
            
            // Actualitzar formData si hi ha hagut canvis
            if (hasChanges) {
                this.stateManager.set('formData', currentFormData);
                this.formManager.renderFormFromState(); // Assegurem que la UI es refresca
            }
    
            // Carregar escut per defecte si no hi ha cap escut carregat
            if (profile.shield && !this.stateManager.get('shield.file')) {
                const file = FileService.base64ToFile(profile.shield, 'escut_perfil.jpg');
                this.stateManager.set('shield', {
                    file: file,
                    url: URL.createObjectURL(file)
                });
            }
            
            // Carregar imatge de fons per defecte si no hi ha cap imatge carregada
            if (profile.backgroundImage && !this.stateManager.get('backgroundImage.file')) {
                const file = FileService.base64ToFile(profile.backgroundImage, 'background_perfil.jpg');
                this.stateManager.set('backgroundImage', {
                    file: file,
                    url: URL.createObjectURL(file)
                });
            }
            
            // Carregar imatge de signatura per defecte si no hi ha cap imatge carregada
            if (profile.signatureImage && !this.stateManager.get('signatureImage.file')) {
                const file = FileService.base64ToFile(profile.signatureImage, 'signature_perfil.png');
                
                this.stateManager.withStateUpdate(() => {
                    this.stateManager.set('user.data.signatureImage', {
                        file: file,
                        url: URL.createObjectURL(file)
                    });
                }, 'load-user-defaults-signature');
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'load-user-defaults');
            this.notificationManager.error('Error en carregar les dades de l\'usuari');
        }
    }

    /**
     * Mostrar modal de perfil
     */
    showProfileModal() {
        this.stateManager.set('ui.modals.profile', true);
        this.loadUserProfile();
        // Netejar els camps de contrasenya per seguretat
        this.clearProfilePasswordFields();
        // Configurar validació de contrasenya
        this.setupProfilePasswordValidation();
        // Configurar event listeners del perfil (incloent drag & drop de l'escut)
        this.setupProfileEventListeners();
    }

    /**
     * Amagar modal de perfil
     */
    hideProfileModal() {
        this.stateManager.set('ui.modals.profile', false);
        // Netejar els camps de contrasenya quan es tanca el modal
        this.clearProfilePasswordFields();
    }

    /**
     * Carregar perfil d'usuari
     */
    async loadUserProfile() {
        try {
            const profile = await authService.getProfile();
            if (profile) {
                
                // Actualitzar els camps del modal
                const profileEmail = document.getElementById('profile-email');
                const profileUsername = document.getElementById('profile-username');
                const profileSignants = document.getElementById('profile-signants');
                
                if (profileEmail) profileEmail.value = profile.email || '';
                // Provar tant 'name' com 'username' per al nom d'usuari
                if (profileUsername) profileUsername.value = profile.name || profile.username || '';
                if (profileSignants) profileSignants.value = profile.signants || '';
                
                // Carregar escut si existeix
                if (profile.shield) {
                    this.loadProfileShield(profile.shield);
                }
                
                // Carregar imatge de fons si existeix
                if (profile.backgroundImage) {
                    this.loadProfileBackground(profile.backgroundImage);
                }
                
                // Carregar imatge de signatura si existeix
                if (profile.signatureImage) {
                    this.loadProfileSignature(profile.signatureImage);
                }
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'load-user-profile');
        }
    }

    /**
     * Carregar escut del perfil
     */
    loadProfileShield(shieldBase64) {
        try {
            const shieldFile = FileService.base64ToFile(shieldBase64, 'escut_perfil.jpg');
            this.currentProfileShield = shieldFile;
            
            // Utilitzar el nou component
            const profileShieldComponent = document.getElementById('profile-shield-upload');
            if (profileShieldComponent) {
                profileShieldComponent.setFile(shieldFile);
            }
        } catch (error) {
            Logger.error('Error carregant escut del perfil:', error);
        }
    }

    /**
     * Carregar imatge de fons del perfil
     */
    loadProfileBackground(backgroundBase64) {
        try {
            const backgroundFile = FileService.base64ToFile(backgroundBase64, 'background_perfil.jpg');
            this.currentProfileBackground = backgroundFile;
            
            // Utilitzar el nou component
            const profileBackgroundComponent = document.getElementById('profile-background-upload');
            if (profileBackgroundComponent) {
                profileBackgroundComponent.setFile(backgroundFile);
            }
        } catch (error) {
            Logger.error('Error carregant imatge de fons del perfil:', error);
        }
    }

    /**
     * Carregar imatge de signatura del perfil
     */
    loadProfileSignature(signatureBase64) {
        try {
            const signatureFile = FileService.base64ToFile(signatureBase64, 'signature_perfil.png');
            this.currentProfileSignature = signatureFile;
            
            this.stateManager.withStateUpdate(() => {
                this.stateManager.set('user.data.signatureImage', {
                    file: signatureFile,
                    url: URL.createObjectURL(signatureFile)
                });
            }, 'load-profile-signature');
            
            const profileSignatureComponent = document.getElementById('profile-signature-upload');
            if (profileSignatureComponent) {
                profileSignatureComponent.setFile(signatureFile);
            }
        } catch (error) {
            Logger.error('Error carregant imatge de signatura del perfil:', error);
        }
    }

    /**
     * Gestionar actualització del perfil
     */
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        // Evitar múltiples crides simultànies
        if (this.isUpdatingProfile) {
            return;
        }
        
        this.isUpdatingProfile = true;
        
        // Deshabilitar el botó de submit
        const submitBtn = document.getElementById('profile-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardant...';
        }
        
        try {
            const profileEmail = document.getElementById('profile-email');
            const profileUsername = document.getElementById('profile-username');
            const profileSignants = document.getElementById('profile-signants');
            const currentPassword = document.getElementById('profile-current-password');
            const newPassword = document.getElementById('profile-new-password');
            const confirmPassword = document.getElementById('profile-confirm-password');
            
            const profileData = {};
            
            if (profileEmail) profileData.email = profileEmail.value;
            // Enviar com a 'name' segons l'atribut name del HTML
            if (profileUsername) profileData.name = profileUsername.value;
            if (profileSignants) profileData.signants = profileSignants.value;
            
            // Validar canvi de contrasenya si s'ha introduït alguna cosa als camps de contrasenya
            const hasPasswordFields = (currentPassword && currentPassword.value.trim() !== '') || 
                                    (newPassword && newPassword.value.trim() !== '') || 
                                    (confirmPassword && confirmPassword.value.trim() !== '');
            
            if (hasPasswordFields) {
                // Si s'ha tocat qualsevol camp de contrasenya, validar tots
                if (!currentPassword || currentPassword.value.trim() === '') {
                    this.notificationManager.error('Has d\'introduir la contrasenya actual per canviar-la');
                    return;
                }
                
                if (!newPassword || newPassword.value.trim() === '') {
                    this.notificationManager.error('Has d\'introduir la nova contrasenya');
                    return;
                }
                
                if (!confirmPassword || confirmPassword.value.trim() === '') {
                    this.notificationManager.error('Has de confirmar la nova contrasenya');
                    return;
                }
                
                // Validar que les contrasenyes coincideixen
                if (newPassword.value !== confirmPassword.value) {
                    this.notificationManager.error('Les contrasenyes no coincideixen');
                    return;
                }
                
                // Validar força de la nova contrasenya
                const passwordValidation = ValidationService.validatePassword(newPassword.value);
                if (!passwordValidation.isValid) {
                    this.notificationManager.error(`Nova contrasenya no vàlida: ${passwordValidation.errors.join(', ')}`);
                    return;
                }
                
                // Afegir contrasenyes a les dades del perfil
                profileData.currentPassword = currentPassword.value;
                profileData.newPassword = newPassword.value;
                profileData.confirmPassword = confirmPassword.value;
            }
            
            // Obtenir fitxers dels components
            const profileShieldComponent = document.getElementById('profile-shield-upload');
            const profileBackgroundComponent = document.getElementById('profile-background-upload');
            const profileSignatureComponent = document.getElementById('profile-signature-upload'); // Nou: component de signatura
            
            // Convertir escut a base64 si existeix
            if (profileShieldComponent && profileShieldComponent.getFile()) {
                profileData.shield = await FileService.fileToBase64(profileShieldComponent.getFile());
            }
            
            // Convertir imatge de fons a base64 si existeix
            if (profileBackgroundComponent && profileBackgroundComponent.getFile()) {
                profileData.backgroundImage = await FileService.fileToBase64(profileBackgroundComponent.getFile());
            }

            // Convertir imatge de signatura a base64 si existeix
            if (profileSignatureComponent && profileSignatureComponent.getFile()) {
                profileData.signatureImage = await FileService.fileToBase64(profileSignatureComponent.getFile());
            }
            
            const response = await authService.updateProfile(profileData);
            
            if (response) {
                
                // Extreure les dades de l'usuari de la resposta
                const updatedUserData = response.user || response;
                
                this.notificationManager.success('Perfil actualitzat correctament');
                this.stateManager.set('ui.modals.profile', false);
                // Actualitzar dades de l'usuari a l'estat
                this.stateManager.set('user.data', updatedUserData);
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'profile-update');
            this.notificationManager.error(error.message || 'Error en actualitzar el perfil');
        } finally {
            // Rehabilitar el botó de submit
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Canvis';
            }
            
            // Reset del flag
            this.isUpdatingProfile = false;
        }
    }

    /**
     * Configurar event listeners per al modal de perfil
     */
    setupProfileEventListeners() {
        // Event listener per al formulari de perfil
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            // Netejar event listeners anteriors per evitar duplicats
            const newForm = profileForm.cloneNode(true);
            profileForm.parentNode.replaceChild(newForm, profileForm);
            
            // Registrar el nou event listener per al formulari
            newForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));

            // Registrar event listener per al botó de cancel·lar
            const cancelButton = newForm.querySelector('#cancel-profile-btn');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => this.hideProfileModal());
            }
        }
        
        // Els components d'imatge del perfil ara gestionen els seus propis events via ImageComponentManager
        // No cal configurar event listeners aquí
    }

    /**
     * Configurar validació de contrasenya del perfil
     */
    setupProfilePasswordValidation() {
        const newPasswordInput = document.getElementById('profile-new-password');
        const strengthFill = document.querySelector('#profile-password-strength .strength-fill');
        const strengthText = document.querySelector('#profile-password-strength .strength-text');
        
        if (newPasswordInput && strengthFill && strengthText) {
            newPasswordInput.addEventListener('input', () => {
                const password = newPasswordInput.value;
                if (password.length > 0) {
                    this.updatePasswordStrength(password, strengthFill, strengthText);
                } else {
                    // Resetar indicador si no hi ha contrasenya
                    strengthFill.style.width = '0%';
                    strengthText.textContent = 'Força de la contrasenya';
                }
            });
        }
    }

    /**
     * Guardar escut del perfil
     */
    async saveProfileShield(base64Data) {
        // Aquesta funció podria desar l'escut al servidor si fos necessari
        // De moment, només el guardem a l'estat
        return Promise.resolve();
    }

    /**
     * Actualitzar la barra de força de la contrasenya
     */
    updatePasswordStrength(password, strengthFill, strengthText) {
        const validation = ValidationService.validatePassword(password);
        let percent = 0;
        let text = '';
        let color = '';

        // El ValidationService retorna strength (0-5), no score
        if (validation.strength >= 5) {
            percent = 100;
            text = 'Molt Forta';
            color = '#2ecc71';
        } else if (validation.strength === 4) {
            percent = 80;
            text = 'Forta';
            color = '#27ae60';
        } else if (validation.strength === 3) {
            percent = 60;
            text = 'Normal';
            color = '#f1c40f';
        } else if (validation.strength === 2) {
            percent = 40;
            text = 'Dèbil';
            color = '#e67e22';
        } else if (validation.strength === 1) {
            percent = 20;
            text = 'Molt Dèbil';
            color = '#e74c3c';
        } else {
            percent = 10;
            text = 'Molt Dèbil';
            color = '#e74c3c';
        }

        if (strengthFill) {
            strengthFill.style.width = `${percent}%`;
            strengthFill.style.backgroundColor = color;
        }
        if (strengthText) {
            strengthText.textContent = text;
        }
    }

    /**
     * Netejar els camps de contrasenya del perfil
     */
    clearProfilePasswordFields() {
        try {
            const currentPassword = document.getElementById('profile-current-password');
            const newPassword = document.getElementById('profile-new-password');
            const confirmPassword = document.getElementById('profile-confirm-password');
            
            if (currentPassword) currentPassword.value = '';
            if (newPassword) newPassword.value = '';
            if (confirmPassword) confirmPassword.value = '';
            
        } catch (error) {
            Logger.warn('Error netejant els camps de contrasenya del perfil:', error);
        }
    }
}

// L'export de la instància singleton s'ha eliminat.
// La instanciació serà gestionada per la classe App. 