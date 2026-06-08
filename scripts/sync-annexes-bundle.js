#!/usr/bin/env node
/**
 * Regénère docs/Annexes/TOUTES_LES_ANNEXES.md à partir des fichiers Annexe_XX.
 * Usage : node scripts/sync-annexes-bundle.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANNEX_DIR = path.join(ROOT, 'docs', 'Annexes');
const OUT = path.join(ANNEX_DIR, 'TOUTES_LES_ANNEXES.md');

const FILES = [
  'Annexe_01_build.yml',
  'Annexe_02_netlify.toml',
  'Annexe_03_package.json',
  'Annexe_04_gitignore',
  'Annexe_05_ARCHITECTURE_DEPLOIEMENT.md',
  'Annexe_06_ENVIRONNEMENT_TEST.md',
  'Annexe_07_SECURITE_4_DEPLOIEMENT.md',
  'Annexe_08_PLAN_TEST.md',
  'Annexe_09_DEMO_EPREUVE.md',
  'Annexe_10_COMPETENCE_DEPLOIEMENT_STUDI.md',
  'Annexe_11_dataService.test.ts',
  'Annexe_12_dataCalculations.test.ts',
  'Annexe_13_SCENARIOS_TEST.md',
];

const parts = [
  '# Toutes les annexes (01 à 13)',
  '',
  'Document généré automatiquement — **ne pas éditer à la main**.',
  'Commande : `node scripts/sync-annexes-bundle.js`',
  '',
  'Index : [README.md](./README.md)',
  '',
  '---',
  '',
];

for (const name of FILES) {
  const filePath = path.join(ANNEX_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier manquant : ${name}`);
  }
  const body = fs.readFileSync(filePath, 'utf8').trimEnd();
  parts.push(`## ${name}`, '', body, '', '---', '');
}

fs.writeFileSync(OUT, `${parts.join('\n')}\n`, 'utf8');
console.log(`OK -> ${path.relative(ROOT, OUT)} (${FILES.length} annexes)`);
