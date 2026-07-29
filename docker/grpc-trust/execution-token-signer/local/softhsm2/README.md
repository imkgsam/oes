# SoftHSM2 protected signer host lifecycle

`run-host.sh` is the sole local integration entry point. It builds the exact agent and host checker from this module, creates a private SoftHSM2 token, derives both expected RFC7638 `kid` values from the actual PKCS#11 public objects, generates an active/overlap manifest, and verifies UDS signing, private-export refusal, manifest rejection, weak-credential rejection, and sidecar outage denial.

It requires `go`, `softhsm2-util`, `pkcs11-tool`, `openssl`, and a SoftHSM2 PKCS#11 module. Set `AUTH_EXECUTION_PKCS11_MODULE` only when the module cannot be found in a standard host path. No private key leaves the token and the temporary PIN file is mode `0600`.
