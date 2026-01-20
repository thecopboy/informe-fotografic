/**
 * Mòdul de gestió d'estat
 * Centralitza l'estat de l'aplicació i la lògica de subscripció.
 */
import { ErrorBoundary, Logger } from '../utils/errorHandler.js';

export class StateManager {
    constructor() {
        this.state = {};
        this.listeners = {}; // Canviat a un objecte per gestionar oients per camí
        this.globalListeners = []; // Per a oients que escolten tot
    }

    init() {
        this.state = this._getInitialState();
        this._logStateChange("initialization", this.state);
    }

    _getInitialState() {
        return {
            shield: {
                file: null,
                url: null,
            },
            backgroundImage: {
                file: null,
                url: null,
            },
            photos: [],
            formData: {},
            user: {
                isAuthenticated: false,
                data: null,
                token: null,
            },
            currentReport: {
                id: null,
                isEditing: false,
                data: null,
            },
            ui: {
                debugMode: false, // Controla els logs de state
                stateUpdate: {
                    isUpdating: false,
                    operation: null,
                    timestamp: null
                },
                modals: {
                    login: false,
                    profile: false,
                    info: {
                        visible: false,
                        message: ''
                    },
                    confirm: {
                        visible: false,
                        title: '',
                        message: ''
                    },
                    temporary: {
                        visible: false,
                        message: ''
                    },
                    mobileMenu: false,
            }
            }
        };
    }

    /**
     * Subscriu un oient a un camí específic de l'estat o a tots els canvis.
     * @param {string|Function} pathOrListener - El camí de l'estat (p.ex., 'formData') o la funció de l'oient si és global.
     * @param {Function} [listener] - La funció de l'oient si s'especifica un camí.
     * @returns {Function} Una funció per donar-se de baixa.
     */
    subscribe(pathOrListener, listener) {
        if (typeof pathOrListener === 'function') {
            // Subscripció global
            const globalListener = pathOrListener;
            this.globalListeners.push(globalListener);
            return () => {
                const index = this.globalListeners.indexOf(globalListener);
                if (index > -1) {
                    this.globalListeners.splice(index, 1);
    }
            };
        }

        // Subscripció per camí
        const path = pathOrListener;
        if (typeof listener !== 'function') {
            const error = new TypeError('Attempted to subscribe with a non-function listener.');
            ErrorBoundary.handleError(error, { path, listener }, 'state-subscription');
            return () => {}; // Retorna una funció buida per evitar errors
        }

        if (!this.listeners[path]) {
            this.listeners[path] = [];
        }
        this.listeners[path].push(listener);

        return () => {
            if (this.listeners[path]) {
                const index = this.listeners[path].indexOf(listener);
            if (index > -1) {
                    this.listeners[path].splice(index, 1);
                }
            }
        };
    }

    /**
     * Estableix un valor en un camí de l'estat.
     * @param {string} path - El camí per actualitzar (p.ex., 'formData.client').
     * @param {*} value - El nou valor.
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        const finalKey = keys[keys.length - 1];
        const oldValue = current[finalKey];

        // Sempre actualitzar si el valor és diferent per referència o si és un array
        const shouldUpdate = oldValue !== value || Array.isArray(value);

        if (shouldUpdate) {
            current[finalKey] = value;
            this._logStateChange(`set: ${path}`, value);
            this.notifyListeners(path, oldValue, value);
            }
    }

    /**
     * Obté un valor de l'estat.
     * @param {string} path - El camí del valor a obtenir (p.ex., 'formData.client').
     * @returns {any} El valor de la propietat.
     */
    get(path) {
        if (!path) return this.state;
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Notifica els oients d'un canvi en l'estat.
     * @param {string} path - El camí que ha canviat.
     * @param {*} oldValue - El valor antic.
     * @param {*} newValue - El valor nou.
     */
    notifyListeners(path, oldValue, newValue) {
        try {
            // Notificar oients específics del camí
            Object.keys(this.listeners).forEach(listenerPath => {
                if (path.startsWith(listenerPath)) {
                    this.listeners[listenerPath].forEach(listener => {
                        try {
                            listener(this.get(listenerPath), this.state);
                        } catch (error) {
                            ErrorBoundary.handleError(error, { listenerPath }, 'state-listener-execution');
                        }
        });
    }
            });

            // Notificar oients globals
            this.globalListeners.forEach(listener => {
                 try {
                    listener(this.state, path, oldValue, newValue);
                 } catch(error) {
                    ErrorBoundary.handleError(error, {}, 'state-global-listener-execution');
                 }
            });
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'state-notification');
        }
    }
    
    /**
     * Registra un canvi d'estat a la consola si el mode de depuració està activat.
     * @param {string} action - L'acció que ha provocat el canvi.
     * @param {*} payload - Les dades associades al canvi.
     */
    _logStateChange(action, payload) {
        if (this.get('ui.debugMode')) {
            Logger.info(`[STATE_CHANGE] Action: ${action}`, {
                payload,
                timestamp: new Date().toLocaleTimeString(),
                newState: JSON.parse(JSON.stringify(this.state)) // Deep copy for logging
            });
        }
    }

    /**
     * Marca que s'està carregant des de l'estat (per evitar bucles)
     * @param {string} operation - L'operació que s'està realitzant
     */
    startStateUpdate(operation = 'unknown') {
        this.set('ui.stateUpdate', { 
            isUpdating: true, 
            operation, 
            timestamp: Date.now() 
        });
    }

    /**
     * Marca que s'ha acabat de carregar des de l'estat
     */
    endStateUpdate() {
        this.set('ui.stateUpdate', { 
            isUpdating: false, 
            operation: null, 
            timestamp: null 
        });
    }

    /**
     * Comprova si s'està carregant des de l'estat
     * @returns {boolean} True si s'està carregant
     */
    isUpdatingFromState() {
        const stateUpdate = this.get('ui.stateUpdate');
        return stateUpdate && stateUpdate.isUpdating;
    }

    /**
     * Executa una funció amb protecció contra bucles d'estat
     * @param {Function} fn - La funció a executar
     * @param {string} operation - L'operació que s'està realitzant
     * @returns {*} El resultat de la funció
     */
    withStateUpdate(fn, operation = 'unknown') {
        try {
            this.startStateUpdate(operation);
            return fn();
        } finally {
            this.endStateUpdate();
        }
    }
} 