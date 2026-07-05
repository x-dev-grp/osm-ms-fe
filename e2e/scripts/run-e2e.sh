#!/usr/bin/env bash
set -euo pipefail

SUITE="${1:-smoke}"
BASE_URL="${E2E_BASE_URL:-http://localhost:4200}"

cd "$(dirname "$0")/../.."

npx playwright install chromium
export E2E_BASE_URL="$BASE_URL"

case "$SUITE" in
  smoke)
    npm run e2e:smoke
    ;;
  mobile)
    export E2E_RUN_LOGIN=1
    npm run e2e:mobile
    ;;
  full)
    export E2E_RUN_LOGIN=1
    npm run e2e:full
    ;;
  all)
    npm run e2e:smoke
    export E2E_RUN_LOGIN=1
    npm run e2e:full
    ;;
  *)
    echo "Usage: $0 [smoke|mobile|full|all]"
    exit 1
    ;;
esac
