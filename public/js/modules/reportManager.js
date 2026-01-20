/**
 * Mòdul de gestió d'informes
 * Centralitza tota la lògica relacionada amb CRUD d'informes
 */

import { authService } from '../auth/authService.js';
import { ValidationService } from '../utils/validationService.js';
import { ErrorBoundary } from '../utils/errorHandler.js';
import { generateClientPdf } from '../utils/pdfGenerator.js';
import { FileService } from '../utils/fileService.js';
import { DateTimeService } from '../utils/dateTimeService.js';
import '../components/ReportItemComponent.js';
import { Logger } from '../utils/errorHandler.js';

export class ReportManager {
    constructor(stateManager, notificationManager, photoComponentManager, loadingModalManager, authManager = null, imageComponentManager = null, uiManager) {
        // Validació de dependències
        if (!stateManager || typeof stateManager.get !== 'function') {
            throw new Error('ReportManager: stateManager és obligatori i ha de tenir els mètodes get/set');
        }
        if (!notificationManager || typeof notificationManager.success !== 'function') {
            throw new Error('ReportManager: notificationManager és obligatori i ha de tenir els mètodes de notificació');
        }
        if (!photoComponentManager || typeof photoComponentManager.renderPhotosFromState !== 'function') {
            throw new Error('ReportManager: photoComponentManager és obligatori i ha de tenir el mètode renderPhotosFromState');
        }
        if (!loadingModalManager || typeof loadingModalManager.show !== 'function') {
            throw new Error('ReportManager: loadingModalManager és obligatori i ha de tenir els mètodes show/hide');
        }

        this.stateManager = stateManager;
        this.notificationManager = notificationManager;
        this.photoComponentManager = photoComponentManager;
        this.loadingModalManager = loadingModalManager;
        this.authManager = authManager;
        this.imageComponentManager = imageComponentManager;
        this.uiManager = uiManager;
        this.elements = {
            // Elements de botons
            newReportBtn: null,
            generatePdfBtn: null,
            saveJsonBtn: null,
            
            // Elements de modals
            reportsModal: null,
            closeReportsModal: null,
            reportsList: null,
            reportsError: null,
            noReportsMessage: null,
            
            // Elements de confirmació d'esborrat
            deleteConfirmModal: null,
            closeDeleteConfirmModal: null,
            confirmDeleteBtn: null,
            cancelDeleteBtn: null,
            deleteConfirmText: null,
            
            // Elements mòbils
            mobileNewReportBtn: null,
            mobileMyReportsBtn: null,
            mobileGeneratePdfBtn: null,
            mobileSaveJsonBtn: null,
            // Botó informes (escriptori)
            myReportsBtn: null
        };
        
        this.currentDeleteReportId = null;
    }

    /**
     * Convertir fotos de Base64 a estructura File
     * @param {Array} base64Photos - Array de fotos en format Base64
     * @returns {Promise<Array>} Array de fotos convertides a File
     */
    async _convertBase64PhotosToFileStructure(base64Photos) {
        if (!Array.isArray(base64Photos)) {
            return [];
        }

        const convertedPhotos = [];
        const totalPhotos = base64Photos.length;

        for (let i = 0; i < base64Photos.length; i++) {
            const photo = base64Photos[i];
            try {
                // Convertir base64 a File
                const file = FileService.base64ToFile(photo.foto, photo.originalName || `foto_${i + 1}.jpg`, photo.format || 'image/jpeg');
                
                const convertedPhoto = {
                    file: file,
                    imageUrl: URL.createObjectURL(file), // Crear URL per mostrar la imatge
                    number: photo.number || i + 1,
                    originalName: photo.originalName || `foto_${i + 1}.jpg`,
                    title: photo.titol || '', // Mapear titol -> title
                    description: photo.descripcio || '', // Mapear descripcio -> description
                    isActive: photo.isActive !== false
                };
                
                convertedPhotos.push(convertedPhoto);
            } catch (error) {
                Logger.error(`Error convertint foto ${i + 1}:`, error);
            }
        }
        
        // Assegurar que totes les fotos tenen IDs únics
        return FileService.ensurePhotoIds(convertedPhotos);
    }

