/**
 * Script d'inicialització de la base de dades
 * Crea les taules necessàries per al sistema d'autenticació
 */

import pg from 'pg';

const { Pool } = pg;

// Crear connexió a la base de dades PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'informe_fotografic',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || ''
});

// Crear taula d'usuaris
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences TEXT DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE
)`;

// Crear taula de sessions
const createSessionsTable = `
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear taula de logs d'activitat
const createActivityLogsTable = `
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
)`;

// Crear taula de tokens revocats
const createRevokedTokensTable = `
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear taula d'informes
const createReportsTable = `
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    report_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Crear taula de perfils d'usuari
const createUserProfilesTable = `
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    signants TEXT,
    shield TEXT,
    "backgroundImage" TEXT,
    "signatureImage" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)`;

// Funció per crear les taules i els índexs
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        console.log('Connexió a la base de dades PostgreSQL establerta.');

        await client.query(createUsersTable);
        console.log('Taula users creada o ja existent.');

        await client.query(createSessionsTable);
        console.log('Taula sessions creada o ja existent.');

        await client.query(createActivityLogsTable);
        console.log('Taula activity_logs creada o ja existent.');

        await client.query(createRevokedTokensTable);
        console.log('Taula revoked_tokens creada o ja existent.');

        await client.query(createReportsTable);
        console.log('Taula reports creada o ja existent.');

        await client.query(createUserProfilesTable);
        console.log('Taula user_profiles creada o ja existent.');

        // Crear índexs
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
            'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token ON revoked_tokens(token)',
            'CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_reports_title ON reports(title)',
            'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)'
        ];
        for (const indexSql of indexes) {
            await client.query(indexSql);
        }
        console.log('Índexs creats o ja existents.');

        await createDefaultAdmin(client);
    } finally {
        client.release();
    }
}

// Funció per crear usuari admin per defecte
async function createDefaultAdmin(client) {
    try {
        const bcrypt = await import('bcryptjs');
        const saltRounds = 10;
        const defaultPassword = 'admin123'; // Canviar en producció!

        const hash = await bcrypt.hash(defaultPassword, saltRounds);

        const result = await client.query(
            `INSERT INTO users (email, password_hash, name, role)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO NOTHING`,
            ['admin@informe.com', hash, 'Administrador', 'admin']
        );

        if (result.rowCount > 0) {
            console.log('Usuari admin creat amb èxit.');
            console.log('Email: admin@informe.com');
            console.log('Password: admin123');
            console.log('⚠️  CANVIA LA CONTRASENYA EN PRODUCCIÓ!');
        } else {
            console.log('Usuari admin ja existeix.');
        }
    } catch (error) {
        console.error('Error en crear usuari admin:', error.message);
    }
}

// Executar inicialització
initializeDatabase()
    .then(() => {
        console.log('Base de dades inicialitzada amb èxit!');
        return pool.end();
    })
    .then(() => {
        console.log('Connexió a la base de dades tancada.');
    })
    .catch((err) => {
        console.error('Error en inicialitzar la base de dades:', err);
        process.exit(1);
    });
