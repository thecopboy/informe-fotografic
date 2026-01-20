//import { jsPDF } from 'jspdf';
import { arialNormal } from '../../fonts/arial-normal.js';
import { arialBold } from '../../fonts/arial-bold.js';
import { arialItalic } from '../../fonts/arial-italic.js';
import { arialBoldItalic } from '../../fonts/arial-bold-italic.js';
import { getPDFConfig } from '../config/frontendConfig.js';
import { Logger } from '../utils/errorHandler.js';

// --- Constants de Disseny i Estructura ---
const MARGIN_H = 20; // Marge horitzontal
const MARGIN_V = 15; // Marge vertical
const HEADER_LOGO_HEIGHT = 16.5;
const SPACING = {
    TITLE_AFTER_LOGO: 16,    // Espai entre logo i títol
    FIELD: 3,               // Espai vertical entre camps de text
    LABEL_TO_VALUE: 2,      // Espai horitzontal entre etiqueta i valor
    SECTION: 10,            // Espai entre seccions grans
    PHOTO_TITLE_TO_IMG: 0,  // Espai entre títol de foto i imatge
    PHOTO_IMG_TO_DESC: 5,   // Espai entre imatge i descripció
    PHOTO_BLOCK_TOP_PADDING: 10 // Espai superior dins del bloc de foto
};
const IMAGE_BORDER_WIDTH = 0.7;
const PT_TO_MM_FACTOR = 25.4 / 72; // Conversió de punts (unitat de font) a mm

// --- Estils de Text Centralitzats ---
const STYLES = {
    TITLE: { family: "Arial", size: 21, style: "bold", align: 'center' },
    PAGINATION: { family: "Arial", size: 10, style: "normal", align: 'right' },
    LABEL: { family: "Arial", size: 12, style: "bold", align: 'left' },
    VALUE: { family: "Arial", size: 12, style: "normal", align: 'left' },
    DESCRIPTION: { family: "Arial", size: 10, style: "normal", align: 'justify', lineHeight: 1.25 },
    SIGNATURES_TITLE: { family: "Arial", size: 12, style: "bold", align: 'left' },
};

class PhotographicReportGenerator {
    constructor(reportData) {
        this.data = reportData;
        const { jsPDF } = window.jspdf; // Agafem la llibreria del scope global
        this.doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        this.pageWidth = this.doc.internal.pageSize.getWidth();
        this.pageHeight = this.doc.internal.pageSize.getHeight();
        this.contentWidth = this.pageWidth - (MARGIN_H * 2);
        this.currentY = MARGIN_V;
        this.activePhotos = this.data.photos.filter(p => p.isActive);
        this.lastPagePhotoCount = 0;
        this.lastPageHasVertical = false;

    }

    /**
     * Mètode principal per generar i desar el document PDF.
     */
    generate() {
        this._registerFonts();
        this._drawBackgroundImage(); // Moure aquí per assegurar que estigui al fons
        this._drawHeader();
        this._drawGeneralInfo();
        this._drawAllPhotoBlocks();
        this._drawSignatures();
        this._addPageNumbers(); // Aquest mètode dibuixa la paginació a totes les pàgines
        this._save();
    }

    // --- Mètodes Privats d'Inicialització ---

    _registerFonts() {
        this.doc.addFileToVFS('Arial-normal.ttf', arialNormal);
        this.doc.addFileToVFS('Arial-bold.ttf', arialBold);
        this.doc.addFileToVFS('Arial-italic.ttf', arialItalic);
        this.doc.addFileToVFS('Arial-bold-italic.ttf', arialBoldItalic);
        this.doc.addFont('Arial-normal.ttf', 'Arial', 'normal');
        this.doc.addFont('Arial-bold.ttf', 'Arial', 'bold');
        this.doc.addFont('Arial-italic.ttf', 'Arial', 'italic');
        this.doc.addFont('Arial-bold-italic.ttf', 'Arial', 'bolditalic');
    }

