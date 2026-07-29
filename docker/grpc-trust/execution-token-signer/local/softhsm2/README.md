# SoftHSM2 protected signer host lifecycle

`compose.yaml` is the sole macOS local integration entry point. Docker builds an image containing Go, SoftHSM2, OpenSC and OpenSSL, copies the exact candidate signer source, and runs `run-host.sh` without a host package installation. The runner builds the exact agent and host checker, creates a private SoftHSM2 token, derives both expected RFC7638 `kid` values from the actual PKCS#11 public objects, generates an active/overlap manifest, and verifies UDS signing, private-export refusal, manifest rejection, weak-credential rejection, and sidecar outage denial.

Run from the repository root:

```sh
docker compose -f docker/grpc-trust/execution-token-signer/local/softhsm2/compose.yaml run --rm --build signer-host
```

The runtime has no network, drops Linux capabilities, uses a read-only root filesystem and stores all token/PIN/socket state in an ephemeral `/tmp` filesystem. No private key leaves the token.
