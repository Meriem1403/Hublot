#!/bin/bash

# Script pour démarrer Docker Desktop sur macOS

echo "🚀 Démarrage de Docker Desktop..."

# Vérifier si Docker Desktop est déjà en cours d'exécution
if docker info &> /dev/null; then
    echo "✅ Docker Desktop est déjà démarré"
    docker info | head -3
    exit 0
fi

# Essayer de démarrer Docker Desktop
if [ -d "/Applications/Docker.app" ]; then
    echo "📦 Ouverture de Docker Desktop..."
    # Utiliser le chemin complet pour éviter toute confusion avec d'autres applications
    open "/Applications/Docker.app"
    
    echo "⏳ Attente du démarrage de Docker (cela peut prendre 30-60 secondes)..."
    
    # Attendre que Docker soit prêt (maximum 60 secondes)
    for i in {1..60}; do
        if docker info &> /dev/null; then
            echo ""
            echo "✅ Docker Desktop est maintenant démarré !"
            docker info | head -3
            exit 0
        fi
        echo -n "."
        sleep 1
    done
    
    echo ""
    echo "⚠️  Docker Desktop prend plus de temps que prévu"
    echo "   Vérifiez manuellement que Docker Desktop est démarré"
    echo "   (icône Docker dans la barre de menu doit être verte)"
else
    echo "❌ Docker Desktop n'est pas installé"
    echo ""
    echo "📥 Téléchargez Docker Desktop depuis :"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi
