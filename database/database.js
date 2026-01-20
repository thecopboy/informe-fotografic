/**
 * Servei de connexió a la base de dades SQLite
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta de la base de dades
const dbPath = join(__dirname, 'app.db');

class Database {
    constructor() {
        this.db = null;
        this.isConnected = false;
    }

    /**
     * Conectar a la base de dades
     */
    connect() {
        return new Promise((resolve, reject) => {
            // Si ja estem connectats, resoldre directament
            if (this.isConnected && this.db) {
                resolve();
                return;
            }

            // Si hi ha una connexió anterior, tancar-la primer
            if (this.db) {
                try {
                    this.db.close();
                } catch (error) {
                    console.log('Tancant connexió anterior...');
                }
            }

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error en connectar a la base de dades:', err.message);
                    this.isConnected = false;
                    this.db = null;
                    reject(err);
                    return; // <-- Evita accedir a this.db.run si la connexió ha fallat
                }
                    console.log('Connexió a la base de dades SQLite establerta.');
                    this.isConnected = true;
                    
                    // Habilitar foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    
                    resolve();
            });
        });
    }

    /**
     * Tancar la connexió a la base de dades
     */
    close() {
        return new Promise((resolve) => {
            if (this.db && this.isConnected) {
                try {
                    this.db.close((err) => {
                        if (err) {
                            // Si l'error és que la base de dades ja està tancada, no és un problema
                            if (err.code === 'SQLITE_MISUSE' && err.message.includes('Database is closed')) {
                                console.log('Base de dades ja tancada.');
                            } else {
                                console.error('Error en tancar la base de dades:', err.message);
                            }
                        } else {
                            console.log('Connexió a la base de dades tancada.');
                        }
                        this.isConnected = false;
                        this.db = null;
                        resolve();
                    });
                } catch (error) {
                    console.error('Error en tancar la base de dades:', error.message);
                    this.isConnected = false;
                    this.db = null;
                    resolve();
                }
            } else {
                this.isConnected = false;
                this.db = null;
                resolve();
            }
        });
    }

    /**
     * Executar una consulta SELECT
     * @param {string} sql - Consulta SQL
     * @param {Array} params - Paràmetres de la consulta
     * @returns {Promise<Array>} Resultats de la consulta
     */
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Base de dades no connectada'));
                return;
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error en executar consulta:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Executar una consulta que retorna una sola fila
     * @param {string} sql - Consulta SQL
     * @param {Array} params - Paràmetres de la consulta
     * @returns {Promise<Object|null>} Resultat de la consulta
     */
    queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Base de dades no connectada'));
                return;
            }

            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error en executar consulta:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Executar una consulta INSERT, UPDATE o DELETE
     * @param {string} sql - Consulta SQL
     * @param {Array} params - Paràmetres de la consulta
     * @returns {Promise<Object>} Informació del resultat
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Base de dades no connectada'));
                return;
            }

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error en executar consulta:', err.message);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Executar múltiples consultes en una transacció
     * @param {Array} queries - Array d'objectes {sql, params}
     * @returns {Promise<Array>} Resultats de les consultes
     */
    transaction(queries) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Base de dades no connectada'));
                return;
            }

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                const results = [];
                let hasError = false;

                queries.forEach((query, index) => {
                    if (hasError) return;

                    this.db.run(query.sql, query.params, function(err) {
                        if (err) {
                            hasError = true;
                            console.error('Error en transacció:', err.message);
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            results.push({
                                lastID: this.lastID,
                                changes: this.changes
                            });

                            if (index === queries.length - 1) {
                                this.db.run('COMMIT');
                                resolve(results);
                            }
                        }
                    });
                });
            });
        });
    }

    /**
     * Verificar si la connexió està activa
     * @returns {boolean}
     */
    isConnected() {
        return this.isConnected;
    }
}

// Exporta una funció per crear una nova instància de Database
export function createDatabase() {
    return new Database();
} 