    /**
     * Mètode privat per recollir i validar totes les dades de l'informe actual.
     * @returns {Promise<Object|null>} - Un objecte amb les dades de l'informe o null si la validació falla.
     */
    async _collectReportDataAsync() {
        const generalData = this.stateManager.get('formData');
        const photosData = this.stateManager.get('photos') || [];

        // Validació
        const validation = ValidationService.validateFormData(generalData);
        if (!validation.isValid) {
            this.notificationManager.warning(`Errors de validació: ${validation.errors.join(', ')}`);
            return null;
        }

        // Tractament de l'escut
        const shieldFile = this.stateManager.get('shield.file');
        const escutBase64 = shieldFile ? await FileService.fileToBase64(shieldFile) : '';

        // Tractament de la imatge de fons
        const backgroundFile = this.stateManager.get('backgroundImage.file');
        const backgroundBase64 = backgroundFile ? await FileService.fileToBase64(backgroundFile) : '';

        // Tractament de la imatge de signatura
        const signatureFile = this.stateManager.get('user.data.signatureImage.file'); // Obtenir de l'estat del perfil
        const signatureBase64 = signatureFile ? await FileService.fileToBase64(signatureFile) : '';

        // Tractament de les fotos
        const photosBase64 = await Promise.all(photosData
            .map(async (photo, index) => {
                if (photo.file) {
                    const base64 = await FileService.fileToBase64(photo.file);
                    return {
                        foto: base64,
                        number: index + 1, // Utilitza l'índex actual per al número de la foto
                        originalName: photo.originalName,
                        titol: photo.title, // Mapear title -> titol per al JSON
                        descripcio: photo.description, // Mapear description -> descripcio per al JSON
                        isActive: photo.isActive !== false,
                        format: photo.file.type
                    };
                }
                return null; // En cas que no hi hagi fitxer
            })).then(results => results.filter(Boolean)); // Eliminar entrades nulls

        return {
            general: { ...generalData, escut: escutBase64, backgroundImage: backgroundBase64, signatureImage: signatureBase64 },
            photos: photosBase64,
        };
    }

    /**
     * Inicialitzar el mòdul
     */
    init() {
        this.getElements();
        this.setupEventListeners();
    }

    /**
     * Obtenir referències als elements del DOM
     */
    getElements() {
        // Elements de botons
        this.elements.newReportBtn = document.getElementById('new-report-btn');
        this.elements.generatePdfBtn = document.getElementById('generate-pdf-btn');
        this.elements.saveJsonBtn = document.getElementById('save-json-btn');
        
        // Elements de modals
        this.elements.reportsModal = document.getElementById('reports-modal');
        this.elements.closeReportsModal = document.getElementById('close-reports-modal');
        this.elements.reportsList = document.getElementById('reports-list');
        this.elements.reportsError = document.getElementById('reports-error');
        this.elements.noReportsMessage = document.getElementById('no-reports-message');
        
        // Elements de confirmació d'esborrat
        this.elements.deleteConfirmModal = document.getElementById('delete-confirm-modal');
        this.elements.closeDeleteConfirmModal = document.getElementById('close-delete-confirm-modal');
        this.elements.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.elements.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.elements.deleteConfirmText = document.getElementById('delete-confirm-text');
        
        // Elements mòbils
        this.elements.mobileNewReportBtn = document.getElementById('mobile-new-report-btn');
        this.elements.mobileMyReportsBtn = document.getElementById('mobile-my-reports-btn');
        this.elements.mobileGeneratePdfBtn = document.getElementById('mobile-generate-pdf-btn');
        this.elements.mobileSaveJsonBtn = document.getElementById('mobile-save-json-btn');
        // Botó informes (escriptori)
        this.elements.myReportsBtn = document.getElementById('my-reports-btn');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botó nou informe
        if (this.elements.newReportBtn) {
            this.elements.newReportBtn.addEventListener('click', () => this.handleNewReport());
        }
        
        if (this.elements.mobileNewReportBtn) {
            this.elements.mobileNewReportBtn.addEventListener('click', () => {
                this.handleNewReport();
                this.closeMobileMenu();
            });
        }
        
        // Botó Crear informe
        if (this.elements.generatePdfBtn) {
            this.elements.generatePdfBtn.addEventListener('click', () => this.handleGeneratePdf());
        }
        
        if (this.elements.mobileGeneratePdfBtn) {
            this.elements.mobileGeneratePdfBtn.addEventListener('click', () => {
                this.handleGeneratePdf();
                this.closeMobileMenu();
            });
        }
        
        // Botó guardar JSON
        if (this.elements.saveJsonBtn) {
            this.elements.saveJsonBtn.addEventListener('click', () => this.handleSaveJson());
        }
        
        if (this.elements.mobileSaveJsonBtn) {
            this.elements.mobileSaveJsonBtn.addEventListener('click', () => {
                this.handleSaveJson();
                this.closeMobileMenu();
            });
        }
        
        // Modal d'informes
        if (this.elements.closeReportsModal) {
            this.elements.closeReportsModal.addEventListener('click', () => this.hideReportsModal());
        }
        
        if (this.elements.mobileMyReportsBtn) {
            this.elements.mobileMyReportsBtn.addEventListener('click', () => {
                this.showReportsModal();
                this.closeMobileMenu();
            });
        }

        // Botó informes (escriptori)
        if (this.elements.myReportsBtn) {
            this.elements.myReportsBtn.addEventListener('click', () => this.showReportsModal());
        }
        
        // Modal de confirmació d'esborrat
        if (this.elements.closeDeleteConfirmModal) {
            this.elements.closeDeleteConfirmModal.addEventListener('click', () => this.hideDeleteConfirmModal());
        }
        
        if (this.elements.confirmDeleteBtn) {
            this.elements.confirmDeleteBtn.addEventListener('click', () => this.executeDeleteReport());
        }
        
        if (this.elements.cancelDeleteBtn) {
            this.elements.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmModal());
        }
        
