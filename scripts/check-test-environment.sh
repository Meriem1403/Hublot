#!/usr/bin/env bash
# Vérifie que la machine locale est prête pour DEV et TEST (compétence environnement de test).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0

warn() { echo "⚠️  $*"; }
ok() { echo "✅ $*"; }
fail() { echo "❌ $*"; FAIL=1; }

echo "=== Vérification environnement de test — Hublot ==="
echo ""

# Node.js
if ! command -v node >/dev/null; then
  fail "Node.js absent"
else
  NODE_V="$(node -v)"
  ok "Node.js $NODE_V"
  case "$NODE_V" in
    v20.*|v22.*) ;;
    *) warn "CI utilise Node 20 — version locale différente" ;;
  esac
fi

# Fichiers d'environnement versionnés
for f in .env.development .env.test .env.example; do
  if [[ -f "$f" ]]; then ok "Fichier $f présent"; else fail "Fichier $f manquant"; fi
done

if [[ -f .env ]]; then
  ok "Fichier .env local (surcharges perso)"
else
  warn "Pas de .env local — les modes development/test utilisent .env.development / .env.test"
fi

# Dépendances
if [[ -f package-lock.json ]]; then
  ok "package-lock.json présent (reproductibilité CI)"
else
  fail "package-lock.json absent — npm ci échouera en CI"
fi

echo ""
echo "=== Qualité (identique à l'environnement TEST / CI) ==="
npm ci --quiet 2>/dev/null || npm ci
npm run lint
npm run test:run
npm run audit:prod

echo ""
echo "=== Build mode test (préproduction locale) ==="
npm run build:test
if [[ -f build/index.html ]]; then
  ok "build/ généré (mode test)"
else
  fail "build/index.html absent après build:test"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  ok "Environnement prêt — lancer DEV : npm run dev"
  echo "   Preview TEST Docker : npm run test:preview:docker"
  exit 0
fi
fail "Corrections nécessaires avant de considérer l'environnement prêt."
exit 1
