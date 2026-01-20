/**
 * Controlador per a la gestió d'informes
 */

import { createDatabase } from '../../database/database.js';
import { monitor } from '../../utils/monitor.js';
import { logger } from '../../utils/logger.js';

export const reportsController = {
    /**
     * Crear un nou informe
     */
    async createReport(req, res) {
        try {
            const user = req.user;
            const { title, report_data } = req.body;

            if (!title || !report_data) {
                return res.status(400).json({ error: 'Falten camps obligatoris' });
            }

            const database = createDatabase();
            await database.connect();
            
            try {
                const result = await database.run(
                    'INSERT INTO reports (user_id, title, report_data) VALUES (?, ?, ?)',
                    [user.id, title, JSON.stringify(report_data)]
                );

                // Track de l'operació de negoci
                monitor.trackBusinessOperation('report_created', {
                    userId: user.id,
                    reportId: result.lastID,
                    title: title
                });

                logger.info('Informe creat correctament', {
                    userId: user.id,
                    reportId: result.lastID,
                    title: title
                });

                return res.status(201).json({
                    message: 'Informe creat correctament',
                    report: {
                        id: result.lastID,
                        title,
                        created_at: new Date().toISOString()
                    }
                });
            } catch (dbError) {
                console.error('Error de base de dades en crear informe:', dbError);
                throw dbError;
            } finally {
                try {
                    await database.close();
                } catch (closeError) {
                    console.error('Error en tancar connexió:', closeError);
                }
            }
        } catch (error) {
            console.error('Error en crear informe:', error);
            return res.status(500).json({ error: 'Error intern en crear informe' });
        }
    },

    /**
     * Llistar informes de l'usuari (optimitzat per llistat)
     */
    async listReports(req, res) {
        try {
            const user = req.user;

            const database = createDatabase();
            await database.connect();
            
            try {
                const reports = await database.query(
                    'SELECT id, title, report_data, created_at, updated_at FROM reports WHERE user_id = ? ORDER BY created_at DESC',
                    [user.id]
                );

                return res.status(200).json({
                    reports: reports.map(report => {
                        let reportData = {};
                        try {
                            const fullReportData = JSON.parse(report.report_data);
                            // Només extreure les dades necessàries per al llistat
                            reportData = {
                                general: {
                                    tipus: fullReportData.general?.tipus || '',
                                    numero: fullReportData.general?.numero || '',
                                    assumpte: fullReportData.general?.assumpte || '',
                                    adreca: fullReportData.general?.adreca || '',
                                    data: fullReportData.general?.data || ''
                                }
                            };
                        } catch (e) {
                            console.error('Error parsejant report_data:', e);
                        }
                        
                        return {
                            id: report.id,
                            title: report.title,
                            report_data: reportData,
                            created_at: new Date(report.created_at).toISOString(),
                            updated_at: new Date(report.updated_at).toISOString()
                        };
                    })
                });
            } catch (dbError) {
                console.error('Error de base de dades en llistar informes:', dbError);
                throw dbError;
            } finally {
                try {
                    await database.close();
                } catch (closeError) {
                    console.error('Error en tancar connexió:', closeError);
                }
            }
        } catch (error) {
            console.error('Error en llistar informes:', error);
            return res.status(500).json({ error: 'Error intern en llistar informes' });
        }
    },

    /**
     * Obtenir un informe específic
     */
    async getReport(req, res) {
        try {
            const user = req.user;
            const { id } = req.params;

            const database = createDatabase();
            await database.connect();
            
            try {
                const report = await database.queryOne(
                    'SELECT id, title, report_data, created_at, updated_at FROM reports WHERE id = ? AND user_id = ?',
                    [id, user.id]
                );

                if (!report) {
                    return res.status(404).json({ error: 'Informe no trobat' });
                }

                return res.status(200).json({
                    report: {
                        ...report,
                        report_data: JSON.parse(report.report_data),
                        created_at: new Date(report.created_at).toISOString(),
                        updated_at: new Date(report.updated_at).toISOString()
                    }
                });
            } catch (dbError) {
                console.error('Error de base de dades en obtenir informe:', dbError);
                throw dbError;
            } finally {
                try {
                    await database.close();
                } catch (closeError) {
                    console.error('Error en tancar connexió:', closeError);
                }
            }
        } catch (error) {
            console.error('Error en obtenir informe:', error);
            return res.status(500).json({ error: 'Error intern en obtenir informe' });
        }
    },

    /**
     * Actualitzar un informe
     */
    async updateReport(req, res) {
        try {
            const user = req.user;
            const { id } = req.params;
            const { title, report_data } = req.body;

            if (!title || !report_data) {
                return res.status(400).json({ error: 'Falten camps obligatoris' });
            }

            const database = createDatabase();
            await database.connect();
            
            try {
                // Verificar que l'informe existeix i pertany a l'usuari
                const existingReport = await database.queryOne(
                    'SELECT id FROM reports WHERE id = ? AND user_id = ?',
                    [id, user.id]
                );

                if (!existingReport) {
                    return res.status(404).json({ error: 'Informe no trobat' });
                }

                const result = await database.run(
                    'UPDATE reports SET title = ?, report_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [title, JSON.stringify(report_data), id]
                );

                return res.status(200).json({
                    message: 'Informe actualitzat correctament',
                    report: {
                        id: parseInt(id),
                        title,
                        updated_at: new Date().toISOString()
                    }
                });
            } catch (dbError) {
                console.error('Error de base de dades en actualitzar informe:', dbError);
                throw dbError;
            } finally {
                try {
                    await database.close();
                } catch (closeError) {
                    console.error('Error en tancar connexió:', closeError);
                }
            }
        } catch (error) {
            console.error('Error en actualitzar informe:', error);
            return res.status(500).json({ error: 'Error intern en actualitzar informe' });
        }
    },

    /**
     * Esborrar un informe (DELETE real)
     */
    async deleteReport(req, res) {
        try {
            const user = req.user;
            const { id } = req.params;

            const database = createDatabase();
            await database.connect();
            
            try {
                // Verificar que l'informe existeix i pertany a l'usuari
                const existingReport = await database.queryOne(
                    'SELECT id FROM reports WHERE id = ? AND user_id = ?',
                    [id, user.id]
                );

                if (!existingReport) {
                    return res.status(404).json({ error: 'Informe no trobat' });
                }

                await database.run(
                    'DELETE FROM reports WHERE id = ?',
                    [id]
                );

                return res.status(200).json({
                    message: 'Informe esborrat correctament'
                });
            } catch (dbError) {
                console.error('Error de base de dades en esborrar informe:', dbError);
                throw dbError;
            } finally {
                try {
                    await database.close();
                } catch (closeError) {
                    console.error('Error en tancar connexió:', closeError);
                }
            }
        } catch (error) {
            console.error('Error en esborrar informe:', error);
            return res.status(500).json({ error: 'Error intern en esborrar informe' });
        }
    }
}; 