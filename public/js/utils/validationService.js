/**
 * Servei de validació centralitzat
 * Gestiona tota la validació de dades de l'aplicació
 */

import { FORM_FIELDS } from '../modules/formManager.js';
import { DataSanitizer } from '../utils/sanitizer.js';

export class ValidationService {
    /**
     * Validar i sanititzar text d'entrada
     * @param {string} text - Text a validar i sanititzar
     * @param {string} type - Tipus de sanitització ('text', 'fileName', 'description')
     * @returns {Object} Resultat amb text sanititzat i validació
     */
    static validateAndSanitize(text, type = 'text') {
        let sanitized;
        
        switch(type) {
            case 'fileName':
                sanitized = DataSanitizer.sanitizeFileName(text);
                break;
            case 'expedientNumber':
                sanitized = DataSanitizer.sanitizeExpedientNumber(text);
                break;
            case 'address':
                sanitized = DataSanitizer.sanitizeAddress(text);
                break;
            case 'expedientType':
                sanitized = DataSanitizer.sanitizeExpedientType(text);
                break;
            case 'signers':
                sanitized = DataSanitizer.sanitizeSigners(text);
                break;
            case 'photoTitle':
                sanitized = DataSanitizer.sanitizeText(text);
                break;
            default:
                sanitized = DataSanitizer.sanitizeText(text);
        }
        
        return {
            isValid: DataSanitizer.isSafe(sanitized),
            sanitized,
            original: text,
            errors: sanitized.length === 0 ? [] : 
                   !DataSanitizer.isSafe(sanitized) ? ['El text conté caràcters perillosos'] : []
        };
    }

    /**
     * Validar i sanititzar nom de fitxer
     * @param {string} fileName - Nom de fitxer a validar
     * @returns {Object} Resultat amb nom sanititzat i validació
     */
    static validateAndSanitizeFileName(fileName) {
        return this.validateAndSanitize(fileName, 'fileName');
    }

    /**
     * Validar i sanititzar descripció
     * @param {string} description - Descripció a validar
     * @returns {Object} Resultat amb descripció sanititzada i validació
     */
    static validateAndSanitizeDescription(description) {
        return this.validateAndSanitize(description, 'text');
    }

    /**
     * Validar i sanititzar títol de foto (permite buit)
     * @param {string} title - Títol de foto a validar
     * @returns {Object} Resultat amb títol sanititzat i validació
     */
    static validateAndSanitizePhotoTitle(title) {
        return this.validateAndSanitize(title, 'photoTitle');
    }

    /**
     * Validar força del password
     * @param {string} password - Password a validar
     * @returns {Object} Resultat de la validació
     */
    static validatePassword(password) {
        const errors = [];
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        if (!checks.length) errors.push('Mínim 8 caràcters');
        if (!checks.uppercase) errors.push('Almenys una majúscula');
        if (!checks.lowercase) errors.push('Almenys una minúscula');
        if (!checks.number) errors.push('Almenys un número');
        if (!checks.special) errors.push('Almenys un caràcter especial');

        const strength = Object.values(checks).filter(Boolean).length;
        let strengthText = 'dèbil';
        if (strength >= 4) strengthText = 'fort';
        else if (strength >= 3) strengthText = 'bo';
        else if (strength >= 2) strengthText = 'regular';

        return {
            isValid: errors.length === 0,
            errors,
            strength,
            strengthText
        };
    }

    /**
     * Validar email
     * @param {string} email - Email a validar
     * @returns {boolean} Si és vàlid
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar fitxer
     * @param {File} file - Fitxer a validar
     * @param {Object} options - Opcions de validació
     * @returns {Object} Resultat de la validació
     */
    static validateFile(file, options = {}) {
        // Configuració per defecte (es pot carregar del servidor)
        const defaultConfig = {
            maxSize: 20 * 1024 * 1024, // 20MB per defecte
            allowedTypes: ['image/jpeg', 'image/png']
        };
        
        const {
            maxSize = defaultConfig.maxSize,
            allowedTypes = defaultConfig.allowedTypes
        } = options;

        if (!file) {
            return { isValid: false, errors: ['No s\'ha seleccionat cap fitxer'] };
        }

            const errors = [];

            if (file.size > maxSize) {
                errors.push('El fitxer és massa gran');
            }
            if (!allowedTypes.includes(file.type)) {
                errors.push('Tipus de fitxer no permès. Permesos: Jpeg, i Png');
            }
            
        return {
                isValid: errors.length === 0,
                errors
            };
    }

