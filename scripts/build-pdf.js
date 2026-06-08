#!/usr/bin/env node
/**
 * Génération PDF depuis Markdown via WeasyPrint.
 *
 * Prérequis système (macOS) :
 *   brew install weasyprint
 *
 * Usage :
 *   node scripts/build-pdf.js --input "docs/README.md"
 *   node scripts/build-pdf.js --all
 *   node scripts/build-pdf.js --merged
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_CSS = path.join(ROOT, 'docs', 'Rendus', 'pdf-export.css');
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'docs', 'Rendus', 'pdf');
const COVER_IMAGE_CANDIDATES = [
  path.join(ROOT, 'docs', 'Rendus', 'cover-hublot.png'),
  path.join(ROOT, 'docs', 'Rendus', 'cover-hublot.jpg'),
  path.join(ROOT, 'docs', 'Rendus', 'cover-hublot.jpeg'),
  path.join(ROOT, 'docs', 'Rendus', 'cover-hublot.svg'),
];

const PARTS = {
  '1.1': 'Les bases de la démarche DevOps',
  '1.2': "Préparer le déploiement d'une application",
  '1.3': 'Rédiger des scripts dans la démarche DevOps',
};

const PROJECT_TITLE = 'Statistiques DIRM Méditerranée';
const COMPETENCE_TITLE = 'Préparer le déploiement d\u2019une application sécurisée';
/** Date affichée sur la page de garde (livret de rendu). */
const DOCUMENT_DATE_LABEL = 'janvier 2026';

const PROJECT_ACCESS = {
  repo: 'https://github.com/Meriem1403/Hublot',
  actions: 'https://github.com/Meriem1403/Hublot/actions',
  prodUrl: 'https://dirmhublot.netlify.app',
  stagingUrl: 'https://staging--dirmhublot.netlify.app',
  loginProd:
    'Connexion sur le site : identifiants définis dans Netlify (variables VITE_APP_USERNAME et VITE_APP_PASSWORD, non versionnées dans Git).',
  loginLocal: 'Développement local (npm run dev) : admin / demo — fichier .env.development',
};

const ANNEX_DIR = path.join(ROOT, 'docs', 'Annexes');
const ANNEX_CATALOG = [
  { file: 'Annexe_01_build.yml', num: '01', title: 'Workflow CI (GitHub Actions)' },
  { file: 'Annexe_02_netlify.toml', num: '02', title: 'Configuration Netlify' },
  { file: 'Annexe_03_package.json', num: '03', title: 'Scripts npm (extrait package.json)' },
  { file: 'Annexe_04_gitignore', num: '04', title: 'Fichiers exclus du dépôt (.gitignore)' },
  { file: 'Annexe_05_ARCHITECTURE_DEPLOIEMENT.md', num: '05', title: 'Architecture de déploiement' },
  { file: 'Annexe_06_ENVIRONNEMENT_TEST.md', num: '06', title: 'Environnements DEV, TEST, PROD' },
  { file: 'Annexe_07_SECURITE_4_DEPLOIEMENT.md', num: '07', title: 'Sécurité du déploiement' },
  { file: 'Annexe_08_PLAN_TEST.md', num: '08', title: 'Plan de test' },
  { file: 'Annexe_09_DEMO_EPREUVE.md', num: '09', title: "Procédure d'exécution des tests" },
  { file: 'Annexe_10_COMPETENCE_DEPLOIEMENT_STUDI.md', num: '10', title: 'Validation compétence Studi' },
  { file: 'Annexe_11_dataService.test.ts', num: '11', title: 'Tests unitaires dataService (12 tests)' },
  { file: 'Annexe_12_dataCalculations.test.ts', num: '12', title: 'Tests unitaires dataCalculations (20 tests)' },
  { file: 'Annexe_13_SCENARIOS_TEST.md', num: '13', title: 'Scénarios de test (ST-F*, ST-SEC*, ST-AUTO*)' },
];
const DEFAULT_ANNEXES_PDF = path.join(DEFAULT_OUTPUT_DIR, 'Documentation_Annexes_Fusionnee.pdf');

marked.setOptions({ gfm: true, breaks: false });

