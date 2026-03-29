#!/bin/bash
# =============================================================================
# deploy.sh — Desplega Gestact al servidor via SCP (Opció B2)
# Executa aquest script des del teu ordinador LOCAL.
# Ús: bash scripts/deploy.sh usuari@gestact.cat
# =============================================================================

set -e

# --- Configuració ---
SERVER="${1:-themacboy@gestact.cat}"   # Primer argument o valor per defecte
REMOTE_DIR="/opt/gestact"
IMAGE_NAME="gestact-app"
IMAGE_TAG="latest"
ARCHIVE="gestact.tar.gz"

echo "======================================================"
echo "  GESTACT — Desplegament al Servidor"
echo "  Destí: $SERVER"
echo "======================================================"

# --- 1. Construir la imatge Docker localment ---
echo ""
echo ">> Pas 1/5: Construint la imatge Docker..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
echo "   Imatge construïda: ${IMAGE_NAME}:${IMAGE_TAG}"

# --- 2. Exportar la imatge a un arxiu comprimit ---
echo ""
echo ">> Pas 2/5: Exportant la imatge..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "/tmp/${ARCHIVE}"
echo "   Arxiu creat: /tmp/${ARCHIVE} ($(du -sh /tmp/${ARCHIVE} | cut -f1))"

# --- 3. Copiar la imatge i els fitxers de configuració al servidor ---
echo ""
echo ">> Pas 3/5: Transferint fitxers al servidor..."
scp "/tmp/${ARCHIVE}" "${SERVER}:${REMOTE_DIR}/"
scp docker-compose.yml "${SERVER}:${REMOTE_DIR}/"
ssh "${SERVER}" "mkdir -p ${REMOTE_DIR}/nginx"
scp nginx/gestact.conf "${SERVER}:${REMOTE_DIR}/nginx/"
echo "   Fitxers transferits."

# --- 4. Carregar la imatge i arrencar els contenidors al servidor ---
echo ""
echo ">> Pas 4/5: Carregant imatge i arrencan contenidors..."
ssh "${SERVER}" bash << ENDSSH
  cd ${REMOTE_DIR}
  echo "  Carregant imatge Docker..."
  docker load < ${ARCHIVE}
  echo "  Arrencan contenidors..."
  docker compose up -d
  echo "  Netejant arxiu temporal..."
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
echo "  ssh ${SERVER} 'docker compose -f ${REMOTE_DIR}/docker-compose.yml ps'"
echo "  curl https://gestact.cat/health"
echo ""
