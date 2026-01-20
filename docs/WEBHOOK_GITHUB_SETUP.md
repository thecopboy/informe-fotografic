# 🔄 Configuració de Webhook de GitHub per Auto-Deploy

## 📋 Resum

El projecte inclou un sistema automàtic de desplegament que es triggera quan es fa push a GitHub. Aquesta guia explica com configurar-lo.

---

## 🚀 Setup del Webhook

### Pas 1: Genera un Secret Segur

Al servidor, genera un secret segur per al webhook:

```bash
openssl rand -base64 32
```

**Copia el valor generat** (exemple: `qN8mPxZ7kL2wRtY5hJ9dFgV3sB1nM4cE`)

### Pas 2: Configura el Secret al Servidor

#### Opció A: Variable d'Entorn (Recomanat)

```bash
# Afegeix a .env del servidor:
echo "GITHUB_WEBHOOK_SECRET=qN8mPxZ7kL2wRtY5hJ9dFgV3sB1nM4cE" >> /path/to/.env

# Recarrega la variable
source /path/to/.env
export GITHUB_WEBHOOK_SECRET=$(cat /path/to/.env | grep GITHUB_WEBHOOK_SECRET | cut -d '=' -f 2)
```

#### Opció B: PM2 Ecosystem (Si utilitzes PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "github-update",
      script: "./git-update/github.js",
      env: {
        NODE_ENV: "production",
        GITHUB_WEBHOOK_SECRET: "qN8mPxZ7kL2wRtY5hJ9dFgV3sB1nM4cE"
      }
    }
  ]
};
```

#### Opció C: Variables d'Entorn del Sistema

```bash
# Afegeix al ~/.bashrc o ~/.zshrc:
export GITHUB_WEBHOOK_SECRET="qN8mPxZ7kL2wRtY5hJ9dFgV3sB1nM4cE"

# Recarrega el shell:
source ~/.bashrc
```

### Pas 3: Reinicia l'Aplicació de Webhook

```bash
# Si utilitzes PM2
pm2 restart github-update

# Si utilitzes npm directament
cd /path/to/git-update
npm start
```

### Pas 4: Verifica que Funciona

```bash
# Comprova que la variable està definida
echo $GITHUB_WEBHOOK_SECRET

# Comprova que el webhook escolta correctament
pm2 logs github-update | head -20
```

---

## 🔐 Configurar el Webhook a GitHub

### 1. Va a Settings del Repositori

1. Obrir https://github.com/thecopboy/informe-fotografic/settings/hooks
2. Clickar **"Add webhook"**

### 2. Configura els Paràmetres

| Camp | Valor |
|------|-------|
| **Payload URL** | `http://TU_SERVIDOR:3000/webhook` |
| **Content type** | `application/json` |
| **Secret** | `qN8mPxZ7kL2wRtY5hJ9dFgV3sB1nM4cE` |
| **Events** | **"Push events"** (o els que vulguis) |
| **Active** | ✅ Marcat |

### 3. Guarda

Clicka **"Add webhook"**

---

## ✅ Verificar que Funciona

### Test Manual

1. Fes un push petit (p.ex. actualitza un comentari):
   ```bash
   git add .
   git commit -m "Test webhook"
   git push origin main
   ```

2. Verifica el log al servidor:
   ```bash
   pm2 logs github-update
   ```

3. Hauries de veure missatges com:
   ```
   Webhook received for push event. Running deploy script...
   Deployment completed successfully!
   ```

### Revisar el Webhook a GitHub

1. Va a: https://github.com/thecopboy/informe-fotografic/settings/hooks
2. Click al webhook
3. Scroll fins a **"Recent Deliveries"**
4. Verifica que els pushes apareixen com a "✅ Successful"

---

## 🐛 Troubleshooting

### Error: "GITHUB_WEBHOOK_SECRET no està definida"

**Solució:**
```bash
# Verifica que la variable està definida
echo $GITHUB_WEBHOOK_SECRET

# Si no surt res, defineix-la:
export GITHUB_WEBHOOK_SECRET="el_teu_secret"

# Reinicia el webhook
pm2 restart github-update
```

### Error: "Connection refused" (no es pot connectar al webhook)

**Verificar que el webhook escolta correctament:**
```bash
# Verifica que el port 3000 està obert
netstat -tuln | grep 3000

# Si no apareix, reinicia:
pm2 restart github-update

# Comprova els logs:
pm2 logs github-update
```

### Error: "Invalid signature"

**Significa que el secret no coincideix:**
1. Verifica que el secret a GitHub és igual que `GITHUB_WEBHOOK_SECRET`
2. Si no coincideix, actualitza:
   ```bash
   # Genera un secret nou
   NEW_SECRET=$(openssl rand -base64 32)
   echo "Nou secret: $NEW_SECRET"
   
   # Actualitza al servidor
   export GITHUB_WEBHOOK_SECRET=$NEW_SECRET
   pm2 restart github-update
   
   # Actualitza a GitHub Settings
   ```

### El Deploy no S'Executa Automàticament

**Possibles causes:**
1. El webhook no está "Active" a GitHub
2. El secret no coincideix
3. El deploy.sh no té permisos d'execució:
   ```bash
   chmod +x /path/to/deploy.sh
   ```
4. PM2 no té permís per executar deploy.sh:
   ```bash
   sudo chown -R $USER /path/to/git-update
   ```

---

## 📝 Variables d'Entorn del Webhook

Aquí estan totes les variables que pot necessitar el webhook:

| Variable | Obligatòria | Exemple | On Definir |
|----------|------------|---------|-----------|
| `GITHUB_WEBHOOK_SECRET` | ✅ SÍ | `qN8mPxZ7kL2wRt...` | `.env` o PM2 |
| `NODE_ENV` | ❌ No | `production` | `.env` o PM2 |
| `PORT` | ❌ No (def: 3000) | `3000` | `.env` o PM2 |

---

## 🔄 Flux Complet del Deploy

Quan es fa push a GitHub:

1. **GitHub** envia un webhook POST a `http://tu-servidor:3000/webhook`
2. **github.js** verifica la signatura amb `GITHUB_WEBHOOK_SECRET`
3. **github.js** executa `deploy.sh`
4. **deploy.sh** fa:
   - `git pull` els canvis
   - `npm install` les dependències noves (si cal)
   - `pm2 restart` l'aplicació principal
5. **L'aplicació es reinicia** amb els últims canvis

---

## ⚠️ Seguretat

- **Guarda el secret en un lloc segur** - No el commitegis mai a Git
- **Usa HTTPS** si pots - En producció és recomanat `https://tu-servidor/webhook`
- **Rota el secret regularment** - Cada 3-6 mesos
- **Verifica el certificat SSL** - Si utilitzes HTTPS

---

## 📚 Fitxers Relacionats

- [git-update/github.js](../../git-update/github.js) - Servidor del webhook
- [git-update/deploy.sh](../../git-update/deploy.sh) - Script de desplegament
- [git-update/package.json](../../git-update/package.json) - Dependències del webhook

---

**Última actualització**: Gener 2026  
**Contacte**: themacboy72@gmail.com
