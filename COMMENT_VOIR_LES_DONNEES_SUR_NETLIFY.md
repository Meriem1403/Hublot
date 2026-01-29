# Comment voir les données sur Netlify

Tu as **2 façons** d’afficher les données du tableau de bord sur ton site Netlify. Choisis **une seule**.

---

## Option 1 : Sans base de données (la plus simple)

**À faire :**

1. Sur ton ordinateur, ouvre le dossier du projet (StatDirm / Hublot).
2. Tu dois avoir un fichier qui contient tes données des agents.  
   - Soit : `src/data/agents.json`  
   - Soit : un fichier Excel que tu as déjà converti en JSON.
3. Ouvre un terminal dans ce dossier et tape :
   ```bash
   npm run copy-data-for-netlify
   ```
   Cette commande copie tes données dans le bon endroit pour Netlify.
4. Ensuite :
   ```bash
   git add public/data/agents.json
   git commit -m "Données pour Netlify"
   git push
   ```
5. Attends 1–2 minutes que Netlify redéploie. Rafraîchis ton site : les données devraient s’afficher.

**En résumé :** tu copies ton fichier de données avec une commande, tu le commites et tu pousses. Netlify déploie ce fichier et le site l’utilise.

---

## Option 2 : Avec Neon (base de données Netlify)

Tu utilises ça **seulement si** tu as déjà connecté Neon sur Netlify (extension Neon / Netlify DB).  
Sur Netlify, Neon crée automatiquement la variable **`NETLIFY_DATABASE_URL`** — tu n’as rien à configurer côté variables.

**À faire :**

1. **Mettre tes données dans la base Neon** (une fois, ou à chaque mise à jour) :
   - **En local :** ajoute dans ton fichier `.env` une ligne avec l’URL de la base.  
     Copie la valeur depuis Netlify : **Paramètres du site → Environment variables → NETLIFY_DATABASE_URL** (bouton « Show » pour voir la valeur), puis dans ton `.env` :
     ```bash
     NETLIFY_DATABASE_URL=postgresql://...
     ```
   - Dans un terminal à la racine du projet :
     ```bash
     npm run push-agents-to-neon
     ```
   Ça crée la table dans Neon (si besoin) et y envoie le contenu de ton fichier `src/data/agents.json` ou `public/data/agents.json`.

2. **Déployer :** fais un `git push`. Netlify rebuilde ; le site utilisera **`NETLIFY_DATABASE_URL`** pour lire les données dans Neon et les afficher.

**En résumé :** tu copies `NETLIFY_DATABASE_URL` dans ton `.env`, tu lances `npm run push-agents-to-neon`, puis tu fais `git push`.

---

## Si tu ne sais pas quoi choisir

- Tu n’as **pas** configuré Neon / Netlify DB → utilise **Option 1**.
- Tu as **déjà** connecté Neon à Netlify → tu peux utiliser **Option 2**.

---

## Problème : « Je n’ai pas de fichier agents.json »

- Si tu as un **Excel** avec les effectifs : utilise d’abord le script de conversion (voir README, section « Données ») pour générer `agents.json`, puis reviens à l’**Option 1** ou **Option 2** selon ton cas.
