#!/usr/bin/env bash
# Déploiement manuel ou semi-automatisé vers NAS Synology.
# Usage local :
#   ./scripts/deploy-nas.sh
# Avec rsync SSH (secrets CI ou ~/.ssh) :
#   NAS_HOST=192.168.1.10 NAS_USER=admin NAS_PATH=/volume1/docker/statdirm ./scripts/deploy-nas.sh --rsync

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RSYNC=0
if [[ "${1:-}" == "--rsync" ]]; then
  RSYNC=1
fi

echo "==> Build production"
npm ci
npm run lint
npm run test:run
npm run build

BUILD_DIR="${ROOT}/build"
if [[ ! -f "${BUILD_DIR}/index.html" ]]; then
  echo "Erreur: build/ introuvable après npm run build"
  exit 1
fi

# Compat NAS : certains compose montent dist/
mkdir -p "${ROOT}/dist"
rsync -a --delete "${BUILD_DIR}/" "${ROOT}/dist/"

if [[ "$RSYNC" -eq 1 ]]; then
  : "${NAS_HOST:?NAS_HOST requis}"
  : "${NAS_USER:?NAS_USER requis}"
  : "${NAS_PATH:?NAS_PATH requis}"
  echo "==> Rsync vers ${NAS_USER}@${NAS_HOST}:${NAS_PATH}"
  rsync -avz --delete \
    "${BUILD_DIR}/" \
    "${NAS_USER}@${NAS_HOST}:${NAS_PATH}/build/"
  rsync -avz \
    "${ROOT}/docker-compose.yml" \
    "${ROOT}/nginx.conf" \
    "${NAS_USER}@${NAS_HOST}:${NAS_PATH}/"
  echo "Sur le NAS : Container Manager → redémarrer le projet statdirm"
else
  echo "==> Artefacts prêts : build/ et dist/"
  echo "Copiez le projet sur le NAS puis lancez docker-compose.yml (port 8080)."
fi
