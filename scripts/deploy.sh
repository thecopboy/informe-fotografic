#!/bin/bash
# =============================================================================
# deploy.sh — Desplega Informe Fotogràfic al servidor via SCP
# Executa aquest script des del teu ordinador LOCAL.
# Ús: bash scripts/deploy.sh [usuari@infoto.cat]
# =============================================================================

set -e

# --- Configuració ---
SERVER="${1:-themacboy@infoto.cat}"   # Primer argument o valor per defecte
REMOTE_DIR="/opt/informe-fotografic"
IMAGE_NAME="informe-fotografic"
IMAGE_TAG="latest"
ARCHIVE="informe-fotografic.tar.gz"

echo "======================================================"
echo "  INFORME FOTOGRÀFIC — Desplegament al Servidor"
echo "  Destí: $SERVER"
echo "======================================================"

# --- 1. Construir la imatge Docker localment ---
echo ""
echo ">> Pas 1/5: Construint la imatge Docker..."
# Anem a l'arrel del projecte si l'script s'executa des de /scripts
cd "$(dirname "$0")/.."
sudo docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
echo "   Imatge construïda: ${IMAGE_NAME}:${IMAGE_TAG}"

# --- 2. Exportar la imatge a un arxiu comprimit ---
echo ""
echo ">> Pas 2/5: Exportant la imatge..."
sudo docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "/tmp/${ARCHIVE}"
echo "   Arxiu creat: /tmp/${ARCHIVE} ($(du -sh /tmp/${ARCHIVE} | cut -f1))"

# --- 3. Copiar la imatge i els fitxers de configuració al servidor ---
echo ""
echo ">> Pas 3/5: Transferint fitxers al servidor..."
scp "/tmp/${ARCHIVE}" "${SERVER}:${REMOTE_DIR}/"
scp docker-compose.yml "${SERVER}:${REMOTE_DIR}/"
if [ -f ".env" ]; then
  scp .env "${SERVER}:${REMOTE_DIR}/"
else
  echo "   AVÍS: No s'ha trobat el fitxer .env localment. S'ignora la transferència."
fi
echo "   Fitxers transferits."

# --- 4. Carregar la imatge i arrencar els contenidors al servidor ---
echo ""
echo ">> Pas 4/5: Carregant imatge i arrencan contenidors..."
ssh "${SERVER}" bash << ENDSSH
  cd ${REMOTE_DIR}
  
  # Assegurar que el directori de la BD existeix i el fitxer app.db és un fitxer, no un directori
  mkdir -p database
  if [ -d "database/app.db" ]; then
    echo "  Corregint directori erroni database/app.db..."
    rm -rf database/app.db
  fi
  touch database/app.db

  echo "  Carregant imatge Docker..."
  docker load < ${ARCHIVE}
  echo "  Arrencan contenidors..."
  docker compose up -d
  echo "  Netejant arxiu temporal remot..."
  rm -f ${ARCHIVE}
ENDSSH

# --- 5. Netejar arxiu temporal local ---
echo ""
echo ">> Pas 5/5: Netejant arxiu temporal local..."
rm -f "/tmp/${ARCHIVE}"

echo ""
echo "======================================================"
echo "  DESPLEGAMENT COMPLETAT!"
echo "======================================================"
echo ""
echo "Verifica que tot funciona:"
echo "  ssh ${SERVER} 'cd ${REMOTE_DIR} && docker compose ps'"
echo ""
