# SoftHSM2 protected signer and verifier host lifecycle

`compose.yaml` is the sole macOS local integration entry point. Docker builds an image containing Go, SoftHSM2, OpenSC and OpenSSL, copies the exact candidate signer source, and runs `run-host.sh` without a host package installation. The runner builds the exact agent and host checker, creates a private SoftHSM2 token, derives both expected RFC7638 `kid` values from the actual PKCS#11 public objects, generates a separate verifier manifest backed by non-exportable HMAC secret keys, and verifies:

- UDS signing against the active ES256 key
- UDS external API-key verifier `ISSUE` and `VERIFY` behavior
- terminal `COMPROMISED_DISABLED` status evidence plus compute denial
- private-key and HMAC-secret non-exportability
- signer-manifest and verifier-manifest mismatch rejection
- weak signer-credential and weak verifier-credential rejection
- sidecar outage denial with no fallback transport

Run from the repository root:

```sh
docker compose -f docker/grpc-trust/execution-token-signer/local/softhsm2/compose.yaml run --rm --build signer-host
```

The runtime has no network, drops Linux capabilities, uses a read-only root filesystem and stores all token/PIN/socket state in an ephemeral `/tmp` filesystem. No private key leaves the token.