    /**
     * Dibuixa la imatge de fons a la pàgina actual cobrint tota la pàgina
     * Aquest mètode s'ha de cridar abans que qualsevol altre element per assegurar que està al fons
     */
    _drawBackgroundImage() {
        if (!this.data.general.backgroundImage) {
            return;
        }

        try {
            const imgProps = this.doc.getImageProperties(this.data.general.backgroundImage);
            
            // Calcular les dimensions de la pàgina
            const pageWidth = this.doc.internal.pageSize.getWidth();
            const pageHeight = this.doc.internal.pageSize.getHeight();
            
            // Calcular l'aspect ratio de la imatge i de la pàgina
            const imageAspectRatio = imgProps.width / imgProps.height;
            const pageAspectRatio = pageWidth / pageHeight;
            
            let finalWidth, finalHeight;
            
            // Adaptar la imatge per cobrir el costat més llarg de la pàgina
            if (imageAspectRatio > pageAspectRatio) {
                // La imatge és més ampla que la pàgina - omplir per amplada (costat més llarg)
                finalWidth = pageWidth;
                finalHeight = pageWidth / imageAspectRatio;
            } else {
                // La imatge és més alta que la pàgina - omplir per alçada (costat més llarg)
                finalHeight = pageHeight;
                finalWidth = pageHeight * imageAspectRatio;
            }
            
            // Sense centrar la imatge
            const offsetX = 0;
            const offsetY = 0;
            
            // Guardar l'estat actual del context
            this.doc.saveGraphicsState();
            
            // Dibuixar la imatge de fons cobrint tota la pàgina
            this.doc.addImage(
                this.data.general.backgroundImage, 
                'PNG', 
                offsetX, 
                offsetY, 
                finalWidth, 
                finalHeight, 
                undefined, 
                'NONE'
            );
            
            // Restaurar l'estat del context
            this.doc.restoreGraphicsState();
        } catch (error) {
            Logger.warn('No s\'ha pogut afegir la imatge de fons:', error);
        }
    }

    // --- Mètodes Privats de Dibuix ---

    _drawHeader() {
        if (this.data.general.escut) {
            try {
                const imgProps = this.doc.getImageProperties(this.data.general.escut);
                const aspectRatio = imgProps.width / imgProps.height;
                const finalWidth = HEADER_LOGO_HEIGHT * aspectRatio;
                this.doc.addImage(this.data.general.escut, 'PNG', MARGIN_H, MARGIN_V, finalWidth, HEADER_LOGO_HEIGHT);
                this.currentY = MARGIN_V + HEADER_LOGO_HEIGHT + SPACING.TITLE_AFTER_LOGO;
            } catch (e) {
                Logger.error("No s'ha pogut afegir l'escut:", e);
                this.currentY = MARGIN_V; // Comença des del marge superior si falla el logo
            }
        }
        
        this._applyStyle('TITLE');
        this.doc.text("Informe Fotogràfic", this.pageWidth / 2, this.currentY, { align: STYLES.TITLE.align });
        this.currentY += this._getLineHeight(STYLES.TITLE) * 2;
    }

    _drawGeneralInfo() {
        const { general } = this.data;
        // this._drawBackgroundImage(); // Eliminar la crida d'aquí
        this.currentY = this._drawField("Tipus d'expedient:", general.tipus, this.currentY);
        this.currentY = this._drawField("Número d'expedient:", general.numero, this.currentY);
        this.currentY = this._drawField("Data i hora:", `${general.data}, a les ${general.hora}`, this.currentY);
        this.currentY = this._drawField("Adreça:", general.adreca, this.currentY);
        this.currentY = this._drawField("Assumpte:", general.assumpte, this.currentY);
        this.currentY = this._drawField("Signants:", general.signants, this.currentY);
    }
    
    _isImageVertical(photo) {
        // Com que la imatge ja està girada al frontend, només cal comprovar les seves dimensions directes.
        const imgProps = this.doc.getImageProperties(photo.foto);
        return imgProps.height > imgProps.width;
    }

