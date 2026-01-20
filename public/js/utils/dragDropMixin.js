/**
 * Mixin per reutilitzar lògica de drag & drop
 * Elimina la duplicació de codi entre DragDropManager i ImageUploadComponent
 */

import { ValidationService } from './validationService.js';
import { Logger } from './errorHandler.js';

export const DragDropMixin = {
    /**
     * Configurar drag & drop en un element
     * @param {HTMLElement} element - Element on configurar drag & drop
     * @param {Object} options - Opcions de configuració
     * @param {Function} options.onDrop - Callback quan es fa drop d'un fitxer
     * @param {Function} options.onError - Callback quan hi ha un error
     * @param {Array} options.allowedTypes - Tipus de fitxers permesos
     * @param {number} options.maxSize - Mida màxima de fitxer en bytes
     * @param {boolean} options.multiple - Si accepta múltiples fitxers
     * @param {string} options.dropEffect - Efecte de drop ('copy', 'move', etc.)
     */
    setupDragDrop(element, options = {}) {
        const {
            onDrop,
            onError,
            allowedTypes = ['image/jpeg', 'image/png'],
            maxSize = 5 * 1024 * 1024, // 5MB per defecte
            multiple = false,
            dropEffect = 'copy'
        } = options;

        if (!element) {
            Logger.warn('DragDropMixin: Element no proporcionat');
            return;
        }

        // Event listener per dragover
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = dropEffect;
            element.classList.add('drag-over');
        });

        // Event listener per dragleave
        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!element.contains(e.relatedTarget)) {
                element.classList.remove('drag-over');
            }
        });

        // Event listener per drop
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            
            if (files.length === 0) return;

            // Processar fitxers segons si és múltiple o no
            if (multiple) {
                this._processMultipleFiles(files, { onDrop, onError, allowedTypes, maxSize });
            } else {
                this._processSingleFile(files[0], { onDrop, onError, allowedTypes, maxSize });
            }
        });
    },

    /**
     * Processar un sol fitxer
     * @private
     */
    _processSingleFile(file, options) {
        const { onDrop, onError, allowedTypes, maxSize } = options;
        
        try {
            // Validar fitxer
            const validation = this._validateFile(file, { allowedTypes, maxSize });
            
            if (!validation.isValid) {
                if (onError) {
                    onError(validation.errors);
                }
                return;
            }

            // Cridar callback d'èxit
            if (onDrop) {
                onDrop(file);
            }
            
        } catch (error) {
            Logger.error('Error processant fitxer:', error);
            if (onError) {
                onError(['Error inesperat processant el fitxer']);
            }
        }
    },

    /**
     * Processar múltiples fitxers
     * @private
     */
    _processMultipleFiles(files, options) {
        const { onDrop, onError, allowedTypes, maxSize } = options;
        
        try {
            const validFiles = [];
            const errors = [];

            // Validar cada fitxer
            files.forEach(file => {
                const validation = this._validateFile(file, { allowedTypes, maxSize });
                
                if (validation.isValid) {
                    validFiles.push(file);
                } else {
                    errors.push(...validation.errors);
                }
            });

            // Reportar errors si n'hi ha
            if (errors.length > 0 && onError) {
                onError(errors);
            }

            // Cridar callback amb fitxers vàlids
            if (validFiles.length > 0 && onDrop) {
                onDrop(validFiles);
            }
            
        } catch (error) {
            Logger.error('Error processant múltiples fitxers:', error);
            if (onError) {
                onError(['Error inesperat processant els fitxers']);
            }
        }
    },

    /**
     * Validar fitxer utilitzant ValidationService
     * @private
     */
    _validateFile(file, options) {
        const { allowedTypes, maxSize } = options;
        
        // Utilitzar ValidationService si està disponible
        if (typeof ValidationService !== 'undefined' && ValidationService.validateFile) {
            return ValidationService.validateFile(file, {
                allowedTypes,
                maxSize
            });
        }

        // Fallback si ValidationService no està disponible
        return this._validateFileFallback(file, { allowedTypes, maxSize });
    },

    /**
     * Validació de fallback si ValidationService no està disponible
     * @private
     */
    _validateFileFallback(file, options) {
        const { allowedTypes, maxSize } = options;
        const errors = [];

        // Verificar tipus
        if (!allowedTypes.includes(file.type)) {
            errors.push(`Tipus de fitxer no permès. Tipus acceptats: ${allowedTypes.join(', ')}`);
        }

        // Verificar mida
        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            errors.push(`El fitxer és massa gran. Mida màxima: ${maxSizeMB}MB`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Configurar click per obrir selector de fitxers
     * @param {HTMLElement} element - Element clicable
     * @param {HTMLInputElement} fileInput - Input de tipus file
     * @param {Object} options - Opcions de configuració
     */
    setupFileInputClick(element, fileInput, options = {}) {
        const {
            onFileSelected,
            onError,
            allowedTypes = ['image/jpeg', 'image/png'],
            maxSize = 5 * 1024 * 1024,
            multiple = false
        } = options;

        if (!element || !fileInput) {
            Logger.warn('DragDropMixin: Element o fileInput no proporcionats');
            return;
        }

        // Configurar input
        fileInput.accept = allowedTypes.join(',');
        if (multiple) {
            fileInput.setAttribute('multiple', '');
        } else {
            fileInput.removeAttribute('multiple');
        }

        // Event listener per click
        element.addEventListener('click', (e) => {
            // Evitar que es propagui si es clica en un botó d'eliminar
            if (e.target.classList.contains('remove-button')) {
                return;
            }
            fileInput.click();
        });

        // Event listener per canvi de fitxer
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length === 0) return;

            // Processar fitxers
            if (multiple) {
                this._processMultipleFiles(files, { onDrop: onFileSelected, onError, allowedTypes, maxSize });
            } else {
                this._processSingleFile(files[0], { onDrop: onFileSelected, onError, allowedTypes, maxSize });
            }

            // Netejar input per permetre seleccionar els mateixos fitxers de nou
            e.target.value = '';
        });
    },

    /**
     * Configurar prevenció global de drag & drop
     * @param {Array} allowedSelectors - Selectors CSS dels elements que permeten drop
     */
    setupGlobalDragPrevention(allowedSelectors = []) {
        const defaultSelectors = [
            '#drop-zone',
            'image-upload'
        ];

        const allSelectors = [...defaultSelectors, ...allowedSelectors];

        // Prevenir comportament per defecte global
        document.addEventListener('dragover', (e) => {
            const isAllowed = allSelectors.some(selector => {
                return e.target.closest(selector);
            });
            
            if (!isAllowed) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        document.addEventListener('dragenter', (e) => {
            const isAllowed = allSelectors.some(selector => {
                return e.target.closest(selector);
            });
            
            if (!isAllowed) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        document.addEventListener('drop', (e) => {
            const isAllowed = allSelectors.some(selector => {
                return e.target.closest(selector);
            });
            
            if (!isAllowed) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    },

    /**
     * Netejar classes de drag & drop
     * @param {HTMLElement} element - Element a netejar
     */
    clearDragClasses(element) {
        if (element) {
            element.classList.remove('drag-over');
        }
    },

    /**
     * Netejar tots els indicadors de drag & drop
     */
    clearAllDragIndicators() {
        document.querySelectorAll('.drag-over, .drag-after, .dragging').forEach(el => {
            el.classList.remove('drag-over', 'drag-after', 'dragging');
        });
    }
}; 