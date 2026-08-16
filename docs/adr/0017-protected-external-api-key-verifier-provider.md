# ADR 0017: Protected External API Key Verifier Provider

```text
status: ACCEPTED
decisionDate: 2026-08-02
designGate: DG-3
architectureTruthSource: docs/architecture/services/auth-service.md
collaborationTruthSource: docs/architecture/collaborations/external-api-key-security.md
contract: docs/contracts/auth-service/external-api-key-security.md
```

## Context

DG-3 requires Auth to persist only an irreversible, constant-time-verifiable API-key verifier produced with a versioned KMS/HSM-held Pepper. The API Key secret is already server-generated with 256 bits of entropy, so Pepper is defence in depth against a database/backup-only compromise rather than a remedy for SHA-256 randomness. The protected HMAC key must remain separate from the credential database and must not be returned to Auth.

The preliminary implementation seam returns `{ version, material }` to Auth. That would place raw Pepper in the application process and make environment/file/memory fallback tempting, contradicting the frozen security objective. The accepted EXEC-CRYPTO asset already supplies one per-Auth UDS sidecar for non-exporting ES256 signing, but its protocol has no protected MAC operation. Adding a second sidecar would duplicate socket, health, credential and HSM-session lifecycle without creating a strong isolation boundary inside the same Auth pod.

This design follows the established industry pattern in which a secrets vault/KMS/HSM retains HMAC material and applications invoke a permissioned MAC operation. AWS KMS HMAC keys support only generate/verify MAC and never leave KMS unencrypted; Google Cloud KMS uses versioned `MAC` keys; HashiCorp Vault Transit provides versioned HMAC operations; OWASP recommends storing Pepper outside the credential database in a secrets vault or HSM. These are reference patterns, not claims about any vendor's undisclosed API-key implementation.

## Decision

### 1. Ownership and deployment boundary

- Auth owns API-key generation/parsing, the `ExternalApiKeyVerifierPort`, canonical verifier semantics, constant-time comparison, credential persistence, audit and API-key capability readiness.
- Deployment/EXEC-CRYPTO owns the protected provider implementation/profile, KMS/HSM HMAC key and logical-version manifest, workload identity/credential delivery, local SoftHSM asset and provider security acceptance.
- DG-3 reuses the existing per-Auth `execution-token-signer-agent` process and UDS. It adds no second sidecar, public endpoint, OES service, tenant state or business database.
- Renaming the existing executable/path is rejected for DG-3 because it would create an unrelated EXEC-CRYPTO migration. The retained name is historical; the added API-key namespace remains fixed and operation-specific.
- The ES256 signing key and HMAC verifier key are distinct backend objects with distinct usages and lifecycle. The new methods do not widen `SignEs256` or create a general cryptographic oracle.

### 2. Narrow provider protocol

The only API-key cryptographic operation is:

```text
ComputeExternalApiKeyVerifier(
  mode: ISSUE | VERIFY,
  identifier: canonical base64url(18 random bytes),
  secret: canonical base64url(32 random bytes),
  verifierKeyVersion?: opaque logical version
) -> {
  verifier: canonical base64url(32-byte HMAC),
  verifierKeyVersion: opaque logical version
}
```

`ISSUE` forbids a requested version and uses the provider's unique `ACTIVE` version. `VERIFY` requires exactly the version stored on the credential and accepts it only in `ACTIVE` or `VERIFY_ONLY` state. The provider also exposes read-only `GetExternalApiKeyVerifierStatus`, returning opaque active/verification lifecycle data and the terminal safe compromise evidence defined in section 6, never backend references or material.

The provider accepts no algorithm, backend key/KMS reference, domain label, arbitrary message, tenant, principal, Permission Code or expiry. The HMAC input is exactly:

```text
ASCII("oes.auth.external-api-key-verifier/v1")
|| 0x00
|| ASCII(identifier)
|| 0x00
|| BASE64URL_DECODE(secret)
```