    _drawAllPhotoBlocks() {
        // Alçades màximes per als blocs de fotos, basades en l'alçada útil d'una pàgina.
        const pageContentHeight = this.pageHeight - (MARGIN_V * 2) - (SPACING.PHOTO_BLOCK_TOP_PADDING);
        const PHOTO_BLOCK_HORIZONTAL_HEIGHT = Math.floor(pageContentHeight / 2);
        const PHOTO_BLOCK_VERTICAL_HEIGHT = Math.floor(pageContentHeight);

        // Calcular espai disponible per a la primera foto
        const signatureSpace = 20; // Espai reservat per a les signatures
        let availableSpaceForFirstPhoto;
        if (this.activePhotos.length > 1) {
            availableSpaceForFirstPhoto = this.pageHeight - this.currentY - MARGIN_V;
        } else {
            availableSpaceForFirstPhoto = this.pageHeight - this.currentY - MARGIN_V - signatureSpace;
        }
                
        // Comprovació per ajustar l'alçada si les dues últimes fotos són horitzontals
        let adjustLastTwoHorizontal = false;
        if (this.activePhotos.length >= 2) {
            const lastPhoto = this.activePhotos[this.activePhotos.length - 1];
            const secondLastPhoto = this.activePhotos[this.activePhotos.length - 2];
            if (!this._isImageVertical(lastPhoto) && !this._isImageVertical(secondLastPhoto)) {
                adjustLastTwoHorizontal = true;
            }
        }

        for (let i = 0; i < this.activePhotos.length; i++) {
            const photo = this.activePhotos[i];
            const isFirstPhoto = i === 0;
            const isLastPhoto = i === this.activePhotos.length - 1;
            const isSecondLastPhoto = i === this.activePhotos.length - 2;

            // 1. Determinar si la foto és vertical per calcular l'alçada del bloc.
            const isVerticalImage = this._isImageVertical(photo);
            let blockHeight = isVerticalImage ? PHOTO_BLOCK_VERTICAL_HEIGHT : PHOTO_BLOCK_HORIZONTAL_HEIGHT;

            // Ajust especial per a la primera foto:aprofitar l'espai disponible
            if (isFirstPhoto && this.activePhotos.length > 0) {
                // Calcular l'alçada mínima necessària per a la primera foto
                const minFirstPhotoHeight = this._calculateMinPhotoBlockHeight(photo);
                
                // Si hi ha espai suficient, ajustar l'alçada peraprofitar l'espai disponible
                if (availableSpaceForFirstPhoto > minFirstPhotoHeight) {
                    // Limitar l'alçada màxima per evitar que la foto sigui massa gran
                    const maxFirstPhotoHeight = Math.min(availableSpaceForFirstPhoto, PHOTO_BLOCK_VERTICAL_HEIGHT);
                    blockHeight = Math.max(minFirstPhotoHeight, maxFirstPhotoHeight);
                }
            }

            // Ajust especial: si és la darrera foto i és vertical, fem el bloc una mica més petit
            // per deixar més espai per a les signatures a la mateixa pàgina si és possible.
            if (isLastPhoto && isVerticalImage) {
                blockHeight -= 10;
            }

            // Ajust especial: si són les dues darreres i són horitzontals, fem els blocs 5mm més petits
            if (adjustLastTwoHorizontal && (isLastPhoto || isSecondLastPhoto)) {
                blockHeight -= 5;
            }

            // 2. Comprovar si el bloc cap a la pàgina actual. Si no, afegir pàgina nova.
            if (this.currentY + blockHeight > this.pageHeight - MARGIN_V) {
                this.doc.addPage();
                this._drawBackgroundImage(); // Dibuixar imatge de fons a la nova pàgina
                this.currentY = MARGIN_V;
                // Reiniciem els comptadors per a la nova pàgina
                this.lastPagePhotoCount = 0;
                this.lastPageHasVertical = false;
            }

            this._drawPhotoBlock(photo, this.currentY, blockHeight);
            this.currentY += blockHeight;

            // Actualitzem els comptadors per a la pàgina actual
            this.lastPagePhotoCount++;
            if (isVerticalImage) this.lastPageHasVertical = true;
        }
    }

