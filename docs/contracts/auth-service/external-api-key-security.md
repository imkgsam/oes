# Auth External API Key Credential Contract

```text
status: FROZEN_DG3
architectureTruthSource: docs/architecture/services/auth-service.md
collaborationTruthSource: docs/architecture/collaborations/external-api-key-security.md
revocationInvariant: BOUNDED_RESIDUAL_MAX_5_MINUTES
dg2ExternalOpeningGate: false
externalOpening: DISABLED_PENDING_DG3_IMPLEMENTATION_ACCEPTANCE
```

> This is the Auth black-box credential contract. It does not define Machine Principal ownership, tenant lifecycle, Permission internals, or the external HTTP exchange shape.

## 1. Scope

This contract covers creation, one-time reveal, listing, rotation, revocation, expiry, audit, and the Gateway-to-Auth internal service contract for API Key credentials of an existing tenant Integration Machine. It is consumed through the authorised Gateway/BFF management path and Auth's trusted internal interface; it is not a public direct Auth API.

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
| Create | Existing active tenant Integration Machine and `identity.machine.api_key.create` in trusted HUMAN execution context. | One ACTIVE credential and the one-time full key. |
| List / Get | Same tenant and credential-management authorisation. | Masked credential metadata only. |
| Rotate | `identity.machine.api_key.rotate` in trusted HUMAN execution context; machine active; valid-credential count remains at most two. | New full key once; predecessor remains usable for at most seven days. |
| Revoke | `identity.machine.api_key.revoke` in trusted HUMAN execution context, or trusted security operation. | Credential permanently unusable for exchange; idempotent when already revoked. |
| Disable / expire | Tenant policy or Auth security process. | No future exchange; never reveals or restores the secret. |

Creation and rotation always use server-generated values. The caller cannot provide identifier, secret, tenant, principal, expiry extension, permission set, or pepper version. `expiresAt` defaults to one year and may be shortened by tenant security policy; a caller cannot create a non-expiring credential. API Key management has no credential-specific MFA grant; shared organisation/session assurance policy may require stronger administrator authentication before Gateway establishes the trusted HUMAN context.

## 4. Frozen Internal gRPC Contract

`src/common/src/contracts/auth_service/external_api_key.proto` is the single generated contract input. Its `ExternalApiKeyCredentialService` methods are:

| RPC | Caller and authorization mode | Request authority | Response boundary |
| --- | --- | --- | --- |
| `CreateExternalApiKey` | Gateway with trusted HUMAN context and `identity.machine.api_key.create`. | `integration_machine_id`, optional label and earlier expiry only. Tenant/operator come only from trusted context. | Full `api_key` once plus masked metadata. |
| `ListExternalApiKeys` | Gateway with trusted HUMAN context and at least one API Key management permission. | `integration_machine_id`; no tenant or principal field. | Masked metadata only. |
| `RotateExternalApiKey` | Gateway with trusted HUMAN context and `identity.machine.api_key.rotate`. | `credential_id`; no replacement secret, tenant, or principal field. | Replacement full `api_key` once plus predecessor metadata. |
| `RevokeExternalApiKey` | Gateway with trusted HUMAN context and `identity.machine.api_key.revoke`, or an Auth security workflow. | `credential_id`; no caller-selected deny selector. | Masked revoked metadata only. |
| `ExchangeExternalApiKey` | Gateway workload only, using its verified mTLS identity and registered INTERNAL issuance policy. | The sole sensitive field `presented_api_key`; no tenant, machine, Permission Code, capability, role, audience, or expiry field. | Gateway-only five-minute external access token and safe correlation metadata. |

`ExchangeExternalApiKey` is an INTERNAL technical primitive. It is called only by `api-gateway`, carries the Gateway root MACHINE execution context established by the frozen trusted runtime, and requires the exact INTERNAL issuance policy `api-gateway -> auth-service -> auth.internal.external_api_key.exchange`. No human role can receive this INTERNAL code. Auth rejects a caller that lacks verified Gateway workload identity, the registered issuance policy, or a current root context.

## 5. Validation And Exchange Decision

Auth accepts a presented key only from the trusted Gateway exchange path and verifies all of the following before issuing an external-access result:

1. Identifier/secret syntax and constant-time secret verifier match.
2. Credential is ACTIVE and within its validity window.
3. Auth calls `IdentityQueryService.ResolveIntegrationMachineForAuth` with only the credential-owned machine reference, using verified Auth mTLS and an `aud=identity-service` INTERNAL ExecutionToken with `identity.internal.integration_machine.resolve`. Identity must return `eligible=true`, the same machine id, `scope_level=TENANT`, `machine_type=EXTERNAL_INTEGRATION`, `lifecycle_status=ACTIVE`, a non-empty tenant and lifecycle version.
4. Identity's tenant must exactly equal the Auth credential-owned tenant reference, and that tenant must be active. Caller-supplied tenant data has no authority.
5. Auth calls `PermissionCheckService.ResolveExternalMachineAuthorizationSnapshot` with the Identity-returned machine/tenant, using verified Auth mTLS and an `aud=permission-service` INTERNAL ExecutionToken with `permission.internal.external_machine.snapshot.resolve`. Permission must return `allowed=true`, exact machine/tenant echo, a non-empty externally eligible existing BUSINESS Permission Code snapshot, `authz_version` and decision reference. Neither Gateway nor the external caller supplies a requested capability or Permission Code.

