/**
 * Mòdul per a la gestió d'esdeveniments dels components de fotos
 * Conté tota la lògica relacionada amb els esdeveniments dels foto-components
 */

import { ValidationService } from '../utils/validationService.js';
import { ErrorBoundary } from '../utils/errorHandler.js';
import '../components/FotoComponent.js'; // Assegurem que el custom element estigui definit

export class PhotoComponentManager {
    constructor(stateManager) {
        this.stateManager = stateManager; // Injecció de dependències
        this.elements = {
            previewSection: null,
            addPhotoBtn: null,
            photoInput: null,
            componentTemplate: null
        };
        this.nextComponentId = 1;
        this.fotoComponentMap = {}; // Mapa de referències dels FotoComponent
    }

    init() {
        this.getElements();
        this.setupEventListeners();
        this.setupStateSubscriptions();
        // Funcions de drag & drop gestionades per DragDropManager
    }

    getElements() {
        this.elements.previewSection = document.getElementById('preview-section');
        this.elements.addPhotoBtn = document.getElementById('add-photo-btn');
        this.elements.photoInput = document.getElementById('photo-input');
        this.elements.componentTemplate = document.getElementById('photo-component-template');
    }

    setupEventListeners() {
        // Botó d'afegir foto
        if (this.elements.addPhotoBtn) {
            this.elements.addPhotoBtn.addEventListener('click', () => {
                this.elements.photoInput.click();
            });
        }

        // Input de fitxer
        if (this.elements.photoInput) {
            this.elements.photoInput.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
            });
        }

        // Escoltar esdeveniments component-deleted dels FotoComponent
        document.addEventListener('component-deleted', (e) => {
            const component = e.target;
            const componentId = component.getAttribute('data-id');
            if (componentId) {
                this.removeComponent(parseInt(componentId));
            }
        });

        // Escoltar esdeveniments component-updated dels FotoComponent
        document.addEventListener('component-updated', (e) => {
            const component = e.target;
            const componentId = component.getAttribute('data-id');
            const updatedData = e.detail;
            
            if (componentId && updatedData) {
                // Actualitzar l'estat amb les noves dades del component
                this.updateComponentFromEvent(parseInt(componentId), updatedData);
            }
        });

        // Escoltar esdeveniment per esborrar tots els títols
        document.addEventListener('clear-all-titles-requested', (e) => {
            this.clearAllPhotoTitles();
        });

        // Drag & drop per a la secció de previsualització
        if (this.elements.previewSection) {
            // Drag & drop configurat per DragDropManager
        }
    }

    /**
     * Configurar subscripcions d'estat
     */
    setupStateSubscriptions() {
        // Subscriure el gestor als canvis de l'estat de les fotos.
        // Això assegura que la UI es manté sincronitzada amb les dades.
        // _lastPhotosState es manté per a comparacions eficients, evitant clonacions profundes de File.
        this._lastPhotosState = undefined;
        this._forceGlobalRender = false; // Bandera per forçar un render complet si cal (e.g. clearAllTitles)
        this.stateManager.subscribe('photos', (photosData) => {
            // Crear un snapshot de les dades serialitzables per a la comparació de canvis.
            const currentComparablePhotos = photosData.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                isActive: p.isActive,
                filename: p.filename // Inclou el nom del fitxer per a detectar canvis en el fitxer real
            }));

            // Si es força un render global o és la primera vegada, o hi ha canvis en la llargada/ordre,
            // cridem a la reconciliació completa (renderPhotosFromState).
            if (this._forceGlobalRender || !this._lastPhotosState ||
                photosData.length !== this._lastPhotosState.length ||
                !photosData.every((p, i) => p.id === this._lastPhotosState[i]?.id)) {
                this.renderPhotosFromState();
                this._lastPhotosState = currentComparablePhotos; // Actualitzem el snapshot
                this._forceGlobalRender = false; // Reset la bandera
                return; // Ja hem fet el render, sortim.
            }

            // Per a actualitzacions selectives (canvis interns de dades en components existents):
            for (let i = 0; i < photosData.length; i++) {
                const photoFromState = photosData[i];
                const currentFotoComponent = this.fotoComponentMap[photoFromState.id];

                if (currentFotoComponent) {
                    const currentComponentData = currentFotoComponent.getData();
                    // Actualitzem el número visible (sempre que es reordena)
                    if (currentFotoComponent.updateNumber) {
                        currentFotoComponent.updateNumber(i + 1);
                    }
                    // Crida setData només si les dades intrínseques de la foto han canviat
                    if (this._componentNeedsUpdate(currentComponentData, photoFromState)) {
                        currentFotoComponent.setData({
                            id: photoFromState.id,
                            file: photoFromState.file,
                            number: i + 1, // Passar el número actualitzat
                            originalName: photoFromState.filename,
                            titol: photoFromState.title,
                            descripcio: photoFromState.description,
                            isActive: photoFromState.isActive !== false
                        });
                    }
                }
            }
            this._lastPhotosState = currentComparablePhotos; // Actualitzem el snapshot al final de la pass
        });

        // Renderitza l'estat inicial en carregar la pàgina.
        this.renderPhotosFromState();
    }

    /**
     * Configurar prevenció global de drag & drop
     */
    // Funcions de drag & drop gestionades per DragDropManager

    /**
     * Configurar drag & drop
     */
    // Funcions de drag & drop gestionades per DragDropManager

    /**
     * Gestionar pujada de fotos
     */
    async handlePhotoUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await this.processPhotoFile(file);
            }
            
            // Netejar input
            event.target.value = '';
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'photo-upload');
        }
    }

    /**
     * Processar fitxer de foto
     */
    async processPhotoFile(file) {
        try {
            // Validar fitxer
            const validation = ValidationService.validateFile(file, {
                allowedTypes: ['image/jpeg', 'image/png'],
                maxSize: 20 * 1024 * 1024 // 20MB
            });

            if (!validation.isValid) {
                return;
            }

            // Crear dades de la foto
            const componentId = this.nextComponentId++;
            const photoData = {
                id: componentId,
                file,
                filename: file.name,
                title: file.name, // Títol per defecte amb el nom del fitxer
                description: '',
                isActive: true, // Per defecte, les fotos estan actives
                number: componentId // Afegim el número
            };
            
            // Afegir a l'estat
            const currentPhotos = this.stateManager.get('photos') || [];
            currentPhotos.push(photoData);
            this.stateManager.set('photos', currentPhotos);
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'photo-process');
        }
    }

    /**
     * Elimina un component de la UI i de l'estat.
     * @param {string} componentId - L'ID del component a eliminar.
     */
    removeComponent(componentId) {
        try {
            const photos = this.stateManager.get('photos') || [];
            const photoToRemove = photos.find(photo => photo.id === componentId);

            if (photoToRemove && this.fotoComponentMap[componentId]) {
                this.fotoComponentMap[componentId].cleanup();
            }

            const filteredPhotos = photos.filter(photo => photo.id !== componentId);
            this.stateManager.set('photos', filteredPhotos);
            
            delete this.fotoComponentMap[componentId];
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'remove-component');
        }
    }

    /**
     * Actualitzar dades del component
     */
    updateComponentData(componentId, field, value) {
        try {
            const photos = this.stateManager.get('photos') || [];
            const idx = photos.findIndex(photo => photo.id === componentId);
            if (idx === -1) return;
            const currentPhoto = photos[idx];
            const updatedPhoto = { ...currentPhoto, [field]: value, file: currentPhoto.file };
            photos[idx] = updatedPhoto;
            this.stateManager.set('photos', photos);
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'component-update-data');
        }
    }

    /**
     * Actualitzar component des d'un esdeveniment
     */
    updateComponentFromEvent(componentId, updatedData) {
        try {
            const photos = this.stateManager.get('photos') || [];
            const idx = photos.findIndex(photo => photo.id === componentId);
            if (idx === -1) return;
            
            const currentPhoto = photos[idx];
            const updatedPhoto = {
                ...currentPhoto,
                title: updatedData.titol !== undefined ? updatedData.titol : currentPhoto.title,
                description: updatedData.descripcio !== undefined ? updatedData.descripcio : currentPhoto.description,
                file: updatedData.file || currentPhoto.file,
                isActive: updatedData.isActive !== undefined ? updatedData.isActive : currentPhoto.isActive
            };
            
            photos[idx] = updatedPhoto;
            this.stateManager.set('photos', photos);
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'component-update-from-event');
        }
    }

    /**
     * Actualitzar el fitxer d'una foto (per rotació, edició, etc.)
     * @param {string} photoId - L'ID de la foto a actualizar.
     * @param {File} newFile - El nou fitxer.
     * @param {Object} extraData - Dades addicionals per actualitzar (títol, etc.).
     */
    updatePhotoFile(photoId, newFile, extraData = {}) {
        try {
            const photos = this.stateManager.get('photos') || [];
            const photoIndex = photos.findIndex(p => p.id === photoId);
            if (photoIndex === -1) return;
            
            const oldPhoto = photos[photoIndex];
            const updatedPhoto = {
                ...oldPhoto,
                file: newFile,
                ...extraData
            };
            
            photos[photoIndex] = updatedPhoto;
            this.stateManager.set('photos', photos);

        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'update-photo-file');
        }
    }

    /**
     * Netejar tots els components
     */
    clearAllComponents() {
        if (!this.elements.previewSection) return;

        for (const id in this.fotoComponentMap) {
            if (this.fotoComponentMap.hasOwnProperty(id)) {
                const component = this.fotoComponentMap[id];
                if (component.cleanup && typeof component.cleanup === 'function') {
                    component.cleanup();
                }
            }
        }
        
        this.stateManager.setState({ photos: [] });
        this.elements.previewSection.innerHTML = '';
        this.fotoComponentMap = {};
    }

    /**
     * Renderitza els components de foto basant-se en l'estat actual.
     * Aquesta funció és cridada automàticament quan l'estat canvia.
     */
    renderPhotosFromState() {
        if (!this.elements.previewSection) return;

        const photos = this.stateManager.get('photos') || [];
        
        const currentDomOrder = Array.from(this.elements.previewSection.children);
        const newFotoComponentMap = {};
        const updatedElements = []; // Per mantenir l'ordre i els elements actualitzats
        
        // 1. Processar cada foto de l'estat i preparar els components.
        photos.forEach((photoData, index) => {
            const componentId = photoData.id;
            let component = this.fotoComponentMap[componentId]; // Intentar reutilitzar del mapa

            if (!component) {
                // Si no existeix al mapa, el busquem al DOM per si s'ha reordenat manualment o el mapa no estava sincronitzat
                component = currentDomOrder.find(c => Number(c.getAttribute('data-id')) === componentId);
                if (!component) {
                    // Si encara no existeix, creem un nou component
                    component = document.createElement('foto-component');
                    component.id = `foto-${componentId}`;
                    component.setAttribute('data-id', componentId);
                    component.setAttribute('draggable', true); // Assegurem que sigui arrossegable
                }
            }
            
            // Sempre actualitzar les dades del component. FotoComponent.setData ja gestionarà si cal re-renderitzar la imatge.
            component.setData({
                id: photoData.id,
                file: photoData.file,
                number: index + 1, // Tornar a la numeració basada en l'índex per al frontend
                originalName: photoData.filename,
                titol: photoData.title,
                descripcio: photoData.description,
                isActive: photoData.isActive !== false
            });

            newFotoComponentMap[componentId] = component; // Guardar al nou mapa
            updatedElements.push(component); // Afegir a la llista d'elements actualitzats
        });

        // 2. Manipular el DOM per reflectir l'ordre actualitzat i afegir/eliminar elements.
        // Iterem sobre la llista d'elements actualitzats i els inserim/movem al DOM.
        updatedElements.forEach((component, index) => {
            const currentDomChild = this.elements.previewSection.children[index];
            if (component !== currentDomChild) {
                if (index >= this.elements.previewSection.children.length) {
                    this.elements.previewSection.appendChild(component);
                } else {
                    this.elements.previewSection.insertBefore(component, currentDomChild);
                }
            }
        });

        // 3. Eliminar components antics que ja no estan a l'estat.
        Object.keys(this.fotoComponentMap).forEach(oldId => {
            const numOldId = Number(oldId);
            if (!newFotoComponentMap[numOldId]) {
                const componentToRemove = this.fotoComponentMap[numOldId];
                if (componentToRemove) {
                    if (componentToRemove.cleanup && typeof componentToRemove.cleanup === 'function') {
                        componentToRemove.cleanup(); // Crida al cleanup per revocar URL blob
                    }
                    componentToRemove.remove(); // Elimina del DOM
                }
            }
        });

        // Reemplaça el mapa antic pel nou.
        this.fotoComponentMap = newFotoComponentMap;
    }

    /**
     * Determina si un component necessita actualització (només per dades, no per posició).
     * @param {Object} currentData - Dades actuals del component (getData() del FotoComponent)
     * @param {Object} newData - Noves dades de l'estat (photosData de stateManager)
     * @returns {boolean} True si necessita actualització de dades
     */
    _componentNeedsUpdate(currentData, newData) {
        if (currentData.file !== newData.file) {
            return true; 
        }

        if (currentData.isActive !== (newData.isActive !== false)) {
            return true;
        }
        
        if (currentData.titol !== newData.title || currentData.descripcio !== newData.description) {
            return true;
        }
        
        return false;
    }

    handlePhotoReorder() {
        const previewSection = this.elements.previewSection;
        if (!previewSection) return;
        const ids = Array.from(previewSection.querySelectorAll('foto-component')).map(el => Number(el.getAttribute('data-id')));
        
        const photos = this.stateManager.get('photos') || [];
        const reorderedPhotos = ids.map(id => {
            const originalPhoto = photos.find(photo => photo.id === id);
            return originalPhoto;
        }).filter(Boolean);
        
        this.stateManager.set('photos', reorderedPhotos);
    }

    /**
     * Esborra el títol de totes les fotos a l'estat
     */
    clearAllPhotoTitles() {
        const photos = this.stateManager.get('photos') || [];
        const updatedPhotos = photos.map(photo => ({ ...photo, title: '' }));
        // Aquesta bandera força una reconstrucció completa per assegurar que tots els títols es mostren buits
        // ja que la lògica de reconciliació normal no detectaria canvis a les dades no passades per setData.
        // Amb la nova renderPhotosFromState, això és menys crític però es pot mantenir per claredat.
        this.stateManager.set('photos', updatedPhotos);
    }
}

// La funció d'inicialització global s'ha eliminat.
// La instanciació i la subscripció a l'estat ara seran gestionades
// per la classe principal de l'aplicació (App) per centralitzar la lògica.

 