#!/bin/bash
set -euo pipefail

cd /app
export PYTHONPATH="/app${PYTHONPATH:+:${PYTHONPATH}}"

echo "Running database migrations..."
python -m alembic upgrade head

echo "Starting Protocols API..."
if [[ "$#" -gt 0 ]]; then
  exec "$@"
fi

exec python -m app.server
