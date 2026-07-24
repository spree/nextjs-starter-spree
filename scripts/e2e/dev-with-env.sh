#!/usr/bin/env bash
# Boot `next dev` with .env.e2e loaded into the environment.
# Used by Playwright's webServer block.

set -euo pipefail

cd "$(dirname "$0")/../.."

if [[ ! -f .env.e2e ]]; then
  echo ".env.e2e not found. Run ./scripts/e2e/bootstrap-spree.sh first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.e2e
set +a

# Reuse the canonical dev command (port + flags) from package.json.
exec pnpm run dev
