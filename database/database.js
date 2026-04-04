/**
 * Servei de connexió a la base de dades PostgreSQL
 */

import pg from 'pg';

const { Pool } = pg;

// Configuració del pool de connexions PostgreSQL
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'informe_fotografic',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
};

// Pool compartit per tota l'aplicació
const sharedPool = new Pool(poolConfig);

sharedPool.on('error', (err) => {
    console.error('Error inesperat al pool de PostgreSQL:', err.message);
});

/**
 * Converteix els placeholders '?' d'estil SQLite als placeholders '$N' de PostgreSQL
 * @param {string} sql - Consulta SQL amb placeholders '?'
 * @returns {string} Consulta SQL amb placeholders '$N'
 */
function convertPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
}

class Database {
    constructor() {
        this._connected = false;
    }

    /**
     * Connectar a la base de dades (verifica la connexió al pool)
     */
    async connect() {
        if (this._connected) {
            return;
        }
        // Verificar la connexió fent una consulta simple
        const client = await sharedPool.connect();
        client.release();
        this._connected = true;
        console.log('Connexió a la base de dades PostgreSQL establerta.');
    }

    /**
     * Alliberar la connexió (amb pool, no cal tancar)
     */
    async close() {
        this._connected = false;
    }

    /**
     * Executar una consulta SELECT
     * @param {string} sql - Consulta SQL
     * @param {Array} params - Paràmetres de la consulta
     * @returns {Promise<Array>} Resultats de la consulta
     */
    async query(sql, params = []) {
        if (!this._connected) {
            throw new Error('Base de dades no connectada');
        }
        try {
            const pgSql = convertPlaceholders(sql);
            const result = await sharedPool.query(pgSql, params);
            return result.rows;
        } catch (err) {
            console.error('Error en executar consulta:', err.message);
            throw err;
        }
    }

    /**
     * Executar una consulta que retorna una sola fila
     * @param {string} sql - Consulta SQL
     * @param {Array} params - Paràmetres de la consulta
     * @returns {Promise<Object|null>} Resultat de la consulta
     */
    async queryOne(sql, params = []) {
        if (!this._connected) {
            throw new Error('Base de dades no connectada');
        }
        try {
            const pgSql = convertPlaceholders(sql);
            const result = await sharedPool.query(pgSql, params);
            return result.rows[0] || null;
        } catch (err) {
            console.error('Error en executar consulta:', err.message);
            throw err;
        }
    }

    /**
     * Executar una consulta INSERT, UPDATE o DELETE
     * @param {string} sql - Consulta SQL
     * @param {Array} params - Paràmetres de la consulta
     * @returns {Promise<Object>} Informació del resultat ({ lastID, changes })
     */
    async run(sql, params = []) {
        if (!this._connected) {
            throw new Error('Base de dades no connectada');
        }
        try {
            let pgSql = convertPlaceholders(sql);
            // Afegir RETURNING id per obtenir el lastID en INSERT
            const isInsert = /^\s*INSERT\s/i.test(pgSql);
            if (isInsert && !/RETURNING/i.test(pgSql)) {
                pgSql = `${pgSql} RETURNING id`;
            }
            const result = await sharedPool.query(pgSql, params);
            return {
                lastID: result.rows[0]?.id || null,
                changes: result.rowCount
            };
        } catch (err) {
            console.error('Error en executar consulta:', err.message);
            throw err;
        }
    }

    /**
     * Executar múltiples consultes en una transacció
     * @param {Array} queries - Array d'objectes {sql, params}
     * @returns {Promise<Array>} Resultats de les consultes
     */
    async transaction(queries) {
        if (!this._connected) {
            throw new Error('Base de dades no connectada');
        }
        const client = await sharedPool.connect();
        try {
            await client.query('BEGIN');
            const results = [];
            for (const query of queries) {
                let pgSql = convertPlaceholders(query.sql);
                const isInsert = /^\s*INSERT\s/i.test(pgSql);
                if (isInsert && !/RETURNING/i.test(pgSql)) {
                    pgSql = `${pgSql} RETURNING id`;
                }
                const result = await client.query(pgSql, query.params || []);
                results.push({
                    lastID: result.rows[0]?.id || null,
                    changes: result.rowCount
                });
            }
            await client.query('COMMIT');
            return results;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error en transacció:', err.message);
            throw err;
        } finally {
            client.release();
        }
    }
}

// Exporta una funció per crear una nova instància de Database
export function createDatabase() {
    return new Database();
}

// Exporta el pool per a ús directe si cal (ex: migracions)
export { sharedPool };
