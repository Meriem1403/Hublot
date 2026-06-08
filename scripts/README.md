# Scripts DevOps et évolution des données

Ce dossier contient les scripts opérationnels utilisés dans la démarche DevOps
du projet Hublot : conversion de données, vérifications d'environnement, audits
et déploiement.

## Prérequis

```bash
pip3 install -r requirements.txt
npm ci
```

## Scripts principaux

### 1) `run-evolution-pipeline.sh` (nouveau standard)

Orchestrateur de la chaîne d'évolution des données (base **1.3.3 / 1.3.4 / 1.3.5**):

1. conversion Excel -> JSON,
2. contrôles de cohérence (IDs uniques, agents actifs, service renseigné),
3. empreinte SHA256 de la version générée,
4. push Neon optionnel.

**Usage :**

```bash
bash scripts/run-evolution-pipeline.sh --file "trdata/Suivi_des_emplois_en_ETPT_RPROG (23).xlsx"
bash scripts/run-evolution-pipeline.sh --file "trdata/Suivi_des_emplois_en_ETPT_RPROG (23).xlsx" --push-neon
```

### 2) `convert_suivi_etpt_to_json.py`

Convertisseur principal pour l'export RenoiRH **Suivi des emplois en ETPT_RPROG**.

**Usage :**

```bash
python3 scripts/convert_suivi_etpt_to_json.py "trdata/Suivi_des_emplois_en_ETPT_RPROG (23).xlsx"
```

**Sorties :**

- `src/data/agents.json`
- `public/data/agents.json`

### 3) `check-test-environment.sh`

Vérifie qu'un poste local reproduit bien l'environnement TEST/CI :

- Node/npm
- fichiers d'environnement
- `lint`, `test:run`, `audit:prod`, `build:test`

**Usage :**

```bash
bash scripts/check-test-environment.sh
```

### 4) `deploy-nas.sh`

Script de déploiement NAS (build + lint + tests + rsync optionnel).

**Usage :**

```bash
./scripts/deploy-nas.sh
NAS_HOST=... NAS_USER=... NAS_PATH=... ./scripts/deploy-nas.sh --rsync
```

## Scripts complémentaires

- `analyze_excel.py` : diagnostic de structure Excel
- `convert_excel_to_json.py` : convertisseur historique (legacy)
- `npm-audit-prod.sh` : audit npm orienté production
- `check-security-headers.sh` : validation headers HTTP sécurité
- `build-pdf.js` : génération PDF depuis Markdown via WeasyPrint
- `sync-annexes-bundle.js` : regénère `docs/Annexes/TOUTES_LES_ANNEXES.md` après modification des annexes
- `push-agents-to-neon.js` / `reset-neon-agents.js` / `check-neon-agents.js` : gestion des données Neon

## Générer la documentation PDF (WeasyPrint)

Prérequis (macOS) :

```bash
brew install weasyprint
```

Commandes :

```bash
# PDF livret compact (~70 pages) : En bref, mise en place, preuves, synthèse
npm run docs:pdf

# PDF annexes uniquement (01 à 13)
npm run docs:pdf:annexes

# PDF complet (~170 pages) : toutes les sections
npm run docs:pdf:full

# Image de couverture personnalisée (PNG/JPG prioritaire sur le SVG)
npm run docs:pdf:one -- --merged --cover "docs/Rendus/mon-logo.png"

# Générer un seul document
npm run docs:pdf:one -- --input "docs/README.md"

# Générer un doc avec sortie personnalisée
npm run docs:pdf:one -- --input "docs/README.md" --output "docs/Rendus/pdf/README.pdf"

# Générer un PDF par document (mode batch)
node scripts/build-pdf.js --all
```

## Bonnes pratiques

- Toujours lancer `run-evolution-pipeline.sh` avant un push de données.
- Ne jamais pousser `agents.json` sans vérifier les compteurs affichés.
- Utiliser `--push-neon` uniquement après validation métier.
