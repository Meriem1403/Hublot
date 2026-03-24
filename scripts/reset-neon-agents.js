#!/usr/bin/env node
/**
 * Réinitialise les données Neon utilisées par l'app (table agents_export).
 * - Sauvegarde d'abord le payload JSON (si présent)
 * - Supprime ensuite la ligne id=1 (base "vidée" pour l'app)
 *
 * Utilise NETLIFY_DATABASE_URL (ou DATABASE_URL).
 * Charge automatiquement le fichier .env à la racine du projet s'il existe.
 */

const fs = require('fs');
const path = require('path');

// Charger .env à la racine du projet (même logique que push-agents-to-neon)
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
  console.error('Ajoute NETLIFY_DATABASE_URL=postgresql://... dans ton .env puis relance.');
  process.exit(1);
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function run() {
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(databaseUrl);

  // Assurer que la table existe (sinon, rien à vider)
  await sql`
    CREATE TABLE IF NOT EXISTS agents_export (
      id INT PRIMARY KEY DEFAULT 1,
      payload JSONB NOT NULL,
      CONSTRAINT single_row CHECK (id = 1)
    )
  `;

  const rows = await sql`SELECT payload FROM agents_export WHERE id = 1 LIMIT 1`;
  if (rows && rows.length > 0) {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const backupPath = path.join(backupDir, `agents_export_${timestamp()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(rows[0].payload, null, 2), 'utf8');
    console.log('Backup créé :', path.relative(path.join(__dirname, '..'), backupPath));
  } else {
    console.log('Aucun payload trouvé (agents_export.id=1) : pas de backup à créer.');
  }

  await sql`DELETE FROM agents_export WHERE id = 1`;
  console.log('OK : agents_export vidé (DELETE WHERE id=1).');
}

run().catch((err) => {
  console.error('Erreur:', err && err.message ? err.message : String(err));
  process.exit(1);
});

