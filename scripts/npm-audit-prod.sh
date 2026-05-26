#!/usr/bin/env bash
# Audit des dépendances de production (hors devDependencies).
# - critical : bloquant (exit 1)
# - high     : bloquant sauf CVE listées dans security/audit-allowlist.json

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ALLOWLIST="${ROOT}/security/audit-allowlist.json"

echo "=== npm audit (production) — niveau critical ==="
npm audit --omit=dev --audit-level=critical

echo ""
echo "=== npm audit (production) — niveau high ==="
JSON="$(mktemp)"
npm audit --omit=dev --audit-level=high --json >"$JSON" 2>/dev/null || true

if node -e "
const fs = require('fs');
const allowPath = process.argv[1];
const auditPath = process.argv[2];
let allow = [];
try {
  allow = JSON.parse(fs.readFileSync(allowPath, 'utf8')).allow || [];
} catch (_) {}
const allowedIds = new Set(allow.map((a) => a.id));
let audit;
try {
  audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
} catch {
  console.error('Impossible de lire le rapport audit JSON');
  process.exit(1);
}
const vulns = audit.vulnerabilities || {};
const blocking = Object.values(vulns).filter((v) => {
  const sev = v.severity;
  if (sev !== 'high' && sev !== 'critical') return false;
  const via = v.via || [];
  for (const item of via) {
    if (typeof item === 'object' && item.source && allowedIds.has(String(item.source))) {
      return false;
    }
  }
  const name = v.name || '';
  const allowedByName = allow.some((a) => a.package && name.includes(a.package));
  return !allowedByName;
});
if (blocking.length === 0) {
  console.log('Aucune vulnérabilité high/critical non allowlistée (prod).');
  process.exit(0);
}
console.error('Vulnérabilités prod non allowlistées:', blocking.length);
blocking.slice(0, 10).forEach((v) => console.error('-', v.name, v.severity));
process.exit(1);
" "$ALLOWLIST" "$JSON"; then
  rm -f "$JSON"
  exit 0
fi

rm -f "$JSON"
exit 1
