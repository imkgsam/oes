#!/usr/bin/env sh
set -eu
: "${SOFTHSM2_CONF:?}" "${EXECUTION_SIGNER_TOKEN_LABEL:?}" "${EXECUTION_SIGNER_PIN_FILE:?}"
softhsm2-util --init-token --free --label "$EXECUTION_SIGNER_TOKEN_LABEL" --so-pin file:"$EXECUTION_SIGNER_PIN_FILE" --pin file:"$EXECUTION_SIGNER_PIN_FILE"
pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --keypairgen --key-type EC:prime256v1 --id 01 --label oes-execution --usage-sign --private
pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --keypairgen --key-type EC:prime256v1 --id 02 --label oes-execution-overlap --usage-sign --private
mkdir -p "$(dirname "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH")"
printf '%s\n' '{"keys":[{"pkcs11Uri":"pkcs11:token='"$EXECUTION_SIGNER_TOKEN_LABEL"';serial='"$EXECUTION_SIGNER_TOKEN_SERIAL"';id=%01;type=private"},{"pkcs11Uri":"pkcs11:token='"$EXECUTION_SIGNER_TOKEN_LABEL"';serial='"$EXECUTION_SIGNER_TOKEN_SERIAL"';id=%02;type=private"}]}' > "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH"
execution-token-signer-agent &
AGENT_PID=$!
trap 'kill "$AGENT_PID" 2>/dev/null || true' EXIT
wait_for_socket(){ i=0; while [ "$i" -lt 30 ] && [ ! -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" ]; do i=$((i+1)); sleep 1; done; test -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"; }
wait_for_socket
