/**
 * Sistema de gestió d'errors robust per a l'aplicació
 * Inclou Error Boundary, logging i gestió d'errors amigable
 */

/**
 * Utilitats per detectar l'entorn d'execució
 */
export class EnvironmentUtils {
    /**
     * Comprova si estem en mode desenvolupament
     * @returns {boolean} True si estem en desenvolupament
     */
    static isDevelopment() {
        return typeof window !== 'undefined' && window.location && (
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.port === '33333'
        );
    }

    /**
     * Comprova si estem en mode producció
     * @returns {boolean} True si estem en producció
     */
    static isProduction() {
        return !this.isDevelopment();
    }

    /**
     * Comprova si estem en un entorn de test
     * @returns {boolean} True si estem en test
     */
    static isTest() {
        return typeof window === 'undefined' || typeof localStorage === 'undefined';
    }
}

export class ErrorBoundary {
    /**
     * Configura els gestors d'errors globals per capturar errors no controlats
     */
    static configure() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), {
                source,
                lineno,
                colno
            }, 'global-onerror');
            return true; // Prevenir que l'error es mostri a la consola
        };

        window.onunhandledrejection = (event) => {
            this.handleError(event.reason || new Error('Unhandled promise rejection'), {}, 'global-onunhandledrejection');
            event.preventDefault(); // Prevenir que l'error es mostri a la consola
        };
    }
    
    /**
     * Captura i gestiona errors de manera centralitzada
     * @param {Error} error - L'error capturat
     * @param {Object} errorInfo - Informació addicional de l'error
     * @param {string} context - Context on s'ha produït l'error
     */
    static handleError(error, errorInfo = {}, context = 'unknown') {
        // Logging detallat de l'error
        console.error(`[ERROR] Context: ${context}`, {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...errorInfo
        });

        // Enviar a servei de logging (en producció)
        this.sendToLoggingService(error, errorInfo, context);

        // Mostrar missatge amigable a l'usuari
        this.showUserFriendlyError(error, context);
    }

    /**
     * Envia l'error a un servei de logging (simulat)
     * @param {Error} error - L'error
     * @param {Object} errorInfo - Informació addicional
     * @param {string} context - Context de l'error
     */
    static sendToLoggingService(error, errorInfo, context) {
        // En desenvolupament, només loggejem a consola
        if (EnvironmentUtils.isDevelopment()) {
            return;
        }

        // En producció, enviaríem a un servei real
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...errorInfo
        };

        // Simular enviament a servei de logging
        fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData)
        }).catch(() => {
            // Si falla l'enviament, guardar localment
            this.saveErrorLocally(errorData);
        });
    }

    /**
     * Guarda l'error localment si no es pot enviar al servei
     * @param {Object} errorData - Dades de l'error
     */
    static saveErrorLocally(errorData) {
        try {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.push(errorData);
            // Mantenir només els últims 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            localStorage.setItem('app_errors', JSON.stringify(errors));
        } catch (e) {
            console.error('No s\'ha pogut guardar l\'error localment:', e);
        }
    }

    /**
     * Mostra un missatge d'error amigable a l'usuari
     * @param {Error} error - L'error
     * @param {string} context - Context de l'error
     */
    static showUserFriendlyError(error, context) {
        // Crear missatge amigable segons el tipus d'error
        const userMessage = this.getUserFriendlyMessage(error, context);
        
        // Mostrar error via console (ErrorModal eliminat)
        console.error(`[ERROR] ${userMessage}`, {
                error: error,
                context: context
        });
    }

    /**
     * Converteix errors tècnics en missatges amigables
     * @param {Error} error - L'error tècnic
     * @param {string} context - Context de l'error
     * @returns {string} Missatge amigable
     */
    static getUserFriendlyMessage(error, context) {
        const errorMessages = {
            'NetworkError': 'Hi ha hagut un problema de connexió. Comprova la teva connexió a internet.',
            'TypeError': 'Hi ha hagut un problema amb les dades. Si us plau, torna-ho a provar.',
            'ReferenceError': 'Hi ha hagut un problema tècnic. Recarrega la pàgina.',
            'RangeError': 'Les dades són massa grans. Prova amb fitxers més petits.',
            'SyntaxError': 'Hi ha hagut un problema amb el format de les dades.',
            'default': 'S\'ha produït un error inesperat. Si us plau, torna-ho a provar.'
        };

        // Missatges específics per context
        const contextMessages = {
            'file-upload': 'Hi ha hagut un problema en pujar el fitxer. Comprova que el format sigui correcte.',
            'pdf-generation': 'Hi ha hagut un problema en generar el PDF. Comprova que totes les dades siguin correctes.',
            'json-save': 'Hi ha hagut un problema en guardar les dades. Torna-ho a provar.',
            'json-load': 'Hi ha hagut un problema en carregar les dades. Comprova que el fitxer sigui vàlid.',
            'form-validation': 'Hi ha dades que no són correctes. Comprova tots els camps obligatoris.',
            'image-processing': 'Hi ha hagut un problema en processar la imatge. Prova amb una altra imatge.'
        };

        // Retornar missatge específic del context o del tipus d'error
        return contextMessages[context] || 
               errorMessages[error.name] || 
               errorMessages.default;
    }

    // Mètodes safeExecute eliminats - no s'utilitzaven
}

/**
 * Logger per a diferents nivells de logging
 */
export class Logger {
    static info(message, data = {}) {
        if (EnvironmentUtils.isDevelopment()) {
            console.log(`[INFO] ${message}`, data);
        }
        this.logToStorage('info', message, data);
    }

    static warn(message, data = {}) {
        if (EnvironmentUtils.isDevelopment()) {
            console.warn(`[WARN] ${message}`, data);
        }
        this.logToStorage('warn', message, data);
    }

    static error(message, error = null) {
        console.error(`[ERROR] ${message}`, error);
        this.logToStorage('error', message, error);
    }

    static debug(message, data = {}) {
        // Només mostrar logs de debug en desenvolupament
        if (EnvironmentUtils.isDevelopment()) {
            console.debug(`[DEBUG] ${message}`, data);
        }
    }

    /**
     * Guarda logs a localStorage per debugging
     * @param {string} level - Nivell del log
     * @param {string} message - Missatge
     * @param {any} data - Dades addicionals
     */
    static logToStorage(level, message, data) {
        try {
            if (EnvironmentUtils.isTest()) {
                return; // No localStorage en entorn de test
            }
            
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            logs.push({
                level,
                message,
                data,
                timestamp: new Date().toISOString()
            });
            
            // Mantenir només els últims 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('app_logs', JSON.stringify(logs));
        } catch (e) {
            console.error('No s\'ha pogut guardar el log:', e);
        }
    }
}

// ErrorUtils eliminat - no s'utilitzava 