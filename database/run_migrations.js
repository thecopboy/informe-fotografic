import pg from 'pg';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, 'migrations');

async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'informe_fotografic',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || ''
    });

    const client = await pool.connect();
    logger.info('Connected to PostgreSQL database for migrations.');

    try {
        // Crear taula de control de migracions si no existeix
        await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`);

        // Obtenir migracions ja aplicades
        const appliedResult = await client.query('SELECT name FROM schema_migrations');
        const appliedMigrations = appliedResult.rows.map(row => row.name);

        const migrationFiles = (await fs.readdir(migrationsDir))
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            if (appliedMigrations.includes(file)) {
                logger.info(`Migration '${file}' already applied. Skipping.`);
                continue;
            }

            const filePath = join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                logger.info(`Migration '${file}' applied successfully.`);
            } catch (err) {
                await client.query('ROLLBACK');
                logger.error(`Error applying migration '${file}':`, err.message);
                throw err;
            }
        }

        logger.info('All migrations processed.');
    } catch (error) {
        logger.error('Error during migrations:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        logger.info('Database connection closed after migrations.');
    }
}

runMigrations();
