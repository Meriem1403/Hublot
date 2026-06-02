#!/usr/bin/env bash
#
# Orchestrateur des scripts d'évolution de données (ETPT -> agents.json).
# Couvre la chaîne complète :
#   1) conversion
#   2) contrôles de cohérence
#   3) (optionnel) push vers Neon
#
# Usage :
#   bash scripts/run-evolution-pipeline.sh --file "trdata/Suivi_des_emplois_en_ETPT_RPROG (23).xlsx"
#   bash scripts/run-evolution-pipeline.sh --file "...xlsx" --push-neon
#   bash scripts/run-evolution-pipeline.sh --help

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

EXCEL_FILE=""
PUSH_NEON=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/run-evolution-pipeline.sh --file <excel.xlsx> [--push-neon]

Options:
  --file <path>   Fichier Excel source (obligatoire)
  --push-neon     Exécute ensuite le push vers Neon (optionnel)
  --help          Affiche cette aide
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      EXCEL_FILE="${2:-}"
      shift 2
      ;;
    --push-neon)
      PUSH_NEON=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Option inconnue: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$EXCEL_FILE" ]]; then
  echo "❌ --file est obligatoire."
  usage
  exit 1
fi

if [[ ! -f "$EXCEL_FILE" ]]; then
  echo "❌ Fichier introuvable: $EXCEL_FILE"
  exit 1
fi

timestamp_ms() { date +%s%3N; }

step_start() {
  echo ""
  echo "==> $1"
  STEP_T0="$(timestamp_ms)"
}

step_end() {
  local t1 elapsed
  t1="$(timestamp_ms)"
  elapsed=$((t1 - STEP_T0))
  echo "✅ terminé en ${elapsed} ms"
}

step_start "Conversion Excel -> JSON"
python3 scripts/convert_suivi_etpt_to_json.py "$EXCEL_FILE"
step_end

step_start "Contrôles de cohérence JSON"
python3 - <<'PY'
import json
from pathlib import Path

p = Path("public/data/agents.json")
if not p.exists():
    raise SystemExit("❌ public/data/agents.json absent")

data = json.loads(p.read_text(encoding="utf-8"))
agents = data.get("agents", [])
if not agents:
    raise SystemExit("❌ Aucun agent dans public/data/agents.json")

ids = [str(a.get("id", "")) for a in agents]
if len(ids) != len(set(ids)):
    raise SystemExit("❌ IDs agents dupliqués détectés")

actifs = [a for a in agents if a.get("actif")]
if not actifs:
    raise SystemExit("❌ Aucun agent actif détecté")

without_service = [a for a in agents if not str(a.get("service", "")).strip()]
if without_service:
    raise SystemExit(f"❌ {len(without_service)} agents sans service")

print(f"Agents totaux : {len(agents)}")
print(f"Agents actifs : {len(actifs)}")
print("Contrôles : OK")
PY
step_end

step_start "Empreinte de version des données"
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 public/data/agents.json | awk '{print "SHA256 agents.json:", $1}'
else
  echo "⚠️ shasum non disponible, empreinte ignorée"
fi
step_end

if [[ "$PUSH_NEON" -eq 1 ]]; then
  step_start "Push vers Neon"
  npm run push-agents-to-neon
  step_end
else
  echo ""
  echo "ℹ️ Push Neon non exécuté (mode dry-run). Ajoute --push-neon pour publier."
fi

echo ""
echo "🎯 Pipeline d'évolution terminé."
