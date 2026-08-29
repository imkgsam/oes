#!/usr/bin/env sh
# Runs the complete local protected-signing lifecycle with a real SoftHSM2 token and the exact source-built signer binary.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
SIGNER_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
if [ -n "${EXECUTION_SIGNER_HOST_WORK_DIR:-}" ]; then WORK_DIR=$EXECUTION_SIGNER_HOST_WORK_DIR; OWNED_WORK_DIR=0; else WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/oes-signer-host.XXXXXX"); OWNED_WORK_DIR=1; fi
KEEP_WORK_DIR=${EXECUTION_SIGNER_KEEP_HOST_WORK_DIR:-0}
AGENT_PID=

# cleanup removes only this invocation's ephemeral token, binary, socket, and credential state.
cleanup() {
  if [ -n "$AGENT_PID" ]; then kill "$AGENT_PID" 2>/dev/null || true; wait "$AGENT_PID" 2>/dev/null || true; fi
  if [ "$OWNED_WORK_DIR" = 1 ] && [ "$KEEP_WORK_DIR" != 1 ]; then rm -rf "$WORK_DIR"; fi
}
trap cleanup EXIT INT TERM

# require_command makes missing host prerequisites explicit before creating token state.
require_command() { command -v "$1" >/dev/null 2>&1 || { echo "missing host prerequisite: $1" >&2; exit 1; }; }
require_command go
require_command mktemp
require_command openssl

EXECUTION_SIGNER_TOKEN_LABEL=${EXECUTION_SIGNER_TOKEN_LABEL:-oes-execution-host}
AUTH_EXECUTION_SIGNER_SOCKET_PATH=${AUTH_EXECUTION_SIGNER_SOCKET_PATH:-$WORK_DIR/signer.sock}; export AUTH_EXECUTION_SIGNER_SOCKET_PATH
EXECUTION_SIGNER_ROTATION_MANIFEST_PATH=${EXECUTION_SIGNER_ROTATION_MANIFEST_PATH:-$WORK_DIR/rotation.json}; export EXECUTION_SIGNER_ROTATION_MANIFEST_PATH
EXECUTION_SIGNER_PIN_FILE=${EXECUTION_SIGNER_PIN_FILE:-$WORK_DIR/pin}; export EXECUTION_SIGNER_PIN_FILE
EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH=${EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH:-$WORK_DIR/verifier-rotation.json}; export EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH
EXECUTION_SIGNER_VERIFIER_PIN_FILE=${EXECUTION_SIGNER_VERIFIER_PIN_FILE:-$WORK_DIR/verifier-pin}; export EXECUTION_SIGNER_VERIFIER_PIN_FILE

# resolve_module finds the locally installed SoftHSM2 provider unless deployment supplied an explicit PKCS#11 module path.
resolve_module() {
  if [ -n "${AUTH_EXECUTION_PKCS11_MODULE:-}" ]; then printf '%s\n' "$AUTH_EXECUTION_PKCS11_MODULE"; return; fi
  for candidate in /opt/homebrew/lib/softhsm/libsofthsm2.so /usr/local/lib/softhsm/libsofthsm2.so /usr/lib/softhsm/libsofthsm2.so /usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so; do
    if [ -r "$candidate" ]; then printf '%s\n' "$candidate"; return; fi
  done
  echo "unable to locate SoftHSM2 PKCS#11 module; set AUTH_EXECUTION_PKCS11_MODULE" >&2
  exit 1
}
AUTH_EXECUTION_PKCS11_MODULE=$(resolve_module); export AUTH_EXECUTION_PKCS11_MODULE

umask 077
mkdir -p "$WORK_DIR/tokens"
if [ ! -f "$EXECUTION_SIGNER_PIN_FILE" ]; then openssl rand -hex 24 > "$EXECUTION_SIGNER_PIN_FILE"; fi
chmod 600 "$EXECUTION_SIGNER_PIN_FILE"
if [ ! -f "$EXECUTION_SIGNER_VERIFIER_PIN_FILE" ]; then cp "$EXECUTION_SIGNER_PIN_FILE" "$EXECUTION_SIGNER_VERIFIER_PIN_FILE"; fi
chmod 600 "$EXECUTION_SIGNER_VERIFIER_PIN_FILE"
if [ -z "${SOFTHSM2_CONF:-}" ]; then
  SOFTHSM2_CONF=$WORK_DIR/softhsm2.conf
  printf 'directories.tokendir = %s\nobjectstore.backend = file\nlog.level = ERROR\n' "$WORK_DIR/tokens" > "$SOFTHSM2_CONF"