    /**
     * Calcula l'alçada mínima necessària per a un bloc de foto
     * @param {object} photo - L'objecte foto
     * @returns {number} L'alçada mínima en mm
     */
    _calculateMinPhotoBlockHeight(photo) {
        // Alçada del títol de la foto
        const titleHeight = this._getLineHeight(STYLES.LABEL) + SPACING.PHOTO_TITLE_TO_IMG;
        
        // Alçada mínima de la imatge (mínim 30mm per a una imatge visible)
        const minImageHeight = 30;
        
        // Alçada de la descripció (estimat mínim)
        const minDescriptionHeight = photo.descripcio ? this._getLineHeight(STYLES.DESCRIPTION) * 2 : 0;
        
        // Espaiat superior del bloc
        const topPadding = SPACING.PHOTO_BLOCK_TOP_PADDING;
        
        // Espai entre imatge i descripció
        const imageToDescSpacing = SPACING.PHOTO_IMG_TO_DESC;
        
        return topPadding + titleHeight + minImageHeight + imageToDescSpacing + minDescriptionHeight;
    }

    _drawPhotoBlock(photo, y, blockHeight) {
        let blockCurrentY = y;
        
        // Afegir espaiat superior dins del bloc
        blockCurrentY += SPACING.PHOTO_BLOCK_TOP_PADDING;

        // Dibuixar Títol de la Foto
        this._applyStyle('LABEL');
        const titleLabel = `Fotografia ${photo.number}: `;
        this.doc.text(titleLabel, MARGIN_H, blockCurrentY);
        
        this._applyStyle('VALUE');
        const labelWidth = this.doc.getTextWidth(titleLabel);
        this.doc.text(photo.titol || '', MARGIN_H + labelWidth + SPACING.LABEL_TO_VALUE, blockCurrentY);
        blockCurrentY += this._getLineHeight(STYLES.LABEL) + SPACING.PHOTO_TITLE_TO_IMG;
        
        // Càlcul preliminar de l'alçada de la descripció per reservar espai.
        // Es fa amb l'amplada màxima per tenir una estimació segura (el text no ocuparà més alçada que això).
        this._applyStyle('DESCRIPTION');
        const preliminaryDescLines = photo.descripcio ? this.doc.splitTextToSize(photo.descripcio, this.contentWidth) : [];
        const descriptionTextHeight = preliminaryDescLines.length * this._getLineHeight(STYLES.DESCRIPTION);
        
        // Calcular dimensions de la Imatge
        const availableHeightForImage = blockHeight - (blockCurrentY - y) - descriptionTextHeight - SPACING.PHOTO_IMG_TO_DESC;
        const imgProps = this.doc.getImageProperties(photo.foto);

        const aspectRatio = imgProps.height / imgProps.width;

        let finalImgWidth = this.contentWidth;
        let finalImgHeight = finalImgWidth * aspectRatio;

        if (finalImgHeight > availableHeightForImage) {
            finalImgHeight = availableHeightForImage;
            finalImgWidth = finalImgHeight / aspectRatio;
        }

        // Dibuixar Imatge (centrada horitzontalment)
        const boxX = MARGIN_H + (this.contentWidth - finalImgWidth) / 2;
        const boxY = blockCurrentY;
 
        // La imatge ja està en la posició correcta, no cal cap rotació ni ajust de coordenades.
        this.doc.addImage(photo.foto, photo.format, boxX, boxY, finalImgWidth, finalImgHeight, undefined, 'FAST');

        // Dibuixar el marc de la imatge
        this.doc.setLineWidth(IMAGE_BORDER_WIDTH);
        this.doc.rect(boxX, boxY, finalImgWidth, finalImgHeight, 'S');

        blockCurrentY += finalImgHeight + SPACING.PHOTO_IMG_TO_DESC;

        // Dibuixar Descripció
        if (photo.descripcio) {
            this._applyStyle('DESCRIPTION');
            const finalDescLines = this.doc.splitTextToSize(photo.descripcio, finalImgWidth);
            this.doc.text(finalDescLines, boxX, blockCurrentY, { align: STYLES.DESCRIPTION.align, maxWidth: finalImgWidth });
        }
    }

