/**
 * Netlify Function : renvoie les données agents depuis Neon.
 * Utilise NETLIFY_DATABASE_URL (créée par l’extension Neon sur Netlify) ou DATABASE_URL.
 * Table attendue : agents_export (id INT PRIMARY KEY, payload JSONB)
 */

const { neon } = require('@neondatabase/serverless');

const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

exports.handler = async function (event, context) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (!databaseUrl) {
    return {
      statusCode: 503,
      headers: cors,
      body: JSON.stringify({
        error: 'NETLIFY_DATABASE_URL (ou DATABASE_URL) non configurée. Active l’extension Neon sur Netlify.',
      }),
    };
  }

  try {
    const sql = neon(databaseUrl);
    const rows = await sql`SELECT payload FROM agents_export WHERE id = 1 LIMIT 1`;

    if (!rows || rows.length === 0) {
      return {
        statusCode: 404,
        headers: cors,
        body: JSON.stringify({
          error: 'Aucune donnée dans Neon',
          hint: 'Lance : npm run push-agents-to-neon (avec NETLIFY_DATABASE_URL dans ton .env)',
        }),
      };
    }

    let payload = rows[0].payload;
    if (typeof payload === 'string') payload = JSON.parse(payload);
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.agents)) {
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: 'Format payload invalide (attendu: { agents: [], capacites: {} })' }),
      };
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify(payload),
    };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({
        error: 'Erreur Neon',
        detail: message,
        hint: 'Vérifie que la table agents_export existe (npm run push-agents-to-neon).',
      }),
    };
  }
};
