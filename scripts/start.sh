#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p data
if curl -sf -o /dev/null --connect-timeout 1 http://127.0.0.1:8877/api/health; then
  echo "已在运行 → http://127.0.0.1:8877"
  exit 0
fi
exec env PYTHONUNBUFFERED=1 python3 "$ROOT/server/app.py"
