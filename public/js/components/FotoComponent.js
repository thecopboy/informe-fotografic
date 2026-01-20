/**
 * Web Component natiu per a mostrar una foto i les seves dades.
 * S'utilitza com a <foto-component></foto-component>
 */

import { DataSanitizer } from '../utils/sanitizer.js';
import { ValidationService } from '../utils/validationService.js';
import { Logger } from '../utils/errorHandler.js';

class FotoComponent extends HTMLElement {
    constructor() {
        super();
        // Creem un Shadow DOM per encapsular els estils i l'estructura
        this.attachShadow({ mode: 'open' });
        this.isActive = true; // Estat per defecte
        this.titol = ''; // Títol per defecte
        this._currentRenderedUrl = null; // Per rastrejar la URL blob actualment en ús
        this._activeListeners = new Map(); // NOU: Mapa per rastrejar els event listeners actius
        // Configuració inicial del component
    }

    connectedCallback() {
        // És més segur establir atributs que es reflecteixen al DOM (com draggable)
        // un cop l'element està connectat al document. Això soluciona l'error.
        this.draggable = true;
    }

    /**
     * Mètode per passar les dades al component un cop creat.
     * @param {object} data - Objecte amb les dades de la imatge.
     * @param {File} data.file - L'objecte File de la imatge.
     * @param {number} data.number - El número seqüencial del component.
     * @param {string} data.originalName - El nom original del fitxer (opcional).
     * @param {string} data.titol - El títol de la foto (opcional).
     * @param {string} data.descripcio - La descripció de la foto (opcional).
     */
    setData({ id, file, number, originalName, titol, descripcio, isActive }) {
        this.id = id;
        this.file = file; // Guardem l'objecte File real
        this.number = number;
        // this.imageUrl = imageUrl; // Ja no es passa directament, es genera des del file
        this.originalName = originalName || file.name; // Guardem el nom original
        this.titol = titol || ''; // Guardem el títol
        this.descripcio = descripcio || ''; // Guardem la descripció
        this.isActive = isActive !== undefined ? isActive : true; // Guardem l'estat actiu/inactiu
        this._render(); // Forcem el render que generarà la URL blob
        this._addEventListeners();
        // Eliminada la lògica de visibilitat condicional del botó clear-title-button
    }

    /**
     * Retorna les dades actuals del component.
     * @returns {{number: number, titol: string, foto: string, descripcio: string, isActive: boolean, rotation: number, format: string, originalName: string}}
     */
    getData() {
        // Accedim als inputs, assegurant-nos que existeixen abans d'intentar llegir-ne el valor.
        const titleInput = this.shadowRoot.querySelector('.image-title-input');
        const descriptionTextarea = this.shadowRoot.querySelector('.image-description');
        
        // Si els inputs no estan encara renderitzats al Shadow DOM (per a un component nou),
        // utilitzem les propietats internes del component com a valors de fallback.
        const title = titleInput ? titleInput.value : this.titol;
        const descripcio = descriptionTextarea ? descriptionTextarea.value : this.descripcio;
        
        // Cache per evitar validacions repetides
        const titleKey = `${title}_${this._lastTitleValidation || ''}`;
        const descKey = `${descripcio}_${this._lastDescValidation || ''}`;
        
        let sanitizedTitle, sanitizedDesc;
        
        // Validar títol només si ha canviat
        if (titleKey !== this._lastTitleKey) {
            sanitizedTitle = ValidationService.validateAndSanitizePhotoTitle(title).sanitized;
            this._lastTitleValidation = sanitizedTitle;
            this._lastTitleKey = titleKey;
        } else {
            sanitizedTitle = this._lastTitleValidation;
        }
        
        // Validar descripció només si ha canviat
        if (descKey !== this._lastDescKey) {
            sanitizedDesc = DataSanitizer.sanitizeText(descripcio);
            this._lastDescValidation = sanitizedDesc;
            this._lastDescKey = descKey;
        } else {
            sanitizedDesc = this._lastDescValidation;
        }
        
        return {
            id: this.id,
            number: this.number,
            titol: sanitizedTitle,
            foto: this._currentRenderedUrl, // Ara retornem la URL blob actualment renderitzada
            descripcio: sanitizedDesc,
            isActive: this.isActive, // Llegim l'estat intern
            format: this.file ? this.file.type : '', // Afegim el tipus MIME de la imatge (ex: 'image/jpeg')
            originalName: DataSanitizer.sanitizeFileName(this.originalName), // Utilitzem DataSanitizer
            file: this.file // IMPORTANT: Retornem també l'objecte File original
        };
    }

