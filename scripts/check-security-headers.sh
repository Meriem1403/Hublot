#!/usr/bin/env bash
#
# check-security-headers.sh — Vérifie automatiquement les en-têtes HTTP de
# sécurité d'un déploiement (automatisation du scénario ST-SEC01).
#
# Usage :
#   bash scripts/check-security-headers.sh [URL]
#   URL par défaut : https://dirmhublot.netlify.app
#
# Codes de sortie :
#   0 = tous les en-têtes obligatoires sont présents et HTTPS OK
#   1 = au moins un en-tête obligatoire manquant ou non HTTPS
#
# Rattachement : docs/SECURITE_4_DEPLOIEMENT.md, docs/SCENARIOS_TEST.md (ST-SEC01).

set -u

URL="${1:-https://dirmhublot.netlify.app}"

echo "🔒 Vérification des en-têtes de sécurité : $URL"
echo "------------------------------------------------------------"

# HTTPS obligatoire
if [[ "$URL" != https://* ]]; then
  echo "❌ L'URL n'est pas en HTTPS : $URL"
  exit 1
fi

# Récupère les en-têtes (insensible à la casse)
HEADERS="$(curl -sSI --max-time 20 "$URL" 2>/dev/null)"
if [[ -z "$HEADERS" ]]; then
  echo "❌ Aucune réponse du serveur (réseau / URL injoignable)."
  exit 1
fi

STATUS="$(printf '%s\n' "$HEADERS" | head -n 1)"
echo "Statut : $STATUS"
echo ""

# En-têtes obligatoires : nom -> motif attendu (regex insensible à la casse)
declare -a REQUIRED_NAMES=("X-Frame-Options" "X-Content-Type-Options")
declare -a REQUIRED_PATTERNS=("DENY|SAMEORIGIN" "nosniff")

# En-têtes recommandés (non bloquants, simple avertissement)
declare -a RECOMMENDED=("Referrer-Policy" "Permissions-Policy" "Strict-Transport-Security" "Content-Security-Policy")

fail=0

check_header() {
  local name="$1" pattern="$2" required="$3"
  local line
  line="$(printf '%s\n' "$HEADERS" | grep -i "^${name}:" | head -n 1)"
  if [[ -z "$line" ]]; then
    if [[ "$required" == "yes" ]]; then
      echo "❌ MANQUANT (obligatoire) : $name"
      fail=1
    else
      echo "⚠️  absent (recommandé)   : $name"
    fi
    return
  fi
  if [[ -n "$pattern" ]] && ! printf '%s' "$line" | grep -iqE "$pattern"; then
    echo "❌ VALEUR INATTENDUE      : $line (attendu : $pattern)"
    [[ "$required" == "yes" ]] && fail=1
    return
  fi
  echo "✅ OK                     : $(printf '%s' "$line" | tr -d '\r')"
}

for i in "${!REQUIRED_NAMES[@]}"; do
  check_header "${REQUIRED_NAMES[$i]}" "${REQUIRED_PATTERNS[$i]}" "yes"
done

for name in "${RECOMMENDED[@]}"; do
  check_header "$name" "" "no"
done

echo "------------------------------------------------------------"
if [[ "$fail" -eq 0 ]]; then
  echo "✅ ST-SEC01 : en-têtes de sécurité obligatoires présents."
  exit 0
else
  echo "❌ ST-SEC01 : en-têtes de sécurité obligatoires manquants."
  exit 1
fi