Auth signs the resulting Gateway-only JWT with exact `aud = api-gateway`, Integration Machine subject, tenant, credential reference, `scope` containing only that externally eligible BUSINESS Permission Code snapshot, opaque `authz_version`, `jti` and a maximum five-minute expiry. The Token is not encrypted: codes included in `scope` are intentionally external-safe, while roles, policy graphs, INTERNAL Codes, resource facts, secrets and business data are excluded. Auth rejects a serialized Token over 4 KiB rather than silently truncating the snapshot. Gateway performs the later route-specific and tenant/resource checks; resource policy and domain rules are not decided by this exchange.

Any failed condition returns a non-enumerating stable failure category. Auth never grants a partial requested set, changes a tenant, creates an internal grant, or treats an API Key as a human session.

The runtime boundary is actionable and fixed: Identity implements the dedicated query on its existing query controller/application/repository path; Permission implements the dedicated query on its existing permission-check controller/authorization query/PrincipalRoleBinding catalog path; Auth uses dedicated infrastructure gRPC adapters injected into the external API-key application service. Missing client configuration or trust policy prevents external-exchange readiness. Timeout, unavailable dependency, malformed/ineligible result, tenant mismatch, empty/invalid snapshot or missing trust fails the request before JWT signing; Auth does not use legacy `AuthenticateApiKey`, generic account `CheckPermission`, direct database access or caller facts as fallback.

## 6. Rotation, Audit, And Leak Semantics

- Replacement overlap is no longer than seven days, after which the predecessor becomes unusable. At most two credentials can be usable for one Integration Machine.
- At 90 days Auth marks the credential for rotation-health reminders. This is advisory; expiry remains the configured date, defaulting to one year.
- Auth records lifecycle and exchange audit facts without secrets or tokens. Gateway adds external HTTP usage and rate-protection audit facts using the supplied correlation reference.
- A confirmed leak revokes the credential immediately, creates a security audit fact, and prevents reactivation. New exchanges fail immediately. Gateway does not retain a credential-deny cache or call Auth per request: already-issued Gateway-only access tokens remain valid for no more than their five-minute natural lifetime. DG-2's ExecutionToken revocation event remains an internal-token security contract and is not an external-opening dependency.
- A machine grant removal prevents the next API Key exchange from receiving that Code. An already-issued external Token retains only its signed snapshot until its five-minute expiry; a later STS request for a target-audience ExecutionToken may deny the removed Code sooner under the current MACHINE grant. This bounded behavior is not an emergency credential-deny channel.

## 7. Stable Failure Categories

- `EXTERNAL_API_KEY_INVALID`
- `EXTERNAL_API_KEY_INACTIVE`
- `EXTERNAL_API_KEY_EXPIRED`
- `EXTERNAL_API_KEY_REVOKED`
- `EXTERNAL_INTEGRATION_MACHINE_INACTIVE`
- `EXTERNAL_INTEGRATION_TENANT_INACTIVE`
- `EXTERNAL_CAPABILITY_NOT_ALLOWED`
- `EXTERNAL_AUTHORIZATION_SNAPSHOT_TOO_LARGE`
- `EXTERNAL_API_KEY_ROTATION_LIMIT`
- `EXTERNAL_RATE_LIMITED`

The HTTP status and public error envelope are defined by Gateway. Neither Auth nor Gateway returns a reason that can be used to discover a valid key, its owner, or its grant graph.

## 8. Acceptance

1. A full secret is available exactly once after create and rotate; every later read is masked.
2. An identifier/secret pair cannot authenticate if either component belongs to another credential.
3. A machine disabled, tenant suspended, revoked key, expired key, or elapsed overlap cannot exchange.
4. A normal rotation keeps both credentials valid only during the bounded overlap; a confirmed leak bypasses overlap and revokes immediately.
5. A credential never crosses tenant, becomes an internal workload credential, or enters gRPC metadata.
6. Unauthorised management fails before a secret is generated; the decision consumes only trusted HUMAN context and the exact management Permission Code.
7. Exchange rejects every workload other than the registered Gateway INTERNAL caller, including any caller-supplied tenant, machine, Permission Code, audience, or expiry value.
8. Audit and logs contain no secret, verifier, pepper, Authorization value, external access token, or internal ExecutionToken.
9. Exchange accepts no caller-selected capability or Permission Code; Auth obtains the externally eligible MACHINE snapshot through Permission Service only after credential, machine and tenant validation.
10. The signed external JWT has only externally safe existing BUSINESS Codes in `scope`, is no larger than 4 KiB, and Gateway can use existing route permission metadata to deny an undeclared or nonmatching external request before a business side effect.
11. Identity lookup and Permission snapshot are separately protected by Auth mTLS plus their exact target-audience INTERNAL ExecutionTokens; Gateway or an external caller cannot invoke either interface successfully.
12. Not found/inactive/wrong-type/wrong-scope machine, credential/Identity tenant mismatch, missing tenant lifecycle, denied/empty/invalid snapshot, malformed response, timeout or dependency unavailability causes no external JWT and no fallback path.
