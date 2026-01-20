/**
 * Controlador de perfil d'usuari
 */

import { createDatabase } from '../../database/database.js';
import { PasswordUtils } from '../utils/passwordUtils.js';

export const profileController = {
    /**
     * Obtenir perfil d'usuari
     */
    async getProfile(req, res) {
        const database = createDatabase();
        try {
            const userId = req.user.id;
            await database.connect();
            try {
                // Obtenir dades bàsiques de l'usuari
                const user = await database.queryOne(
                    'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
                    [userId]
                );
                if (!user) {
                    return res.status(404).json({ error: 'Usuari no trobat' });
                }
                // Obtenir dades addicionals del perfil (si existeixen)
                let profileData = {};
                try {
                    const profile = await database.queryOne(
                        'SELECT signants, shield, backgroundImage, signatureImage FROM user_profiles WHERE user_id = ?',
                        [userId]
                    );
                    if (profile) {
                        profileData = {
                            signants: profile.signants,
                            shield: profile.shield,
                            backgroundImage: profile.backgroundImage,
                            signatureImage: profile.signatureImage
                        };
                    }
                } catch (profileError) {
                    // Si la taula user_profiles no existeix, continuar sense dades addicionals
                    console.log('Taula user_profiles no disponible, continuant...');
                }
                // Combinar dades
                const fullProfile = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    created_at: user.created_at,
                    ...profileData
                };
                return res.status(200).json(fullProfile);
            } finally {
                await database.close();
            }
        } catch (error) {
            console.error('Error en obtenir perfil:', error);
            return res.status(500).json({ error: 'Error intern en obtenir perfil' });
        }
    },

    /**
     * Actualitzar perfil d'usuari
     */
    async updateProfile(req, res) {
        const database = createDatabase();
        try {
            const userId = req.user.id;
            const { name, currentPassword, newPassword, signants, shield, backgroundImage, signatureImage } = req.body;
            await database.connect();
            try {
                // Verificar que l'usuari existeix
                const user = await database.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
                if (!user) {
                    return res.status(404).json({ error: 'Usuari no trobat' });
                }
                // Actualitzar nom si es proporciona
                if (name && name !== user.name) {
                    await database.run('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
                }
                // Actualitzar password si es proporciona
                if (newPassword) {
                    // Verificar password actual
                    const validCurrentPassword = await PasswordUtils.verifyPassword(currentPassword, user.password_hash);
                    if (!validCurrentPassword) {
                        return res.status(400).json({ error: 'Contrasenya actual incorrecta' });
                    }
                    // Validar nova password
                    const pwCheck = PasswordUtils.validatePasswordStrength(newPassword);
                    if (!pwCheck.isValid) {
                        return res.status(400).json({ error: 'Nova contrasenya dèbil', details: pwCheck.errors });
                    }
                    // Hash i actualitzar nova password
                    const newHash = await PasswordUtils.hashPassword(newPassword);
                    await database.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
                }
                // Actualitzar dades addicionals del perfil
                try {
                    // Comprovar si existeix entrada al perfil
                    const existingProfile = await database.queryOne(
                        'SELECT id FROM user_profiles WHERE user_id = ?',
                        [userId]
                    );
                    if (existingProfile) {
                        // Actualitzar perfil existent
                        await database.run(
                            'UPDATE user_profiles SET signants = ?, shield = ?, backgroundImage = ?, signatureImage = ? WHERE user_id = ?',
                            [signants || null, shield || null, backgroundImage || null, signatureImage || null, userId]
                        );
                    } else {
                        // Crear nova entrada de perfil
                        await database.run(
                            'INSERT INTO user_profiles (user_id, signants, shield, backgroundImage, signatureImage) VALUES (?, ?, ?, ?, ?)',
                            [userId, signants || null, shield || null, backgroundImage || null, signatureImage || null]
                        );
                    }
                } catch (profileError) {
                    // Si la taula user_profiles no existeix, ignorar l'error
                    console.log('Taula user_profiles no disponible, continuant...');
                }
                // Obtenir perfil actualitzat
                const updatedUser = await database.queryOne(
                    'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
                    [userId]
                );
                return res.status(200).json({
                    message: 'Perfil actualitzat correctament',
                    user: updatedUser
                });
            } finally {
                await database.close();
            }
        } catch (error) {
            console.error('Error en actualitzar perfil:', error);
            return res.status(500).json({ error: 'Error intern en actualitzar perfil', details: error.message, stack: error.stack });
        }
    }
}; 