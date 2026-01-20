import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateRegistration, validateLogin } from '../middleware/validationMiddleware.js';
import { asyncHandler } from '../../utils/errorHandler.js';

const router = express.Router();

// Registre d'usuari
router.post('/register', validateRegistration, asyncHandler(authController.register));
// Login d'usuari
router.post('/login', validateLogin, asyncHandler(authController.login));
// Logout
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
// Dades de l'usuari autenticat
router.get('/me', authMiddleware, asyncHandler(authController.me));
// Refrescar token
router.post('/refresh', asyncHandler(authController.refresh));

export default router; 