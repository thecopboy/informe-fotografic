/**
 * Mòdul per a la gestió de drag & drop
 * Centralitza TOTA la lògica relacionada amb l'arrossegament de fitxers i reordenació de components
 * Segueix els patrons d'arquitectura del projecte: DI, SRP, Observer
 */
import { ErrorBoundary } from '../utils/errorHandler.js';
import { ValidationService } from '../utils/validationService.js';
import { DragDropMixin } from '../utils/dragDropMixin.js';

export class DragDropManager {
    constructor(stateManager, uiManager, photoComponentManager, notificationManager, authManager = null) {
        // Validació de dependències
        if (!stateManager || typeof stateManager.get !== 'function') {
            throw new Error('DragDropManager: stateManager és obligatori i ha de tenir els mètodes get/set');
        }
        if (!uiManager || typeof uiManager.showError !== 'function') {
            throw new Error('DragDropManager: uiManager és obligatori i ha de tenir els mètodes de UI');
        }
        if (!photoComponentManager || typeof photoComponentManager.processPhotoFile !== 'function') {
            throw new Error('DragDropManager: photoComponentManager és obligatori i ha de tenir el mètode processPhotoFile');
        }
        if (!notificationManager || typeof notificationManager.error !== 'function') {
            throw new Error('DragDropManager: notificationManager és obligatori i ha de tenir els mètodes de notificació');
        }

        this.stateManager = stateManager;
        this.uiManager = uiManager;
        this.photoComponentManager = photoComponentManager;
        this.notificationManager = notificationManager;
        this.authManager = authManager;
        
        this.elements = {};
        this.draggedElement = null;
        this.dragStartPosition = null;
        this.dragOverlay = null;
        this.isDragging = false;
    }

    /**
     * Inicialitzar el mòdul - Seguint el patró d'inicialització del projecte
     */
    init() {
        this.getElements();
        this.setupGlobalDragPrevention();
        this.setupAllDragAndDrop();
        this.setupStateSubscriptions();
    }

    /**
     * Obtenir referències als elements del DOM
     */
    getElements() {
        this.elements.dropZone = document.getElementById('drop-zone');
        this.elements.previewSection = document.getElementById('preview-section');
        
        // Input de fitxers de fotos
        this.elements.photosFileInput = document.getElementById('photos-file-input');
        
        // Elements de drag visual
        this.elements.dragOverlay = document.getElementById('drag-overlay');
        
        // Els components d'imatge (shield i background) ara es gestionen automàticament
        // No cal obtenir referències als elements antics
    }

    /**
     * Configurar subscripcions d'estat - Seguint el patró Observer del projecte
     */
    setupStateSubscriptions() {
        // Subscriure's als canvis d'estat per actualitzar la UI
        // Els components d'imatge (shield i background) ara es gestionen automàticament
        this.stateManager.subscribe('photos', this.updatePhotosUI.bind(this));
    }

    /**
     * Configurar prevenció global de drag & drop
     */
    setupGlobalDragPrevention() {
        // Utilitzar el mixin per la prevenció global
        DragDropMixin.setupGlobalDragPrevention();
    }

    /**
     * Configurar tot el drag & drop
     */
    setupAllDragAndDrop() {
        this.setupPhotosDropZone();
        // Els components d'imatge (shield i background) ara gestionen el seu propi drag & drop
        this.setupPreviewSection();
        this.setupComponentDragDrop();
    }

    /**
     * Configurar zona de drop de fotos
     */
    setupPhotosDropZone() {
        if (!this.elements.dropZone) return;

        // Utilitzar el mixin per configurar drag & drop
        DragDropMixin.setupDragDrop(this.elements.dropZone, {
            onDrop: (files) => this.handlePhotosDrop(files),
            onError: (errors) => this._handlePhotoErrors(errors),
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxSize: 20 * 1024 * 1024, // 20MB per fotos
            multiple: true,
            dropEffect: 'copy'
        });

        // Configurar l'event listener per a l'input de fitxers (inclou click)
        const photosFileInput = document.getElementById('photos-file-input');
        if (photosFileInput) {
            DragDropMixin.setupFileInputClick(this.elements.dropZone, photosFileInput, {
                onFileSelected: (files) => this.handlePhotosDrop(files),
                onError: (errors) => this._handlePhotoErrors(errors),
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                maxSize: 20 * 1024 * 1024,
                multiple: true
            });
        }
    }