    /**
     * Validar formulari d'informe
     * @param {Object} formData - Dades del formulari
     * @returns {Object} Resultat de la validació
     */
    static validateReportForm(formData) {
        const errors = [];
        const requiredFields = FORM_FIELDS;

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push(`El camp "${field}" és obligatori`);
            }
        });

        // Validacions específiques
        if (formData.data && !this.validateDate(formData.data)) {
            errors.push('Format de data invàlid');
        }

        if (formData.hora && !this.validateTime(formData.hora)) {
            errors.push('Format d\'hora invàlid');
        }

        return {
            isValid: errors.length === 0,
            errors,
            missingFields: requiredFields.filter(field => !formData[field] || formData[field].trim() === '')
        };
    }

    /**
     * Validar dades de formulari d'informe
     * @param {Object} formData
     * @returns {Object}
     */
    static validateFormData(formData) {
        const requiredFields = FORM_FIELDS;
        const errors = [];
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} és obligatori`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validar dades completes d'informe
     * @param {Object} reportData
     * @returns {Object}
     */
    static validateReportData(reportData) {
        const errors = [];
        // Validar general
        if (!reportData.general) {
            errors.push('Falten dades generals');
        } else {
            const general = reportData.general;
            if (!general.tipus || general.tipus.trim() === '') errors.push("Tipus d'expedient és obligatori");
            if (!general.numero || general.numero.trim() === '') errors.push('Número d\'expedient és obligatori');
            if (!general.data || general.data.trim() === '') errors.push('Data és obligatòria');
            if (!general.hora || general.hora.trim() === '') errors.push('Hora és obligatòria');
            if (!general.adreca || general.adreca.trim() === '') errors.push('Adreça és obligatòria');
            if (!general.assumpte || general.assumpte.trim() === '') errors.push('Assumpte és obligatori');
            if (!general.signants || general.signants.trim() === '') errors.push('Signants és obligatori');
            if (general.data && !/^\d{4}-\d{2}-\d{2}$/.test(general.data)) errors.push('Format de data invàlid');
            if (general.hora && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(general.hora)) errors.push("Format d'hora invàlid");
        }
        // Validar fotos (opcional)
        if (reportData.photos && Array.isArray(reportData.photos)) {
            reportData.photos.forEach((photo, idx) => {
                // Si vols validar camps obligatoris de fotos, afegeix aquí
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validar data
     * @param {string} date - Data a validar (YYYY-MM-DD)
     * @returns {boolean} Si és vàlida
     */
    static validateDate(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
    }

    /**
     * Validar hora
     * @param {string} time - Hora a validar (HH:MM)
     * @returns {boolean} Si és vàlida
     */
    static validateTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    /**
     * Validar JSON
     * @param {string} jsonString - String JSON a validar
     * @returns {Object} Resultat de la validació
     */
    static validateJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return { isValid: true, errors: [] };
        } catch (error) {
            return {
                isValid: false,
                errors: [`JSON invàlid: ${error.message}`] 
            };
        }
    }

    /**
     * Validar valor genèric amb regles
     * @param {string} value - Valor a validar
     * @param {Object} rule - Regla de validació
     * @returns {Object} Resultat de la validació
     */
    static validate(value, rule) {
        const errors = [];
        
        // Validar si és obligatori
        if (rule.required && (!value || value.trim() === '')) {
            errors.push('Aquest camp és obligatori');
        }
        
        // Si no hi ha valor i no és obligatori, és vàlid
        if (!value || value.trim() === '') {
            return { isValid: errors.length === 0, errors };
        }
        
        // Validar longitud mínima
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Mínim ${rule.minLength} caràcters`);
        }
        
        // Validar longitud màxima
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`Màxim ${rule.maxLength} caràcters`);
        }
        
        // Validar patró
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(rule.message || 'Format invàlid');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validar dades d'usuari
     * @param {Object} userData - Dades d'usuari
     * @returns {Object} Resultat de la validació
     */
    static validateUserData(userData) {
        const errors = [];

        if (!userData.name || userData.name.trim().length < 2) {
            errors.push('El nom ha de tenir almenys 2 caràcters');
        }

        if (!userData.email || !this.validateEmail(userData.email)) {
            errors.push('Email invàlid');
        }

        if (userData.password) {
            const passwordValidation = this.validatePassword(userData.password);
            if (!passwordValidation.isValid) {
                errors.push(...passwordValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanititzar text
     * @param {string} text - Text a sanititzar
     * @returns {string} Text sanititzat
     */
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/[<>]/g, '') // Eliminar caràcters perillosos
            .substring(0, 1000); // Límit de longitud
    }

    /**
     * Sanititzar nom de fitxer
     * @param {string} filename - Nom del fitxer
     * @returns {string} Nom sanititzat
     */
    static sanitizeFilename(filename) {
        if (typeof filename !== 'string') return 'file';
        
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Només caràcters segurs
            .substring(0, 100); // Límit de longitud
    }

    /**
     * Validar mida de dades
     * @param {Object} data - Dades a validar
     * @param {number} maxSizeMB - Mida màxima en MB
     * @returns {Object} Resultat de la validació
     */
    static validateDataSize(data, maxSizeMB = 50) {
        const jsonString = JSON.stringify(data);
        const sizeInBytes = new Blob([jsonString]).size;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        return {
            isValid: sizeInMB <= maxSizeMB,
            sizeInMB: sizeInMB.toFixed(2),
            maxSizeMB,
            sizeInBytes
        };
    }
} 