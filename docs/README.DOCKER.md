# 🐳 Docker - Démarrage rapide

## ⚡ Commandes essentielles

### Développement
```bash
# Avec Make (recommandé)
make dev

# Avec npm
npm run docker:dev

# Avec docker-compose directement
docker-compose -f docker-compose.dev.yml up
```

L'application sera accessible sur **http://localhost:3000**

### Production
```bash
# Avec Make
make prod

# Avec npm
npm run docker:prod

# Avec docker-compose directement
docker-compose -f docker-compose.prod.yml up -d
```

L'application sera accessible sur **http://localhost:8080**

### Convertir Excel → JSON
```bash
# Avec Make (fichier par défaut)
make convert

# Avec Make (fichier spécifique)
make convert-file FILE=trdata/mon_fichier.xlsx

# Avec docker-compose
docker-compose run --rm converter python3 scripts/convert_excel_to_json.py trdata/votre_fichier.xlsx
```

## 📚 Documentation complète

Voir [DOCKER.md](./DOCKER.md) pour la documentation complète.

## 🆘 Aide rapide

```bash
# Voir toutes les commandes disponibles
make help

# Voir les logs
make logs

# Arrêter les conteneurs
make stop

# Nettoyer
make clean
```
