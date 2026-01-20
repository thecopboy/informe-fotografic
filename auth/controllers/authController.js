/**
 * Controlador d'autenticació d'usuaris
 */

import { createDatabase } from '../../database/database.js';
import { PasswordUtils } from '../utils/passwordUtils.js';
import { TokenUtils } from '../utils/tokenUtils.js';

export const authController = {
    /**
     * Registre d'un nou usuari
     */
    async register(req, res) {
        try {
            const { email, password, name } = req.body;
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Falten camps obligatoris' });
            }

            // Validar força del password
            const pwCheck = PasswordUtils.validatePasswordStrength(password);
            if (!pwCheck.isValid) {
                return res.status(400).json({ error: 'Password dèbil', details: pwCheck.errors });
            }

            // Connexió i operacions de base de dades
            const db = createDatabase();
            await db.connect();
            
            try {
                // Comprovar si l'email ja existeix
                const existing = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
                if (existing) {
                    return res.status(409).json({ error: 'Ja existeix un usuari amb aquest email' });
                }

                // Hash del password
                const hash = await PasswordUtils.hashPassword(password);
                const result = await db.run(
                    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
                    [email, hash, name, 'user']
                );

                // Retornar info bàsica
                return res.status(201).json({
                    message: 'Usuari registrat correctament',
                    user: {
                        id: result.lastID,
                        email,
                        name,
                        role: 'user'
                    }
                });
            } finally {
                // Sempre tancar la connexió
                await db.close();
            }
        } catch (error) {
            console.error('Error en registrar usuari:', error);
            return res.status(500).json({ error: 'Error intern en registrar usuari' });
        }
    },

    /**
     * Login d'usuari
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ 
                    error: 'Falten camps obligatoris',
                    details: {
                        email: !email ? 'Falta email' : 'OK',
                        password: !password ? 'Falta password' : 'OK'
                    }
                });
            }
            
            // Connexió i operacions de base de dades
            const db = createDatabase();
            await db.connect();
            
            try {
                const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
                if (!user) {
                    return res.status(401).json({ error: 'Credencials incorrectes' });
                }
                if (!user.is_active) {
                    return res.status(403).json({ error: 'Usuari desactivat' });
                }
                const valid = await PasswordUtils.verifyPassword(password, user.password_hash);
                if (!valid) {
                    return res.status(401).json({ error: 'Credencials incorrectes' });
                }
                
                // Generar tokens
                const tokens = TokenUtils.generateTokenPair(user);
                // Actualitzar last_login (ignorar si la columna no existeix)
                try {
                    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                } catch (updateError) {
                    // Si la columna last_login no existeix, ignorar l'error
                    console.log('Columna last_login no disponible, continuant...');
                }
                
                // Obtenir dades bàsiques de l'usuari després del login
                const userId = user.id;
                const accessToken = tokens.accessToken;
                const refreshToken = tokens.refreshToken;

                const userData = await db.queryOne(
                    'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
                    [userId]
                );
                if (!userData) {
                    return res.status(401).json({ error: 'Usuari o contrasenya incorrectes' });
                }
                
                // Retornar info
                return res.status(200).json({
                    accessToken,
                    refreshToken,
                    user: userData
                });
            } finally {
                // Sempre tancar la connexió
                await db.close();
            }
        } catch (error) {
            console.error('Error en login:', error);
            return res.status(500).json({ error: 'Error intern en login' });
        }
    },

    /**
     * Logout (invalidació de token)
     */
    async logout(req, res) {
        try {
            const user = req.user;
            if (user) {
                const db = createDatabase();
                await db.connect();
                
                try {
                    // Opcional: Guardar el token actual a la llista de tokens revocats
                    const authHeader = req.headers.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        const token = authHeader.substring(7);
                        
                        // Comprovar si el token ja està revocat abans d'inserir-lo
                        const existingToken = await db.queryOne(
                            'SELECT id FROM revoked_tokens WHERE token = ?',
                            [token]
                        );
                        
                        if (!existingToken) {
                            await db.run(
                                'INSERT INTO revoked_tokens (token, user_id, revoked_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                                [token, user.id]
                            );
                        }
                    }
                    
                    // Actualitzar last_logout (ignorar si la columna no existeix)
                    try {
                        await db.run('UPDATE users SET last_logout = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                    } catch (updateError) {
                        // Si la columna last_logout no existeix, ignorar l'error
                        console.log('Columna last_logout no disponible, continuant...');
                    }
                } finally {
                    // Sempre tancar la connexió
                    await db.close();
                }
            }
            
            return res.status(200).json({ 
                message: 'Logout correcte',
                success: true
            });
        } catch (error) {
            console.error('Error en logout:', error);
            return res.status(500).json({ error: 'Error intern en logout' });
        }
    },

    /**
     * Dades de l'usuari autenticat
     */
    async me(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'No autenticat' });
            }
            return res.status(200).json({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            });
        } catch (error) {
            return res.status(500).json({ error: 'Error intern' });
        }
    },

    /**
     * Refrescar token d'accés
     */
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Falta el token de refresc' });
            }
            const newTokens = TokenUtils.refreshAccessToken(refreshToken);
            return res.status(200).json(newTokens);
        } catch (error) {
            return res.status(401).json({ error: error.message });
        }
    }
}; 