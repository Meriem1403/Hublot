#!/usr/bin/env node
/**
 * Copie src/data/agents.json vers public/data/agents.json pour le déploiement Netlify.
 * À lancer quand tu as tes vraies données dans src/data/agents.json, puis commiter public/data/agents.json.
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'data', 'agents.json');
const dest = path.join(__dirname, '..', 'public', 'data', 'agents.json');

if (!fs.existsSync(src)) {
  console.error('Fichier source absent :', src);
  console.error('Place tes données dans src/data/agents.json puis relance : npm run copy-data-for-netlify');
  process.exit(1);
}

const destDir = path.dirname(dest);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Copié : src/data/agents.json → public/data/agents.json');
console.log('Tu peux maintenant commiter et pousser pour que Netlify déploie les données.');