    _drawSignatures() {
        const hasOneVerticalOnLastPage = this.lastPagePhotoCount === 1 && this.lastPageHasVertical;
        const hasTwoHorizontalOnLastPage = this.lastPagePhotoCount === 2 && !this.lastPageHasVertical;

        // Si a l'última pàgina hi ha una foto vertical o dues d'horitzontals,
        // la posició de la signatura és fixa per assegurar que quedi al final de la pàgina.
        if (this.activePhotos.length > 0 && (hasOneVerticalOnLastPage || hasTwoHorizontalOnLastPage)) {
            this.currentY = 272;
        } else {
            this.currentY += SPACING.SECTION; // Més espai abans de les signatures
        }

        // Comprovació de salt de pàgina
        this._applyStyle('SIGNATURES_TITLE');
        const titleHeight = this._getLineHeight(STYLES.SIGNATURES_TITLE);
        
        if (this.currentY + titleHeight > this.pageHeight - MARGIN_V) {
            this.doc.addPage();
            this._drawBackgroundImage(); // Dibuixar imatge de fons a la nova pàgina
            this.currentY = MARGIN_V;
        }

        this._applyStyle('SIGNATURES_TITLE');
        this.doc.text("Signatures:", MARGIN_H, this.currentY);

        // Dibuixar imatge de signatura si existeix
        if (this.data.general.signatureImage) {
            try {
                const imgProps = this.doc.getImageProperties(this.data.general.signatureImage);
                const originalWidth = imgProps.width;
                const originalHeight = imgProps.height;
                const pdfConfig = getPDFConfig(); // Obtenir configuració de PDF
                const maxImgHeight = pdfConfig.signatureImage.maxHeight; // Alçada màxima des de config
                const maxImgWidth = pdfConfig.signatureImage.maxWidth; // Amplada màxima des de config

                let finalWidth = originalWidth;
                let finalHeight = originalHeight;

                // Escalar per alçada si és massa alta
                if (finalHeight > maxImgHeight) {
                    finalWidth = (maxImgHeight / finalHeight) * finalWidth;
                    finalHeight = maxImgHeight;
                }
                
                // Escalar per amplada si és massa ample (després d'escalar per alçada)
                if (finalWidth > maxImgWidth) {
                    finalHeight = (maxImgWidth / finalWidth) * finalHeight;
                    finalWidth = maxImgWidth;
                }

                // Posicionar la imatge
                const textWidth = this.doc.getTextWidth("Signatures:");
                const signatureX = MARGIN_H + textWidth + 3; // 3mm a la dreta del text
                let signatureY;

                // Ajustar posició vertical si l'amplada és el doble de l'alçada màxima
                if (finalWidth > (2 * maxImgHeight)) {
                    signatureY = this.currentY - 3
                } else {
                    signatureY = this.currentY - 8; // Ajustar cap amunt per alinear verticalment (ajustable)
                }

                this.doc.addImage(
                    this.data.general.signatureImage,
                    'PNG',
                    signatureX,
                    signatureY,
                    finalWidth,
                    finalHeight,
                    null,
                    'FAST'
                );
                // Ajustar currentY si la imatge és més gran que l'alçada del títol
                if (finalHeight > titleHeight) {
                    this.currentY += finalHeight + 5; // Marge extra després de la signatura
                }
            } catch (error) {
                Logger.error('No s\'ha pogut afegir la imatge de signatura:', error);
            }
        }
    }

