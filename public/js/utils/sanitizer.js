/**
 * Utilitats per a la sanitització de dades d'entrada
 * Protegeix contra XSS, injecció de codi i dades malicioses
 * Utilitza configuració centralitzada des de frontendConfig
 */

import { getSanitizationConfig } from '../config/frontendConfig.js';

export class DataSanitizer {
    /**
     * Sanititza text general (títols, descripcions, assumptes)
     * @param {string} text - Text a sanititzar
     * @returns {string} Text sanititzat
     */
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        
        const config = getSanitizationConfig('text');
        let sanitized = text;
        
        if (config.removeScriptTags) {
            sanitized = sanitized.replace(/[<>]/g, '');
        }
        if (config.removeJavaScript) {
            sanitized = sanitized.replace(/javascript:/gi, '');
        }
        if (config.removeEventHandlers) {
            sanitized = sanitized.replace(/on\w+=/gi, '');
        }
        if (config.removeDataUrls) {
            sanitized = sanitized.replace(/data:/gi, '');
        }
        if (config.removeVbScript) {
            sanitized = sanitized.replace(/vbscript:/gi, '');
        }
        if (config.removeControlChars) {
            sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (config.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        return sanitized.substring(0, config.maxLength);
    }
    
    /**
     * Sanititza números d'expedient
     * @param {string} number - Número d'expedient a sanititzar
     * @returns {string} Número sanititzat
     */
    static sanitizeExpedientNumber(number) {
        if (!number || typeof number !== 'string') return '';
        
        const config = getSanitizationConfig('expedientNumber');
        let sanitized = number;
        
        if (config.allowedChars) {
            sanitized = sanitized.replace(config.allowedChars, '');
        }
        if (config.removeControlChars) {
            sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (config.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        return sanitized.substring(0, config.maxLength);
    }
    
    /**
     * Sanititza adreces
     * @param {string} address - Adreça a sanititzar
     * @returns {string} Adreça sanititzada
     */
    static sanitizeAddress(address) {
        if (!address || typeof address !== 'string') return '';
        
        const config = getSanitizationConfig('address');
        let sanitized = address;
        
        if (config.removeScriptTags) {
            sanitized = sanitized.replace(/[<>]/g, '');
        }
        if (config.removeJavaScript) {
            sanitized = sanitized.replace(/javascript:/gi, '');
        }
        if (config.removeEventHandlers) {
            sanitized = sanitized.replace(/on\w+=/gi, '');
        }
        if (config.removeControlChars) {
            sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (config.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        return sanitized.substring(0, config.maxLength);
    }
    
    /**
     * Sanititza noms de fitxers
     * @param {string} filename - Nom del fitxer a sanititzar
     * @returns {string} Nom sanititzat
     */
    static sanitizeFileName(filename) {
        if (!filename || typeof filename !== 'string') return '';
        
        const config = getSanitizationConfig('fileName');
        let sanitized = filename;
        
        if (config.invalidFileChars) {
            sanitized = sanitized.replace(config.invalidFileChars, '');
        }
        if (config.removeParentDirRefs) {
            sanitized = sanitized.replace(/\.\./g, '');
        }
        if (config.removeLeadingDot) {
            sanitized = sanitized.replace(/^\./, '');
        }
        if (config.removeControlChars) {
            sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (config.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        return sanitized.substring(0, config.maxLength);
    }
    
    /**
     * Sanititza tipus d'expedient
     * @param {string} type - Tipus d'expedient a sanititzar
     * @returns {string} Tipus sanititzat
     */
    static sanitizeExpedientType(type) {
        if (!type || typeof type !== 'string') return '';
        
        const config = getSanitizationConfig('expedientType');
        let sanitized = type;
        
        if (config.removeScriptTags) {
            sanitized = sanitized.replace(/[<>]/g, '');
        }
        if (config.removeJavaScript) {
            sanitized = sanitized.replace(/javascript:/gi, '');
        }
        if (config.removeControlChars) {
            sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (config.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        return sanitized.substring(0, config.maxLength);
    }
    
    /**
     * Sanititza signants
     * @param {string} signers - Signants a sanititzar
     * @returns {string} Signants sanititzats
     */
    static sanitizeSigners(signers) {
        if (!signers || typeof signers !== 'string') return '';
        
        const config = getSanitizationConfig('signers');
        let sanitized = signers;
        
        if (config.removeScriptTags) {
            sanitized = sanitized.replace(/[<>]/g, '');
        }
        if (config.removeJavaScript) {
            sanitized = sanitized.replace(/javascript:/gi, '');
        }
        if (config.removeEventHandlers) {
            sanitized = sanitized.replace(/on\w+=/gi, '');
        }
        if (config.removeControlChars) {
            sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (config.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        return sanitized.substring(0, config.maxLength);
    }
    
    /**
     * Valida si una cadena conté caràcters perillosos
     * @param {string} text - Text a validar
     * @returns {boolean} True si és segur, false si conté caràcters perillosos
     */
    static isSafe(text) {
        if (!text || typeof text !== 'string' || text.trim() === '') return true;
        
        const config = getSanitizationConfig('text');
        const dangerousPatterns = config.dangerousPatterns || getSanitizationConfig('dangerousPatterns');
        
        return !dangerousPatterns.some(pattern => pattern.test(text));
    }
} 