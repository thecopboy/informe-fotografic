/**
 * Component per visualitzar un element d'informe individual
 * Similar a FotoComponent però adaptat per informes
 */
class ReportItemComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.reportData = null;
    }

    connectedCallback() {
        this._render();
        this._addEventListeners();
    }

    /**
     * Estableix les dades de l'informe
     */
    setData({ id, tipus, numero, assumpte, adreca, data, created_at }) {
        this.reportData = { id, tipus, numero, assumpte, adreca, data, created_at };
        this._render();
    }

    /**
     * Obté les dades de l'informe
     */
    getData() {
        return this.reportData;
    }

    /**
     * Renderitza el component
     */
    _render() {
        const style = `
            :host {
                display: block;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                background: #f9f9f9;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            }

            :host(:hover) {
                background: #f0f0f0;
                border-color: #007bff;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .report-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
            }

            .report-info {
                display: flex;
                flex-direction: column;
                gap: 5px;
                flex: 1;
            }

            .report-title {
                font-weight: 600;
                color: #333;
                margin: 0;
                padding: 0;
                font-size: 1.1rem;
                text-align: left;
            }

            .report-assumpte {
                color: #555;
                font-size: 1rem;
                margin: 0!important;
                padding: 0!important;
                text-align: left;
            }

            .report-adreca {
                color: #666;
                font-size: 0.9rem;
                margin: 0!important;
                padding: 0!important;
                text-align: left;
            }

            .report-actions {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .report-delete-btn {
                background: none;
                color: #999;
                border: none;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                opacity: 0.8;
                border-radius: 4px;
            }

            .report-delete-btn:hover {
                color: #dc3545;
                opacity: 1;
                transform: scale(1.1);
            }

            .report-delete-btn svg {
                width: 24px;
                height: 24px;
                fill: currentColor;
            }


        `;

        // Definim l'estructura HTML del component
        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="report-content">
                <div class="report-info">
                    <h6 class="report-title">${this.reportData?.tipus || 'Sense tipus'} núm. ${this.reportData?.numero || 'Sense número'} del dia ${this.reportData?.data ? new Date(this.reportData.data).toLocaleDateString('ca-ES') : 'Sense data'}</h6>
                    <p class="report-assumpte">${this.reportData?.assumpte || 'Sense assumpte'}</p>
                    <p class="report-adreca">${this.reportData?.adreca || 'Sense adreça'}</p>
                </div>
                <div class="report-actions">
                    <button class="report-delete-btn" aria-label="Eliminar informe" title="Eliminar informe">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>


        `;
    }

    _addEventListeners() {
        const deleteButton = this.shadowRoot.querySelector('.report-delete-btn');

        // Event listener per clicar a l'informe (per carregar-lo)
        this.addEventListener('click', (event) => {
            // No activar si es clica el botó d'eliminar
            if (!event.target.closest('.report-delete-btn')) {
                this.dispatchEvent(new CustomEvent('report-selected', {
                    detail: this.reportData,
                    bubbles: true,
                    composed: true
                }));
            }
        });

        // Quan es clica el botó de paperera, enviem l'esdeveniment per mostrar la modal
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent('report-delete-requested', {
                detail: this.reportData,
                bubbles: true,
                composed: true
            }));
        });
    }
}

// Registrem el nostre Web Component
customElements.define('report-item-component', ReportItemComponent); 