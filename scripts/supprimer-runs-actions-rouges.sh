#!/usr/bin/env bash
# Supprime les anciens runs GitHub Actions en échec (historique rouge).
# Prérequis : GitHub CLI installé et connecté
#   brew install gh
#   gh auth login
#
# Usage :
#   ./scripts/supprimer-runs-actions-rouges.sh

set -euo pipefail

REPO="Meriem1403/Hublot"

echo "Runs en échec sur $REPO :"
gh run list --repo "$REPO" --status failure --limit 50

echo ""
read -r -p "Supprimer tous ces runs ? (oui/non) " CONFIRM
if [[ "$CONFIRM" != "oui" ]]; then
  echo "Annulé."
  exit 0
fi

IDS=$(gh run list --repo "$REPO" --status failure --limit 50 --json databaseId -q '.[].databaseId')

if [[ -z "$IDS" ]]; then
  echo "Aucun run en échec à supprimer."
  exit 0
fi

for ID in $IDS; do
  echo "Suppression run $ID..."
  gh run delete "$ID" --repo "$REPO"
done

echo "Terminé. Vérifie : https://github.com/$REPO/actions"
