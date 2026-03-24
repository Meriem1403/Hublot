# ⚡ Démarrage rapide avec Docker

## 🚨 Problème : "Cannot connect to the Docker daemon"

Cette erreur signifie que **Docker Desktop n'est pas démarré**.

### Solution rapide

**Option 1 : Démarrer manuellement**
1. Ouvrez **Docker Desktop** depuis Applications (ou Spotlight : `Cmd + Space`, tapez "Docker")
2. Attendez que l'icône Docker dans la barre de menu soit **verte** ✅
3. Relancez votre commande

**Option 2 : Utiliser le script automatique**
```bash
# Démarrer Docker Desktop automatiquement
make start-docker

# Ou directement
./scripts/start-docker.sh
```

**Option 3 : Vérifier l'état**
```bash
# Vérifier si Docker est prêt
make check-docker

# Ou directement
./scripts/check-docker.sh
```

## ✅ Une fois Docker démarré

```bash
# Vérifier que Docker fonctionne
docker ps

# Lancer l'application en développement
make dev

# L'application sera accessible sur http://localhost:3000
```

## 🔄 Workflow complet

```bash
# 1. Vérifier/Démarrer Docker
make check-docker
# Si erreur : make start-docker

# 2. Lancer l'application
make dev

# 3. Ouvrir dans le navigateur
# http://localhost:3000
```

## 💡 Alternative sans Docker

Si Docker pose problème, vous pouvez utiliser l'application directement :

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# L'application sera accessible sur http://localhost:3000
```

## 📝 Commandes utiles

```bash
# Vérifier Docker
make check-docker

# Démarrer Docker Desktop
make start-docker

# Lancer en développement
make dev

# Voir les logs
make logs

# Arrêter
make stop
```
