# Données pour le déploiement (Netlify, etc.)

Pour que le site affiche les **vraies données** en production :

1. Copiez votre fichier `agents.json` (même format que pour le build local) ici :
   - **Chemin :** `public/data/agents.json`
2. L’app charge ce fichier à l’exécution au chargement de la page.
3. Vous pouvez **commiter** `public/data/agents.json` pour que Netlify le déploie, ou le garder en local et l’ajouter uniquement sur l’environnement de déploiement.

Si ce fichier est absent, l’app utilise les données de repli (tableau vide).

**Variable d’environnement optionnelle :** `VITE_APP_DATA_URL` = URL complète du JSON (ex. `https://mon-cdn.com/agents.json`) pour charger les données depuis une autre origine.
