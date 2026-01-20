/**
 * Script d'inicialització de la base de dades
 * Crea les taules necessàries per al sistema d'autenticació
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta de la base de dades
const dbPath = join(__dirname, 'app.db');

// Crear connexió a la base de dades
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error en connectar a la base de dades:', err.message);
    } else {
        console.log('Connexió a la base de dades SQLite establerta.');
    }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Crear taula d'usuaris
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    preferences TEXT DEFAULT '{}',
    is_active BOOLEAN DEFAULT 1
)`;

// Crear taula de sessions
const createSessionsTable = `
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    device_info TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear taula de logs d'activitat
const createActivityLogsTable = `
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
)`;

// Crear taula de tokens revocats
const createRevokedTokensTable = `
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear taula d'informes
const createReportsTable = `
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    report_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear taula de perfils d'usuari
const createUserProfilesTable = `
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    signants TEXT,
    shield TEXT,
    backgroundImage TEXT,
    signatureImage TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear índexs per a millor rendiment
const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token ON revoked_tokens(token);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_title ON reports(title);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
`;

// Funció per crear les taules
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Crear taules
            db.run(createUsersTable, (err) => {
                if (err) {
                    console.error('Error en crear taula users:', err.message);
                    reject(err);
                    return;
                }
                console.log('Taula users creada o ja existent.');
            });

            db.run(createSessionsTable, (err) => {
                if (err) {
                    console.error('Error en crear taula sessions:', err.message);
                    reject(err);
                    return;
                }
                console.log('Taula sessions creada o ja existent.');
            });

            db.run(createActivityLogsTable, (err) => {
                if (err) {
                    console.error('Error en crear taula activity_logs:', err.message);
                    reject(err);
                    return;
                }
                console.log('Taula activity_logs creada o ja existent.');
            });

            db.run(createRevokedTokensTable, (err) => {
                if (err) {
                    console.error('Error en crear taula revoked_tokens:', err.message);
                    reject(err);
                    return;
                }
                console.log('Taula revoked_tokens creada o ja existent.');
            });

            db.run(createReportsTable, (err) => {
                if (err) {
                    console.error('Error en crear taula reports:', err.message);
                    reject(err);
                    return;
                }
                console.log('Taula reports creada o ja existent.');
            });

            db.run(createUserProfilesTable, (err) => {
                if (err) {
                    console.error('Error en crear taula user_profiles:', err.message);
                    reject(err);
                    return;
                }
                console.log('Taula user_profiles creada o ja existent.');
            });

            // Crear índexs
            db.run(createIndexes, (err) => {
                if (err) {
                    console.error('Error en crear índexs:', err.message);
                    reject(err);
                    return;
                }
                console.log('Índexs creats o ja existents.');
            });

            // Crear usuari admin per defecte si no existeix
            createDefaultAdmin().then(() => {
                resolve();
            }).catch((error) => {
                console.error('Error en crear usuari admin:', error);
                resolve(); // Resolvem igual per no trencar la inicialització
            });
        });
    });
}

// Funció per crear usuari admin per defecte
async function createDefaultAdmin() {
    try {
        const bcrypt = await import('bcryptjs');
        const saltRounds = 10;
        const defaultPassword = 'admin123'; // Canviar en producció!
        
        const hash = await bcrypt.hash(defaultPassword, saltRounds);

        const insertAdmin = `
            INSERT OR IGNORE INTO users (email, password_hash, name, role)
            VALUES ('admin@informe.com', ?, 'Administrador', 'admin')
        `;

        db.run(insertAdmin, [hash], function(err) {
            if (err) {
                console.error('Error en crear usuari admin:', err.message);
            } else if (this.changes > 0) {
                console.log('Usuari admin creat amb èxit.');
                console.log('Email: admin@informe.com');
                console.log('Password: admin123');
                console.log('⚠️  CANVIA LA CONTRASENYA EN PRODUCCIÓ!');
            } else {
                console.log('Usuari admin ja existeix.');
            }
        });
    } catch (error) {
        console.error('Error en crear usuari admin:', error.message);
    }
}

// Executar inicialització
initializeDatabase()
    .then(() => {
        console.log('Base de dades inicialitzada amb èxit!');
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('Error en tancar la base de dades:', err.message);
                } else {
                    console.log('Connexió a la base de dades tancada.');
                }
            });
        }, 1000); // Donar temps per crear l'usuari admin
    })
    .catch((err) => {
        console.error('Error en inicialitzar la base de dades:', err);
        process.exit(1);
    }); 