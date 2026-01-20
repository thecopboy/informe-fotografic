/**
 * Middleware de validació per a les dades d'entrada
 */

/**
 * Validació per actualització de perfil
 */
export const validateProfileUpdate = (req, res, next) => {
    const { name, currentPassword, newPassword, confirmPassword, signants } = req.body;
    const errors = [];

    // Validar nom
    if (name !== undefined) {
        if (!name || name.trim().length < 2) {
            errors.push('El nom ha de tenir almenys 2 caràcters');
        }
        if (name.trim().length > 50) {
            errors.push('El nom no pot tenir més de 50 caràcters');
        }
    }

    // Validar password si es vol canviar
    if (newPassword) {
        if (!currentPassword) {
            errors.push('Has d\'introduir la contrasenya actual');
        }
        
        if (newPassword !== confirmPassword) {
            errors.push('Les contrasenyes no coincideixen');
        }
        
        if (newPassword.length < 8) {
            errors.push('La nova contrasenya ha de tenir almenys 8 caràcters');
        }
        
        if (!/(?=.*[a-z])/.test(newPassword)) {
            errors.push('La nova contrasenya ha de contenir almenys una lletra minúscula');
        }
        
        if (!/(?=.*[A-Z])/.test(newPassword)) {
            errors.push('La nova contrasenya ha de contenir almenys una lletra majúscula');
        }
        
        if (!/(?=.*\d)/.test(newPassword)) {
            errors.push('La nova contrasenya ha de contenir almenys un número');
        }
    }

    // Validar signants
    if (signants !== undefined && signants && signants.trim().length > 500) {
        errors.push('Els signants no poden tenir més de 500 caràcters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Dades de validació incorrectes',
            details: errors
        });
    }

    next();
};

export const validateRegistration = (req, res, next) => {
    const { email, password, name } = req.body;
    const errors = [];

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Email vàlid obligatori');
    }

    // Validar contrasenya
    if (!password || password.length < 8) {
        errors.push('Contrasenya obligatòria amb almenys 8 caràcters');
    }

    // Validar nom
    if (!name || name.trim().length < 2) {
        errors.push('Nom obligatori amb almenys 2 caràcters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dades de validació incorrectes',
            details: errors
        });
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Validació de dades d'entrada

    // Validar email
    if (!email || typeof email !== 'string' || email.trim() === '') {
        errors.push('Email obligatori');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push('Format d\'email invàlid');
        }
    }

    // Validar contrasenya
    if (!password || typeof password !== 'string' || password.trim() === '') {
        errors.push('Contrasenya obligatòria');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dades de login incorrectes',
            details: errors
        });
    }

    next();
}; 