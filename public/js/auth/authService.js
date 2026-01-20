/**
 * Servei d'autenticació per gestionar login, registre i tokens
 */

import { NotificationManager } from '../modules/notificationManager.js';
import { Logger } from '../utils/errorHandler.js';

export class AuthService {
    constructor() {
        this.baseURL = '/api/auth';
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    /**
     * Registre d'un nou usuari
     * @param {Object} userData - Dades de l'usuari
     * @returns {Promise<Object>} Resposta del servidor
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el registre');
            }

            return data;
        } catch (error) {
            throw new Error(`Error en registrar usuari: ${error.message}`);
        }
    }

    /**
     * Login d'usuari
     * @param {string} email - Email de l'usuari
     * @param {string} password - Password de l'usuari
     * @returns {Promise<Object>} Dades de l'usuari i tokens
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el login');
            }

            // Guardar tokens i dades d'usuari
            this.setTokens(data.accessToken, data.refreshToken);
            this.setUser(data.user);

            return data.user;
        } catch (error) {
            throw new Error(`Error en login: ${error.message}`);
        }
    }

    /**
     * Logout d'usuari
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await fetch(`${this.baseURL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            Logger.warn('Error en logout al servidor:', error);
        } finally {
            // Sempre netejar dades locals
            this.clearTokens();
            this.clearUser();
        }
    }

    /**
     * Obtenir dades de l'usuari autenticat
     * @returns {Promise<Object>} Dades de l'usuari
     */
    async getCurrentUser() {
        try {
            // Verificar que hi ha un token abans de fer la petició
            if (!this.accessToken) {
                throw new Error('No hi ha token d\'accés');
            }

            const response = await fetch(`${this.baseURL}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                }
            });

            if (!response.ok) {
                return await this._handleAuthError(response, () => this.getCurrentUser());
            }

            const user = await response.json();
            this.setUser(user);
            return user;
        } catch (error) {
            // Si és un error de xarxa o altre, no netejar les dades
            if (error.message.includes('Sessió expirada') || error.message.includes('No hi ha token')) {
                throw error;
            }
            throw new Error(`Error en obtenir usuari: ${error.message}`);
        }
    }

    /**
     * Obtenir perfil complet de l'usuari
     * @returns {Promise<Object>} Perfil de l'usuari
     */
    async getProfile() {
        try {
            if (!this.accessToken) {
                throw new Error('No hi ha token d\'accés');
            }

            const response = await fetch(`/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                }
            });

            if (!response.ok) {
                return await this._handleAuthError(response, () => this.getProfile());
            }

            const profile = await response.json();
            return profile;
        } catch (error) {
            if (error.message.includes('Sessió expirada') || error.message.includes('No hi ha token')) {
                throw error;
            }
            throw new Error(`Error en obtenir perfil: ${error.message}`);
        }
    }

    /**
     * Actualitzar perfil de l'usuari
     * @param {Object} profileData - Dades del perfil a actualitzar
     * @returns {Promise<Object>} Perfil actualitzat
     */
    async updateProfile(profileData) {
        try {
            if (!this.accessToken) {
                throw new Error('No hi ha token d\'accés');
            }

            const response = await fetch(`/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                return await this._handleAuthError(response, () => this.updateProfile(profileData));
            }

            const updatedProfile = await response.json();
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error en actualitzar perfil: ${response.status}`);
            }

            return updatedProfile;
        } catch (error) {
            if (error.message.includes('Sessió expirada') || error.message.includes('No hi ha token')) {
                throw error;
            }
            throw new Error(`Error en actualitzar perfil: ${error.message}`);
        }
    }

    /**
     * Gestiona errors d'autenticació (401), intenta refrescar el token i reintenta la petició.
     * @param {Response} response - La resposta original del fetch.
     * @param {Function} retryCallback - La funció a executar per reintentar la petició.
     * @returns {Promise<any>} El resultat de la petició reintentada.
     * @private
     */
    async _handleAuthError(response, retryCallback) {
        if (response.status === 401) {
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
                this.clearTokens();
                this.clearUser();
                throw new Error('Sessió expirada');
            }
            // Reintentar la petició original
            return await retryCallback();
        }
        
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        throw new Error(errorData.error || `Error en la petició: ${response.status}`);
    }

    /**
     * Refrescar token d'accés
     * @returns {Promise<boolean>} True si s'ha refrescat correctament
     */
    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                return false;
            }

            const response = await fetch(`${this.baseURL}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            this.setTokens(data.accessToken, this.refreshToken);
            return true;
        } catch (error) {
            Logger.error('Error en refrescar token:', error);
            return false;
        }
    }

    /**
     * Verificar si l'usuari està autenticat
     * @returns {boolean}
     */
    isAuthenticated() {
        // Verificar que hi ha token i usuari
        if (!this.accessToken || !this.user) {
            return false;
        }
        
        // Verificar que el token no està buit
        if (this.accessToken.trim() === '') {
            return false;
        }
        
        // Verificar que el token és vàlid
        return this.isTokenValid();
    }

    /**
     * Obtenir l'usuari actual
     * @returns {Object|null}
     */
    getCurrentUserSync() {
        return this.user;
    }

    /**
     * Obtenir el token d'accés
     * @returns {string|null}
     */
    getAccessToken() {
        return this.accessToken;
    }

    /**
     * Guardar tokens
     * @param {string} accessToken - Token d'accés
     * @param {string} refreshToken - Token de refresc
     */
    setTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    /**
     * Guardar dades d'usuari
     * @param {Object} user - Dades de l'usuari
     */
    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Netejar tokens
     */
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    /**
     * Netejar dades d'usuari
     */
    clearUser() {
        this.user = null;
        localStorage.removeItem('user');
    }

    /**
     * Crear headers amb autorització
     * @returns {Object} Headers per a peticions
     */
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Verificar si el token és vàlid (sense fer petició al servidor)
     * @returns {boolean}
     */
    isTokenValid() {
        if (!this.accessToken) return false;
        
        try {
            const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            // Verificar que el token no ha expirat
            return payload.exp > now;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verificar si el token està a punt d'expirar
     * @returns {boolean}
     */
    isTokenExpiringSoon() {
        if (!this.accessToken) return false;
        
        try {
            const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const threshold = 10 * 60; // 10 minuts (més conservador per tokens d'1 hora)
            
            return (payload.exp - now) <= threshold;
        } catch (error) {
            return false;
        }
    }

    /**
     * Renovar automàticament el token si està a punt d'expirar
     * @returns {Promise<boolean>} True si s'ha renovat correctament
     */
    async autoRefreshToken() {
        if (this.isTokenExpiringSoon()) {
            Logger.info('Token a punt d\'expirar, renovant automàticament...');
            return await this.refreshAccessToken();
        }
        return true;
    }

    /**
     * Configurar renovació automàtica del token
     * @param {number} checkInterval - Interval de comprovació en minuts (per defecte 5)
     */
    setupAutoRefresh(checkInterval = 5) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.autoRefreshInterval = setInterval(async () => {
            if (this.isAuthenticated()) {
                await this.autoRefreshToken();
            }
        }, checkInterval * 60 * 1000); // Convertir minuts a mil·lisegons
    }

    /**
     * Aturar la renovació automàtica del token
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    async getReports() {
        if (!this.accessToken) {
            throw new Error('No hi ha token d\'accés');
        }
        const response = await fetch('/api/reports', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('No s\'han pogut carregar els informes');
        return await response.json();
    }

    async getReport(reportId) {
        if (!this.accessToken) {
            throw new Error('No hi ha token d\'accés');
        }
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('No s\'ha pogut carregar l\'informe');
        return await response.json();
    }

    async deleteReport(reportId) {
        if (!this.accessToken) {
            throw new Error('No hi ha token d\'accés');
        }
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('No s\'ha pogut eliminar l\'informe');
        return await response.json();
    }

    /**
     * Actualitzar informe
     * @param {string} reportId - ID de l'informe
     * @param {object} reportData - Dades de l'informe
     * @returns {Promise<object>} - Resposta del servidor
     */
    async updateReport(reportId, reportData) {
        if (!this.accessToken) {
            throw new Error('No hi ha token d\'accés');
        }
        
        try {
            const response = await fetch(`/api/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error actualitzant informe: ${errorText}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            Logger.error('Error actualitzant informe:', error);
            throw error;
        }
    }
}

// Crear instància singleton
export const authService = new AuthService(); 