#!/bin/bash
# Script pour générer un fichier .htpasswd pour l'authentification Nginx
# Usage: ./scripts/generate-htpasswd.sh [username]

if [ -z "$1" ]; then
    echo "Usage: $0 <username>"
    echo "Exemple: $0 admin"
    exit 1
fi

USERNAME=$1
HTPASSWD_FILE="/etc/nginx/.htpasswd"

# Vérifier si htpasswd est installé
if ! command -v htpasswd &> /dev/null; then
    echo "Erreur: htpasswd n'est pas installé."
    echo "Installer avec: sudo apt-get install apache2-utils (Debian/Ubuntu)"
    echo "ou: sudo yum install httpd-tools (CentOS/RHEL)"
    exit 1
fi

# Créer le répertoire si nécessaire
sudo mkdir -p /etc/nginx

# Générer ou mettre à jour le fichier .htpasswd
if [ -f "$HTPASSWD_FILE" ]; then
    echo "Ajout/mise à jour de l'utilisateur $USERNAME dans $HTPASSWD_FILE"
    sudo htpasswd "$HTPASSWD_FILE" "$USERNAME"
else
    echo "Création du fichier $HTPASSWD_FILE avec l'utilisateur $USERNAME"
    sudo htpasswd -c "$HTPASSWD_FILE" "$USERNAME"
fi

echo "Fichier créé/mis à jour: $HTPASSWD_FILE"
echo "N'oubliez pas de décommenter l'authentification dans nginx.conf !"
