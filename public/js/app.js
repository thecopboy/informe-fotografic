/**
 * Aplicació principal
 * Punt d'entrada de l'aplicació que inicialitza tots els mòduls
 * 
 * @copyright 2025 themacboy72@gmail.com
 * @license Apache-2.0
 */

import { StateManager } from './modules/stateManager.js';
import { UIManager } from './modules/uiManager.js';
import { FormManager } from './modules/formManager.js';
import { PhotoComponentManager } from './modules/photoComponentManager.js';
import { DragDropManager } from './modules/dragDropManager.js';
import { ReportManager } from './modules/reportManager.js';
import { AuthManager } from './modules/authManager.js';
import { NotificationManager } from './modules/notificationManager.js';
import { ImageComponentManager } from './modules/imageComponentManager.js';
import { ErrorBoundary, Logger, EnvironmentUtils } from './utils/errorHandler.js';
import { JsonLoader } from './modules/jsonLoader.js';
import { loadConfig, applyUIConfigToCSS } from './config/frontendConfig.js';
import { scrollController } from './utils/scrollController.js';
import { EnterKeyManager } from './modules/enterKeyManager.js';
import LoadingModalManager from './modules/loadingModalManager.js';

// Registrar el web component abans que s'utilitzi
import './components/ImageUploadComponent.js';

export class App {
    constructor() {
        this.stateManager = null;
        this.notificationManager = null;
        this.authManager = null;
        this.formManager = null;
        this.uiManager = null;
        this.photoComponentManager = null;
        this.imageComponentManager = null;
        this.dragDropManager = null;
        this.reportManager = null;
        this.jsonLoader = null;
        this.scrollController = null;
        this.enterKeyManager = null;
        this.loadingModalManager = null;
    }

    async init() {
        ErrorBoundary.configure();
        Logger.info("Iniciant l'aplicació...");

        // 0. Carregar configuració abans d'inicialitzar els mòduls
        try {
            await loadConfig();
            Logger.info("Configuració carregada correctament.");
        } catch (error) {
            Logger.warn("Error carregant configuració, usant valors per defecte:", error);
            applyUIConfigToCSS(); // Aplicar configuració per defecte
        }

        // 1. Instanciar tots els mòduls
        this.stateManager = new StateManager();
        this.notificationManager = new NotificationManager();
        this.photoComponentManager = new PhotoComponentManager(this.stateManager);
        this.imageComponentManager = new ImageComponentManager(this.stateManager, this.notificationManager);
        // Inicialitzar UIManager només amb stateManager
        this.uiManager = new UIManager(this.stateManager);
        this.formManager = new FormManager(this.stateManager, null, this.imageComponentManager); 
        this.loadingModalManager = new LoadingModalManager();
        this.reportManager = new ReportManager(this.stateManager, this.notificationManager, this.photoComponentManager, this.loadingModalManager, this.imageComponentManager, this.uiManager);
        this.authManager = new AuthManager(this.stateManager, this.notificationManager, this.formManager, this.reportManager);
        this.reportManager.authManager = this.authManager; 
        this.formManager.reportManager = this.reportManager; 
        
        // Ara que AuthManager i ReportManager estan instanciats, assignar-los a UIManager
        this.uiManager.setAuthAndReportManagers(this.authManager, this.reportManager);
        
        // La crida a uiManager.init() ja no és necessària aquí ja que la lògica s'ha mogut a setAuthAndReportManagers
        // this.uiManager.init(); 
        
        this.dragDropManager = new DragDropManager(this.stateManager, this.uiManager, this.photoComponentManager, this.notificationManager, this.authManager);
        this.jsonLoader = new JsonLoader(this.stateManager, this.photoComponentManager, this.notificationManager, this.imageComponentManager);
        this.enterKeyManager = new EnterKeyManager(this.stateManager, this.notificationManager);

        // 2. Inicialitzar tots els mòduls (ara que tots existeixen)
        this.photoComponentManager.init();
        this.imageComponentManager.init();
        this.formManager.init();
        this.reportManager.init();
        await this.authManager.init();
        // this.uiManager.init(); // Eliminat, la inicialització principal es fa a setAuthAndReportManagers
        this.dragDropManager.init();
        this.jsonLoader.init();
        this.enterKeyManager.init();

        // 3. Inicialitzar el scrollController després que tot estigui carregat
        this.scrollController = scrollController;
        Logger.info("ScrollController activat correctament.");
            
        // 5. Carregar l'estat inicial
        await this.loadInitialState();
        Logger.info("Aplicació inicialitzada correctament.");
    }

    async loadInitialState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.stateManager.setState(parsedState);
                Logger.info("Estat de l'aplicació restaurat des de localStorage", { stateKeys: Object.keys(parsedState) });
            } else {
                Logger.info("No s'ha trobat cap estat guardat. Inicialitzant amb valors per defecte.");
                this.formManager.handleReset();
            }
        } catch (error) {
            Logger.error("Error carregant l'estat inicial, es reinicia a valors per defecte", error);
            this.formManager.handleReset();
        } finally {
            this.stateManager.set('app.isLoaded', true);
            Logger.info("Estat inicialitzat amb valors per defecte.");
        }
    }


}

export default new App(); 