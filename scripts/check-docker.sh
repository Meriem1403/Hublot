#!/bin/bash

# Script de vérification Docker pour StatDirm

echo "🔍 Vérification de Docker..."
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "   Téléchargez Docker Desktop depuis : https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker est installé"
docker --version

# Vérifier si Docker daemon fonctionne
if ! docker info &> /dev/null; then
    echo ""
    echo "❌ Docker daemon n'est pas démarré"
    echo ""
    echo "📋 Solutions :"
    echo "   1. Ouvrez Docker Desktop depuis Applications"
    echo "   2. Attendez que l'icône Docker soit verte dans la barre de menu"
    echo "   3. Relancez cette commande"
    echo ""
    echo "💡 Pour démarrer Docker Desktop automatiquement :"
    echo "   open -a Docker"
    exit 1
fi

echo "✅ Docker daemon fonctionne"
echo ""

# Vérifier docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose n'est pas installé (mais docker compose devrait fonctionner)"
else
    echo "✅ docker-compose est installé"
    docker-compose --version
fi

echo ""
echo "🎉 Docker est prêt ! Vous pouvez maintenant utiliser :"
echo "   make dev        # Lancer en développement"
echo "   make prod       # Lancer en production"
echo "   make convert    # Convertir Excel → JSON"