The algorithm is HMAC-SHA-256 with a distinct non-exportable 256-bit key. The result is 32 bytes encoded as canonical unpadded base64url. Auth decodes stored/candidate values, requires equal 32-byte lengths and uses a constant-time comparison. The provider never returns Pepper, backend credentials, raw handles or key references. The preliminary material-returning port/client is removed with no compatibility fallback; external opening is still disabled, so no production credential migration is required.

A syntactically valid unknown identifier follows one bounded provider computation against the active version and one equal-length comparison against a fixed non-secret dummy value, then returns the same public denial category as a known identifier with a wrong secret. Gateway exchange rate protection bounds this non-enumerating HSM/KMS path. Malformed syntax may reject before provider use but never reveals which component was wrong.

### 3. Versioning, rotation and retirement

- Auth stores `verifierKeyVersion`, an opaque logical identifier with no tenant or backend-key meaning.
- A deployment-owned read-only manifest maps logical versions to backend references and lifecycle state. Auth requests cannot change that mapping.
- Exactly one version is `ACTIVE` for issue. Older versions may remain `VERIFY_ONLY` so routine provider rotation does not interrupt existing external integrations.
- API-key readiness requires provider status to include exactly one active issue version and every distinct version referenced by an active, unexpired or still-overlapping credential row.
- A version can retire only after Auth proves no active, unexpired or credential-overlap row references it and the declared backup/restore recovery period has elapsed.
- A confirmed HMAC-key compromise disables the affected version, permanently revokes all associated credentials and requires replacement. It never re-enables an old secret.

### 4. Failure and readiness

Missing provider, invalid/missing logical version, zero/multiple active versions, manifest/backend mismatch, timeout, workload credential failure or KMS/HSM outage closes API-key create, rotate and exchange. There is no raw environment/file/memory Pepper fallback in staging, production or security acceptance.

Production uses workload identity for the agent-to-KMS/HSM hop with least-privilege usage on separate ES256 and HMAC key objects. If the backend requires additional authentication, only the agent resolves a deployment-supplied opaque credential reference through its secret broker; no resolved credential, PIN, key bytes or backend handle enters Auth. Provider request/response secrets and verifiers are excluded from logs, traces, metrics labels and diagnostics.

This is capability-scoped failure: credential list and revoke remain available, unrelated Auth login/session functions remain independent, and an already issued Gateway-only external token retains only its existing five-minute maximum. Recovery resumes new operations without changing a healthy external credential.

### 5. Development and security integration

- Day-to-day development keeps Auth on the host. An explicit `LocalDevelopmentExternalApiKeyVerifier` may use a generated, repository-ignored, owner-readable local key only when both `NODE_ENV=development` and a separate local-development security profile are proven.
- That provider never satisfies staging, production or security-acceptance readiness; those environments reject it rather than silently falling back.
- Isolated unit tests may use a fake port.
- Security integration runs the actual UDS agent against SoftHSM2. It creates a distinct `CKK_GENERIC_SECRET` / `CKM_SHA256_HMAC` object with 256-bit value, `CKA_SENSITIVE=true` and `CKA_EXTRACTABLE=false`; the signing P-256 object is not reused.
- Acceptance proves raw-key export refusal, fixed algorithm/domain/input validation, arbitrary selector rejection, correct constant-time comparison, active/verify-only rotation, retirement guard, local-provider production rejection and provider/manifest/HSM failure closure.

### 6. Confirmed compromise control plane

The compromise workflow is ordered and fail-safe:

1. Deployment/EXEC-CRYPTO records a safe opaque incident reference, removes the logical version from the agent compute allowlist and disables the backend HMAC version.
2. `GetExternalApiKeyVerifierStatus` may expose terminal `COMPROMISED_DISABLED` only after both local denial and backend unusability are confirmed. Its evidence is limited to logical version, `incidentReference`, `occurredAt` and immutable/monotonic `stateRevision`; the state cannot be re-enabled.
3. A dedicated, exactly allowlisted deployment `security-operations-runner` invokes Auth's existing internal gRPC host with mTLS plus a certificate-bound, `aud=auth-service`, SYSTEM-scope INTERNAL ExecutionToken containing only `auth.internal.external_api_key.verifier_version.compromise`.
4. Auth validates exact provider evidence and runs `CompromiseExternalApiKeyVerifierVersion` as an internal CQRS command. There is no HTTP route, Gateway exposure, ordinary tenant-admin/HUMAN method or caller-selected backend/credential scope.
5. One Auth database transaction creates the durable completion record, locks every credential for the version, preserves prior revocations, revokes all remaining rows at one server time and inserts per-newly-revoked plus aggregate audit facts. Any failure rolls back all Auth changes; the already-disabled provider continues denying exchange until retry succeeds.

