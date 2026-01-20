/**
 * Middleware d'autenticació per a rutes protegides
 */

import { TokenUtils } from '../utils/tokenUtils.js';
import { createDatabase } from '../../database/database.js';

export async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = TokenUtils.extractTokenFromHeader(authHeader);
        if (!token) {
            return res.status(401).json({ error: 'Token d\'autenticació requerit' });
        }
        // Verificar i decodificar el token
        const decoded = TokenUtils.verifyToken(token);
        // Buscar usuari a la base de dades
        const db = createDatabase();
        await db.connect();
        const user = await db.queryOne('SELECT id, email, name, role, is_active FROM users WHERE id = ?', [decoded.userId]);
        await db.close();
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Usuari no vàlid o desactivat' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: error.message || 'Token invàlid' });
    }
} 