fi
export SOFTHSM2_CONF

AGENT_BINARY=$WORK_DIR/execution-token-signer-agent
HOST_CHECK_BINARY=$WORK_DIR/execution-token-signer-host-check
(cd "$SIGNER_ROOT" && go build -o "$AGENT_BINARY" ./cmd/agent && go build -o "$HOST_CHECK_BINARY" ./cmd/host-check)

SERIAL=$($HOST_CHECK_BINARY init-token --module "$AUTH_EXECUTION_PKCS11_MODULE" --pin-file "$EXECUTION_SIGNER_PIN_FILE" --label "$EXECUTION_SIGNER_TOKEN_LABEL")
[ -n "$SERIAL" ] || { echo "unable to resolve initialized token serial" >&2; exit 1; }

ACTIVE_URI="pkcs11:token=$EXECUTION_SIGNER_TOKEN_LABEL;serial=$SERIAL;id=%01;type=private"
OVERLAP_URI="pkcs11:token=$EXECUTION_SIGNER_TOKEN_LABEL;serial=$SERIAL;id=%02;type=private"
ACTIVE_VERIFIER_URI="pkcs11:token=$EXECUTION_SIGNER_TOKEN_LABEL;serial=$SERIAL;id=%11;type=secret-key"
VERIFY_ONLY_VERIFIER_URI="pkcs11:token=$EXECUTION_SIGNER_TOKEN_LABEL;serial=$SERIAL;id=%12;type=secret-key"
COMPROMISED_VERIFIER_URI="pkcs11:token=$EXECUTION_SIGNER_TOKEN_LABEL;serial=$SERIAL;id=%13;type=secret-key"
ACTIVE_VERIFIER_VERSION=${ACTIVE_VERIFIER_VERSION:-verifier-v2}
VERIFY_ONLY_VERIFIER_VERSION=${VERIFY_ONLY_VERIFIER_VERSION:-verifier-v1}
COMPROMISED_VERIFIER_VERSION=${COMPROMISED_VERIFIER_VERSION:-verifier-v0}
COMPROMISED_VERIFIER_INCIDENT=${COMPROMISED_VERIFIER_INCIDENT:-INC-LOCAL-SOFTHSM-1}
COMPROMISED_VERIFIER_STATE_REVISION=${COMPROMISED_VERIFIER_STATE_REVISION:-rev-local-1}
AUTH_EXECUTION_KMS_KEY_REF=$ACTIVE_URI; export AUTH_EXECUTION_KMS_KEY_REF
AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF=$ACTIVE_VERIFIER_URI; export AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF
$HOST_CHECK_BINARY generate-keypair --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$ACTIVE_URI" --pin-file "$EXECUTION_SIGNER_PIN_FILE" --label oes-active
$HOST_CHECK_BINARY generate-keypair --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$OVERLAP_URI" --pin-file "$EXECUTION_SIGNER_PIN_FILE" --label oes-overlap
$HOST_CHECK_BINARY generate-secret-key --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$ACTIVE_VERIFIER_URI" --pin-file "$EXECUTION_SIGNER_VERIFIER_PIN_FILE" --label oes-verifier-active
$HOST_CHECK_BINARY generate-secret-key --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$VERIFY_ONLY_VERIFIER_URI" --pin-file "$EXECUTION_SIGNER_VERIFIER_PIN_FILE" --label oes-verifier-verify-only
ACTIVE_KID=$($HOST_CHECK_BINARY derive-kid --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$ACTIVE_URI" --pin-file "$EXECUTION_SIGNER_PIN_FILE")
OVERLAP_KID=$($HOST_CHECK_BINARY derive-kid --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$OVERLAP_URI" --pin-file "$EXECUTION_SIGNER_PIN_FILE")
MANIFEST_COMMAND=write-manifest
[ "${EXECUTION_SIGNER_RUNTIME_MODE:-0}" = 1 ] && MANIFEST_COMMAND=write-persistent-local-manifest
$HOST_CHECK_BINARY "$MANIFEST_COMMAND" --output "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH" --active-uri "$ACTIVE_URI" --active-kid "$ACTIVE_KID" --overlap-uri "$OVERLAP_URI" --overlap-kid "$OVERLAP_KID"
$HOST_CHECK_BINARY write-verifier-manifest --output "$EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH" --active-uri "$ACTIVE_VERIFIER_URI" --active-version "$ACTIVE_VERIFIER_VERSION" --verify-only-uri "$VERIFY_ONLY_VERIFIER_URI" --verify-only-version "$VERIFY_ONLY_VERIFIER_VERSION" --compromised-uri "$COMPROMISED_VERIFIER_URI" --compromised-version "$COMPROMISED_VERIFIER_VERSION" --compromised-incident "$COMPROMISED_VERIFIER_INCIDENT" --compromised-state-revision "$COMPROMISED_VERIFIER_STATE_REVISION"

if [ "${EXECUTION_SIGNER_RUNTIME_MODE:-0}" = 1 ]; then
  : "${EXECUTION_SIGNER_READY_PATH:?EXECUTION_SIGNER_READY_PATH is required}"
  rm -f "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" "$EXECUTION_SIGNER_READY_PATH"
fi
AUTH_EXECUTION_KMS_KEY_REF="$ACTIVE_URI" AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF="$ACTIVE_VERIFIER_URI" EXECUTION_SIGNER_PIN_FILE="$EXECUTION_SIGNER_PIN_FILE" EXECUTION_SIGNER_VERIFIER_PIN_FILE="$EXECUTION_SIGNER_VERIFIER_PIN_FILE" "$AGENT_BINARY" >"$WORK_DIR/agent.log" 2>&1 &
AGENT_PID=$!
i=0; while [ "$i" -lt 30 ] && [ ! -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" ]; do i=$((i + 1)); sleep 1; done
test -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"
$HOST_CHECK_BINARY verify-uds --socket "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" --active-kid "$ACTIVE_KID"
$HOST_CHECK_BINARY verify-verifier-uds --socket "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$VERIFY_ONLY_VERIFIER_URI" --pin-file "$EXECUTION_SIGNER_VERIFIER_PIN_FILE" --active-version "$ACTIVE_VERIFIER_VERSION" --verify-only-version "$VERIFY_ONLY_VERIFIER_VERSION" --compromised-version "$COMPROMISED_VERIFIER_VERSION" --compromised-incident "$COMPROMISED_VERIFIER_INCIDENT" --compromised-state-revision "$COMPROMISED_VERIFIER_STATE_REVISION"
$HOST_CHECK_BINARY assert-private-nonexportable --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$ACTIVE_URI" --pin-file "$EXECUTION_SIGNER_PIN_FILE"
$HOST_CHECK_BINARY assert-secret-nonexportable --module "$AUTH_EXECUTION_PKCS11_MODULE" --uri "$ACTIVE_VERIFIER_URI" --pin-file "$EXECUTION_SIGNER_VERIFIER_PIN_FILE"

if [ "${EXECUTION_SIGNER_RUNTIME_MODE:-0}" = 1 ]; then
  printf '%s\n' "$ACTIVE_URI" > "$EXECUTION_SIGNER_READY_PATH.tmp"
  chmod 600 "$EXECUTION_SIGNER_READY_PATH.tmp"
  mv "$EXECUTION_SIGNER_READY_PATH.tmp" "$EXECUTION_SIGNER_READY_PATH"
  wait "$AGENT_PID"
  exit $?
fi

BAD_MANIFEST=$WORK_DIR/invalid-manifest.json
$HOST_CHECK_BINARY write-manifest --output "$BAD_MANIFEST" --active-uri "$ACTIVE_URI" --active-kid invalid-expected-kid --overlap-uri "$OVERLAP_URI" --overlap-kid "$OVERLAP_KID"
if AUTH_EXECUTION_SIGNER_SOCKET_PATH="$WORK_DIR/invalid-manifest.sock" EXECUTION_SIGNER_ROTATION_MANIFEST_PATH="$BAD_MANIFEST" EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH="$EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH" AUTH_EXECUTION_KMS_KEY_REF="$ACTIVE_URI" AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF="$ACTIVE_VERIFIER_URI" EXECUTION_SIGNER_PIN_FILE="$EXECUTION_SIGNER_PIN_FILE" EXECUTION_SIGNER_VERIFIER_PIN_FILE="$EXECUTION_SIGNER_VERIFIER_PIN_FILE" "$AGENT_BINARY" >/dev/null 2>&1; then echo "manifest mismatch was accepted" >&2; exit 1; fi
BAD_VERIFIER_MANIFEST=$WORK_DIR/invalid-verifier-manifest.json
# Build the deliberately invalid duplicate-selector fixture directly so the strict valid-manifest writer does not abort the negative test first.
printf '{"versions":[{"pkcs11Uri":"%s","verifierKeyVersion":"%s","state":"ACTIVE","activatedAt":"2020-01-01T00:00:00Z"},{"pkcs11Uri":"%s","verifierKeyVersion":"%s","state":"VERIFY_ONLY","activatedAt":"2020-01-01T00:00:00Z","verifyOnlyAt":"2020-01-02T00:00:00Z","retireAfter":"2099-01-01T00:00:00Z"}]}\n' "$VERIFY_ONLY_VERIFIER_URI" "$ACTIVE_VERIFIER_VERSION" "$VERIFY_ONLY_VERIFIER_URI" "$VERIFY_ONLY_VERIFIER_VERSION" > "$BAD_VERIFIER_MANIFEST"
if AUTH_EXECUTION_SIGNER_SOCKET_PATH="$WORK_DIR/invalid-verifier.sock" EXECUTION_SIGNER_ROTATION_MANIFEST_PATH="$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH" EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH="$BAD_VERIFIER_MANIFEST" AUTH_EXECUTION_KMS_KEY_REF="$ACTIVE_URI" AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF="$ACTIVE_VERIFIER_URI" EXECUTION_SIGNER_PIN_FILE="$EXECUTION_SIGNER_PIN_FILE" EXECUTION_SIGNER_VERIFIER_PIN_FILE="$EXECUTION_SIGNER_VERIFIER_PIN_FILE" "$AGENT_BINARY" >/dev/null 2>&1; then echo "verifier manifest mismatch was accepted" >&2; exit 1; fi
chmod 644 "$EXECUTION_SIGNER_PIN_FILE"
if AUTH_EXECUTION_SIGNER_SOCKET_PATH="$WORK_DIR/invalid-credential.sock" EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH="$EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH" AUTH_EXECUTION_KMS_KEY_REF="$ACTIVE_URI" AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF="$ACTIVE_VERIFIER_URI" EXECUTION_SIGNER_PIN_FILE="$EXECUTION_SIGNER_PIN_FILE" EXECUTION_SIGNER_VERIFIER_PIN_FILE="$EXECUTION_SIGNER_VERIFIER_PIN_FILE" "$AGENT_BINARY" >/dev/null 2>&1; then echo "weak credential mount was accepted" >&2; exit 1; fi
chmod 600 "$EXECUTION_SIGNER_PIN_FILE"
chmod 644 "$EXECUTION_SIGNER_VERIFIER_PIN_FILE"
if AUTH_EXECUTION_SIGNER_SOCKET_PATH="$WORK_DIR/invalid-verifier-credential.sock" EXECUTION_SIGNER_ROTATION_MANIFEST_PATH="$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH" EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH="$EXECUTION_SIGNER_VERIFIER_MANIFEST_PATH" AUTH_EXECUTION_KMS_KEY_REF="$ACTIVE_URI" AUTH_EXTERNAL_API_KEY_VERIFIER_KEY_REF="$ACTIVE_VERIFIER_URI" EXECUTION_SIGNER_PIN_FILE="$EXECUTION_SIGNER_PIN_FILE" EXECUTION_SIGNER_VERIFIER_PIN_FILE="$EXECUTION_SIGNER_VERIFIER_PIN_FILE" "$AGENT_BINARY" >/dev/null 2>&1; then echo "weak verifier credential mount was accepted" >&2; exit 1; fi
chmod 600 "$EXECUTION_SIGNER_VERIFIER_PIN_FILE"
kill "$AGENT_PID"; wait "$AGENT_PID" 2>/dev/null || true; AGENT_PID=
$HOST_CHECK_BINARY assert-outage --socket "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"
printf 'SoftHSM2 signer and verifier lifecycle passed; set EXECUTION_SIGNER_KEEP_HOST_WORK_DIR=1 to retain %s\n' "$WORK_DIR"