    /**
     * Actualitza el número del component de manera eficient.
     * Aquest mètode és necessari per a la funcionalitat de reordenació.
     * @param {number} newNumber - El nou número a mostrar.
     */
    updateNumber(newNumber) {
        this.number = newNumber;
        // Actualitzem només el text del número per no perdre l'estat (p.ex. el text de la descripció)
        const numberSpan = this.shadowRoot.querySelector('.image-number');
        if (numberSpan) {
            numberSpan.textContent = `${newNumber}.`;
        }
    }

    // Mètode públic per actualitzar el títol
    updateTitle(nouTitol) {
        this.titol = nouTitol;
        const input = this.shadowRoot.querySelector('.image-title-input');
        if (input) input.value = nouTitol;
    }

    // Mètode públic per actualitzar la descripció
    updateDescription(novaDescripcio) {
        this.descripcio = novaDescripcio;
        const textarea = this.shadowRoot.querySelector('.image-description');
        if (textarea) textarea.value = novaDescripcio;
    }

    // Mètode públic per actualitzar l'estat actiu/inactiu
    setActive(isActive) {
        this.isActive = isActive;
        const btn = this.shadowRoot.querySelector('.toggle-button');
        if (btn) {
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('inactive', !isActive);
            btn.textContent = isActive ? 'Actiu' : 'Inactiu';
        }
    }

    // Mètode públic per actualitzar la rotació
    async updateRotation(degrees) {
        await this._rotateImage(degrees);
    }

    /**
     * Neteja recursos del component (cridar quan s'elimina)
     */
    cleanup() {
        // Revocar URLs d'objectes per evitar fuites de memòria de forma SÍNCRONA
        if (this._currentRenderedUrl && this._currentRenderedUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this._currentRenderedUrl);
            this._currentRenderedUrl = null; // Netejar la referència
        }
        
        // Netejar canvas de rotació
        if (this._rotationCanvas) {
            this._rotationCanvas.width = 0;
            this._rotationCanvas.height = 0;
            this._rotationCanvas = null;
        }
        
        // Netejar cache de validacions
        this._lastTitleValidation = null;
        this._lastTitleKey = null;
        this._lastDescValidation = null;
        this._lastDescKey = null;

