#!/bin/bash
# =============================================================================
# setup-server.sh — Configuració inicial del servidor per a Informe Fotogràfic
# Executa aquest script al servidor (ex. Ubuntu) amb permisos sudo.
# Ús: bash setup-server.sh
# =============================================================================

set -e  # Atura si qualsevol comanda falla

echo "======================================================"
echo "  INFORME FOTOGRÀFIC — Configuració del Servidor"
echo "======================================================"

# --- 1. Actualitzar el sistema ---
echo ""
echo ">> Pas 1/5: Actualitzant el sistema..."
sudo apt-get update -y && sudo apt-get upgrade -y

# --- 2. Instal·lar Docker ---
echo ""
echo ">> Pas 2/5: Instal·lant Docker..."
if command -v docker &> /dev/null; then
    echo "   Docker ja està instal·lat: $(docker --version)"
else
    curl -fsSL https://get.docker.com | sudo bash
    echo "   Docker instal·lat correctament."
fi

# --- 3. Afegir l'usuari actual al grup docker ---
echo ""
echo ">> Pas 3/5: Configurant permisos de Docker..."
sudo usermod -aG docker "${SUDO_USER:-$USER}"
echo "   Usuari '${SUDO_USER:-$USER}' afegit al grup docker."

# --- 4. Crear l'estructura de directoris del projecte ---
echo ""
echo ">> Pas 4/5: Creant directoris del projecte..."
sudo mkdir -p /opt/informe-fotografic/database
sudo chown -R "${SUDO_USER:-$USER}":"${SUDO_USER:-$USER}" /opt/informe-fotografic
echo "   Directori /opt/informe-fotografic creat."

# --- 5. Crear l'arxiu .env buit per omplir manualment ---
echo ""
echo ">> Pas 5/5: Preparant fitxer de configuració..."
if [ ! -f /opt/informe-fotografic/.env ]; then
    cat > /opt/informe-fotografic/.env << EOF
# Variables d'entorn d'Informe Fotogràfic — OMPLE AMB LES DADES REALS
PORT=33333
NODE_ENV=production

# Base de dades
DB_PATH=./database/app.db

# JWT Secrets (Gerenar preferiblement amb 'openssl rand -base64 48')
JWT_ACCESS_SECRET=$(openssl rand -base64 48 2>/dev/null || echo "CANVIA_AQUEST_SECRET_ABANS_DE_PRODUCCIO")
JWT_REFRESH_SECRET=$(openssl rand -base64 48 2>/dev/null || echo "CANVIA_AQUEST_SECRET_ABANS_DE_PRODUCCIO")
EOF
    echo "   Fitxer .env creat a /opt/informe-fotografic/.env"
    echo ""
    echo "   !! IMPORTANT: Verifica els JWT secrets o canvia'ls si cal."
    echo "      nano /opt/informe-fotografic/.env"
else
    echo "   El fitxer .env ja existeix, no s'ha sobreescrit."
fi

echo ""
echo "======================================================"
echo "  CONFIGURACIÓ COMPLETADA!"
echo "======================================================"
echo ""
echo "Propers passos:"
echo "  1. Des del teu ordinador local, executa: bash scripts/deploy.sh"
echo ""
echo "NOTA: Si és la teva primera vegada afegint-te al grup docker,"
echo "      tanca la sessió SSH i torna a obrir-la perquè tinguin efecte."
echo ""
