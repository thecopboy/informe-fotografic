import bcrypt from 'bcrypt';

const password = 'XXXX'; // Nova contrasenya per a l'administrador
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generant el hash:', err);
    } else {
        console.log('Contrasenya:', password);
        console.log('Hash generat:', hash);
    }
}); 