        // Escoltar esdeveniment de creació d'informe
        document.addEventListener('reportCreated', (event) => {
            const { reportId, reportData } = event.detail;
            this.handleReportCreated(reportId, reportData);
        });
    }

    /**
     * Gestionar generació de PDF
     */
    async handleGeneratePdf() {
        try {
            const reportData = await this._collectReportDataAsync();
            if (!reportData) return; // La validació ha fallat

            // Clonar reportData per no modificar l'original que s'utilitza per guardar.
            const reportDataForPdf = { ...reportData };
            // Filtrar les fotos inactives només per a la generació del PDF
            reportDataForPdf.photos = reportData.photos.filter(photo => photo.isActive);

            // Re-numerar les fotos actives per al PDF
            let activePhotoCounter = 0;
            reportDataForPdf.photos = reportDataForPdf.photos.map(photo => ({
                ...photo,
                number: ++activePhotoCounter
            }));

            const isAuthenticated = this.stateManager.get('user.isAuthenticated');
            const isEditing = this.stateManager.get('currentReport.isEditing');
            const currentReport = this.stateManager.get('currentReport');
            
            if (isAuthenticated) {
                if (isEditing) {
                    // Actualitzar a la base de dades i després generar PDF (sense guardar de nou)
                    await this.updateReportInDatabase(currentReport.id, reportData);
                    await generateClientPdf(reportDataForPdf, false); // No guardar de nou, ja s'ha actualitzat
                    this.notificationManager.success('Informe actualitzat i descarregat correctament!');
                } else {
                    await generateClientPdf(reportDataForPdf, true); // Crear nou informe
                    this.notificationManager.success('Informe creat correctament!');
                }
            } else {
                await generateClientPdf(reportDataForPdf, false);
                this.notificationManager.success('Informe generat correctament!');
            }
        } catch (error) {
            
            // Mostrar notificació d'error específica
            if (error.message && error.message.includes('validació')) {
                this.notificationManager.warning(error.message);
            } else {
                this.notificationManager.error('Error en generar el PDF');
            }
            
            ErrorBoundary.handleError(error, {}, 'generate-pdf');
            }
    }

    /**
     * Gestiona l'acció de crear un nou informe, netejant l'estat actual.
     */
    handleNewReport() {
        try {
            
            // Obtenir data i hora actuals del servei
            const { currentDate, currentTime } = DateTimeService.getCurrentDateTime();

            // Neteja completa de les dades del formulari i estableix data i hora
            this.stateManager.set('formData', {
                data: currentDate,
                hora: currentTime,
                tipus: '',
                numero: '',
                adreca: '',
                assumpte: '',
                signants: ''
            });

            // Neteja les fotos
            this.stateManager.set('photos', []);

            // Neteja l'escut
            this.stateManager.set('shield', { file: null, url: null });

            // Neteja la imatge de fons
            this.stateManager.set('backgroundImage', { file: null, url: null });

            // Neteja la imatge de signatura
            this.stateManager.set('signatureImage', { file: null, url: null });

            // Netejar els components d'imatge si estan disponibles
            // this.imageComponentManager.clearAll(); // ELIMINAT: La neteja es gestiona a través de StateManager i ImageComponentManager

            // Reseteja l'estat de l'informe actual
            this.stateManager.set('currentReport', { id: null, isEditing: false, data: null });
            
            
            // Actualitzar el text del botó després del reset
            this.updateGenerateButtonText();
            
            // Carregar les dades per defecte de l'usuari si està autenticat
            const user = this.stateManager.get('user');
            if (user && user.isAuthenticated && user.data && this.authManager) {
                // Utilitzar authManager per carregar les dades per defecte
                this.authManager.loadUserDefaults(false);
            }

        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'create-new-report');
            this.notificationManager.error("S'ha produït un error en intentar crear un nou informe.");
        }
    }

    /**
     * Gestionar guardat de JSON
     */
    async handleSaveJson() {
        try {
            const reportData = await this._collectReportDataAsync();
            if (!reportData) return; // La validació ha fallat
            
            const fileName = `informe_${reportData.general.numero || 'sense_numero'}_${reportData.general.data}.json`;

            // Convertir l'objecte JSON a un Blob
            const jsonString = JSON.stringify(reportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Utilitza el servei FileService per a la descàrrega
            FileService.downloadFile(blob, fileName);

            this.notificationManager.success('Informe exportat correctament!');

        } catch (error) {
            this.notificationManager.error("Error en exportar l'informe a JSON.");
            ErrorBoundary.handleError(error, {}, 'save-json-handler');
        }
    }

    /**
     * Tancar menú mòbil
     */
    closeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('active');
        }
        
        if (mobileNav) {
            mobileNav.classList.remove('active');
            }
        
        document.body.style.overflow = '';
    }

    /**
     * Mostrar modal d'informes
     */
    async showReportsModal() {
        if (this.elements.reportsModal) {
            this.elements.reportsModal.classList.add('show');
            this.stateManager.set('ui.modals.reports', true);
            await this.loadReports();
            // Configurar event listeners per als informes després de carregar-los
            this.setupReportEventListeners();
        }
    }

    /**
     * Amagar modal d'informes
     */
    hideReportsModal() {
        if (this.elements.reportsModal) {
            this.elements.reportsModal.classList.remove('show');
            this.stateManager.set('ui.modals.reports', false);
        }
    }

    /**
     * Carregar llista d'informes
     */
    async loadReports() {
        try {
            this.showReportsLoading();
            
            const userData = this.stateManager.get('user.data');
            if (!userData?.id) {
                throw new Error('No hi ha usuari autenticat');
            }
            
            // Carregar del servidor
            const reports = await authService.getReports();
            
            // L'API retorna {reports: [...]}, no un array directe
            const reportsArray = reports.reports || reports;
            const hasReports = reportsArray && reportsArray.length > 0;
            
            if (hasReports) {
                this.displayReports(reports);
            } else {
                this.showNoReportsMessage();
            }
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'load-reports');
            this.showReportsError('Error en carregar els informes');
        }
    }

    /**
     * Mostrar carregant informes
     */
    showReportsLoading() {
        if (this.elements.reportsList) {
            this.elements.reportsList.style.display = 'none';
        }
        if (this.elements.reportsError) {
            this.elements.reportsError.style.display = 'none';
        }
        if (this.elements.noReportsMessage) {
            this.elements.noReportsMessage.style.display = 'none';
        }
    }

    /**
     * Mostrar error en carregar informes
     */
    showReportsError(message) {
        if (this.elements.reportsError) {
            this.elements.reportsError.textContent = message;
            this.elements.reportsError.style.display = 'block';
        }
        this.notificationManager.error(message);
        if (this.elements.reportsList) {
            this.elements.reportsList.style.display = 'none';
        }
        if (this.elements.noReportsMessage) {
            this.elements.noReportsMessage.style.display = 'none';
        }
    }

    /**
     * Mostrar missatge de no hi ha informes
     */
    showNoReportsMessage() {
        if (this.elements.noReportsMessage) {
            this.elements.noReportsMessage.style.display = 'block';
        }
        if (this.elements.reportsList) {
            this.elements.reportsList.style.display = 'none';
        }
        if (this.elements.reportsError) {
            this.elements.reportsError.style.display = 'none';
        }
    }

    /**
     * Mostrar llista d'informes
     */
    displayReports(reports) {
        
        if (!this.elements.reportsList) {
            return;
        }
        
        this.elements.reportsList.innerHTML = '';
        
        // L'API retorna {reports: [...]}, no un array directe
        const reportsArray = reports.reports || reports;
        
        reportsArray.forEach(report => {
            // Les dades dels camps estan dins de report_data.general
            const generalData = report.report_data?.general || {};
            const tipus = generalData.tipus || 'Sense tipus';
            const numero = generalData.numero || 'Sense número';
            const assumpte = generalData.assumpte || 'Sense assumpte';
            const adreca = generalData.adreca || 'Sense adreça';
            const data = generalData.data || 'Sense data';
            
            // Crear el component d'informe
            const reportComponent = document.createElement('report-item-component');
            reportComponent.setData({
                id: report.id,
                tipus: tipus,
                numero: numero,
                assumpte: assumpte,
                adreca: adreca,
                data: data,
                created_at: report.created_at
            });
            
            // Event listeners per al component
            reportComponent.addEventListener('report-selected', (event) => {
                this.loadReport(event.detail.id);
            });
            
            reportComponent.addEventListener('report-deleted', (event) => {
                this.showDeleteConfirmModal(event.detail.id);
            });
            
            this.elements.reportsList.appendChild(reportComponent);
        });
        
        this.elements.reportsList.style.display = 'block';
        this.elements.reportsError.style.display = 'none';
        this.elements.noReportsMessage.style.display = 'none';
    }

    /**
     * Configurar event listeners dels informes
     */
    setupReportEventListeners() {
        if (!this.elements.reportsList) return;
        
        // Event listeners per eliminar informes (delegació)
        this.elements.reportsList.addEventListener('report-delete-requested', (e) => {
            const reportData = e.detail;
            if (reportData && reportData.id) {
                this.showDeleteConfirmModal(reportData.id);
            }
        });
    }

    /**
     * Carregar informe específic
     */
    async loadReport(reportId) {
        try {
            // Amagar la modal d'informes i mostrar la modal de càrrega immediatament
            this.hideReportsModal();
            this.loadingModalManager.show("Carregant l'informe...");

            // Carregar del servidor
            const report = await authService.getReport(reportId);
            
            if (report) {
                await this.loadReportData(report, true);
                
                this.stateManager.set('currentReport', { id: reportId, isEditing: true, data: report });
                
                // Verificar que s'ha configurat correctament
                const currentReport = this.stateManager.get('currentReport');
                
                this.hideReportsModal();
                this.updateGenerateButtonText();
                
                // Mostrar toast de confirmació amb el títol de l'informe si està disponible
                const reportTitle = report.title || report.report?.title || 'Informe';
                this.notificationManager.success(`Informe "${reportTitle}" carregat correctament`);
            } else {
                Logger.error('No s\'ha rebut cap informe de l\'API');
                this.notificationManager.error('No s\'ha pogut carregar l\'informe');
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'load-report');
            this.showInfoModal('Error en carregar l\'informe');
            this.notificationManager.error('Error en carregar l\'informe');
        } finally {
            this.loadingModalManager.hide(); // Assegurar que la modal de càrrega s'amaga al final
        }
    }

    /**
     * Eliminar informe
     */
    deleteReport(reportId) {
        this.currentDeleteReportId = reportId;
        this.showDeleteConfirmModal(reportId);
    }

    /**
     * Mostrar modal de confirmació d'esborrat
     */
    showDeleteConfirmModal(reportId) {
        this.currentDeleteReportId = reportId;
        
        if (this.elements.deleteConfirmModal) {
            this.elements.deleteConfirmModal.classList.add('show');
        }
        
        if (this.elements.deleteConfirmText) {
            this.elements.deleteConfirmText.textContent = `Estàs segur que vols eliminar aquest informe?`;
        }
    }

    /**
     * Amagar modal de confirmació d'esborrat
     */
    hideDeleteConfirmModal() {
        this.currentDeleteReportId = null;
        
        if (this.elements.deleteConfirmModal) {
            this.elements.deleteConfirmModal.classList.remove('show');
        }
    }

    /**
     * Executar esborrat d'informe
     */
    async executeDeleteReport() {
        if (!this.currentDeleteReportId) return;
        
        try {
            await authService.deleteReport(this.currentDeleteReportId);
            
            // Si l'informe eliminat era el que estàvem editant, netejar estat
            const currentReport = this.stateManager.get('currentReport');
            if (currentReport && currentReport.id === this.currentDeleteReportId) {
                this.stateManager.set('currentReport', { id: null, isEditing: false, data: null });
                this.updateGenerateButtonText();
            }
            
            this.hideDeleteConfirmModal();
            this.hideReportsModal();
            
            // Recarregar llista d'informes
            await this.showReportsModal();
            this.notificationManager.success('Informe eliminat correctament!');
            
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'delete-report');
            this.showInfoModal('Error en eliminar l\'informe');
            this.notificationManager.error('Error en eliminar l\'informe');
        }
    }

    /**
     * Actualitzar informe a la base de dades
     */
    async updateReportInDatabase(reportId, reportData) {
        try {
            // Eliminar el camp 'dia' si existeix abans d'enviar al servidor
            if (reportData && reportData.general && reportData.general.hasOwnProperty('dia')) {
                delete reportData.general.dia;
            }

            // Transformar les dades al format que espera el servidor
            const title = `Informe Fotogràfic - ${new Date().toLocaleDateString('ca-ES')}`;
            const dataForServer = {
                title: title,
                report_data: reportData
            };
            
            await authService.updateReport(reportId, dataForServer);
        } catch (error) {
            
            // Mostrar notificació d'error específica
            if (error.message && error.message.includes('No autoritzat')) {
                this.notificationManager.error('No tens permisos per actualitzar aquest informe');
            } else if (error.message && error.message.includes('No trobat')) {
                this.notificationManager.error('L\'informe no s\'ha trobat a la base de dades');
            } else {
                this.notificationManager.error('Error en actualitzar l\'informe');
            }
            
            ErrorBoundary.handleError(error, {}, 'update-report-database');
            throw error;
        }
    }

    /**
     * Carregar dades d'informe al formulari
     */
    async loadReportData(reportData, isFromDatabase = false) {
        try {
            
            // L'API retorna {report: {...}}, no un objecte directe
            const actualReportData = reportData.report || reportData;
            
            // Carregar dades generals
            if (actualReportData.report_data?.general) {
                
                // Actualitzar l'estat amb les dades generals
                const formData = {
                    tipus: actualReportData.report_data.general.tipus || '',
                    numero: actualReportData.report_data.general.numero || '',
                    data: actualReportData.report_data.general.data || '',
                    hora: actualReportData.report_data.general.hora || '',
                    adreca: actualReportData.report_data.general.adreca || '',
                    assumpte: actualReportData.report_data.general.assumpte || '',
                    signants: actualReportData.report_data.general.signants || '',
                    escut: actualReportData.report_data.general.escut || ''
                };
                
                this.stateManager.set('formData', formData); // Preservar data i hora del servidor
                
                // Convertir escut base64 a File utilitzant FileService
                if (actualReportData.report_data.general.escut) {
                    try {
                        const base64 = actualReportData.report_data.general.escut;
                        const file = FileService.base64ToFile(base64, 'escut.jpg', 'image/jpeg');
                        
                        this.stateManager.withStateUpdate(() => {
                        this.stateManager.set('shield', {
                            file: file,
                            url: URL.createObjectURL(file)
                        });
                            
                            // Carregar al component d'imatge si està disponible
                            // this.imageComponentManager.setShieldFile(file); // ELIMINAT: La càrrega es gestiona a través de StateManager
                        }, 'load-report-shield');
                    } catch (error) {
                        Logger.error('Error convertint escut:', error);
                        this.stateManager.set('shield', { file: null, url: null });
                    }
                } else {
                    this.stateManager.set('shield', { file: null, url: null });
                    }

                // Convertir imatge de fons base64 a File utilitzant FileService
                if (actualReportData.report_data.general.backgroundImage) {
                    try {
                        const base64 = actualReportData.report_data.general.backgroundImage;
                        const file = FileService.base64ToFile(base64, 'background.jpg', 'image/jpeg');
                        
                        this.stateManager.withStateUpdate(() => {
                            this.stateManager.set('backgroundImage', {
                                file: file,
                                url: URL.createObjectURL(file)
                            });
                            
                            // Carregar al component d'imatge si està disponible
                            // this.imageComponentManager.setBackgroundFile(file); // ELIMINAT: La càrrega es gestiona a través de StateManager
                        }, 'load-report-background');
                    } catch (error) {
                        Logger.error('Error convertint imatge de fons:', error);
                        this.stateManager.set('backgroundImage', { file: null, url: null });
                    }
                } else {
                    this.stateManager.set('backgroundImage', { file: null, url: null });
                    }
                
                // if (actualReportData.report_data.general.signatureImage) {
                //     console.log('ReportManager: Carregant signatura al component (loadReportData):', actualReportData.report_data.general.signatureImage ? 'DATA_PRESENT' : 'NO_DATA');
                //     try {
                //         const base64 = actualReportData.report_data.general.signatureImage;
                //         const file = FileService.base64ToFile(base64, 'signature.png', 'image/png');
                //         
                //         this.stateManager.withStateUpdate(() => {
                //             this.stateManager.set('signatureImage', {
                //                 file: file,
                //                 url: URL.createObjectURL(file)
                //             });
                //             
                //             // Carregar al component d'imatge si està disponible
                //             if (this.imageComponentManager) {
                //                 this.imageComponentManager.setSignatureFile(file);
                //             }
                //         }, 'load-report-signature');
                //     } catch (error) {
                //         console.error('Error convertint imatge de signatura:', error);
                //         this.stateManager.set('signatureImage', { file: null, url: null });
                //     }
                // } else {
                //     console.log('ReportManager: No hi ha dades de signatura en carregar l\'informe.');
                //     this.stateManager.set('signatureImage', { file: null, url: null });
                // }
            
            } else {
                Logger.warn('No s\'han trobat dades generals a reportData');
            }
            
            // Carregar fotos
            if (actualReportData.report_data?.photos && Array.isArray(actualReportData.report_data.photos)) {
                
                // Total de fotos a carregar (només les actives, ja que el filtratge es fa a _collectReportDataAsync)
                const totalPhotosToLoad = actualReportData.report_data.photos.filter(p => p.isActive).length;
                let loadedPhotosCount = 0;

                // Convertir fotos de Base64 a estructura File, amb actualització de progrés
                const convertedPhotos = await this._convertBase64PhotosToFileStructure(
                    actualReportData.report_data.photos
                );
                
                this.stateManager.set('photos', convertedPhotos);
            } else {
                Logger.info('No hi ha fotos per carregar');
            }
        } catch (error) {
            ErrorBoundary.handleError(error, {}, 'load-report-data');
            throw error;
        } finally {
            this.loadingModalManager.hide(); // Assegurar que la modal de càrrega s'amaga al final
        }
    }

    /**
     * Actualitzar text del botó de generar
     */
    updateGenerateButtonText() {
        if (!this.elements.generatePdfBtn) return;
        
        const token = localStorage.getItem('accessToken');
        const isAuthenticated = !!token;
        const currentReport = this.stateManager.get('currentReport');
        const isEditing = currentReport && currentReport.id;
        
        let buttonText = '';
        
        if (isAuthenticated) {
            if (isEditing) {
                buttonText = 'Actualitzar i descarregar';
            } else {
                buttonText = 'Guardar i descarregar';
            }
        } else {
            buttonText = 'Descarregar';
        }
        
        this.elements.generatePdfBtn.textContent = buttonText;

        if(this.elements.mobileGeneratePdfBtn) {
            this.elements.mobileGeneratePdfBtn.textContent = buttonText;
        }
    }

    /**
     * Mostrar missatge informatiu
     */
    showInfoModal(message) {
        // Disparar esdeveniment per mostrar modal
        const event = new CustomEvent('showInfoModal', { detail: message });
        document.dispatchEvent(event);
    }

    /**
     * Amagar missatge informatiu
     */
    hideInfoModal() {
        // Disparar esdeveniment per amagar modal
        const event = new CustomEvent('hideInfoModal');
        document.dispatchEvent(event);
    }

    /**
     * Mostrar missatge temporal
     */
    showTemporaryModal(message, duration = 3000) {
        // Disparar esdeveniment per mostrar modal temporal
        const event = new CustomEvent('showTemporaryModal', { 
            detail: { message, duration } 
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejar l'esdeveniment 'reportCreated' quan es crea un nou informe.
     * Actualitza l'estat currentReport i el text del botó.
     */
    handleReportCreated(reportId, reportData) {
        
        this.stateManager.set('currentReport', { id: reportId, isEditing: true, data: reportData });
        this.updateGenerateButtonText();
        
        // Notificació de confirmació que l'estat s'ha actualitzat
        this.notificationManager.info('Informe carregat per a edició');
    }
}



// Exportar instància singleton
// export const reportManager = new ReportManager(); 