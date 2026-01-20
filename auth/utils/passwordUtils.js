/**
 * Utilitats per a la gestió segura de passwords
 */

import bcrypt from 'bcryptjs';

export class PasswordUtils {
    /**
     * Generar hash d'un password
     * @param {string} password - Password en text pla
     * @param {number} saltRounds - Rondes de salt (per defecte 10)
     * @returns {Promise<string>} Hash del password
     */
    static async hashPassword(password, saltRounds = 10) {
        try {
            const hash = await bcrypt.hash(password, saltRounds);
            return hash;
        } catch (error) {
            throw new Error(`Error en generar hash del password: ${error.message}`);
        }
    }

    /**
     * Verificar si un password coincideix amb el seu hash
     * @param {string} password - Password en text pla
     * @param {string} hash - Hash del password
     * @returns {Promise<boolean>} True si coincideix
     */
    static async verifyPassword(password, hash) {
        try {
            const isValid = await bcrypt.compare(password, hash);
            return isValid;
        } catch (error) {
            throw new Error(`Error en verificar password: ${error.message}`);
        }
    }

    /**
     * Validar força d'un password
     * @param {string} password - Password a validar
     * @returns {Object} Resultat de la validació
     */
    static validatePasswordStrength(password) {
        const errors = [];
        const warnings = [];

        // Longitud mínima
        if (password.length < 8) {
            errors.push('El password ha de tenir almenys 8 caràcters');
        } else if (password.length < 12) {
            warnings.push('Es recomana un password d\'almenys 12 caràcters');
        }

        // Majúscules
        if (!/[A-Z]/.test(password)) {
            errors.push('El password ha de contenir almenys una majúscula');
        }

        // Minúscules
        if (!/[a-z]/.test(password)) {
            errors.push('El password ha de contenir almenys una minúscula');
        }

        // Números
        if (!/\d/.test(password)) {
            errors.push('El password ha de contenir almenys un número');
        }

        // Caràcters especials (obligatoris)
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('El password ha de contenir almenys un símbol (!@#$%^&*...)');
        }

        // Password comú
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('No pots utilitzar un password comú');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: this.calculatePasswordScore(password)
        };
    }

    /**
     * Calcular puntuació de seguretat del password
     * @param {string} password - Password a avaluar
     * @returns {number} Puntuació de 0 a 100
     */
    static calculatePasswordScore(password) {
        let score = 0;

        // Longitud
        if (password.length >= 8) score += 10;
        if (password.length >= 12) score += 10;
        if (password.length >= 16) score += 10;

        // Varietat de caràcters
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/\d/.test(password)) score += 10;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

        // Complexitat
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= 8) score += 10;
        if (uniqueChars >= 12) score += 10;

        // Evitar patrons
        if (!/(.)\1{2,}/.test(password)) score += 10; // No 3 caràcters iguals seguits
        if (!/(.)(.)\1\2/.test(password)) score += 10; // No patrons repetits

        return Math.min(score, 100);
    }

    /**
     * Generar password aleatori segur
     * @param {number} length - Longitud del password (per defecte 16)
     * @returns {string} Password generat
     */
    static generateSecurePassword(length = 16) {
        const charset = {
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            numbers: '0123456789',
            symbols: '!@#$%^&*(),.?":{}|<>'
        };

        let password = '';
        const allChars = Object.values(charset).join('');

        // Assegurar que hi ha almenys un caràcter de cada tipus
        password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
        password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
        password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
        password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

        // Completar la resta del password
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Barrejar els caràcters
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
} 