#!/bin/sh
# Start script for backend container
# If /app/.env exists, source it so that GEMINI_API_KEY is available as an env var
if [ -f /app/.env ]; then
  # shellcheck disable=SC1091
  set -o allexport
  . /app/.env
  set +o allexport
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "ERROR: GEMINI_API_KEY is not set. Please provide it in /app/.env or through environment variables."
  echo "Container will exit to avoid starting without the API key."
  exit 1
fi

echo "GEMINI_API_KEY present. Starting backend..."
exec node dist/main.js