The request contains only `verifierKeyVersion`, a safe opaque `incidentReference` and evidence `occurredAt`; trusted operator/workload/trace context comes from the verified transport runtime. The incident reference is a 1–128 character ASCII identifier matching `[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}`, not free-text narrative. `incidentReference` is globally unique and `verifierKeyVersion` has at most one compromise incident. Exact replay returns the stored result and emits no duplicate audit; conflicting reference/version/time reuse is denied. The incident record persists provider `stateRevision`, evidence/processing times, caller workload/trace and matched/newly-revoked/already-revoked counts. The response returns only incident reference, those counts and completion time.

This ordering deliberately avoids a cross-system distributed transaction. Provider disablement is the security gate; Auth's atomic transaction is the credential/audit truth. AWS KMS and Google Cloud KMS both make disabled keys/versions unusable for cryptographic operations, while NIST key-management guidance requires compromised keys to stop applying protection. OES adds the application-level bulk revocation and idempotent evidence record because KMS disablement alone cannot update Auth credential truth.

## Alternatives Rejected

### Store only SHA-256 of the random API Key

Cryptographically reasonable for a correctly generated 256-bit secret, but rejected for OES because the frozen enterprise boundary requires defence in depth against database/backup-only compromise, central key-use audit and controlled provider rotation.

### Return raw Pepper to Auth

Rejected. It defeats non-exporting provider isolation and allows raw material to enter application memory, DI, environment configuration or diagnostics.

### Add a second API-key sidecar

Rejected. It duplicates deployment lifecycle and provides limited additional isolation inside the same Auth pod. Separate backend keys and a fixed method namespace preserve purpose separation with less operational cost.

### Direct arbitrary KMS/HSM SDK use from application/domain code

Rejected. It couples Auth semantics to a deployment vendor and permits caller-selected cryptographic details. Provider-specific code stays behind Auth infrastructure and the deployment-owned agent profile.

### Force API Key replacement on every normal provider-key rotation

Rejected. A verify-only version window gives safe provider maintenance without avoidable customer integration outages. Confirmed compromise remains the explicit forced-replacement case.

## Consequences

Positive:

- Database or backup compromise does not reveal API Key secrets or the HMAC key.
- No additional public service or second sidecar is required.
- Normal HMAC-key rotation does not break healthy external integrations.
- Host-based development remains usable while production and security acceptance retain non-exporting key guarantees.

Costs:

- The existing protected agent protocol and SoftHSM harness gain a second, strictly fixed key type and operation namespace.
- Deployment must manage one additional HMAC key, logical-version manifest and least-privilege permission.
- API-key issue/exchange depends on protected-provider availability, while the rest of Auth remains independently available.

## References

- [AWS KMS HMAC keys](https://docs.aws.amazon.com/kms/latest/developerguide/hmac.html)
- [Google Cloud KMS MAC signatures](https://cloud.google.com/kms/docs/mac-signatures)
- [HashiCorp Vault Transit secrets engine](https://developer.hashicorp.com/vault/docs/secrets/transit)
- [OWASP Password Storage Cheat Sheet: Peppering](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#peppering)
- [AWS KMS enabling and disabling keys](https://docs.aws.amazon.com/kms/latest/developerguide/enabling-keys.html)
- [Google Cloud KMS enable and disable key versions](https://cloud.google.com/kms/docs/enable-disable)
- [NIST SP 800-57 Part 1 Rev. 5](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-57pt1r5.pdf)
- [Auth service truth source](../architecture/services/auth-service.md)
- [External API Key collaboration](../architecture/collaborations/external-api-key-security.md)
- [Auth External API Key contract](../contracts/auth-service/external-api-key-security.md)
