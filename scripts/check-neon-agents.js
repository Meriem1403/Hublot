#!/usr/bin/env node
/**
 * Vérifie le payload stocké dans Neon (table agents_export).
 * Affiche le nombre d'agents si la ligne id=1 existe.
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
  process.exit(1);
}

async function run() {
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(databaseUrl);

  const rows = await sql`SELECT payload FROM agents_export WHERE id = 1 LIMIT 1`;
  if (!rows || rows.length === 0) {
    console.log('KO : aucune ligne agents_export.id=1');
    process.exit(2);
  }

  const payload = rows[0].payload;
  const agentsCount = payload && payload.agents && Array.isArray(payload.agents) ? payload.agents.length : null;
  console.log('OK : agents_export.id=1 présent');
  console.log('Agents:', agentsCount);
}

run().catch((err) => {
  console.error('Erreur:', err && err.message ? err.message : String(err));
  process.exit(1);
});

