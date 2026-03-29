#!/bin/bash
# =============================================================================
# setup-server.sh — Configuració inicial del servidor per a Gestact
# Executa aquest script al servidor Ubuntu com a usuari amb permisos sudo.
# Ús: bash setup-server.sh
# =============================================================================

set -e  # Atura si qualsevol comanda falla

echo "======================================================"
echo "  GESTACT — Configuració del Servidor"
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
sudo usermod -aG docker "$USER"
echo "   Usuari '$USER' afegit al grup docker."

# --- 4. Crear l'estructura de directoris del projecte ---
echo ""
echo ">> Pas 4/5: Creant directoris del projecte..."
sudo mkdir -p /opt/gestact/data
sudo chown -R "$USER":"$USER" /opt/gestact
echo "   Directori /opt/gestact creat."

# --- 5. Crear l'arxiu .env buit per omplir manualment ---
echo ""
echo ">> Pas 5/5: Preparant fitxer de configuració..."
if [ ! -f /opt/gestact/.env ]; then
    cat > /opt/gestact/.env << 'EOF'
# Variables d'entorn de Gestact — OMPLE AMB LES DADES REALS
PORT=3003
NODE_ENV=production
DB_HOST=db
DB_PORT=5433
DB_NAME=gestact_db
DB_USER=gestact_user
DB_PASSWORD=CANVIA_AQUESTA_CONTRASENYA
SESSION_SECRET=CANVIA_AQUEST_SECRET_PER_UN_DE_MOLT_LLARG
EOF
    echo "   Fitxer .env creat a /opt/gestact/.env"
    echo ""
    echo "   !! IMPORTANT: Edita el fitxer .env amb les credencials reals:"
    echo "      nano /opt/gestact/.env"
else
    echo "   El fitxer .env ja existeix, no s'ha sobreescrit."
fi

echo ""
echo "======================================================"
echo "  CONFIGURACIÓ COMPLETADA!"
echo "======================================================"
echo ""
echo "Propers passos:"
echo "  1. Edita les credencials: nano /opt/gestact/.env"
echo "  2. Des del teu ordinador local, executa: bash scripts/deploy.sh"
echo ""
echo "NOTA: Tanca la sessió SSH i torna a obrir-la perquè"
echo "      els permisos del grup docker tinguin efecte."
echo ""
