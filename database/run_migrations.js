import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'app.db');
const migrationsDir = join(__dirname, 'migrations');

async function runMigrations() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error('Error connecting to database for migrations:', err.message);
            process.exit(1);
        } else {
            logger.info('Connected to SQLite database for migrations.');
        }
    });

    try {
        await new Promise((resolve, reject) => {
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Get list of applied migrations
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const appliedMigrations = (await new Promise((resolve, reject) => {
            db.all('SELECT name FROM schema_migrations', (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map(row => row.name));
            });
        }));

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

            await new Promise((resolve, reject) => {
                db.exec(sql, (err) => {
                    if (err) {
                        logger.error(`Error applying migration '${file}':`, err.message);
                        return reject(err);
                    }
                    logger.info(`Migration '${file}' applied successfully.`);
                    db.run('INSERT INTO schema_migrations (name) VALUES (?)', [file], (err) => {
                        if (err) {
                            logger.error(`Error recording migration '${file}':`, err.message);
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });
        }
        logger.info('All migrations processed.');

    } catch (error) {
        logger.error('Error during migrations:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                logger.error('Error closing database connection after migrations:', err.message);
            } else {
                logger.info('Database connection closed after migrations.');
            }
        });
    }
}

runMigrations(); 