    _addPageNumbers() {
        const totalPages = this.doc.internal.getNumberOfPages();
        this._applyStyle('PAGINATION');

        for (let i = 1; i <= totalPages; i++) {
            this.doc.setPage(i);
            // Dibuixar número de pàgina
            const pageText = `Pàgina ${i} de ${totalPages}`;
            this.doc.text(pageText, this.pageWidth - MARGIN_H, MARGIN_V, { align: STYLES.PAGINATION.align });
        }
    }

    _save() {
        const filename = `Informe_fotogràfic_${this.data.general.numero}_${Date.now()}.pdf`;
        this.doc.save(filename);
    }

    // --- Mètodes Ajudants (Helpers) ---

    _applyStyle(styleName) {
        const style = STYLES[styleName];
        if (style) {
            this.doc.setFont(style.family, style.style);
            this.doc.setFontSize(style.size);
        }
    }

    _getLineHeight(style) {
        // Retorna l'alçada de línia en 'mm' per a un estil donat
        const lineHeightFactor = style.lineHeight || 1.15;
        return (style.size * lineHeightFactor) * PT_TO_MM_FACTOR;
    }

    _drawField(label, value, y) {
        const fieldPadding = SPACING.FIELD;

        // Dibuixa l'etiqueta
        this._applyStyle('LABEL');
        const labelWidth = this.doc.getTextWidth(label);
        this.doc.text(label, MARGIN_H, y, { align: STYLES.LABEL.align });

        // Dibuixa el valor
        if ( value ) {
            this._applyStyle('VALUE');
            const valueX = MARGIN_H + labelWidth + SPACING.LABEL_TO_VALUE;
            const valueMaxWidth = this.contentWidth - labelWidth - SPACING.LABEL_TO_VALUE;
            const valueLines = this.doc.splitTextToSize(value, valueMaxWidth);
            this.doc.text(valueLines, valueX, y, { align: STYLES.VALUE.align });
            return y + (valueLines.length * this._getLineHeight(STYLES.VALUE)) + fieldPadding;
        } else {
            return y + (label.length * this._getLineHeight(STYLES.LABEL)) + fieldPadding;
        }
    }
}

/**
 * Funció exportada que crea i genera el document PDF.
 * Aquesta és l'única funció que necessites cridar des de fora.
 * @param {object} reportData - L'objecte amb les dades recollides del formulari.
 * @param {boolean} saveToDatabase - Si es vol guardar a la base de dades (requereix autenticació)
 */
export async function generateClientPdf(reportData, saveToDatabase = false) {
    // Guardar l'informe a la base de dades si està autenticat i es demana
    if (saveToDatabase) {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Eliminar el camp 'dia' si existeix abans d'enviar al servidor
                if (reportData && reportData.general && reportData.general.hasOwnProperty('dia')) {
                    delete reportData.general.dia;
                }

                const response = await fetch('/api/reports', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: `Informe Fotogràfic - ${new Date().toLocaleDateString('ca-ES')}`,
                        report_data: reportData
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    Logger.info('Informe guardat amb ID:', result.report.id);
                    
                    // Disparar esdeveniment per actualitzar l'estat del informe
                    const event = new CustomEvent('reportCreated', {
                        detail: {
                            reportId: result.report.id,
                            reportData: result.report
                        }
                    });
                    document.dispatchEvent(event);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || 'Error desconegut';
                    Logger.warn('No s\'ha pogut guardar l\'informe a la base de dades:', errorMessage);
                    
                    // Mostrar notificació d'error específica
                    if (response.status === 401) {
                        Logger.error('Error d\'autenticació en crear informe');
                    } else if (response.status === 400) {
                        Logger.error('Error en les dades enviades:', errorMessage);
                    } else {
                        Logger.error('Error del servidor en crear informe:', errorMessage);
                    }
                }
            } else {
                Logger.warn('No hi ha token d\'autenticació per guardar l\'informe');
            }
        } catch (error) {
            Logger.error('Error en guardar l\'informe:', error);
            // Continuar amb la generació del PDF encara que falli el guardat
        }
    }

    // Generar el PDF
    const generator = new PhotographicReportGenerator(reportData);
    generator.generate();
}