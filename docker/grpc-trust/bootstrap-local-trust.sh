#!/usr/bin/env bash
set -euo pipefail

# bootstrap-local-trust creates or renews local-only CA and per-workload mTLS leaf material without committing secrets.
readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly workload_file="${script_dir}/workloads.txt"
trust_environment="${OES_TRUST_ENV:-local}"
output_directory="${OES_TRUST_OUTPUT_DIRECTORY:-/trust}"
force_renewal="${OES_FORCE_RENEW:-false}"
rotation_interval_seconds="${OES_ROTATION_CHECK_INTERVAL_SECONDS:-300}"

# parse_arguments limits the bootstrap interface to a local runtime output directory.
parse_arguments() {
  while (($#)); do
    case "$1" in
      --output)
        output_directory="$2"
        shift 2
        ;;
      *)
        echo "unsupported argument: $1" >&2
        exit 64
        ;;
    esac
  done
}

# issue_workload_leaf writes a private, server-and-client-authentication leaf for exactly one listed workload.
issue_workload_leaf() {
  local workload="$1"
  local workload_directory="${output_directory}/${workload}"
  local leaf_directory
  local extension_file
  local spiffe_id="${trust_domain}/ns/oes/sa/${workload}"

  mkdir -p "${workload_directory}"
  leaf_directory="$(mktemp -d "${workload_directory}/.leaf.XXXXXX")"
  extension_file="${leaf_directory}/leaf-ext.cnf"
  cat >"${extension_file}" <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=critical,clientAuth,serverAuth
subjectAltName=critical,URI:${spiffe_id},DNS:${workload}
EOF

  openssl req -new -newkey rsa:2048 -nodes \
    -keyout "${leaf_directory}/key.pem" \
    -out "${leaf_directory}/request.pem" \
    -subj "/CN=${workload}" >/dev/null 2>&1
  openssl x509 -req \
    -in "${leaf_directory}/request.pem" \
    -CA "${output_directory}/ca.pem" \
    -CAkey "${output_directory}/ca-key.pem" \
    -CAcreateserial \
    -out "${leaf_directory}/cert.pem" \
    -days 1 \
    -sha256 \
    -extfile "${extension_file}" >/dev/null 2>&1
  cp "${output_directory}/ca.pem" "${leaf_directory}/ca.pem"
  rm -f "${leaf_directory}/request.pem" "${extension_file}"
  chmod 0400 "${leaf_directory}/key.pem"
  chmod 0444 "${leaf_directory}/cert.pem" "${leaf_directory}/ca.pem"
  ln -sfn "$(basename "${leaf_directory}")" "${workload_directory}/current"
  for superseded_leaf_directory in "${workload_directory}"/.leaf.*; do
    [[ -d "${superseded_leaf_directory}" && "${superseded_leaf_directory}" != "${leaf_directory}" ]] || continue
    rm -rf "${superseded_leaf_directory}"
  done
}

# needs_renewal makes the next rotation poll renew before the two-thirds lifetime boundary is crossed.
needs_renewal() {
  local certificate_path="$1"
  local renewal_window_seconds=$((leaf_ttl_seconds / 3 + rotation_interval_seconds))

  [[ "${force_renewal}" == "true" ]] && return 0
  [[ ! -f "${certificate_path}" ]] && return 0
  ! openssl x509 -in "${certificate_path}" -noout -checkend "${renewal_window_seconds}" >/dev/null 2>&1
}

# main prepares one isolated local trust domain and never substitutes staging or production credentials.
main() {
  parse_arguments "$@"
  if [[ "${trust_environment}" != "local" ]]; then
    echo "bootstrap-local-trust only creates the local trust domain; staging and production material must be injected by the deployment secret manager" >&2
    exit 65
  fi

  readonly trust_domain="spiffe://local.oes.internal"
  readonly leaf_ttl_seconds=86400
  mkdir -p "${output_directory}"
  if [[ ! -f "${output_directory}/ca.pem" || ! -f "${output_directory}/ca-key.pem" ]]; then
    openssl req -x509 -newkey rsa:4096 -nodes \
      -keyout "${output_directory}/ca-key.pem" \
      -out "${output_directory}/ca.pem" \
      -days 30 \
      -subj '/CN=OES Local Workload CA' \
      -addext 'basicConstraints=critical,CA:TRUE' \
      -addext 'keyUsage=critical,keyCertSign,cRLSign' >/dev/null 2>&1
    chmod 0400 "${output_directory}/ca-key.pem"
    chmod 0444 "${output_directory}/ca.pem"
  fi

  while IFS= read -r workload || [[ -n "${workload}" ]]; do
    [[ -z "${workload}" || "${workload}" == \#* ]] && continue
    if needs_renewal "${output_directory}/${workload}/current/cert.pem"; then
      issue_workload_leaf "${workload}"
    fi
  done <"${workload_file}"
}

main "$@"
