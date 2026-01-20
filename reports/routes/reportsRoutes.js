/**
 * Rutes per a la gestió d'informes
 */

import express from 'express';
import { reportsController } from '../controllers/reportsController.js';
import { authMiddleware } from '../../auth/middleware/authMiddleware.js';

const router = express.Router();

// Aplicar middleware d'autenticació a totes les rutes
router.use(authMiddleware);

// Rutes per als informes
router.post('/', reportsController.createReport);
router.get('/', reportsController.listReports);
router.get('/:id', reportsController.getReport);
router.put('/:id', reportsController.updateReport);
router.delete('/:id', reportsController.deleteReport);

export default router; 