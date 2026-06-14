#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/create_supabase_user.sh email password
# Requires environment variables: SUPABASE_URL, SUPABASE_SECRET_KEY

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SECRET_KEY:-}" ]; then
  echo "Set SUPABASE_URL and SUPABASE_SECRET_KEY environment variables before running."
  exit 1
fi

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 email password"
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"

API_URL="${SUPABASE_URL%/}/auth/v1/admin/users"

echo "Creating Supabase user: $EMAIL"
curl -sS -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"email_confirm\": true}"

echo
echo "Done. Inspect the JSON response above for success or error details."
