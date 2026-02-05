#!/usr/bin/env bash
set -euo pipefail

# Sync variables from a local .env file to Railway service "web" without leaking values
# Usage:
#   ./scripts/railway-sync-env.sh .env

ENV_FILE="${1:-.env}"
SERVICE_NAME="${RAILWAY_SERVICE:-web}"
ENVIRONMENT_NAME="${RAILWAY_ENVIRONMENT:-production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 2
fi

# Parse .env (simple KEY=VALUE lines; ignores comments/blank)
KEYS_TMP="$(mktemp)"
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE" \
  | sed -E 's/=.*$//' \
  | grep -v '^DATABASE_URL$' \
  | sort -u > "$KEYS_TMP"

COUNT="$(wc -l < "$KEYS_TMP" | tr -d ' ')"
echo "Syncing ${COUNT} keys from $ENV_FILE -> Railway service '$SERVICE_NAME' (env '$ENVIRONMENT_NAME')"

while IFS= read -r k; do
  [[ -z "$k" ]] && continue
  # Extract raw value (handles = in value by splitting on first =)
  v="$(ENV_FILE="$ENV_FILE" KEY="$k" python3 - <<'PY'
import os, re
path=os.environ['ENV_FILE']
key=os.environ['KEY']
val=None
for line in open(path,'r',encoding='utf-8'):
    line=line.strip()
    if not line or line.startswith('#'):
        continue
    if not re.match(r'^[A-Za-z_][A-Za-z0-9_]*=', line):
        continue
    k,rest=line.split('=',1)
    if k==key:
        val=rest
if val is None:
    raise SystemExit(3)
if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
    val=val[1:-1]
print(val)
PY
)"

  # Set via stdin so the secret doesn't appear in process args
  printf "%s" "$v" | railway variable set -s "$SERVICE_NAME" -e "$ENVIRONMENT_NAME" --stdin "$k" --skip-deploys >/dev/null
  echo "  set $k"
done < "$KEYS_TMP"
rm -f "$KEYS_TMP"

echo "Done. Now set DATABASE_URL from the Postgres service, then deploy."