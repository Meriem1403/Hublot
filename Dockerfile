# Dockerfile multi-stage pour StatDirm (Vite)
# Stage 1: Build de l'application
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances (npm install si pas de package-lock.json)
RUN npm ci --only=production=false 2>/dev/null || npm install

# Copier le code source
COPY . .

# Builder l'application (sortie Vite: /app/build — voir vite.config.ts outDir)
RUN npm run build

# Stage 2: Serveur de production avec Nginx
FROM nginx:alpine AS production

# Installer wget pour le healthcheck
RUN apk add --no-cache wget

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Créer le répertoire pour les certificats SSL (sera monté en production)
RUN mkdir -p /etc/nginx/ssl

# Sécurité : Supprimer les fichiers sensibles du build
RUN find /usr/share/nginx/html -name "*.env*" -delete || true
RUN find /usr/share/nginx/html -name ".git*" -delete || true

# Exposer le port HTTP
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Développement (optionnel)
FROM node:20-alpine AS development

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer toutes les dépendances (y compris dev)
RUN npm install

# Copier le code source
COPY . .

# Exposer le port de développement Vite
EXPOSE 5173

# Commande par défaut pour le développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
