import { ErrorBoundary, Logger } from '../utils/errorHandler.js';

/**
 * Servei de gestió de fitxers
 * Centralitza tota la lògica relacionada amb fitxers
 */

export class FileService {
    /**
     * Convertir fitxer a Base64
     * @param {File} file - Fitxer a convertir
     * @returns {Promise<string>} String Base64
     */
    static async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error en llegir el fitxer'));
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convertir Base64 a File
     * @param {string} base64 - String Base64
     * @param {string} filename - Nom del fitxer
     * @param {string} mimeType - Tipus MIME
     * @returns {File} Objecte File
     */
    static base64ToFile(base64, filename, mimeType = 'image/jpeg') {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new File([ab], filename, { type: mimeType });
    }

    /**
     * Garantir que totes les fotos tenen un id únic
     * @param {Array} photos - Array de fotos
     * @returns {Array} Array de fotos amb ids únics
     */
    static ensurePhotoIds(photos) {
        let nextId = 1;
        return photos.map(photo => ({
            ...photo,
            id: photo.id || nextId++
        }));
    }

    /**
     * Descarregar fitxer al navegador
     * @param {Blob} blob - Blob del fitxer a descarregar
     * @param {string} filename - Nom del fitxer
     */
    static downloadFile(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Alliberar la memòria
                URL.revokeObjectURL(url);
                } catch (error) {
            Logger.error('Error en descarregar el fitxer:', error);
            throw new Error('Error en descarregar el fitxer');
        }
    }
} 