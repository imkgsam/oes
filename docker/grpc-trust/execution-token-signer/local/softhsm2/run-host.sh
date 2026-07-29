#!/usr/bin/env sh
set -eu
: "${SOFTHSM2_CONF:?}" "${EXECUTION_SIGNER_TOKEN_LABEL:?}" "${EXECUTION_SIGNER_PIN_FILE:?}" "${AUTH_EXECUTION_PKCS11_MODULE:?}" "${AUTH_EXECUTION_SIGNER_SOCKET_PATH:?}" "${EXECUTION_SIGNER_ROTATION_MANIFEST_PATH:?}"
softhsm2-util --init-token --free --label "$EXECUTION_SIGNER_TOKEN_LABEL" --so-pin file:"$EXECUTION_SIGNER_PIN_FILE" --pin file:"$EXECUTION_SIGNER_PIN_FILE"
SERIAL=$(softhsm2-util --show-slots | awk '/Serial number:/ {print $3; exit}')
pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --keypairgen --key-type EC:prime256v1 --id 01 --label oes-active --usage-sign --private
pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --keypairgen --key-type EC:prime256v1 --id 02 --label oes-overlap --usage-sign --private
mkdir -p "$(dirname "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH")"
printf '%s\n' '{"keys":[{"pkcs11Uri":"pkcs11:token='"$EXECUTION_SIGNER_TOKEN_LABEL"';serial='"$SERIAL"';id=%01;type=private"},{"pkcs11Uri":"pkcs11:token='"$EXECUTION_SIGNER_TOKEN_LABEL"';serial='"$SERIAL"';id=%02;type=private"}]}' > "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH"
execution-token-signer-agent & AGENT_PID=$!
trap 'kill "$AGENT_PID" 2>/dev/null || true; wait "$AGENT_PID" 2>/dev/null || true' EXIT
i=0; while [ "$i" -lt 30 ] && [ ! -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" ]; do i=$((i+1)); sleep 1; done; test -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"GetActiveKey","params":{}}' | nc -U "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" | jq -e '.result.publicJwk.crv=="P-256" and .result.kid'
printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"ListPublishedKeys","params":{}}' | nc -U "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" | jq -e '.result|length>=2'
! pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --read-object --type privkey --id 01
kill "$AGENT_PID"; wait "$AGENT_PID" || true
! printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"GetActiveKey","params":{}}' | nc -U "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"