    /**
     * Configurar secció de previsualització (només reordenació)
     */
    setupPreviewSection() {
        if (!this.elements.previewSection) return;

        this.elements.previewSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this.draggedElement) {
                this.updateDragPosition(e);
            }
        });

        this.elements.previewSection.addEventListener('dragleave', (e) => {
            if (!this.elements.previewSection.contains(e.relatedTarget)) {
                this.clearDragIndicators();
            }
        });

        this.elements.previewSection.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedElement) {
                this.handleComponentDrop(e);
            }
        });
    }

    /**
     * Configurar drag & drop per a components
     */
    setupComponentDragDrop() {
        // Escoltar esdeveniments de drag dels components
        document.addEventListener('dragstart', (e) => {
            const component = e.target.closest('.photo-component, foto-component');
            if (component) {
                this.handleDragStart(e, component);
            }
        });

        document.addEventListener('dragend', (e) => {
            const component = e.target.closest('.photo-component, foto-component');
            if (component) {
                this.handleDragEnd(e, component);
            }
        });
    }

    /**
     * Gestionar drop de fotos - Delegació a PhotoComponentManager
     */
    async handlePhotosDrop(files) {
        try {
                // Delegació al PhotoComponentManager - Seguint SRP
            for (const file of files) {
                    await this.photoComponentManager.processPhotoFile(file);
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'photos-drop');
            this.notificationManager.error('Error en processar les fotos.');
        }
    }

    /**
     * Gestionar errors de fotos
     * @private
     */
    _handlePhotoErrors(errors) {
        if (errors && errors.length > 0) {
            this.notificationManager.warning(`Errors en les fotos: ${errors.join(', ')}`);
        }
    }

    /**
     * Obrir selector de fitxers per a les fotos
     */
    openPhotosFileSelector() {
        const input = document.getElementById('photos-file-input');
        if (input) {
        input.click();
        }
    }

    /**
     * Gestionar inici de drag de components
     */
    handleDragStart(e, component) {
        try {
            this.draggedElement = component;
            this.dragStartPosition = this.getElementPosition(component);
            
            // Afegir classe de drag
            component.classList.add('dragging');
            
            // Configurar data transfer
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', component.dataset.id || '');
            
            // Crear overlay de drag si no existeix
            this.createDragOverlay(component);
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-start');
        }
    }

    /**
     * Gestionar final de drag de components
     */
    handleDragEnd(e, component) {
        try {
            // Netejar classes de drag
            component.classList.remove('dragging');
            
            // Netejar indicadors
            this.clearDragIndicators();
            this.removeDragOverlay();
            
            this.draggedElement = null;
            this.dragStartPosition = null;
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-end');
        }
    }

    /**
     * Gestionar drop de component
     */
    handleComponentDrop(e) {
        try {
            if (!this.draggedElement) return;
            
            // Trobar el drop target real directament des de l'event
            const dropTarget = e.target.closest('foto-component');

            // Si hi ha un drop target, no és el mateix element arrossegat
            if (dropTarget && dropTarget !== this.draggedElement) {
                const photos = this.stateManager.get('photos');
                const draggedId = this.draggedElement.dataset.id;
                const targetId = dropTarget.dataset.id;

                const draggedIndex = photos.findIndex(p => p.id.toString() === draggedId);
                const targetIndex = photos.findIndex(p => p.id.toString() === targetId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Intercanviar directament els elements a l'array d'estat
                    const temp = photos[draggedIndex];
                    photos[draggedIndex] = photos[targetIndex];
                    photos[targetIndex] = temp;
                    
                    // Actualitzar estat via StateManager
                    this.stateManager.set('photos', photos);
                }
            }
            
            // Netejar indicadors visuals
            this.clearDragIndicators();
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'component-drop');
        }
    }

    /**
     * Actualitzar posició de drag
     */
    updateDragPosition(e) {
        // Implementar lògica visual de drag si cal
    }

    /**
     * Obtenir posició d'un element
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }

    /**
     * Crear overlay de drag
     */
    createDragOverlay(component) {
        try {
            if (this.elements.dragOverlay) {
                this.elements.dragOverlay.style.display = 'block';
                
                // Copiar estil del component
                const rect = component.getBoundingClientRect();
                this.elements.dragOverlay.style.width = rect.width + 'px';
                this.elements.dragOverlay.style.height = rect.height + 'px';
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-overlay-create');
        }
    }

    /**
     * Eliminar overlay de drag
     */
    removeDragOverlay() {
        try {
            if (this.elements.dragOverlay) {
                this.elements.dragOverlay.style.display = 'none';
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-overlay-remove');
        }
    }

    /**
     * Netejar indicadors de drag
     */
    clearDragIndicators() {
        try {
            // Utilitzar el mixin per netejar indicadors
            DragDropMixin.clearAllDragIndicators();
            
            if (this.elements.previewSection) {
            this.elements.previewSection.classList.remove('drag-end');
            }
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-indicators-clear');
        }
    }

    /**
     * Actualitzar UI de les fotos - Callback d'Observer
     */
    updatePhotosUI(photosData) {
        // Delegar al PhotoComponentManager si cal
        // O implementar lògica específica de drag & drop
    }

    /**
     * Habilitar drag & drop
     */
    enableDragDrop() {
        try {
            const components = this.elements.previewSection?.querySelectorAll('.photo-component, foto-component');
            
            components?.forEach(component => {
                component.draggable = true;
            });
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-drop-enable');
        }
    }

    /**
     * Deshabilitar drag & drop
     */
    disableDragDrop() {
        try {
            const components = this.elements.previewSection?.querySelectorAll('.photo-component, foto-component');
            
            components?.forEach(component => {
                component.draggable = false;
            });
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'drag-drop-disable');
        }
    }

    /**
     * Netejar recursos - Seguint el patró de cleanup del projecte
     */
    cleanup() {
        this.clearDragIndicators();
        this.removeDragOverlay();
        this.draggedElement = null;
        this.dragStartPosition = null;
    }
}