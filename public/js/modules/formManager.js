/**
 * Mòdul per a la gestió del formulari principal
 * Conté tota la lògica relacionada amb la gestió dels camps del formulari
 */
import { ErrorBoundary } from '../utils/errorHandler.js';

// Funcionalitat centralitzada en la classe FormManager

// Constants centralitzats de camps
export const FORM_FIELDS = [
    'tipus', 'numero', 'data', 'hora', 'adreca', 'assumpte', 'signants'
];

export class FormManager {
    constructor(stateManager, reportManager, imageComponentManager = null) {
        this.stateManager = stateManager;
        this.reportManager = reportManager;
        this.imageComponentManager = imageComponentManager;
        this.elements = {
            form: null,
            fields: {},
            submitBtn: null,
            resetBtn: null,
            saveBtn: null,
            loadBtn: null
        };
    }

    init() {
        this.getElements();
        this.setupEventListeners();
        // Subscriu-te als canvis de formData i renderitza el formulari
        this.stateManager.subscribe('formData', this.renderFormFromState.bind(this));
        // Renderitza l'estat inicial en carregar la pàgina
        this.renderFormFromState();
    }

    getElements() {
        this.elements.form = document.getElementById('main-form');
        // Obtenir tots els camps del formulari
        FORM_FIELDS.forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                this.elements.fields[id] = field;
            }
        });
        // Obtenir botons
        this.elements.submitBtn = document.getElementById('submit-btn');
        this.elements.resetBtn = document.getElementById('reset-btn');
        this.elements.saveBtn = document.getElementById('save-btn');
        this.elements.loadBtn = document.getElementById('load-btn');
    }

    setupEventListeners() {
        // Event listeners per als camps - només per actualitzar l'estat, sense validacions
        Object.values(this.elements.fields).forEach(field => {
            field.addEventListener('input', () => this.handleFieldChange(field));
        });
        
        // La gestió de submit, save i load ara es fa des d'altres mòduls (ReportManager, JsonLoader)
        // que llegeixen directament de l'estat, per la qual cosa aquests listeners ja no són necessaris aquí.
    }

    /**
     * Gestionar canvi de camp
     */
    handleFieldChange(field) {
        try {
            const fieldId = field.id;
            const value = field.value;
            
            // L'única responsabilitat és actualitzar l'estat.
            this.stateManager.set(`formData.${fieldId}`, value);
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'field-change-handler');
        }
    }

    // Mètodes de validació eliminats - els camps són completament lliures

    /**
     * Gestionar reset del formulari
     */
    handleReset() {
        try {
            const emptyFormData = this._getEmptyFormData({ withDateTime: true });
            this.stateManager.set('formData', emptyFormData);
            this.stateManager.set('photos', []);
            this.stateManager.set('shield', { file: null, url: null });
            this.stateManager.set('backgroundImage', { file: null, url: null });
            this.stateManager.set('currentReport', { id: null, isEditing: false, data: null });
            
            // Netejar els components d'imatge si estan disponibles
            if (this.imageComponentManager) {
                this.imageComponentManager.clearAll();
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'form-reset');
        }
    }

    /**
     * Renderitza el formulari basant-se en l'estat actual de formData.
     */
    renderFormFromState() {
        const formData = this.stateManager.get('formData');
        if (!formData) return;

        FORM_FIELDS.forEach(fieldId => {
            const fieldElement = this.elements.fields[fieldId];
            if (fieldElement) {
                // Comprova si el valor a l'estat existeix, si no, posa una cadena buida.
                const value = formData[fieldId] || '';
                if (fieldElement.value !== value) {
                    fieldElement.value = value;
                }
            }
        });
    }

    /**
     * Obté un objecte de formulari buit.
     * @param {object} options - Opcions.
     * @param {boolean} options.withDateTime - Si s'ha d'incloure data/hora.
     * @returns {object} - L'objecte de dades del formulari.
     */
    _getEmptyFormData({ withDateTime = false } = {}) {
        let today = '';
        let currentTime = '';
        if (withDateTime) {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            today = `${year}-${month}-${day}`;
            currentTime = `${hours}:${minutes}`;
        }
        return {
            'tipus': '',
            'numero': '',
            'data': today,
            'hora': currentTime,
            'adreca': '',
            'assumpte': '',
            'signants': '',
            'escut': ''
        };
    }

    /**
     * Gestionar carregar formulari
     */
    async handleLoad() {
        try {
            const formData = await this.loadFormData();
            
            if (formData) {
                this.populateForm(formData);
            }
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'form-load');
        }
    }

    /**
     * Carregar dades del formulari
     */
    async loadFormData() {
        // Simular càrrega
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Carregar des de localStorage o servidor
        const savedData = localStorage.getItem('formData');
        
        if (savedData) {
            this.populateForm(JSON.parse(savedData));
        }

        return savedData ? JSON.parse(savedData) : null;
    }

    /**
     * Poblar formulari amb dades
     */
    populateForm(formData) {
        this.stateManager.set('formData', formData);
    }

    /**
     * Mostrar error de camp
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Crear o actualitzar missatge d'error
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Netejar error de camp
     */
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Netejar tots els errors
     */
    clearAllErrors() {
        Object.values(this.elements.fields).forEach(field => {
            this.clearFieldError(field);
        });
    }

    // Mètodes de progrés i neteja eliminats - no s'utilitzaven
}

// Funcions de validació eliminades per simplificar el codi 