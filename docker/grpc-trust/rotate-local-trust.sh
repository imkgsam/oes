#!/usr/bin/env bash
set -euo pipefail

# rotate-local-trust continuously renews local workload leaves before their two-thirds lifetime boundary.
readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly rotation_interval_seconds="${OES_ROTATION_CHECK_INTERVAL_SECONDS:-300}"

# main delegates each renewal decision to the idempotent local trust bootstrap.
main() {
  while true; do
    OES_ROTATION_CHECK_INTERVAL_SECONDS="${rotation_interval_seconds}" \
      "${script_dir}/bootstrap-local-trust.sh" --output "${OES_TRUST_OUTPUT_DIRECTORY:-/trust}"
    sleep "${rotation_interval_seconds}"
  done
}

main "$@"
