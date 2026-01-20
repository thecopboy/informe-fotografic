#!/bin/bash

# Fitxer: /ruta/al/teu/projecte/deploy.sh

# Assegura't que el script s'executa des de la carpeta del projecte
cd /home/themacboy/informe-fotografic/

# Realitza el pull dels darrers canvis
git pull origin main # O la teva branca principal

# Instal·la dependències (si hi ha canvis a package.json)
npm install

# Construeix el projecte (si és una aplicació frontend o si cal transpilació)
# npm run build # Descomenta si el teu projecte Node.js també serveix frontend compilat

# Reinicia la teva aplicació Node.js
# Si utilitzes PM2 (molt recomanat per a Node.js en producció):
pm2 restart "Informe Fotogràfic"
# O si utilitzes systemd directament:
# sudo systemctl restart <nom_del_teu_servei_node>

LOG_FILE="/home/themacboy/informe-fotografic/git-update/deploy.log"
echo "Deployment started at $(date)" >> "$LOG_FILE"
