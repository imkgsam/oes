#!/usr/bin/env sh
set -eu
: "${SOFTHSM2_CONF:?}" "${EXECUTION_SIGNER_TOKEN_LABEL:?}" "${EXECUTION_SIGNER_PIN_FILE:?}" "${EXECUTION_SIGNER_ROTATION_MANIFEST_PATH:?}" "${EXECUTION_SIGNER_ACTIVE_KID:?}" "${EXECUTION_SIGNER_OVERLAP_KID:?}" "${EXECUTION_SIGNER_ACTIVE_PUBLISH_NOT_BEFORE:?}" "${EXECUTION_SIGNER_ACTIVE_SIGNING_NOT_BEFORE:?}" "${EXECUTION_SIGNER_ACTIVE_SIGNING_NOT_AFTER:?}" "${EXECUTION_SIGNER_ACTIVE_RETIRE_AFTER:?}" "${EXECUTION_SIGNER_OVERLAP_PUBLISH_NOT_BEFORE:?}" "${EXECUTION_SIGNER_OVERLAP_SIGNING_NOT_BEFORE:?}" "${EXECUTION_SIGNER_OVERLAP_SIGNING_NOT_AFTER:?}" "${EXECUTION_SIGNER_OVERLAP_RETIRE_AFTER:?}"
softhsm2-util --init-token --free --label "$EXECUTION_SIGNER_TOKEN_LABEL" --so-pin file:"$EXECUTION_SIGNER_PIN_FILE" --pin file:"$EXECUTION_SIGNER_PIN_FILE"
pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --keypairgen --key-type EC:prime256v1 --id 01 --label oes-execution --usage-sign --private
pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --keypairgen --key-type EC:prime256v1 --id 02 --label oes-execution-overlap --usage-sign --private
mkdir -p "$(dirname "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH")"
SERIAL=$(softhsm2-util --show-slots | awk '/Serial number:/ {print $3; exit}')
AUTH_EXECUTION_KMS_KEY_REF="pkcs11:token=$EXECUTION_SIGNER_TOKEN_LABEL;serial=$SERIAL;id=%01;type=private"; export AUTH_EXECUTION_KMS_KEY_REF
printf '%s\n' '{"keys":[{"pkcs11Uri":"pkcs11:token='"$EXECUTION_SIGNER_TOKEN_LABEL"';serial='"$SERIAL"';id=%01;type=private","expectedKid":"'"$EXECUTION_SIGNER_ACTIVE_KID"'","publishNotBefore":"'"$EXECUTION_SIGNER_ACTIVE_PUBLISH_NOT_BEFORE"'","signingNotBefore":"'"$EXECUTION_SIGNER_ACTIVE_SIGNING_NOT_BEFORE"'","signingNotAfter":"'"$EXECUTION_SIGNER_ACTIVE_SIGNING_NOT_AFTER"'","retireAfter":"'"$EXECUTION_SIGNER_ACTIVE_RETIRE_AFTER"'"},{"pkcs11Uri":"pkcs11:token='"$EXECUTION_SIGNER_TOKEN_LABEL"';serial='"$SERIAL"';id=%02;type=private","expectedKid":"'"$EXECUTION_SIGNER_OVERLAP_KID"'","publishNotBefore":"'"$EXECUTION_SIGNER_OVERLAP_PUBLISH_NOT_BEFORE"'","signingNotBefore":"'"$EXECUTION_SIGNER_OVERLAP_SIGNING_NOT_BEFORE"'","signingNotAfter":"'"$EXECUTION_SIGNER_OVERLAP_SIGNING_NOT_AFTER"'","retireAfter":"'"$EXECUTION_SIGNER_OVERLAP_RETIRE_AFTER"'"}]}' > "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH"
execution-token-signer-agent &
AGENT_PID=$!
trap 'kill "$AGENT_PID" 2>/dev/null || true' EXIT
wait_for_socket(){ i=0; while [ "$i" -lt 30 ] && [ ! -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" ]; do i=$((i+1)); sleep 1; done; test -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"; }
wait_for_socket
