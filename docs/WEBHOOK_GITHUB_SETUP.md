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

### Pas 2: Afegeix el Secret al Fitxer .env

El webhook carrega la variable `GITHUB_WEBHOOK_SECRET` des del fitxer `git-update/.env`:

```bash
# Al servidor, afegeix la variable al fitxer .env
cd /path/to/informe-fotografic/git-update
echo "GITHUB_WEBHOOK_SECRET=qN8mPxZ7kL2wRtY5hJ9dFgV3sB1nM4cE" >> .env
```

### Pas 3: Arrenca el Webhook amb PM2

**Important**: Utilitza `--node-args="--env-file=.env"` perquè PM2 carregui el fitxer .env:

```bash
cd /path/to/informe-fotografic/git-update
pm2 start github.js --name github-update --node-args="--env-file=.env"

# Per reiniciar si ja està arrencant
pm2 restart github-update
```

### Pas 4: Verifica que Funciona

```bash
# Comprova que el webhook escolta correctament
pm2 logs github-update | head -20

# Verifica que carrega la variable del fitxer .env
pm2 exec github-update -- node -e "console.log('Secret:', process.env.GITHUB_WEBHOOK_SECRET?.substring(0, 10) + '...')"
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
# Verifica que el secret està al fitxer .env
cat /path/to/git-update/.env | grep GITHUB_WEBHOOK_SECRET

# Si no hi és, afegeix-lo:
cd /path/to/git-update
echo "GITHUB_WEBHOOK_SECRET=el_teu_secret" >> .env

# Reinicia el webhook perquè recarregui el fitxer .env
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
1. Verifica que el secret a GitHub és igual que el de `git-update/.env`
2. Si no coincideix, actualitza:
   ```bash
   # Genera un secret nou
   NEW_SECRET=$(openssl rand -base64 32)
   echo "Nou secret: $NEW_SECRET"
   
   # Actualitza al fitxer .env
   cd /path/to/git-update
   sed -i "s/GITHUB_WEBHOOK_SECRET=.*/GITHUB_WEBHOOK_SECRET=$NEW_SECRET/" .env
   pm2 restart github-update
   
   # Actualitza el mateix secret a GitHub Settings
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

El webhook carrega les variables des del fitxer `git-update/.env`:

| Variable | Obligatòria | Exemple | Descripció |
|----------|------------|---------|------------|
| `GITHUB_WEBHOOK_SECRET` | ✅ SÍ | `qN8mPxZ7kL2wRt...` | Secret compartit amb GitHub |
| `PORT` | ❌ No (def: 3000) | `3000` | Port on escolta el webhook |

**Nota**: Arrenca amb PM2 usant `--node-args="--env-file=.env"` per carregar aquestes variables.

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
