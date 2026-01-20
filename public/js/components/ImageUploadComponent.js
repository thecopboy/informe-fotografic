/**
 * Web Component per a càrrega d'imatges unificat
 * Reemplaça els components d'escut i imatge de fons amb un sol component reutilitzable
 */

import { DragDropMixin } from '../utils/dragDropMixin.js';
import { Logger } from '../utils/errorHandler.js';

export class ImageUploadComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.file = null;
        this.previewUrl = '';
        this.eventListenersSetup = false; // Flag per evitar configuració múltiple
        
        // Atributs per defecte
        this.title = this.getAttribute('title') || 'Imatge';
        this.placeholder = this.getAttribute('placeholder') || 'Fes clic o arrossega una imatge';
        this.acceptTypes = this.getAttribute('accept-types') || 'image/jpeg,image/png';
        this.multiple = this.getAttribute('multiple') === 'true';
        this.maxSize = parseInt(this.getAttribute('max-size')) || 5 * 1024 * 1024; // 5MB per defecte
        this.showActiveToggle = this.getAttribute('show-active-toggle') === 'true';
        this.isActive = this.getAttribute('is-active') !== 'false'; // Per defecte és actiu
        
        this._render();
        this._setupEventListeners();
    }

    static get observedAttributes() {
        return ['title', 'placeholder', 'accept-types', 'multiple', 'max-size', 'show-active-toggle', 'is-active'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'title':
                    this.title = newValue;
                    this._updateTitle();
                    break;
                case 'placeholder':
                    this.placeholder = newValue;
                    this._updatePlaceholder();
                    break;
                case 'accept-types':
                    this.acceptTypes = newValue;
                    this._updateAcceptTypes();
                    break;
                case 'multiple':
                    this.multiple = newValue === 'true';
                    this._updateMultiple();
                    break;
                case 'max-size':
                    this.maxSize = parseInt(newValue) || 5 * 1024 * 1024;
                    break;
                case 'show-active-toggle':
                    this.showActiveToggle = newValue === 'true';
                    this._updateActiveToggleButton();
                    break;
                case 'is-active':
                    this.isActive = newValue === 'true';
                    this._updateActiveToggleButton();
                    break;
            }
        }
    }

    _render() {
        const style = `
            :host {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
            
            .form-field {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 0;
                margin: 0;
                padding: 0;
            }
            
            .form-field label {
                margin: 0 0 5px 0;
                font-weight: bold;
                font-size: 0.9em;
                color: var(--color-text-secondary, #666);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: block;
                width: 100%;
            }
            
            .drop-zone {
                aspect-ratio: 1 / 1;
                width: 100%;
                border: 2px dashed var(--color-border-light, #ddd);
                border-radius: 10px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                color: var(--color-text-muted, #999);
                transition: border-color 0.3s, background-color 0.3s;
                cursor: pointer;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
            }
            
            .drop-zone:hover {
                border-color: var(--color-primary, #00539C);
                background-color: var(--color-primary-light, #f0f8ff);
            }
            
            .drop-zone.drag-over {
                border-color: var(--color-primary, #00539C);
                background-color: var(--color-primary-light, #f0f8ff);
            }
            
            .drop-zone p {
                font-size: 0.9em;
                line-height: 1.2;
                margin: 0;
                text-align: center;
                z-index: 1;
            }
            
            .preview {
                width: 100%;
                height: 100%;
                max-width: 100%;
                object-fit: contain;
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 2;
            }
            
            .preview[src]:not([src=""]) {
                display: block;
            }
            
            .file-input {
                display: none;
            }
            
            .remove-button {
                position: absolute;
                top: 5px;
                right: 5px;
                background: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                color: red;
                font-size: 1.6rem;
                font-weight: bold;
                z-index: 3;
                transition: background-color 0.2s;
            }
            
            .remove-button:hover {
                background: rgba(220, 53, 69, 1);
                color:white;
            }
            
            .remove-button.visible {
                display: flex;
            }
            
            .active-toggle-button {
                position: absolute;
                top: unset; /* Eliminar top */
                bottom: 5px; /* Moure a la part inferior */
                left: 5px;
                background: var(--color-success, #28a745);
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.9rem;
                font-weight: bold;
                z-index: 3;
                transition: background-color 0.2s;
            }
            
            .active-toggle-button.inactive {
                background: var(--color-danger, #dc3545);
            }
            
            /* Eliminar l'efecte hover del botó d'activació/desactivació */
            /*
            .active-toggle-button:hover {
                background: var(--color-warning, #ffc107);
            }
            */
            
            .active-toggle-button.visible {
                display: flex;
            }
            
            /* Estils per a mòbils */
            @media (max-width: 768px) {
                .drop-zone {
                    aspect-ratio: 1 / 1;
                    height: auto;
                }
                
                .drop-zone p {
                    font-size: 0.85em;
                }
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="form-field">
                <label for="file-input">${this.title}:</label>
                <div class="drop-zone">
                    <p>${this.placeholder}</p>
                    <img class="preview" src="" alt="">
                    <button class="remove-button" title="Eliminar imatge">×</button>
                    ${this.showActiveToggle ? `<button class="active-toggle-button" title="Activar/Desactivar imatge">A</button>` : ''}
                    <input type="file" class="file-input" accept="${this.acceptTypes}" ${this.multiple ? 'multiple' : ''}>
                </div>
            </div>
        `;
        this._updateActiveToggleButton();
    }

    _setupEventListeners() {
        // Evitar configuració múltiple
        if (this.eventListenersSetup) {
            Logger.debug(`Event listeners ja configurats per a component: ${this.title}`);
            return;
        }

        const dropZone = this.shadowRoot.querySelector('.drop-zone');
        const fileInput = this.shadowRoot.querySelector('.file-input');
        const removeButton = this.shadowRoot.querySelector('.remove-button');
        const activeToggleButton = this.shadowRoot.querySelector('.active-toggle-button');

        // Configurar drag & drop utilitzant el mixin
        DragDropMixin.setupDragDrop(dropZone, {
            onDrop: (file) => this._handleFile(file),
            onError: (errors) => this._dispatchEvent('error', { errors }),
            allowedTypes: this.acceptTypes.split(',').map(type => type.trim()),
            maxSize: this.maxSize,
            multiple: this.multiple
        });

        // Configurar click per obrir selector de fitxers
        DragDropMixin.setupFileInputClick(dropZone, fileInput, {
            onFileSelected: (file) => this._handleFile(file),
            onError: (errors) => this._dispatchEvent('error', { errors }),
            allowedTypes: this.acceptTypes.split(',').map(type => type.trim()),
            maxSize: this.maxSize,
            multiple: this.multiple
        });

        // Botó d'eliminar
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this._removeFile();
        });

        // Botó d'activar/desactivar
        if (activeToggleButton) {
            activeToggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleActiveState();
            });
        }

        this.eventListenersSetup = true;
        Logger.debug(`Event listeners configurats per a component: ${this.title}`);
    }

    _handleFile(file) {
        // Ara, _handleFile simplement delegarà a setFile, indicant que és una acció d'usuari.
        this.setFile(file, true);
    }

    _createPreview(file) {
        // Revocar la URL anterior si existeix per evitar fuites de memòria
        if (this._currentPreviewUrl && this._currentPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this._currentPreviewUrl);
        }

        if (!file) {
            this._currentPreviewUrl = '';
            return;
        }
        this._currentPreviewUrl = URL.createObjectURL(file);
    }

    _updatePreview() {
        const preview = this.shadowRoot.querySelector('.preview');
        const placeholder = this.shadowRoot.querySelector('p');
        const removeButton = this.shadowRoot.querySelector('.remove-button');
        
        if (this._currentPreviewUrl) {
            preview.src = this._currentPreviewUrl;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            removeButton.classList.add('visible');
        } else {
            preview.src = '';
            preview.style.display = 'none';
            placeholder.style.display = 'block';
            removeButton.classList.remove('visible');
        }
    }

    _removeFile() {
        Logger.debug(`_removeFile cridat per a component: ${this.title} (ID: ${this.id})`);
        // Delegar a setFile per gestionar la lògica de neteja i dispatch
        this.setFile(null);
    }

    _updateUI() {
        this._updatePreview();
    }

    _updateTitle() {
        const label = this.shadowRoot.querySelector('label');
        if (label) {
            label.textContent = this.title + ':';
        }
    }

    _updatePlaceholder() {
        const placeholder = this.shadowRoot.querySelector('p');
        if (placeholder && !this.previewUrl) {
            placeholder.textContent = this.placeholder;
        }
    }

    _updateAcceptTypes() {
        const fileInput = this.shadowRoot.querySelector('.file-input');
        if (fileInput) {
            fileInput.accept = this.acceptTypes;
        }
    }

    _updateMultiple() {
        const fileInput = this.shadowRoot.querySelector('.file-input');
        if (fileInput) {
            if (this.multiple) {
                fileInput.setAttribute('multiple', '');
            } else {
                fileInput.removeAttribute('multiple');
            }
        }
    }

    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...detail, component: this },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    // API pública
    getFile() {
        return this.file;
    }

    setFile(file, isUserAction = false) {
        if (this.file === file) {
            return; // No fer res si el fitxer és el mateix per evitar reprocessament innecessari
        }
        
        this.file = file;
        this._createPreview(file);
        this._updateUI();
        
        if (file) {
            // Només dispatxar file-selected si és una acció de l'usuari
            if (isUserAction) {
                this._dispatchEvent('file-selected', { file: file });
            }
        } else {
            // Sempre dispatxar file-removed, independentment de si és acció d'usuari o programàtic
            this._dispatchEvent('file-removed');
        }
    }

    clear() {
        // Ja no necessitem Logger.debug aquí, setFile ja fa el log.
        this.setFile(null);
    }

    getPreviewUrl() {
        return this._currentPreviewUrl; // Retornar la URL actualment utilitzada
    }

    _updateActiveToggleButton() {
        const activeToggleButton = this.shadowRoot.querySelector('.active-toggle-button');
        if (activeToggleButton) {
            if (this.isActive) {
                activeToggleButton.classList.remove('inactive');
                activeToggleButton.textContent = 'A';
            } else {
                activeToggleButton.classList.add('inactive');
                activeToggleButton.textContent = 'D';
            }
            // La visibilitat ja es gestiona a _render() basant-se en this.showActiveToggle
            activeToggleButton.style.display = this.showActiveToggle ? 'flex' : 'none';
        }
    }
    
    toggleActiveState() {
        this.isActive = !this.isActive;
        this._updateActiveToggleButton();
        this._dispatchEvent('active-toggle-changed', { isActive: this.isActive });
    }

    getIsActive() {
        return this.isActive;
    }
}

// Registrar el component
customElements.define('image-upload', ImageUploadComponent); 