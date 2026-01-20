/**
 * Utilitats per a la gestió de tokens JWT
 */

import jwt from 'jsonwebtoken';

// Clau secreta per a JWT (en producció, utilitzar variable d'entorn)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class TokenUtils {
    /**
     * Generar token JWT d'accés
     * @param {Object} payload - Dades a incloure en el token
     * @param {string} expiresIn - Temps d'expiració (per defecte 24h)
     * @returns {string} Token JWT
     */
    static generateAccessToken(payload, expiresIn = JWT_EXPIRES_IN) {
        try {
            const token = jwt.sign(payload, JWT_SECRET, {
                expiresIn,
                issuer: 'informe-fotografic',
                audience: 'users'
            });
            return token;
        } catch (error) {
            throw new Error(`Error en generar token d'accés: ${error.message}`);
        }
    }

    /**
     * Generar token JWT de refresc
     * @param {Object} payload - Dades a incloure en el token
     * @param {string} expiresIn - Temps d'expiració (per defecte 7d)
     * @returns {string} Token JWT de refresc
     */
    static generateRefreshToken(payload, expiresIn = JWT_REFRESH_EXPIRES_IN) {
        try {
            const token = jwt.sign(payload, JWT_SECRET, {
                expiresIn,
                issuer: 'informe-fotografic',
                audience: 'refresh'
            });
            return token;
        } catch (error) {
            throw new Error(`Error en generar token de refresc: ${error.message}`);
        }
    }

    /**
     * Verificar i decodificar un token JWT
     * @param {string} token - Token JWT a verificar
     * @param {string} audience - Audiència esperada (per defecte 'users')
     * @returns {Object} Payload decodificat
     */
    static verifyToken(token, audience = 'users') {
        try {
            const decoded = jwt.verify(token, JWT_SECRET, {
                issuer: 'informe-fotografic',
                audience
            });
            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expirat');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token invàlid');
            } else {
                throw new Error(`Error en verificar token: ${error.message}`);
            }
        }
    }

    /**
     * Decodificar un token JWT sense verificar (només per a informació)
     * @param {string} token - Token JWT a decodificar
     * @returns {Object} Payload decodificat
     */
    static decodeToken(token) {
        try {
            const decoded = jwt.decode(token);
            return decoded;
        } catch (error) {
            throw new Error(`Error en decodificar token: ${error.message}`);
        }
    }

    /**
     * Generar tokens d'accés i refresc per a un usuari
     * @param {Object} user - Dades de l'usuari
     * @returns {Object} Tokens generats
     */
    static generateTokenPair(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        return {
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRES_IN
        };
    }

    /**
     * Refrescar un token d'accés utilitzant un token de refresc
     * @param {string} refreshToken - Token de refresc
     * @returns {Object} Nou token d'accés
     */
    static refreshAccessToken(refreshToken) {
        try {
            // Verificar el token de refresc
            const decoded = this.verifyToken(refreshToken, 'refresh');
            
            // Generar nou token d'accés
            const payload = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name
            };

            const newAccessToken = this.generateAccessToken(payload);

            return {
                accessToken: newAccessToken,
                expiresIn: JWT_EXPIRES_IN
            };
        } catch (error) {
            throw new Error(`Error en refrescar token: ${error.message}`);
        }
    }

    /**
     * Extraure token del header Authorization
     * @param {string} authHeader - Header Authorization
     * @returns {string|null} Token extraït
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    /**
     * Verificar si un token està a punt d'expirar
     * @param {string} token - Token JWT
     * @param {number} thresholdMinutes - Minuts abans de l'expiració (per defecte 30)
     * @returns {boolean} True si està a punt d'expirar
     */
    static isTokenExpiringSoon(token, thresholdMinutes = 30) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return false;
            }

            const now = Math.floor(Date.now() / 1000);
            const threshold = thresholdMinutes * 60; // Convertir a segons

            return (decoded.exp - now) <= threshold;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtenir informació d'un token sense verificar-lo
     * @param {string} token - Token JWT
     * @returns {Object} Informació del token
     */
    static getTokenInfo(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded) {
                return null;
            }

            const now = Math.floor(Date.now() / 1000);
            const isExpired = decoded.exp ? decoded.exp < now : false;
            const expiresIn = decoded.exp ? decoded.exp - now : null;

            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name,
                issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null,
                expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
                isExpired,
                expiresIn,
                audience: decoded.aud,
                issuer: decoded.iss
            };
        } catch (error) {
            return null;
        }
    }
} 