import express from 'express';
import { profileController } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateProfileUpdate } from '../middleware/validationMiddleware.js';
import { asyncHandler } from '../../utils/errorHandler.js';

const router = express.Router();

// Obtenir perfil d'usuari
router.get('/profile', authMiddleware, asyncHandler(profileController.getProfile));

// Actualitzar perfil d'usuari
router.put('/profile', authMiddleware, validateProfileUpdate, asyncHandler(profileController.updateProfile));

export default router; 