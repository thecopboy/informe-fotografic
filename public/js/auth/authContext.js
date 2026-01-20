/**
 * Context d'autenticació per gestionar l'estat global de l'usuari
 */

import { authService } from './authService.js';
import { Logger } from '../utils/errorHandler.js';

export class AuthContext {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.isLoading = false;
        this.listeners = [];
        
        // Inicialitzar estat
        this.init();
    }

    /**
     * Inicialitzar el context
     */
    async init() {
        this.isLoading = true;
        this.notifyListeners();

        try {
            if (authService.isAuthenticated()) {
                // Verificar si el token és vàlid
                const user = await authService.getCurrentUser();
                this.setUser(user);
            }
        } catch (error) {
            Logger.warn('Error en inicialitzar autenticació:', error);
            // Netejar dades invàlides
            authService.logout();
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Login d'usuari
     * @param {string} email - Email de l'usuari
     * @param {string} password - Password de l'usuari
     * @returns {Promise<Object>} Dades de l'usuari
     */
    async login(email, password) {
        this.isLoading = true;
        this.notifyListeners();

        try {
            const result = await authService.login(email, password);
            this.setUser(result.user);
            return result;
        } catch (error) {
            throw error;
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Registre d'usuari
     * @param {Object} userData - Dades de l'usuari
     * @returns {Promise<Object>} Resultat del registre
     */
    async register(userData) {
        this.isLoading = true;
        this.notifyListeners();

        try {
            const result = await authService.register(userData);
            return result;
        } catch (error) {
            throw error;
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Logout d'usuari
     */
    async logout() {
        this.isLoading = true;
        this.notifyListeners();

        try {
            await authService.logout();
            this.clearUser();
            // Netejar estat d'informe i formulari
            const formManager = window.app?.formManager;
            if (formManager && typeof formManager.handleReset === 'function') {
                formManager.handleReset();
            }
        } catch (error) {
            Logger.error('Error en logout:', error);
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Establir usuari
     * @param {Object} user - Dades de l'usuari
     */
    setUser(user) {
        this.user = user;
        this.isAuthenticated = !!user;
        this.notifyListeners();
    }

    /**
     * Netejar usuari
     */
    clearUser() {
        this.user = null;
        this.isAuthenticated = false;
        this.notifyListeners();
    }

    /**
     * Obtenir usuari actual
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Verificar si l'usuari està autenticat
     * @returns {boolean}
     */
    getIsAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Verificar si està carregant
     * @returns {boolean}
     */
    getIsLoading() {
        return this.isLoading;
    }

    /**
     * Verificar si l'usuari té un rol específic
     * @param {string} role - Rol a verificar
     * @returns {boolean}
     */
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    /**
     * Verificar si l'usuari és admin
     * @returns {boolean}
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Afegir listener per a canvis d'estat
     * @param {Function} listener - Funció a cridar quan canviï l'estat
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Eliminar listener
     * @param {Function} listener - Listener a eliminar
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notificar a tots els listeners
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener({
                    user: this.user,
                    isAuthenticated: this.isAuthenticated,
                    isLoading: this.isLoading
                });
            } catch (error) {
                Logger.error('Error en listener d\'autenticació:', error);
            }
        });
    }

    /**
     * Refrescar dades de l'usuari
     * @returns {Promise<Object>} Dades actualitzades
     */
    async refreshUser() {
        try {
            const user = await authService.getCurrentUser();
            this.setUser(user);
            return user;
        } catch (error) {
            Logger.error('Error en refrescar usuari:', error);
            throw error;
        }
    }
}

// Crear instància singleton
export const authContext = new AuthContext();

// Exportar funcions de conveniència
export const useAuth = () => ({
    user: authContext.getCurrentUser(),
    isAuthenticated: authContext.getIsAuthenticated(),
    isLoading: authContext.getIsLoading(),
    login: authContext.login.bind(authContext),
    logout: authContext.logout.bind(authContext),
    register: authContext.register.bind(authContext),
    hasRole: authContext.hasRole.bind(authContext),
    isAdmin: authContext.isAdmin.bind(authContext)
}); 