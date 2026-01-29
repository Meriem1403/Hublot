#!/usr/bin/env node
/**
 * Envoie agents.json vers Neon (table agents_export).
 * Utilise NETLIFY_DATABASE_URL ou DATABASE_URL (copie la valeur depuis Netlify → Environment variables).
 * Charge automatiquement le fichier .env à la racine du projet s'il existe.
 */

const fs = require('fs');
const path = require('path');

// Charger .env à la racine du projet
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Variable NETLIFY_DATABASE_URL (ou DATABASE_URL) manquante.');
  console.error('Copie la valeur depuis Netlify → Paramètres du site → Environment variables → NETLIFY_DATABASE_URL.');
  console.error('Puis dans ton .env : NETLIFY_DATABASE_URL=postgresql://...');
  process.exit(1);
}

const possiblePaths = [
  path.join(__dirname, '..', 'src', 'data', 'agents.json'),
  path.join(__dirname, '..', 'public', 'data', 'agents.json'),
];

let payload = null;
let jsonPath = null;

for (const p of possiblePaths) {
  if (!fs.existsSync(p)) continue;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.agents)) {
      // Utiliser le fichier qui a des agents, ou le premier trouvé
      if (!payload || parsed.agents.length > payload.agents.length) {
        payload = parsed;
        jsonPath = p;
      }
    }
  } catch (e) {
    continue;
  }
}

if (!payload || !jsonPath) {
  console.error('Aucun fichier agents.json valide trouvé dans src/data/ ou public/data/.');
  console.error('Place ton fichier avec les agents dans src/data/agents.json puis relance la commande.');
  process.exit(1);
}

console.error('Fichier utilisé :', path.relative(path.join(__dirname, '..'), jsonPath));

async function run() {
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS agents_export (
      id INT PRIMARY KEY DEFAULT 1,
      payload JSONB NOT NULL,
      CONSTRAINT single_row CHECK (id = 1)
    )
  `;

  await sql`
    INSERT INTO agents_export (id, payload)
    VALUES (1, ${payload})
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload
  `;

  console.log('OK : données envoyées vers Neon (table agents_export).');
  console.log('Agents:', payload.agents.length);
}

run().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
