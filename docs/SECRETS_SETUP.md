# 🔐 Configuració de Secrets i Variables d'Entorn

## ⚠️ IMPORTANT: Seguretat dels Secrets

**MAI pujis fitxers `.env` amb secrets reals a GitHub!**

Aquest document explica com generar i configurar secrets de manera segura per a cada entorn.

---

## 📋 Variables d'Entorn Necessàries

### Obligatòries per JWT
- `JWT_ACCESS_SECRET` - Secret per tokens d'accés (15 min)
- `JWT_REFRESH_SECRET` - Secret per tokens de refresc (7 dies)

### Opcionals
- `PORT` - Port del servidor (per defecte: 33333)
- `NODE_ENV` - Entorn d'execució (development/production)
- `HOST` - Host del servidor (per defecte: localhost)
- `DB_PATH` - Ruta de la base de dades SQLite

---

## 🖥️ Configuració per Entorn Local (Desenvolupament)

### 1. Copia la plantilla
```bash
cp .env.example .env
```

### 2. Genera secrets segurs
```bash
# Generar JWT_ACCESS_SECRET
openssl rand -base64 48

# Generar JWT_REFRESH_SECRET
openssl rand -base64 48
```

### 3. Edita el fitxer `.env`
Obre `.env` i substitueix els valors per defecte pels secrets generats:

```env
JWT_ACCESS_SECRET=el_secret_generat_per_access
JWT_REFRESH_SECRET=el_secret_generat_per_refresh
```

### 4. Verifica que funciona
```bash
npm start
```

**Nota**: El projecte utilitza el suport natiu de Node.js (>=20.6.0) per carregar fitxers `.env` amb la flag `--env-file=.env`. No cal instal·lar el paquet `dotenv`.

Si veus errors relacionats amb JWT, verifica que les variables estan definides:
```bash
node --env-file=.env -e "console.log('JWT_ACCESS_SECRET length:', process.env.JWT_ACCESS_SECRET.length)"
```

---

## 🚀 Configuració al Servidor de Producció

### Opció 1: Variables d'Entorn del Sistema (Recomanat)

Aquesta és la millor opció per servidors amb gestió d'entorn (Heroku, Vercel, Railway, etc.)

#### 1. Genera els secrets al servidor
```bash
ssh usuari@servidor-producció

# Generar secrets
export JWT_ACCESS_SECRET=$(openssl rand -base64 48)
export JWT_REFRESH_SECRET=$(openssl rand -base64 48)

# Mostrar-los per copiar-los (fes-ho només una vegada!)
echo "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
```

#### 2. Configura-les al teu hosting

**Heroku:**
```bash
heroku config:set JWT_ACCESS_SECRET="el_teu_secret"
heroku config:set JWT_REFRESH_SECRET="el_teu_secret"
```

**Vercel:**
```bash
vercel env add JWT_ACCESS_SECRET
vercel env add JWT_REFRESH_SECRET
```

**Railway:**
Afegeix-les al dashboard → Variables → Add Variable

**PM2 (servidor propi):**
```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'informe-fotografic',
    script: './index.js',
    env_production: {
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET
    }
  }]
}
```

---

### Opció 2: Fitxer .env al Servidor

Si no tens accés a variables d'entorn del sistema, pots crear un `.env` directament al servidor.

#### 1. Connecta't al servidor
```bash
ssh usuari@servidor-producció
cd /path/to/informe-fotografic
```

#### 2. Genera i guarda els secrets
```bash
# Crear fitxer .env amb secrets generats automàticament
cat > .env << EOF
NODE_ENV=production
PORT=33333
JWT_ACCESS_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
EOF

# Protegir el fitxer (només l'usuari actual pot llegir-lo)
chmod 600 .env
```

#### 3. Verifica que està protegit
```bash
ls -la .env
# Ha de mostrar: -rw------- (només propietari pot llegir/escriure)
```

#### 4. IMPORTANT: Fes backup segur
```bash
# Guarda una còpia xifrada (només per emergències)
gpg -c .env
# Això crearà .env.gpg (fitxer xifrat)
# Guarda'l en un lloc segur FORA del servidor
```

---

## 🔄 Rotació de Secrets (Recomanat cada 3-6 mesos)

### Pas 1: Genera nous secrets
```bash
NEW_ACCESS=$(openssl rand -base64 48)
NEW_REFRESH=$(openssl rand -base64 48)
```

### Pas 2: Actualitza la configuració
- Si uses variables d'entorn del hosting: Actualitza-les al dashboard
- Si uses `.env`: Edita el fitxer i substitueix els valors

### Pas 3: Reinicia l'aplicació
```bash
# Node.js directament
node --env-file=.env index.js

# PM2
pm2 restart informe-fotografic

# Heroku
heroku restart

# Docker
docker-compose restart
```

### Pas 4: Invalida tokens antics (opcional)
Pots forçar logout de tots els usuaris eliminant els tokens de la base de dades:
```bash
sqlite3 database/app.db "DELETE FROM sessions;"
sqlite3 database/app.db "DELETE FROM revoked_tokens;"
```

---

## ✅ Checklist de Seguretat

Abans de desplegar a producció, verifica:

- [ ] Els secrets estan generats amb `openssl rand -base64 48` o similar
- [ ] Els secrets de producció són DIFERENTS dels de desenvolupament
- [ ] El fitxer `.env` està al `.gitignore`
- [ ] No hi ha secrets al codi font (ni comentats)
- [ ] Els secrets són d'almenys 48 caràcters
- [ ] Les variables d'entorn estan configurades al servidor
- [ ] El fitxer `.env` al servidor té permisos 600 (`chmod 600 .env`)
- [ ] Hi ha un backup segur dels secrets (xifrat, fora del servidor)
- [ ] Tens un pla de rotació de secrets (cada 3-6 mesos)

---

## 🚨 Què fer si s'ha Exposat un Secret

Si accidentalment has pujat un secret a GitHub o s'ha filtrat:

### 1. Revoca immediatament
```bash
# Genera nous secrets
export JWT_ACCESS_SECRET=$(openssl rand -base64 48)
export JWT_REFRESH_SECRET=$(openssl rand -base64 48)
```

### 2. Actualitza la configuració
Segueix els passos de "Rotació de Secrets" més amunt.

### 3. Invalida tots els tokens
```bash
sqlite3 database/app.db "DELETE FROM sessions;"
sqlite3 database/app.db "DELETE FROM revoked_tokens;"
```

### 4. Si era a GitHub, neteja l'historial
```bash
# ADVERTÈNCIA: Això reescriu l'historial de Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

### 5. Notifica als usuaris
Envia un email demanant que tornin a fer login.

---

## 📚 Referències

- [OWASP - Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [12 Factor App - Config](https://12factor.net/config)
- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**Última actualització**: Gener 2026  
**Mantenidor**: themacboy72@gmail.com
