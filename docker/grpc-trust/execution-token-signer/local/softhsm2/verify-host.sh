#!/usr/bin/env sh
# Delegates legacy verification entry points to the Docker-contained security lifecycle.
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
exec docker compose -f "$SCRIPT_DIR/compose.yaml" run --rm --build signer-host "$@"
