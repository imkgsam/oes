#!/usr/bin/env sh
# Delegates legacy setup entry points to the complete self-contained host lifecycle.
exec "$(CDPATH= cd -- "$(dirname "$0")" && pwd)/run-host.sh" "$@"
