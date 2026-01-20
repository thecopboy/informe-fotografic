import { Logger } from '../utils/errorHandler.js';

class LoadingModalManager {
    constructor() {
        this.modal = document.getElementById('loading-modal');
        this.messageElement = document.getElementById('loading-message');
        this.closeButton = document.getElementById('close-loading-modal');

        if (!this.modal) {
            Logger.error('Error: La modal de càrrega amb ID \'loading-modal\' no s\'ha trobat.');
            return;
        }
        if (!this.messageElement) {
            Logger.error('Error: L\'element de missatge amb ID \'loading-message\' no s\'ha trobat dins de la modal de càrrega.');
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }

        // Assegurar que la modal estigui inicialment oculta
        this.hide();
    }

    /**
     * Mostra la modal de càrrega amb un missatge i títol opcionals.
     * @param {string} message - El missatge a mostrar a la modal. Si no es proporciona, es fa servir un missatge per defecte.
     */
    show(message = 'Carregant...') {
        if (this.modal) {
            this.messageElement.textContent = message;
            this.modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    /**
     * Oculta la modal de càrrega.
     */
    hide() {
        if (this.modal) {
            this.modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }
}

export default LoadingModalManager;