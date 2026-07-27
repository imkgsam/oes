# Auth External API Key Credential Contract

```text
status: FROZEN_DG3
architectureTruthSource: docs/architecture/services/auth-service.md
collaborationTruthSource: docs/architecture/collaborations/external-api-key-security.md
externalOpening: DISABLED_PENDING_DG2
```

> This is the Auth black-box credential contract. It does not define Machine Principal ownership, tenant lifecycle, Permission internals, or the external HTTP exchange shape.

## 1. Scope

This contract covers creation, one-time reveal, listing, rotation, revocation, expiry, and audit of API Key credentials for an existing tenant Integration Machine. It is consumed through the authorised Gateway/BFF management path and Auth's trusted internal interface; it is not a public direct Auth API.

## 2. Credential Representation

The create or rotate success result contains exactly one recoverable secret value:

```text
key = oek_live_<opaque-identifier>.<secret>
```

The non-secret response and all later reads expose only:

- `credentialId` and masked `keyIdentifier`;
- `integrationMachineId`, tenant reference, display label, status, created/last-used/expiry timestamps;
- predecessor/successor reference when rotating; and
- rotation-health state and safe audit references.

`secret`, verifier, pepper reference, external access token, and internal ExecutionToken are never listable, readable, exportable, or included in an audit response.

## 3. Management Operations

| Operation | Preconditions | Stable result |
| --- | --- | --- |
| Create | Existing active tenant Integration Machine; operator is authorised to manage integration credentials and has recent step-up MFA. | One ACTIVE credential and the one-time full key. |
| List / Get | Same tenant and credential-management authorisation. | Masked credential metadata only. |
| Rotate | Same authorisation; machine active; valid-credential count remains at most two. | New full key once; predecessor remains usable for at most seven days. |
| Revoke | Same authorisation, or trusted security operation. | Credential permanently unusable for exchange; idempotent when already revoked. |
| Disable / expire | Tenant policy or Auth security process. | No future exchange; never reveals or restores the secret. |

Creation and rotation always use server-generated values. The caller cannot provide identifier, secret, tenant, principal, expiry extension, permission set, or pepper version. `expiresAt` defaults to one year and may be shortened by tenant security policy; a caller cannot create a non-expiring credential.

## 4. Validation And Exchange Decision

Auth accepts a presented key only from the trusted Gateway exchange path and verifies all of the following before issuing an external-access result:

1. Identifier/secret syntax and constant-time secret verifier match.
2. Credential is ACTIVE and within its validity window.
3. Referenced Integration Machine is active, `TENANT` scoped, and belongs to exactly one active tenant.
4. The tenant is active and the requested Gateway external capability is allowed.
5. The machine's current Permission decision contains every required external BUSINESS Permission Code and the target/resource policy has not denied the request.

Any failed condition returns a non-enumerating stable failure category. Auth never grants a partial requested set, changes a tenant, creates an internal grant, or treats an API Key as a human session.

## 5. Rotation, Audit, And Leak Semantics

- Replacement overlap is no longer than seven days, after which the predecessor becomes unusable. At most two credentials can be usable for one Integration Machine.
- At 90 days Auth marks the credential for rotation-health reminders. This is advisory; expiry remains the configured date, defaulting to one year.
- Auth records lifecycle and exchange audit facts without secrets or tokens. Gateway adds external HTTP usage and rate-protection audit facts using the supplied correlation reference.
- A confirmed leak revokes the credential immediately, creates a security audit fact, and prevents reactivation. New exchanges fail immediately. Gateway denial of already-issued short-lived access tokens is a mandatory external-opening dependency on DG-2's credential-deny propagation.

## 6. Stable Failure Categories

- `EXTERNAL_API_KEY_INVALID`
- `EXTERNAL_API_KEY_INACTIVE`
- `EXTERNAL_API_KEY_EXPIRED`
- `EXTERNAL_API_KEY_REVOKED`
- `EXTERNAL_INTEGRATION_MACHINE_INACTIVE`
- `EXTERNAL_INTEGRATION_TENANT_INACTIVE`
- `EXTERNAL_CAPABILITY_NOT_ALLOWED`
- `EXTERNAL_API_KEY_ROTATION_LIMIT`
- `EXTERNAL_CREDENTIAL_STEP_UP_REQUIRED`
- `EXTERNAL_RATE_LIMITED`

The HTTP status and public error envelope are defined by Gateway. Neither Auth nor Gateway returns a reason that can be used to discover a valid key, its owner, or its grant graph.

## 7. Acceptance

1. A full secret is available exactly once after create and rotate; every later read is masked.
2. An identifier/secret pair cannot authenticate if either component belongs to another credential.
3. A machine disabled, tenant suspended, revoked key, expired key, or elapsed overlap cannot exchange.
4. A normal rotation keeps both credentials valid only during the bounded overlap; a confirmed leak bypasses overlap and revokes immediately.
5. A credential never crosses tenant, becomes an internal workload credential, or enters gRPC metadata.
6. Unauthorised management and missing/revoked step-up MFA fail before a secret is generated.
7. Audit and logs contain no secret, verifier, pepper, Authorization value, external access token, or internal ExecutionToken.
