# 🔧 Dépannage Docker

## ❌ Erreur : "Cannot connect to the Docker daemon"

### Solution 1 : Démarrer Docker Desktop

Sur macOS, Docker Desktop doit être démarré :

1. **Ouvrir Docker Desktop** depuis Applications
2. **Attendre** que l'icône Docker dans la barre de menu soit verte
3. **Vérifier** que Docker fonctionne :
   ```bash
   docker ps
   ```

### Solution 2 : Vérifier que Docker Desktop est installé

```bash
# Vérifier l'installation
docker --version

# Si Docker n'est pas installé, télécharger depuis :
# https://www.docker.com/products/docker-desktop
```

### Solution 3 : Redémarrer Docker Desktop

Si Docker Desktop est déjà ouvert mais ne répond pas :

1. **Quitter Docker Desktop** complètement (clic droit sur l'icône → Quit)
2. **Rouvrir Docker Desktop**
3. **Attendre** le démarrage complet

### Solution 4 : Vérifier les permissions

Sur macOS, assurez-vous que Docker Desktop a les permissions nécessaires :

1. Ouvrir **Préférences Système** → **Sécurité et confidentialité**
2. Vérifier que Docker Desktop est autorisé

## ✅ Vérification rapide

```bash
# Vérifier que Docker fonctionne
docker ps

# Vérifier docker-compose
docker-compose --version

# Tester la connexion
docker info
```

## 🚀 Alternative : Utiliser sans Docker

Si Docker pose problème, vous pouvez utiliser l'application directement :

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Builder pour production
npm run build
```

## 📝 Commandes utiles pour diagnostiquer

```bash
# Voir l'état de Docker
docker info

# Voir les conteneurs en cours
docker ps -a

# Voir les images
docker images

# Voir les logs Docker Desktop (macOS)
tail -f ~/Library/Containers/com.docker.docker/Data/log/vm/dockerd.log
```

## 🔄 Redémarrer complètement Docker

Si rien ne fonctionne :

```bash
# Arrêter tous les conteneurs
docker stop $(docker ps -aq)

# Supprimer tous les conteneurs
docker rm $(docker ps -aq)

# Redémarrer Docker Desktop
# (via l'interface graphique : Quit puis Relaunch)
```

## 💡 Astuce

Pour éviter ce problème à l'avenir, vous pouvez :

1. **Configurer Docker Desktop** pour démarrer automatiquement au démarrage de macOS
2. **Ajouter un alias** dans votre `.zshrc` :
   ```bash
   alias docker-start='open -a Docker'
   ```
