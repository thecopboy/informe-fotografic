import { Logger } from '../utils/errorHandler.js';

/**
 * Controlador per gestionar la opacitat del title-container segons el scroll
 * Optimitzat per evitar jank/tremolor
*/

export class ScrollController {
    constructor() {
        this.titleContainer = null;
        this.mainTitle = null;
        this.isInitialized = false;
        this.lastScrollTop = 0;
        this.animationFrameId = null;
        this.throttleDelay = 8; // Més fluid (120fps max)
        this.lastUpdate = 0;
        this.originalHeight = null;
        this.originalFontSize = null; // Nova propietat per la mida original del text
        this.minimumSize = 30;
        
        // Variables per suavitzar i evitar jank
        this.targetOpacity = 1;
        this.currentOpacity = 1;
        this.targetHeight = null;
        this.currentHeight = null;
        this.targetFontSize = null; // Nova propietat per la mida target del text
        this.currentFontSize = null; // Nova propietat per la mida actual del text
        this.lerpFactor = 0.1; // Factor d'interpolació suau
        this.isAnimating = false;
        this.lastScrollDirection = 0;
        this.scrollVelocity = 0;
        
        this.init();
    }

    init() {
        // Esperar que el DOM estigui carregat
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupController());
        } else {
            this.setupController();
        }
    }

    setupController() {
        // Buscar el title-container i el main-title
        this.titleContainer = document.querySelector('.title-container');
        this.mainTitle = document.querySelector('.main-title');
        
        if (!this.titleContainer || !this.mainTitle) {
            Logger.warn('No s\'han trobat els elements del títol');
            return;
        }

        // Obtenir l'alçada i mida de font originals immediatament
        this.originalHeight = this.mainTitle.offsetHeight;
        this.originalFontSize = parseFloat(getComputedStyle(this.mainTitle).fontSize);
        
        // Inicialitzar valors targets i actuals
        this.targetHeight = this.originalHeight;
        this.currentHeight = this.originalHeight;
        this.targetFontSize = this.originalFontSize;
        this.currentFontSize = this.originalFontSize;

        // Configurar l'escolta d'esdeveniments de scroll amb throttling millorat
        window.addEventListener('scroll', () => this.throttledHandleScroll(), { passive: true });
        
        // Configurar l'escolta per al redimensionament de la finestra
        window.addEventListener('resize', () => this.handleResize());
        
        // Aplicar estat inicial
        this.handleScroll();
        
        this.isInitialized = true;
        Logger.info('ScrollController inicialitzat correctament');
    }

    throttledHandleScroll() {
        const now = performance.now(); // Més precís que Date.now()
        
        // Throttling millorat
        if (now - this.lastUpdate < this.throttleDelay) {
            return;
        }
        
        this.lastUpdate = now;
        
        // Cancelar l'animation frame anterior si existeix
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Usar requestAnimationFrame per suavitzar l'animació
        this.animationFrameId = requestAnimationFrame(() => {
            this.handleScroll();
        });
    }

    handleScroll() {
        if (!this.titleContainer || !this.mainTitle) return;

        // Desactivar l'efecte en dispositius mòbils (menys de 768px)
        if (window.innerWidth <= 768) {
            // Restaurar l'estat original en mòbils
            this.resetToOriginalState();
            return;
        }

        // Obtenir la posició actual del scroll amb més precisió
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Calcular velocitat de scroll per detectar moviments bruscos
        const scrollDelta = scrollTop - this.lastScrollTop;
        this.scrollVelocity = Math.abs(scrollDelta);
        this.lastScrollDirection = scrollDelta > 0 ? 1 : -1;
        
        // Calcular el progrés amb més precisió
        const progress = Math.max(0, Math.min(1, 1 - (scrollTop / this.originalHeight)));
        
        // Suavitzar els valors per evitar tremolor
        const smoothedProgress = this.smoothValue(progress);
        
        // Actualitzar targets
        this.targetOpacity = smoothedProgress;
        this.targetHeight = smoothedProgress * this.originalHeight;
        // Calcular mida del text: de originalFontSize a minimumSize
        this.targetFontSize = Math.max(this.minimumSize, smoothedProgress * this.originalFontSize);
        
        // Aplicar interpolació suau per evitar jank
        this.animateToTarget();
        
        this.lastScrollTop = scrollTop;
    }

    animateToTarget() {
        // Interpolació suau per evitar salts bruscos
        const opacityDiff = this.targetOpacity - this.currentOpacity;
        const heightDiff = this.targetHeight - this.currentHeight;
        const fontSizeDiff = this.targetFontSize - this.currentFontSize;
        
        // Ajustar el factor d'interpolació segons la velocitat de scroll
        const adaptiveLerpFactor = this.scrollVelocity > 10 ? this.lerpFactor * 0.5 : this.lerpFactor;
        
        // Aplicar interpolació
        this.currentOpacity += opacityDiff * adaptiveLerpFactor;
        this.currentHeight += heightDiff * adaptiveLerpFactor;
        this.currentFontSize += fontSizeDiff * adaptiveLerpFactor * 0.5;
        
        // Arrodonir valors per evitar decimals que causen tremolor
        const roundedOpacity = Math.round(this.currentOpacity * 1000) / 1000;
        const roundedHeight = Math.round(this.currentHeight * 10) / 10;
        const roundedFontSize = Math.round(this.currentFontSize * 10) / 10;
        
        // Aplicar transformacions amb will-change per optimitzar
        this.applyTransforms(roundedOpacity, roundedHeight, roundedFontSize);
        
        // Continuar animant si hi ha diferències significatives
        const opacityThreshold = 0.001;
        const heightThreshold = 0.1;
        const fontSizeThreshold = 0.1;
        
        if (Math.abs(opacityDiff) > opacityThreshold || 
            Math.abs(heightDiff) > heightThreshold || 
            Math.abs(fontSizeDiff) > fontSizeThreshold) {
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.continueAnimation();
            }
        } else {
            this.isAnimating = false;
        }
    }

    continueAnimation() {
        if (!this.isAnimating) return;
        
        this.animateToTarget();
        
        if (this.isAnimating) {
            requestAnimationFrame(() => this.continueAnimation());
        }
    }

    applyTransforms(opacity, height, fontSize) {
        // Usar transform3d per activar l'acceleració per hardware
        this.mainTitle.style.opacity = opacity.toString();
        this.mainTitle.style.fontSize = `${fontSize}px`;
        this.titleContainer.style.height = `${height}px`;
        
        // Gestionar visibilitat per millorar el rendiment
        if (opacity < 0.01) {
            this.mainTitle.style.visibility = 'hidden';
        } else {
            this.mainTitle.style.visibility = 'visible';
        }
    }

    smoothValue(value) {
        // Funció de suavitzat millorada per reduir el tremolor
        // Utilitzem una corba més suau
        return Math.pow(value, 1.5);
    }

    resetToOriginalState() {
        this.mainTitle.style.opacity = '1';
        this.mainTitle.style.visibility = 'visible';
        this.mainTitle.style.fontSize = ''; // Restaurar mida original del CSS
        this.titleContainer.style.height = '';
        this.currentOpacity = 1;
        this.targetOpacity = 1;
        this.currentHeight = this.originalHeight;
        this.targetHeight = this.originalHeight;
        this.currentFontSize = this.originalFontSize;
        this.targetFontSize = this.originalFontSize;
    }

    handleResize() {
        // Recalcular dimensions en redimensionar
        if (this.mainTitle) {
            this.originalHeight = this.mainTitle.offsetHeight;
            this.originalFontSize = parseFloat(getComputedStyle(this.mainTitle).fontSize);
            this.handleScroll();
        }
    }

    // Mètode per reinicialitzar si cal
    reinit() {
        this.setupController();
    }
}

// Crear instància global
export const scrollController = new ScrollController(); 