function parseArgs(argv) {
  const args = {
    all: false,
    merged: false,
    annexes: false,
    input: null,
    output: null,
    css: DEFAULT_CSS,
    cover: null,
    only: null,
    compact: false,
    full: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--merged') args.merged = true;
    else if (a === '--annexes') args.annexes = true;
    else if (a === '--compact') args.compact = true;
    else if (a === '--full') args.full = true;
    else if (a === '--input') args.input = argv[++i];
    else if (a === '--output') args.output = argv[++i];
    else if (a === '--css') args.css = argv[++i];
    else if (a === '--cover') args.cover = argv[++i];
    else if (a === '--only') args.only = argv[++i];
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Option inconnue : ${a}`);
    }
  }
  if (!args.all && !args.merged && !args.annexes && !args.input) {
    throw new Error('Veuillez fournir --input <fichier.md>, --all, --merged ou --annexes');
  }
  return args;
}

function printHelp() {
  console.log(`
Generer des PDF depuis des fichiers Markdown.

Options:
  --input <file.md>   Convertit un seul fichier
  --output <file.pdf> Chemin de sortie (optionnel)
  --css <file.css>    Feuille CSS (defaut: docs/Rendus/pdf-export.css)
  --all               PDF individuels (parcours 1.1 / 1.2 / 1.3)
  --merged            PDF unique avec sommaire et mise en page livret
  --annexes           PDF unique des annexes 01 a 13 (docs/Annexes/)
  --compact           Version livret (~70 p.) : sections essentielles + mise en page dense
  --full              Version complete (toutes sections, ~170 p.) — desactive --compact
  --only <1.1.1,...>  Limite aux numeros de docs (ex. preview redaction)
  --cover <image>     Image de couverture (defaut: docs/Rendus/cover-hublot.*)
  --help, -h          Affiche cette aide
`);
}

function ensureWeasyPrint() {
  const check = spawnSync('weasyprint', ['--version'], { encoding: 'utf8' });
  if (check.error || check.status !== 0) {
    throw new Error(
      'WeasyPrint est introuvable. Installe-le avec: brew install weasyprint'
    );
  }
}

function readMarkdown(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!fs.existsSync(absolute)) throw new Error(`Fichier introuvable: ${filePath}`);
  return { absolute, content: fs.readFileSync(absolute, 'utf8') };
}

/** Nettoyage texte pour PDF : pas d’emoji smartphone ni symboles décoratifs. */
function sanitizeForPdf(text) {
  let s = text;

  // Keycaps (1️⃣, 4️⃣, #️⃣…)
  s = s.replace(/(?:\d|#)\uFE0F?\u20E3/gu, '');

  // Statuts courants → libellés professionnels
  s = s.replace(/✅/g, 'Oui');
  s = s.replace(/❌/g, 'Non');
  s = s.replace(/⚠️?/g, 'Attention');
  s = s.replace(/✓/g, '');

  // Tous les pictogrammes Unicode (emoji smartphone, drapeaux, etc.)
  try {
    s = s.replace(/\p{Extended_Pictographic}/gu, '');
  } catch {
    s = s.replace(
      /[\u{1F000}-\u{1FFFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B50}-\u{2B55}]/gu,
      ''
    );
  }

  // Sélecteurs de variation / joiners résiduels
  s = s.replace(/[\uFE00-\uFE0F\u200D\u20E3]/g, '');

  // Dingbats souvent utilisés comme emoji (⚓ ⚡ …) — conserver → et •
  s = s.replace(/[\u2600-\u26FF]/g, (ch) => (ch === '\u2192' || ch === '\u2022' ? ch : ''));

  // Titres : retirer préfixes « Oui / Non / Attention » laissés par le remplacement
  s = s.replace(/^(#{1,6}\s+)(Oui|Non|Attention)\s+/gm, '$1');

  // Espaces et lignes vides
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

/** Listes GFM `- [ ]` / `- [x]` → puces PDF (WeasyPrint ne gère pas les checkbox HTML). */
function normalizeTaskLists(md) {
  return md
    .replace(/^(\s*)- \[ \] /gm, '$1- ')
    .replace(/^(\s*)- \[[xX]\] /gm, '$1- **Validé** — ');
}

/** Retire les checkbox HTML résiduelles après marked. */
function normalizeHtmlForPdf(html) {
  return html
    .replace(/<input[^>]*type=["']checkbox["'][^>]*>/gi, '')
    .replace(/\sclass="contains-task-list"/gi, '')
    .replace(/\sclass="task-list-item"/gi, '');
}

const H2_SECTION_CLASSES = {
  'En bref': 'sec-summary',
  'Objectif pédagogique': 'sec-objective',
  'Contexte — projet Hublot': 'sec-context',
  'Définitions': 'sec-definitions',
  'Ce qui a été mis en place': 'sec-implemented',
  'Pourquoi ces choix': 'sec-why',
  'Comment ça fonctionne': 'sec-how',
  'Quand': 'sec-when',
  'Quand utiliser quel environnement': 'sec-when',
  'Preuves et démonstration': 'sec-proof',
  'Preuves et démonstration (parcours jury, ~5 min)': 'sec-proof',
  'Preuves et démonstration': 'sec-proof',
  'Synthèse': 'sec-synthesis',
  'Documents liés': 'sec-links',
  'Bonnes pratiques': 'sec-tips',
  "Ce qui n'est pas en place (limites assumées)": 'sec-notes',
};

function tagSectionHeadings(html) {
  let out = html;
  for (const [title, cls] of Object.entries(H2_SECTION_CLASSES)) {
    const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(`<h2>${esc}</h2>`, 'gi'),
      `<h2 class="doc-h2 ${cls}">${title}</h2>`
    );
  }
  out = out.replace(/<h2>([^<]+)<\/h2>/g, '<h2 class="doc-h2 sec-default">$1</h2>');
  return out;
}

/** Encadre chaque section h2 dans un bloc coloré. */
function wrapSectionBlocks(html) {
  const matches = [...html.matchAll(/<h2 class="doc-h2 ([^"]+)">([^<]*)<\/h2>/g)];
  if (matches.length === 0) return html;

  let result = html.slice(0, matches[0].index);
  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    const start = m.index;
    const contentStart = start + m[0].length;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const inner = html.slice(contentStart, contentEnd);
    result += `<div class="doc-block ${m[1]}">${m[0]}${inner}</div>`;
  }
  return result;
}

function enhanceHtmlForPdf(html, { annexes = false } = {}) {
  let out = wrapSectionBlocks(tagSectionHeadings(normalizeHtmlForPdf(html)));
  out = classifyTables(out);
  out = wrapCodeBlocks(out, { annexes });
  out = wrapNotes(out);
  return out;
}

function stripTags(text) {
  return text.replace(/<[^>]+>/g, '').trim();
}

/** Typologie des tableaux selon leurs en-têtes. */
function classifyTables(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/gi, (full, inner) => {
    const headers = [...inner.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
      stripTags(m[1]).toLowerCase()
    );
    const colCount = headers.length || [...inner.match(/<td/g)].length;

    let kind = 'table-data';
    const h0 = headers[0] || '';
    const isNumericStepCol = /^(#|n°|num\.?|no\.?|numéro|numero)$/.test(h0);

    if (colCount >= 4) kind = 'table-matrix';
    if (headers.some((h) => h.includes('statut') || h.includes('résultat') || h.includes('resultat'))) {
      kind = 'table-status';
    }
    if (isNumericStepCol) {
      kind = 'table-steps';
    } else if (
      headers.some((h) => h.includes('étape') || h.includes('etape')) &&
      headers.some((h) => h.includes('commande'))
    ) {
      kind = 'table-pipeline';
    } else if (colCount === 2 && /terme|élément|element|artefact|enjeu|pratique|signal|type|fichier|env\.?/.test(h0)) {
      kind = 'table-keyvalue';
    }

    return `<div class="table-wrap table-wrap-${kind.replace('table-', '')}"><table class="${kind}">${inner}</table></div>`;
  });
}

function wrapCodeBlocks(html, { annexes = false } = {}) {
  const panelClass = annexes ? 'code-panel code-panel--annexe' : 'code-panel';
  return html.replace(
    /<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi,
    (_, lang, code) => {
      const l = (lang || '').toLowerCase();
      const label = l === 'bash' || l === 'sh' || l === 'shell' ? 'Terminal' : l === 'json' ? 'JSON' : l ? l.toUpperCase() : 'Code';
      return `<div class="${panelClass}"><div class="code-panel-label">${label}</div><pre class="code-panel-body"><code>${code}</code></pre></div>`;
    }
  );
}

function wrapNotes(html) {
  return html.replace(
    /<blockquote>\s*([\s\S]*?)<\/blockquote>/gi,
    '<aside class="note-box"><blockquote>$1</blockquote></aside>'
  );
}

function stripEmojis(text) {
  return sanitizeForPdf(text);
}

function escapeHtmlAttr(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseDocMeta(filePath) {
  const base = path.basename(filePath, '.md');
  const m = base.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  const number = m ? m[1] : '';
  let title = stripEmojis(m ? m[2] : base);
  title = title.replace(/\s*\([^)]*épreuve[^)]*\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  const partKey = number.split('.').slice(0, 2).join('.');
  const partTitle = PARTS[partKey] || '';
  const slug = number ? number.replace(/\./g, '-') : base.replace(/\W+/g, '-').toLowerCase();
  return { number, title, partKey, partTitle, slug, id: `doc-${slug}` };
}

/** Sections conservées en mode compact (livret, cible ≤ 70 pages). */

/** Ton livrable professionnel : pas de vocabulaire « notes de soutenance ». */
function sanitizeDeliveryTone(text) {
  return text
    .replace(/\(parcours jury[^)]*\)/gi, '')
    .replace(/,\s*~5 min/gi, '')
    .replace(/\bRéférences pour le jury\b/gi, 'Références du projet')
    .replace(/\btraçabilité jury\b/gi, 'traçabilité et auditabilité')
    .replace(/\bvalidation jury\b/gi, 'validation qualité')
    .replace(/\bau jury\b/gi, 'à la validation')
    .replace(/\bpour le jury\b/gi, 'comme preuve de conformité')
    .replace(/\bdémo jury\b/gi, 'démonstration')
    .replace(/\bDémo jury\b/g, 'Démonstration')
    .replace(/\bLivraison jury\b/gi, 'Livraison documentée')
    .replace(/\bRapport jury\b/gi, "Rapport d'exécution")
    .replace(/\bDémo épreuve Studi\b/gi, 'Validation Studi')
    .replace(/\bmontré au jury\b/gi, 'reproductible localement')
    .replace(/\bdémo oral\b/gi, 'procédure documentée')
    .replace(/\bDémonstration orale\b/gi, 'Vérification reproductible')
    .replace(/\bsur scène\b/gi, 'en production')
    .replace(/\bposte du candidat\b/gi, 'poste de travail')
    .replace(/\bpour tenir le durée de démonstration\b/gi, 'pour une exécution rapide')
    .replace(/\bpour audit et jury\b/gi, 'pour audit et traçabilité')
    .replace(/\bdéveloppement et validation jury\b/gi, 'développement et validation qualité')
    .replace(/\bprouver au jury\b/gi, 'prouver en validation')
    .replace(/\bPreuve datée pour le jury\b/gi, 'Preuve datée de conformité')
    .replace(/\bdémo oral\b/gi, 'procédure documentée')
    .replace(/\bjury\b/gi, 'conformité')
    .replace(/\bsoutenance\b/gi, 'validation')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}
function isCompactSection(title) {
  const t = title.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (t === 'en bref') return true;
  if (t === 'synthese') return true;
  if (t.startsWith('preuves et demonstration')) return true;
  if (t.startsWith('ce qui a ete mis en place')) return true;
  if (t.startsWith('commandes essentielles')) return true;
  if (t.includes('checklist detaillee')) return true;
  return false;
}

function compactMarkdown(content) {
  const lines = content.split('\n');
  const kept = [];
  let inSection = false;
  let inFence = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      if (inSection) kept.push(line);
      continue;
    }
    if (inFence) {
      if (inSection) kept.push(line);
      continue;
    }
    if (/^# /.test(line) && !/^## /.test(line)) {
      continue;
    }
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      inSection = isCompactSection(h2[1]);
      if (inSection) {
        if (kept.length > 0 && kept[kept.length - 1] !== '') kept.push('');
        kept.push(line);
      }
      continue;
    }
    if (inSection) kept.push(line);
  }

  const body = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return body;
}

/** Supprime le h2 du corps si doublon avec l'en-tête de chapitre (fusion). */
function stripDuplicateDocHeading(html, meta) {
  if (!meta.number) return html;
  const num = meta.number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`<h2[^>]*>\\s*${num}(?:\\s|&nbsp;)[^<]*</h2>\\s*`, 'i'),
    ''
  );
}

function preprocessMarkdown(content, meta, { merged, compact }) {
  let md = sanitizeForPdf(content);
  md = sanitizeDeliveryTone(md);
  md = normalizeTaskLists(md);

  md = md.replace(/```mermaid[\s\S]*?```/g, '\n> *Schéma interactif : consulter la version Markdown du dépôt.*\n');

  if (compact) {
    md = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, body) => {
      const langTag = (lang || '').trim().toLowerCase();
      const isShell = !langTag || ['bash', 'sh', 'shell', 'zsh'].includes(langTag);
      const lines = body.trim().split('\n');
      if (!isShell || lines.length <= 6) return `\`\`\`${lang}\n${body}\`\`\``;
      return `\`\`\`${lang}\n${lines.slice(0, 5).join('\n')}\n# … (voir dépôt)\n\`\`\``;
    });
    md = md.replace(/```\n([\s\S]*?)```/g, (block, body) => {
      if (/→|git push|npm run/.test(body)) return block;
      const oneLine = body.trim().replace(/\s*\n\s*/g, ' → ');
      if (oneLine.length > 120) return `\n> ${oneLine.slice(0, 117)}…\n`;
      return `\n> ${oneLine}\n`;
    });
  }

  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const label = sanitizeForPdf(text);
    if (url.startsWith('http')) return `${label} (${url})`;
    return label;
  });

  if (merged) {
    md = md.replace(/^# .+\n+Ce document complète\s*:[\s\S]*?\n---\n*/m, '');
    md = md.replace(/^# .+\n+Référentiel[\s\S]*?\n---\n*/m, (block) => {
      if (block.length > 600) return block.split('---')[0] + '\n';
      return block;
    });
    md = md.replace(/\n##\s*(?:\d+[\).]\s*)?R[eé]férences\s*\n[\s\S]*$/i, '');
    md = md.replace(/\n---\n+(?=## )/g, '\n\n');
    md = md.replace(/^# /gm, '## ');
    if (meta.number) {
      const num = meta.number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      md = md.replace(new RegExp(`^## ${num}\\s+[^\\n]+\\n+`, 'm'), '');
    }
  }

  return md.trim();
}

function htmlTemplate({ title, bodyHtml, cssHref, extraHead = '', compact = false, annexes = false }) {
  const classes = [compact && 'pdf-compact', annexes && 'pdf-annexes'].filter(Boolean).join(' ');
  const bodyClass = classes ? ` class="${classes}"` : '';
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <link rel="stylesheet" href="${cssHref}" />
    ${extraHead}
  </head>
  <body${bodyClass}>
    ${bodyHtml}
  </body>
</html>`;
}

function resolveCoverImage(customPath) {
  if (customPath) {
    const abs = path.isAbsolute(customPath) ? customPath : path.join(ROOT, customPath);
    if (fs.existsSync(abs)) return abs;
    throw new Error(`Image de couverture introuvable: ${customPath}`);
  }
  return COVER_IMAGE_CANDIDATES.find((p) => fs.existsSync(p)) || null;
}

function renderCover(coverImagePath, { variant = 'livret' } = {}) {
  const coverPath = resolveCoverImage(coverImagePath);
  const imageHtml = coverPath
    ? `<img class="cover-image" src="file://${coverPath}" alt="Hublot - DIRM Mediterranee" />`
    : '';

  if (variant === 'annexes') {
    return `
    <section class="cover-page cover-page--annexes">
      <div class="cover-inner cover-inner--annexes">
        <p class="cover-annexe-kicker">Volume annexe — hors livret principal</p>
        <h1 class="cover-annexe-headline">Documents annexes</h1>
        <p class="cover-annexe-range">Pièces jointes <strong>01</strong> à <strong>13</strong></p>
        ${imageHtml ? `<div class="cover-image-wrap cover-image-wrap--annexes">${imageHtml}</div>` : ''}
        <p class="cover-title cover-title--annexes">${PROJECT_TITLE}</p>
        <p class="cover-subtitle cover-subtitle--annexes">Configuration · Tests · Preuves techniques</p>
        <div class="cover-divider cover-divider--annexes"></div>
        <ul class="cover-annexe-list">
          <li><span>01–04</span> Fichiers de configuration (CI, Netlify, npm, Git)</li>
          <li><span>05–10</span> Architecture, environnements, sécurité, tests, compétence</li>
          <li><span>11–13</span> Code de tests et scénarios ST-*</li>
        </ul>
        <p class="cover-meta cover-meta--annexes">Complément du dossier Studi — blocs 1.1, 1.2 et 1.3</p>
        <p class="cover-date cover-date--annexes">Documentation rédigée en ${DOCUMENT_DATE_LABEL}</p>
      </div>
    </section>
  `;
  }

  return `
    <section class="cover-page">
      <div class="cover-inner">
        ${imageHtml}
        <p class="cover-badge">Documentation technique</p>
        <h1 class="cover-title">${PROJECT_TITLE}</h1>
        <p class="cover-subtitle">${COMPETENCE_TITLE}</p>
        <div class="cover-divider"></div>
        <p class="cover-meta">Parcours Studi — Blocs 1.1, 1.2 et 1.3</p>
        <div class="cover-footer">
          <div class="cover-access">
            <p class="cover-access-line"><span class="cover-access-label">Dépôt GitHub</span> ${PROJECT_ACCESS.repo.replace('https://', '')}</p>
            <p class="cover-access-line"><span class="cover-access-label">CI / Actions</span> ${PROJECT_ACCESS.actions.replace('https://', '')}</p>
            <p class="cover-access-line"><span class="cover-access-label">Application (prod)</span> ${PROJECT_ACCESS.prodUrl.replace('https://', '')}</p>
          </div>
          <p class="cover-date">Documentation rédigée en ${DOCUMENT_DATE_LABEL}</p>
        </div>
      </div>
    </section>
  `;
}

function renderProjectAccess() {
  return `
    <section class="access-page" id="acces-projet">
      <div class="access-banner">
        <h1 class="access-heading">Accès au projet</h1>
        <p class="access-subtitle">GitHub · Netlify · Connexion</p>
      </div>
      <p class="access-lead">Références du projet : dépôt source, pipeline CI et application déployée.</p>
      <table class="access-table">
        <tbody>
          <tr>
            <th scope="row">Dépôt GitHub</th>
            <td><a href="${PROJECT_ACCESS.repo}">${PROJECT_ACCESS.repo}</a></td>
          </tr>
          <tr>
            <th scope="row">Workflows CI</th>
            <td><a href="${PROJECT_ACCESS.actions}">${PROJECT_ACCESS.actions}</a></td>
          </tr>
          <tr>
            <th scope="row">Application (production)</th>
            <td><a href="${PROJECT_ACCESS.prodUrl}">${PROJECT_ACCESS.prodUrl}</a></td>
          </tr>
          <tr>
            <th scope="row">Préproduction (staging)</th>
            <td><a href="${PROJECT_ACCESS.stagingUrl}">${PROJECT_ACCESS.stagingUrl}</a></td>
          </tr>
          <tr>
            <th scope="row">Connexion au site</th>
            <td>${PROJECT_ACCESS.loginProd}</td>
          </tr>
          <tr>
            <th scope="row">Connexion locale</th>
            <td>${PROJECT_ACCESS.loginLocal}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderToc(entries, { subtitle = 'Parcours 1.1 · 1.2 · 1.3' } = {}) {
  const rows = entries
    .map(
      (e) => `
      <tr class="toc-row toc-depth-${e.depth}">
        <td class="toc-title">
          <a href="#${e.id}">${e.number ? `<span class="toc-num">${e.number}</span> ` : ''}${e.title}</a>
        </td>
        <td class="toc-page"><a href="#${e.id}"></a></td>
      </tr>`
    )
    .join('');

  return `
    <section class="toc-page">
      <div class="toc-banner">
        <h1 class="toc-heading">Sommaire</h1>
        <p class="toc-subtitle">${subtitle}</p>
      </div>
      <table class="toc-table">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderPartPage(partKey, partTitle, { compact }) {
  const slug = partKey.replace('.', '-');
  if (compact) {
    return `
    <div class="part-divider" id="part-${slug}">
      <h2 class="part-divider-title">${partTitle}</h2>
    </div>
  `;
  }
  return `
    <section class="part-page" id="part-${slug}">
      <div class="part-inner">
        <p class="part-kicker">Partie ${partKey}</p>
        <h1 class="part-title">${partTitle}</h1>
      </div>
    </section>
  `;
}

function renderDocSection(meta, bodyHtml, { compact = false, partIntro = null } = {}) {
  const titleHtml = meta.number
    ? compact
      ? `<h1 class="doc-title"><span class="doc-num">${meta.number}</span> ${meta.title}</h1>`
      : `<p class="doc-kicker">${meta.number}</p><h1 class="doc-title">${meta.title}</h1>`
    : `<h1 class="doc-title">${meta.title}</h1>`;

  const partHtml =
    partIntro && compact
      ? `
      <div class="part-divider${partIntro.newPage ? ' part-divider--new-page' : ''}" id="part-${partIntro.slug}">
        <h2 class="part-divider-title">${partIntro.title}</h2>
      </div>`
      : '';

  return `
    <section class="doc-section" id="${meta.id}" data-number="${meta.number}" data-title="${escapeHtmlAttr(meta.title)}">
      ${partHtml}
      <header class="doc-header">
        ${titleHtml}
      </header>
      <div class="doc-body">
        ${bodyHtml}
      </div>
    </section>
  `;
}

function convertOne(mdPath, outputPath, cssPath, { compact = false } = {}) {
  const { absolute, content } = readMarkdown(mdPath);
  const meta = parseDocMeta(absolute);
  let md = content;
  if (compact) md = compactMarkdown(md);
  const htmlBody = enhanceHtmlForPdf(
    marked.parse(preprocessMarkdown(md, meta, { merged: false, compact }))
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statdirm-pdf-'));
  const htmlPath = path.join(tmpDir, 'input.html');
  const cssAbs = path.isAbsolute(cssPath) ? cssPath : path.join(ROOT, cssPath);
  const cssHref = `file://${cssAbs}`;
  const html = htmlTemplate({ title: meta.title, bodyHtml: htmlBody, cssHref, compact });
  fs.writeFileSync(htmlPath, html, 'utf8');

  const out =
    outputPath ||
    path.join(DEFAULT_OUTPUT_DIR, path.basename(mdPath, '.md') + '.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const run = spawnSync('weasyprint', [htmlPath, out], { encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(`Echec WeasyPrint sur ${mdPath}\n${run.stderr || run.stdout}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return out;
}

function annexCodeLang(fileName) {
  if (fileName.endsWith('.yml')) return 'yaml';
  if (fileName.endsWith('.toml')) return 'toml';
  if (fileName.endsWith('.json')) return 'json';
  if (fileName.endsWith('.ts')) return 'typescript';
  if (fileName.includes('gitignore')) return 'gitignore';
  return 'text';
}

function annexMarkdownFromFile(entry) {
  const abs = path.join(ANNEX_DIR, entry.file);
  if (!fs.existsSync(abs)) {
    throw new Error(`Annexe introuvable : ${entry.file}`);
  }
  let raw = fs.readFileSync(abs, 'utf8').trim();
  return raw
    .replace(/^# Annexe \d+[^\n]*\n+/i, '')
    .replace(/^> Copie pour livrable[^\n]*\n+---\n+/i, '')
    .replace(/^# \d+[^\n]*\n+/m, '')
    .trim();
}

const ANNEX_CODE_LABELS = {
  yaml: 'YAML',
  toml: 'TOML',
  json: 'JSON',
  typescript: 'TypeScript',
  gitignore: 'Gitignore',
  text: 'Texte',
};

function renderAnnexSourceNote(entry) {
  return `<p class="annex-source-note"><em>Source :</em> <code>docs/Annexes/${escapeHtml(entry.file)}</code></p>`;
}

/** Corps HTML d'une annexe (fichiers code en HTML direct — évite les pages vides WeasyPrint). */
function renderAnnexBodyHtml(entry) {
  const sourceHtml = renderAnnexSourceNote(entry);
  if (entry.file.endsWith('.md')) {
    const meta = {
      id: `annexe-${entry.num}`,
      number: entry.num,
      title: entry.title,
      partKey: null,
    };
    const md = annexMarkdownFromFile(entry);
    const inner = enhanceHtmlForPdf(
      marked.parse(preprocessMarkdown(md, meta, { merged: false, compact: false })),
      { annexes: true }
    );
    return sourceHtml + inner;
  }

  const abs = path.join(ANNEX_DIR, entry.file);
  const raw = fs.readFileSync(abs, 'utf8');
  const lang = annexCodeLang(entry.file);
  const label = ANNEX_CODE_LABELS[lang] || lang.toUpperCase();
  return `${sourceHtml}
<div class="annex-code-panel">
  <div class="annex-code-label">${label}</div>
  <pre class="annex-code-body"><code>${escapeHtml(raw)}</code></pre>
</div>`;
}

function convertAnnexesMerged(outputPath, cssPath, coverImagePath) {
  const cssAbs = path.isAbsolute(cssPath) ? cssPath : path.join(ROOT, cssPath);
  const cssHref = `file://${cssAbs}`;
  const sections = [];
  const tocEntries = [];

  for (const entry of ANNEX_CATALOG) {
    const meta = {
      id: `annexe-${entry.num}`,
      number: entry.num,
      title: entry.title,
      partKey: null,
    };
    const body = renderAnnexBodyHtml(entry);
    sections.push(renderDocSection(meta, body, { compact: false }));
    tocEntries.push({
      id: meta.id,
      number: meta.number,
      title: meta.title,
      depth: 2,
    });
  }

  const html = htmlTemplate({
    title: 'Annexes — Hublot',
    bodyHtml: [
      renderCover(coverImagePath, { variant: 'annexes' }),
      renderToc(tocEntries, { subtitle: 'Annexes 01 à 13' }),
      ...sections,
    ].join('\n'),
    cssHref,
    annexes: true,
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statdirm-pdf-annexes-'));
  const htmlPath = path.join(tmpDir, 'annexes.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const out = outputPath || DEFAULT_ANNEXES_PDF;
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const run = spawnSync('weasyprint', [htmlPath, out], { encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (run.status !== 0) {
    throw new Error(`Echec WeasyPrint sur les annexes\n${run.stderr || run.stdout}`);
  }
  return out;
}

function convertMerged(docs, outputPath, cssPath, coverImagePath, { compact = false } = {}) {
  if (!docs.length) throw new Error('Aucun document .md a fusionner');

  const cssAbs = path.isAbsolute(cssPath) ? cssPath : path.join(ROOT, cssPath);
  const cssHref = `file://${cssAbs}`;
  const sections = [];
  const tocEntries = [];
  let lastPart = null;
  let partIntro = null;

  for (const doc of docs) {
    const rel = path.relative(ROOT, doc);
    const meta = parseDocMeta(doc);
    const { content } = readMarkdown(rel);
    let md = content;
    if (compact) md = compactMarkdown(md);
    let body = enhanceHtmlForPdf(
      marked.parse(preprocessMarkdown(md, meta, { merged: true, compact }))
    );
    body = stripDuplicateDocHeading(body, meta);

    partIntro = null;
    if (meta.partKey && meta.partKey !== lastPart && PARTS[meta.partKey]) {
      const slug = meta.partKey.replace('.', '-');
      partIntro = {
        slug,
        title: PARTS[meta.partKey],
        newPage: meta.partKey !== '1.1',
      };
      tocEntries.push({
        id: `part-${slug}`,
        number: '',
        title: PARTS[meta.partKey],
        depth: 1,
      });
      lastPart = meta.partKey;
      if (!compact) {
        sections.push(renderPartPage(meta.partKey, PARTS[meta.partKey], { compact: false }));
      }
    }

    sections.push(renderDocSection(meta, body, { compact, partIntro }));
    tocEntries.push({
      id: meta.id,
      number: meta.number,
      title: meta.title,
      depth: meta.number.split('.').length >= 3 ? 3 : 2,
    });
  }

  tocEntries.unshift({
    id: 'acces-projet',
    number: '',
    title: 'Accès GitHub et Netlify',
    depth: 1,
  });

  const html = htmlTemplate({
    title: 'Documentation fusionnee',
    bodyHtml: [
      renderCover(coverImagePath),
      renderToc(tocEntries),
      renderProjectAccess(),
      ...sections,
    ].join('\n'),
    cssHref,
    compact,
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statdirm-pdf-merged-'));
  const htmlPath = path.join(tmpDir, 'merged.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const out = outputPath || path.join(DEFAULT_OUTPUT_DIR, 'Documentation_Complete_Fusionnee.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const run = spawnSync('weasyprint', [htmlPath, out], { encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (run.status !== 0) {
    throw new Error(`Echec WeasyPrint sur la fusion\n${run.stderr || run.stdout}`);
  }
  return out;
}

function collectDocs() {
  const roots = [
    path.join(ROOT, 'docs', '1.1 Les bases de la démarche DevOps'),
    path.join(ROOT, 'docs', '1.2 Préparer le déploiement d\'une application'),
    path.join(ROOT, 'docs', '1.3 Rédiger des scriptes dans la démarche DevOps'),
  ];

  const files = [];
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.md')) files.push(path.join(dir, name));
    }
  }

  const extractNums = (p) => {
    const name = path.basename(p, '.md');
    const m = name.match(/^(\d+(?:\.\d+)*)/);
    if (!m) return [];
    return m[1].split('.').map((n) => Number(n));
  };

  const compareNumericSections = (aNums, bNums) => {
    const len = Math.max(aNums.length, bNums.length);
    for (let i = 0; i < len; i += 1) {
      const av = aNums[i] ?? -1;
      const bv = bNums[i] ?? -1;
      if (av !== bv) return av - bv;
    }
    return 0;
  };

  return files.sort((a, b) => {
    const n = compareNumericSections(extractNums(a), extractNums(b));
    if (n !== 0) return n;
    return path.basename(a).localeCompare(path.basename(b), 'fr');
  });
}

function extractDocNumber(filePath) {
  const m = path.basename(filePath, '.md').match(/^(\d+(?:\.\d+)*)/);
  return m ? m[1] : null;
}

function filterDocsByOnly(docs, onlyCsv) {
  if (!onlyCsv) return docs;
  const allowed = new Set(
    onlyCsv.split(',').map((s) => s.trim()).filter(Boolean)
  );
  const filtered = docs.filter((d) => allowed.has(extractDocNumber(d)));
  if (filtered.length === 0) {
    throw new Error(`Aucun document ne correspond a --only (${onlyCsv})`);
  }
  return filtered;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    ensureWeasyPrint();
    const css = args.css;

    if (args.annexes) {
      const out = args.output || DEFAULT_ANNEXES_PDF;
      const generated = convertAnnexesMerged(out, css, args.cover);
      console.log(`OK annexes (${ANNEX_CATALOG.length} pieces) -> ${path.relative(ROOT, generated)}`);
      return;
    }

    if (args.merged) {
      const docs = filterDocsByOnly(collectDocs(), args.only);
      if (docs.length === 0) {
        throw new Error('Aucun document .md trouve dans docs/1.1, 1.2, 1.3');
      }
      const compact = !args.full;
      const out =
        args.output ||
        (args.only
          ? path.join(DEFAULT_OUTPUT_DIR, 'Documentation_Preview_Redaction.pdf')
          : args.full
            ? path.join(DEFAULT_OUTPUT_DIR, 'Documentation_Complete_Fusionnee_Full.pdf')
            : path.join(DEFAULT_OUTPUT_DIR, 'Documentation_Complete_Fusionnee.pdf'));
      const generated = convertMerged(docs, out, css, args.cover, { compact });
      const mode = compact ? 'compact' : 'complet';
      console.log(`OK fusion ${mode} (${docs.length} docs) -> ${path.relative(ROOT, generated)}`);
      return;
    }

    if (args.all) {
      const docs = filterDocsByOnly(collectDocs(), args.only);
      if (docs.length === 0) {
        throw new Error('Aucun document .md trouve dans docs/1.1, 1.2, 1.3');
      }
      console.log(`Generation PDF: ${docs.length} documents`);
      for (const doc of docs) {
        const rel = path.relative(ROOT, doc);
        const out = path.join(DEFAULT_OUTPUT_DIR, path.basename(doc, '.md') + '.pdf');
        const generated = convertOne(rel, out, css);
        console.log(`OK ${rel} -> ${path.relative(ROOT, generated)}`);
      }
      return;
    }

    const out = convertOne(args.input, args.output, css);
    console.log(`OK ${args.input} -> ${path.relative(ROOT, out)}`);
  } catch (err) {
    console.error(`Erreur: ${err.message}`);
    process.exit(1);
  }
}

main();
