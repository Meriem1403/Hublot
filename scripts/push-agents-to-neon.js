#!/usr/bin/env node
/**
 * Envoie agents.json vers Neon (table agents_export).
 * Utilise NETLIFY_DATABASE_URL ou DATABASE_URL (copie la valeur depuis Netlify → Environment variables).
 */

const fs = require('fs');
const path = require('path');

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

let jsonPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    jsonPath = p;
    break;
  }
}

if (!jsonPath) {
  console.error('Aucun fichier agents.json trouvé dans src/data/ ou public/data/.');
  process.exit(1);
}

const raw = fs.readFileSync(jsonPath, 'utf8');
let payload;
try {
  payload = JSON.parse(raw);
} catch (e) {
  console.error('Fichier JSON invalide:', jsonPath, e.message);
  process.exit(1);
}

if (!payload || typeof payload !== 'object' || !Array.isArray(payload.agents)) {
  console.error('Le JSON doit contenir { "agents": [], "capacites": {} }.');
  process.exit(1);
}

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
