#!/usr/bin/env sh
set -eu
: "${AUTH_EXECUTION_SIGNER_SOCKET_PATH:?}" "${AUTH_EXECUTION_PKCS11_MODULE:?}" "${EXECUTION_SIGNER_ROTATION_MANIFEST_PATH:?}"
test -S "$AUTH_EXECUTION_SIGNER_SOCKET_PATH"
test -r "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH"
test "$(jq '.keys|length' "$EXECUTION_SIGNER_ROTATION_MANIFEST_PATH")" -ge 1
! pkcs11-tool --module "$AUTH_EXECUTION_PKCS11_MODULE" --login --pinfile "$EXECUTION_SIGNER_PIN_FILE" --read-object --type privkey --id 01 >/dev/null 2>&1
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"GetActiveKey","params":{}}' | nc -U "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" | jq -e '.result.kid and .result.publicJwk.crv=="P-256"'
printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"ListPublishedKeys","params":{}}' | nc -U "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" | jq -e '.result|length>=1'
printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"SignEs256","params":{"kid":"invalid","signingInputBase64url":"YQ"}}' | nc -U "$AUTH_EXECUTION_SIGNER_SOCKET_PATH" | jq -e '.error'