        // NOU: Eliminar listeners en cleanup
        this._removeExistingEventListeners(); 
    }

    _render() {
        // Definim els estils encapsulats dins del Shadow DOM
        const style = `
            :host {
                display: block;
                border: 1px solid #ccc;
                border-radius: 8px;
                padding: 15px;
                background-color: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                width: 280px;
                box-sizing: border-box;
                /* Estils per a l'arrossegament */
                cursor: grab;
            }
            :host(:active) {
                cursor: grabbing;
            }
            .image-component-header {
                display: flex; justify-content: space-between; width: 100%;
                margin-bottom: 10px; font-weight: bold; color: #333; font-size: 0.95em;
            }
            .image-number { margin-right: 10px; }
            .title-container {
                display: flex;
                align-items: center;
                flex: 1;
                gap: 5px;
                min-width: 0; /* Important per permetre que el contenidor s'encongeixi correctament */
            }
            .image-title-input {
                flex: 1; /* Permet créixer i encongir-se de manera flexible, amb base de 0% per omplir l'espai */
                border: 1px solid transparent; /* Borde invisible per mantenir l'alineació */
                background-color: transparent;
                font-weight: bold;
                color: #333;
                font-size: 0.95em;
                text-align: right;
                padding: 2px 5px;
                border-radius: 4px;
                transition: background-color 0.2s, border-color 0.2s;
                min-width: 0; /* Important per al flexbox i l'overflow */
                font-family: sans-serif; /* Assegura consistència de la font */
                box-sizing: border-box; /* Assegura que padding i border s'incloguin en l'amplada */
            }
            .image-title-input:hover {
                border-color: #ddd;
            }
            .image-title-input:focus {
                outline: none;
                background-color: #f9f9f9;
                border-color: #00539C; /* Blau policia per consistència */
            }
            .clear-title-button {
                margin-right: 5px;
                background: none;
                border: none;
                cursor: pointer;
                color: silver;
                font-size: 1.2rem;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
                min-width: 20px;
                min-height: 20px;
                flex-shrink: 0; /* Impedeix que el botó es redueixi */
            }
            .clear-title-button:hover {
                background-color: lightgray;
                color: darkgray;
            }

            .clear-title-button:active {
                background-color: lightgray; 
                color: red;
            }

            /* Temporal: fer el botó sempre visible per testejar */
            .clear-title-button {
                display: flex !important;
            }
            .thumbnail-container {
                width: 200px; /* Amplada fixa per a un quadre */
                height: 200px; /* Alçada fixa per a un quadre */
                display: flex; justify-content: center; align-items: center;
                overflow: hidden; margin: 0 auto 15px auto; /* Centrat horitzontalment i marge inferior */
                border: 1px solid #eee; border-radius: 4px; background-color: #fff;
            }
            .thumbnail-container img {
                width: 100%; height: 100%; 
                object-fit: contain; /* La imatge cobrirà el contenidor, retallant si cal */
                /* La rotació ara s'aplica a la imatge real, no amb CSS */
            }
            .image-description {
                width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
                font-family: sans-serif; font-size: 0.9em; box-sizing: border-box;
                resize: vertical; min-height: 90px; max-height: 180px; overflow-y: auto; margin-bottom: 15px; line-height: 1.5;
                background-color: #f9f9f9;
            }
            .actions-container {
                width: 100%;
                display: flex;
                justify-content: space-between; /* Espai entre el botó Actiu/Inactiu i les icones */
                align-items: center;
            }
            .toggle-button {
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-size: 0.9em;
            }
            .toggle-button.active { background-color: #28a745; }
            .toggle-button.inactive { background-color: #dc3545; }

            /* Estils per al modal de confirmació */
            .confirmation-modal-overlay {
                position: fixed; /* Ocupa tota la pantalla */
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: rgba(0, 0, 0, 0.6); /* Fons semitransparent */
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000; /* Assegura que estigui per sobre de tot */
                opacity: 0; /* Actualment no interactuable */
                visibility: hidden; /* Actualment no interactuable */
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .confirmation-modal-overlay.visible {
                opacity: 1;
                visibility: visible;
            }
            .confirmation-modal-content {
                background-color: white;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 350px;
                width: 90%;
                color: #333;
            }
            .confirmation-modal-content p {
                margin-bottom: 20px;
                font-size: 1.1em;
            }
            .modal-buttons {
                display: flex;
                justify-content: space-around;
                gap: 10px;
            }
            .modal-button {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.2s ease;
            }
            .modal-button.cancel { background-color: #f0f0f0; color: #333; }
            .modal-button.cancel:hover { background-color: #e0e0e0; }
            .modal-button.confirm { background-color: #dc3545; color: white; }
            .modal-button.confirm:hover { background-color: #c82333; }

            /* Estils per al modal de visualització d'imatge */
            .image-modal-overlay {
                position: fixed; /* Ocupa tota la pantalla */
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: rgba(0, 0, 0, 0.6); /* Fons fosc semitransparent */
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000; /* Per sobre del modal de confirmació */
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                cursor: pointer; /* Indica que es pot clicar per tancar */
            }
            .image-modal-overlay.visible {
                opacity: 1;
                visibility: visible;
            }
            .modal-image {
                max-width: 90vw; /* Ocupa el 90% de l'amplada del viewport */
                max-height: 90vh; /* Ocupa el 90% de l'alçada del viewport */
                object-fit: contain; /* Manté la relació d'aspecte */
                border-radius: 5px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                /* El cursor canvia a default per indicar que la imatge no fa res més */
                cursor: default;
            }

            .icon-actions {
                display: flex;
                align-items: center;
                gap: 8px; /* Espai entre les icones d'acció */
            }

            .action-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%; /* Botons circulars */
                transition: background-color 0.2s ease;
            }

            .action-button:hover {
                background-color: #f0f0f0; /* Fons gris clar al passar el ratolí */
            }

            .action-button svg {
                width: 24px; height: 24px;
                fill: #888; transition: fill 0.2s ease;
            }

            .action-button:hover svg {
                fill: #333; /* Icona més fosca al passar el ratolí */
            }

            /* Per al botó d'eliminar, fem que la icona es torni vermella en passar el ratolí */
            .delete-button:hover svg {
                fill: #dc3545; /* Vermell per a acció destructiva */
            }

            /* Estil per al component que és un objectiu d'arrossegament */
            :host(.drag-over-target) {
                border: 2px dashed #00539C; /* Blau policia */
                background-color: #e9f5ff; /* Fons blau clar */
            }
        `;

        // Crear una URL de blob per a la imatge del component just abans de renderitzar
        if (this.file) {
            // Revocar l'URL anterior si existeix abans de crear una nova
            if (this._currentRenderedUrl && this._currentRenderedUrl.startsWith('blob:')) {
                URL.revokeObjectURL(this._currentRenderedUrl);
            }
            this._currentRenderedUrl = URL.createObjectURL(this.file);
        } else {
            this._currentRenderedUrl = ''; // Si no hi ha fitxer, no hi ha URL
        }

        // Definim l'estructura HTML del component
        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="image-component-header">
                <span class="image-number">${this.number}.</span>
                <div class="title-container">
                    <input type="text" class="image-title-input" value="${this.titol || ''}" title="Fes clic per editar el títol">
                    <button class="clear-title-button" aria-label="Netejar títol" title="Netejar títol">x</button>
                </div>
            </div>
            <div class="thumbnail-container">
                <img id="thumbnail-image" src="${this._currentRenderedUrl}" alt="Miniatura de ${this.file?.name || this.originalName || 'imatge'}">
            </div>
            <textarea class="image-description" placeholder="Descripció de la foto (opcional)" rows="3">${this.descripcio || ''}</textarea>
            <div class="actions-container">
                <button class="toggle-button ${this.isActive ? 'active' : 'inactive'}">
                    ${this.isActive ? 'Actiu' : 'Inactiu'}
                </button>
                <div class="icon-actions">
                
                    <button class="action-button view-button" aria-label="Veure imatge completa" title="Veure imatge completa">
                        <svg width="20mm" height="20mm" version="1.1" viewBox="0 0 20 20" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.024038 0 0 .024038 -2.3077 -2.3077)"><path d="m128 448c-17.7 0-32-14.3-32-32v-224c0-53 43-96 96-96h224c17.7 0 32 14.3 32 32s-14.3 32-32 32h-224c-17.7 0-32 14.3-32 32v224c0 17.7-14.3 32-32 32zm768 0c-17.7 0-32-14.3-32-32v-224c0-17.7-14.3-32-32-32h-224c-17.7 0-32-14.3-32-32s14.3-32 32-32h224c53 0 96 43 96 96v224c0 17.7-14.3 32-32 32zm-768 128c-17.7 0-32 14.3-32 32v224c0 53 43 96 96 96h224c17.7 0 32-14.3 32-32s-14.3-32-32-32h-224c-17.7 0-32-14.3-32-32v-224c0-17.7-14.3-32-32-32zm768 0c-17.7 0-32 14.3-32 32v224c0 17.7-14.3 32-32 32h-224c-17.7 0-32 14.3-32 32s14.3 32 32 32h224c53 0 96-43 96-96v-224c0-17.7-14.3-32-32-32z"/></g></svg>
                    </button>
                    <button class="action-button rotate-left-button" aria-label="Girar a l'esquerra" title="Girar a l'esquerra">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C20.36 11.23 16.76 8 12.5 8z"/></svg>
                    </button>
                    <button class="action-button rotate-right-button" aria-label="Girar a la dreta" title="Girar a la dreta">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 8c2.65 0 5.05.99 6.9 2.6l3.6-3.6V16h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C3.64 11.23 7.24 8 11.5 8z"/></svg>
                    </button>
                    <button class="action-button delete-button" aria-label="Eliminar foto" title="Eliminar foto">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>

            <!-- Modal de confirmació -->
            <div class="confirmation-modal-overlay">
                <div class="confirmation-modal-content">
                    <p>Estàs segur que vols eliminar aquesta fotografia?</p>
                    <div class="modal-buttons">
                        <button class="modal-button cancel">Cancel·lar</button>
                        <button class="modal-button confirm">Eliminar</button>
                    </div>
                </div>
            </div>

            <!-- Modal de visualització d'imatge -->
            <div class="image-modal-overlay">
                <img src="${this._currentRenderedUrl}" alt="Visualització de la imatge" class="modal-image">
            </div>
        `;
    }

    _addEventListeners() {
        // NOU: Eliminar els event listeners existents abans d'afegir-ne de nous
        this._removeExistingEventListeners();

        const titleInput = this.shadowRoot.querySelector('.image-title-input');
        const clearTitleButton = this.shadowRoot.querySelector('.clear-title-button');
        const descriptionTextarea = this.shadowRoot.querySelector('.image-description');
        const toggleButton = this.shadowRoot.querySelector('.toggle-button');
        const deleteButton = this.shadowRoot.querySelector('.delete-button');
        const viewButton = this.shadowRoot.querySelector('.view-button');
        const rotateLeftButton = this.shadowRoot.querySelector('.rotate-left-button');
        const rotateRightButton = this.shadowRoot.querySelector('.rotate-right-button');
        const thumbnailImage = this.shadowRoot.querySelector('#thumbnail-image');
        const confirmationModal = this.shadowRoot.querySelector('.confirmation-modal-overlay');
        const confirmDeleteButton = this.shadowRoot.querySelector('.modal-button.confirm');
        const cancelDeleteButton = this.shadowRoot.querySelector('.modal-button.cancel');
        const imageModal = this.shadowRoot.querySelector('.image-modal-overlay');
        const modalImage = this.shadowRoot.querySelector('.modal-image');

        // NOU: Funció helper per afegir event listeners i emmagatzemar-los
        const addListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
                if (!this._activeListeners.has(element)) {
                    this._activeListeners.set(element, []);
                }
                this._activeListeners.get(element).push({ event, handler });
            }
        };

        const dispatchUpdate = () => {
            this.dispatchEvent(new CustomEvent('component-updated', {
                detail: this.getData(),
                bubbles: true,
                composed: true
            }));
        };

        // Funció per actualitzar la visibilitat del botó de netejar títol
        const updateClearButtonVisibility = () => {
            if (clearTitleButton) {
                // El botó X ha d'estar sempre visible
                clearTitleButton.classList.remove('hidden');
            }
        };

        // Event listeners per als inputs - s'activen quan surts del camp (blur)
        addListener(titleInput, 'blur', dispatchUpdate);
        addListener(titleInput, 'input', updateClearButtonVisibility);
        addListener(descriptionTextarea, 'blur', dispatchUpdate);

        // Inicialitzar la visibilitat del botó
        setTimeout(() => {
            updateClearButtonVisibility();
        }, 0);

        // Event listeners immediats per a accions que no afecten el text
        addListener(toggleButton, 'click', () => {
            // Canviem l'estat intern
            this.isActive = !this.isActive;

            // Actualitzem l'aparença del botó
            toggleButton.textContent = this.isActive ? 'Actiu' : 'Inactiu';
            toggleButton.classList.toggle('active', this.isActive);
            toggleButton.classList.toggle('inactive', !this.isActive);

            // Notifiquem el canvi immediatament
            this.dispatchEvent(new CustomEvent('component-updated', {
                detail: this.getData(),
                bubbles: true,
                composed: true
            }));
        });

        // Lògica per netejar el títol
        if (clearTitleButton) {
            addListener(clearTitleButton, 'click', (event) => {
                event.stopPropagation(); // Evitem que s'activi el drag
                if (event.ctrlKey) {
                    // Dispara un event global per demanar el borrat de tots els títols
                    this.dispatchEvent(new CustomEvent('clear-all-titles-requested', {
                        bubbles: true,
                        composed: true
                    }));
                } else {
                    titleInput.value = '';
                    dispatchUpdate();
                }
            });
        }

        // Lògica per rotar la imatge
        addListener(rotateLeftButton, 'click', () => {
            this._rotateImage(-90);
        });

        addListener(rotateRightButton, 'click', () => {
            this._rotateImage(90);
        });

        // Quan es clica el botó de paperera, mostrem el modal
        addListener(deleteButton, 'click', (event) => {
            // Aturem la propagació per evitar que s'activi el 'drag' de l'element pare
            event.stopPropagation();
            confirmationModal.classList.add('visible');
        });

        // Lògica per al modal de visualització d'imatge
        addListener(viewButton, 'click', (event) => {
            event.stopPropagation(); // Evitem que s'activi el drag
            if (modalImage && this.file) {
                // Revocar URL anterior del modal si existeix
                if (modalImage.src.startsWith('blob:')) {
                    URL.revokeObjectURL(modalImage.src);
                }
                // Generar una nova URL per al modal d'imatge
                modalImage.src = URL.createObjectURL(this.file);
            }
            imageModal.classList.add('visible');
        });

        // Tanquem el modal en fer clic a qualsevol lloc (fons o imatge)
        addListener(imageModal, 'click', () => {
            imageModal.classList.remove('visible');
            // Revocar la URL de la imatge del modal quan es tanca
            if (modalImage && modalImage.src.startsWith('blob:')) {
                URL.revokeObjectURL(modalImage.src);
                modalImage.src = ''; // Netejar el src per evitar un error 404
            }
        });

        // Quan es clica Cancel·lar al modal, l'amaguem
        addListener(cancelDeleteButton, 'click', () => {
            confirmationModal.classList.remove('visible');
        });

        // Quan es clica Eliminar al modal, amaguem el modal i enviem l'esdeveniment
        addListener(confirmDeleteButton, 'click', () => {
            confirmationModal.classList.remove('visible');
            // Enviem un esdeveniment per notificar que aquest component vol ser eliminat
            this.dispatchEvent(new CustomEvent('component-deleted', {
                bubbles: true, // Permet que l'esdeveniment pugi pel DOM
                composed: true // Permet que l'esdeveniment surti del Shadow DOM
            }));
        });
    }

    // NOU: Mètode per eliminar tots els event listeners registrats
    _removeExistingEventListeners() {
        this._activeListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this._activeListeners.clear();
    }

    /**
     * Gira la imatge real utilitzant un canvas i actualitza la URL de dades.
     * Aquest mètode és asíncron perquè la càrrega de la imatge ho és.
     * @param {number} degrees - Graus de rotació (ex: 90, -90).
     */
    async _rotateImage(degrees) {
        const image = new Image();
        // Usar l'objecte File real com a font
        if (!this.file) {
            Logger.error("No hi ha objecte File per girar la imatge.");
            return;
        }
        // Crear una URL temporal per carregar la imatge al canvas
        const tempImageUrl = URL.createObjectURL(this.file);
        image.src = tempImageUrl;

        // Esperem que la imatge original es carregui en memòria
        await new Promise(resolve => image.onload = () => {
            URL.revokeObjectURL(tempImageUrl); // Revocar URL temporal un cop carregada
            resolve();
        });

        // Reutilitzar canvas si existeix, sinó crear-ne un de nou
        let canvas = this._rotationCanvas;
        if (!canvas) {
            canvas = document.createElement('canvas');
            this._rotationCanvas = canvas;
        }
        
        const ctx = canvas.getContext('2d');

        // Quan girem 90 o 270 graus, les dimensions s'intercanvien
        const isSideways = Math.abs(degrees % 180) === 90;
        if (isSideways) {
            canvas.width = image.height;
            canvas.height = image.width;
        } else {
            canvas.width = image.width;
            canvas.height = image.height;
        }

        // Movem el punt de pivot al centre del canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Rotem el context
        ctx.rotate(degrees * Math.PI / 180);
        // Dibuixem la imatge centrada (per això restem la meitat de l'amplada/alçada)
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        // Obtenim la nova imatge com a Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, this.file.type));
        const newFile = new File([blob], this.file.name, { type: this.file.type });
        
        // Actualitzem l'objecte File del component amb la nova imatge rotada
        this.file = newFile;
        
        // Re-renderitzem el component per mostrar la nova imatge
        this._render();

        // Re-afegim els event listeners als nous elements del DOM
        this._addEventListeners();

        // Notifiquem el canvi a l'aplicació principal
        this.dispatchEvent(new CustomEvent('component-updated', {
            detail: { ...this.getData(), file: newFile }, // Passar el nou File en l'esdeveniment
            bubbles: true,
            composed: true
        }));
    }
}

// Registrem el nostre Web Component perquè el navegador el reconegui
customElements.define('foto-component', FotoComponent);
