# Hublot

**Tableau de bord des effectifs et statistiques RH** de la Direction générale des Affaires maritimes, de la Pêche et de l'Aquaculture (Ministère de la Mer). Visualisation des données par mission, région, service, statuts, contrats et indicateurs RH.

## ⚠️ Données sensibles

**Ne jamais commiter :** `.env`, dossiers `trdata/` et `src/data/`, fichiers Excel, `agents.json`, certificats (`.pem`, `.key`), `.htpasswd`. Le `.gitignore` est configuré pour les exclure.

## 🚀 Démarrage rapide

### Option 1 : Sans Docker (recommandé pour le développement)

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# L'application sera accessible sur http://localhost:3000
```

### Option 2 : Avec Docker

**Important :** Assurez-vous que Docker Desktop est démarré avant d'utiliser Docker.

```bash
# Vérifier que Docker est prêt
make check-docker

# Si Docker n'est pas démarré, le démarrer manuellement :
# 1. Ouvrir Docker Desktop depuis Applications
# 2. Attendre que l'icône soit verte dans la barre de menu

# Lancer en développement
make dev

# L'application sera accessible sur http://localhost:3000
```

## 📊 Données

Les données sont chargées depuis `src/data/agents.json`. Pour mettre à jour les données depuis Excel :

```bash
# Sans Docker
python3 scripts/convert_excel_to_json.py trdata/Interface_Effectifs_DIRM_Central_V6_corrected.xlsx

# Avec Docker
make convert
```

## 📺 Voir les données sur Netlify

**Tu déploies sur Netlify et tu ne vois pas les données ?**  
→ Tout est expliqué pas à pas ici : **[COMMENT_VOIR_LES_DONNEES_SUR_NETLIFY.md](./COMMENT_VOIR_LES_DONNEES_SUR_NETLIFY.md)**  
(2 options : avec ou sans base de données Neon.)

## 📚 Documentation

- [DOCKER.md](./DOCKER.md) - Guide complet Docker
- [QUICK_START.md](./QUICK_START.md) - Démarrage rapide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage
- [DATA_MODEL.md](./DATA_MODEL.md) - Modèle de données
- [INTEGRATION_DONNEES.md](./INTEGRATION_DONNEES.md) - Intégration des données

## 🛠️ Commandes disponibles

### Développement
```bash
npm run dev          # Lancer en développement
npm run build        # Builder pour production
```

### Docker (si Docker Desktop est démarré)
```bash
make dev             # Développement avec Docker
make prod            # Production avec Docker
make check-docker     # Vérifier Docker
make convert         # Convertir Excel → JSON
```

## ⚠️ Note importante

**Pour utiliser Docker**, vous devez d'abord :
1. Ouvrir **Docker Desktop** manuellement depuis Applications
2. Attendre que l'icône Docker soit **verte** dans la barre de menu
3. Ensuite seulement utiliser les commandes Docker

Si Docker pose problème, utilisez simplement `npm install && npm run dev` - cela fonctionne parfaitement sans Docker !
