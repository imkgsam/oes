# Trusted gRPC workload identity

> Current executable state: these commands operate the pre-cutover Compose trust bootstrap. The
> accepted target [Local Development And Test Runtime](../architecture/platforms/local-development-and-test-runtime.md)
> uses stable `DEV`, per-run local Integration, and per-job CI certificate material. The future atomic
> cutover rewrites this runbook; no parallel V2 mode is currently active, and these commands do not
> authorize host-wide deletion of historical trust containers, networks, or volumes.

## Purpose and boundary

This runbook operates the DG-1 deployment transport foundation defined by [ADR 0015](../adr/0015-workload-identity-and-execution-token.md) and the [trusted gRPC architecture](../architecture/platforms/grpc-metadata-and-service-trust.md). It supplies the per-workload certificate and trust material required for a verified direct-workload mTLS identity. It does not issue ExecutionTokens, define authorization policy, revoke a token, accept API keys, or interpret request headers/body as identity.

The current Compose workloads prepared with a distinct TLS mount are `api-gateway`, `auth-service`, `identity-service`, `permission-service`, `entity-service`, and `resource-service`. Each has a distinct URI SAN:

```text
spiffe://local.oes.internal/ns/oes/sa/<workload-name>
```

Only the trust bootstrap and rotator mount the local CA private key. Each workload mounts only its own read-only directory at `/var/run/oes/grpc-trust/current`, containing `ca.pem`, `cert.pem`, and `key.pem`.

## Local operation

Prepare local trust material:

```bash
docker compose up grpc-trust-bootstrap
docker compose up -d grpc-trust-rotator
```

`grpc-trust-bootstrap` creates a local-only CA in the named Docker volume and creates a different client/server-auth leaf for every entry in `docker/grpc-trust/workloads.txt`. No private key is written to Git or a host bind mount. The rotator checks every five minutes. A 24-hour leaf renews while more than one third of its lifetime remains, so normal polling renews before two-thirds lifetime has elapsed.

Run the independent transport acceptance smoke from the repository root:

```bash
node scripts/local/trusted-grpc-transport-smoke.mjs
```

The smoke creates isolated ephemeral material, performs a real TLS 1.2+ mutual-auth handshake, and proves all of the following:

- an expected certificate and SPIFFE ID are accepted;
- a CA-valid but wrong SPIFFE ID is rejected;
- a rotated certificate cannot satisfy the old certificate-fingerprint binding (cross-certificate replay);
- the newly rotated leaf succeeds after the expected fingerprint changes.

This is a deployment-transport proof; it does not route traffic through the current business-service containers. The existing Nest gRPC listeners do not yet consume `OES_GRPC_TLS_*`, so their active traffic is not mTLS until TG-1 installs the common gRPC TLS runtime and each service migration enables it. TG-1 and the resource-service migration owners must then enforce the `client_id` / `cnf.x5t#S256` / ExecutionToken triple binding at the gRPC boundary. TG-0 adds no header or plaintext fallback.

## Environment separation

`docker/grpc-trust/environments.json` fixes separate identifiers for each environment:

| Environment | Trust domain | Issuer | Signing material location |
| --- | --- | --- | --- |
| local | `spiffe://local.oes.internal` | `https://issuer.local.oes.internal` | local runtime-only key |
| staging | `spiffe://staging.oes.internal` | `https://issuer.staging.oes.internal` | staging secret manager |
| production | `spiffe://oes.internal` | `https://issuer.oes.internal` | production KMS |

The local bootstrap intentionally refuses `staging` and `production`. No assigned production deployment repository is available in this task, so staging/production CA provisioning, trust-bundle injection, and issuer/signing-key configuration are not implemented here; this is a handoff blocker for the deployment owner. That owner must use separate CA hierarchies, issuer configuration and ES256 signing keys in the stated secret manager/KMS. Do not copy a local CA, leaf, issuer, trust bundle, or JWT signing key into staging or production. Do not mount a CA private key into a workload container.

Production and staging requirements are:

- TLS 1.3 is preferred; TLS 1.2 is the compatibility floor.
- Each workload receives an independently issued X.509-SVID-style client/server leaf with a maximum lifetime of 24 hours.
- Rotation begins before two-thirds lifetime and switches the workload's `current` leaf directory; applications must reload TLS credentials or reconnect before using the replacement leaf.
- JWT ES256 private keys remain in KMS/HSM-equivalent custody. Publish a new JWKS key before signing with it; retain the old public key through the final token expiry plus clock skew.
- Deployment admission verifies URI SAN against the immutable workload registry. Neither a hostname, a private network address, `x-internal-service-name`, nor request metadata can substitute for this check.

## Rotation and incident handling

Normal leaf rotation changes the certificate fingerprint. A caller must obtain a new target-audience ExecutionToken bound to the new leaf; it must never replay a token or transport proof bound to the old certificate. Restart/reconnect a workload that cannot reload its TLS files safely.

For a suspected CA or leaf compromise, stop the affected workload, revoke/replace the deployment credential through the environment secret manager, issue a new leaf, restart/reconnect the workload, and open the DG-2 emergency-revocation process. Do not add a second trust root, disable peer verification, or fall back to a self-reported service header as an emergency workaround.
