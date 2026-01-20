/**
 * Gestor d'errors centralitzat
 */

export class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
    }
}

export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Error de validació de base de dades
    if (err.code === 'SQLITE_CONSTRAINT') {
        const message = 'Error de restricció de base de dades';
        error = new AppError(message, 400);
    }

    // Error de connexió a base de dades
    if (err.code === 'SQLITE_MISUSE') {
        const message = 'Error de connexió a la base de dades';
        error = new AppError(message, 500);
    }

    // Error de validació
    if (err.name === 'ValidationError') {
        const message = 'Dades de validació incorrectes';
        error = new AppError(message, 400, err.details);
    }

    // Error d'autenticació
    if (err.name === 'UnauthorizedError') {
        const message = 'No autoritzat';
        error = new AppError(message, 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error intern del servidor',
        details: error.details || null,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}; 