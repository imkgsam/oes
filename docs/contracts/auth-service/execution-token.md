# Auth ExecutionToken And STS Contract

```text
status: FROZEN
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/auth-service.md
```

> 本文只冻结 Auth / STS 的黑盒凭据交换、Token、JWKS 与撤销语义。Auth 的长期 owner 边界以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准；Permission grant 与 policy 以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. Scope

本契约覆盖：

- Gateway 使用已验证用户 session 为首跳获取 ExecutionToken。
- 内部服务使用 mTLS workload identity 与当前可信执行上下文为下一跳换 target-audience Token。
- Cron、Robot、AI worker 以 Machine Principal 或 delegation 建立 root execution。
- tenant Integration Machine 使用 API Key 在 Gateway / Auth 入口认证并换 Token。
- 资源服务取得 JWKS 并消费紧急撤销事实。

本契约不开放外部直连 gRPC，也不定义用户登录 access / refresh token。高危 ActionGrant 的生命周期、绑定与消费规则以 [delegated-execution-and-action-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/delegated-execution-and-action-grant.md) 为准。

## 2. Trust Inputs

STS 只接受平台已经验证的输入：

- 直接调用方的 `VerifiedWorkloadIdentity`，来自 mTLS / SPIFFE-compatible identity。
- HUMAN 的 active session truth，或 MACHINE 的 active Machine Principal 与有效 API Key credential。
- DELEGATED 的 active human session / principal、delegation grant 与 agent/tool upper bound。
- Permission Service 返回的 principal grant / policy decision 与 workload INTERNAL issuance decision。
- 可信 tenant / org、target audience、精确 requested Permission Code 集、request / trace correlation。

调用方不能通过 request body 自报或覆盖 subject、principal type、tenant、operator、workload identity、delegation upper bound、permission grant 或 `cnf`。

## 3. ExchangeExecutionToken

### Runtime host and protected signing binding

`ExecutionTokenService.ExchangeExecutionToken` and `ExecutionTokenService.GetExecutionTokenJwks` are both mounted on the existing Auth `auth_service` gRPC host. The Auth transport must load the frozen ExecutionToken proto alongside the existing Auth proto; a standalone HTTP controller is not an implementation of either RPC. `ExchangeExecutionToken` accepts only the declared target audience and requested Permission Code fields. Verified workload identity, certificate thumbprint and current execution context are injected by the trusted Common transport/runtime and cannot be reconstructed from the request body or metadata headers.

`GetExecutionTokenJwks` is the internal gRPC JWKS discovery path. Auth additionally publishes RFC 8414 authorization-server metadata on the exact configured HTTPS issuer host and the absolute `jwks_uri` advertised there. The HTTPS publisher exposes only the same public ES256 verification facts; it does not open ExecutionToken exchange over HTTP or replace the gRPC service.

The Auth runtime has exactly one production signing binding: deployment-provided `KmsHsmExecutionTokenClient` → `KmsHsmExecutionTokenSigningAdapter` → `ExecutionTokenSigningPort`. Bootstrap requires an exact issuer, public metadata/JWKS endpoint, opaque signing-key reference and immutable workload/audience registry. An absent protected client, invalid configuration or invalid active/public key timeline prevents the runtime from accepting exchange or JWKS requests. A later protected signing failure makes new exchange fail closed; no in-memory, file, PEM, private-JWK or environment-secret signer fallback exists. Local security integration uses the same port against a KMS/HSM-compatible non-exportable test key boundary; fake signers are unit-test-only.

The protected provider accepts only an opaque signing-key reference and, when deployment cannot use workload identity directly, an opaque credential reference resolved inside the provider. Neither is private key material. Before readiness, Auth must read active and overlap public keys, validate unique `kid`, ES256/P-256 JWK and every publication/signing/retirement boundary, then sign a bootstrap challenge through the provider and verify it with the active public JWK. Failure rejects startup; a throwing placeholder is not a valid production binding. The exact issuer authority serves TLS itself or uses an approved proxy that forwards only RFC 8414 metadata and configured JWKS routes over an authenticated local channel; plain HTTP, arbitrary Host-header routing and proxy-synthesized JWKS are invalid.

The executable provider is the pod-local `execution-token-signer-agent`, a Go static binary under `docker/grpc-trust/execution-token-signer/cmd/agent/**` with its own local `go.mod`, reached only through deployment-configured `AUTH_EXECUTION_SIGNER_SOCKET_PATH` Unix domain socket with least-privilege mount permissions and peer authentication. It is a sidecar infrastructure component, not a public OES service. Its backend is a PKCS#11-compatible HSM/KMS gateway with a non-exportable P-256 key; local integration uses the same agent protocol with a PKCS#11-compatible test HSM. The wire protocol is newline-delimited JSON-RPC 2.0. Auth may invoke only these operations:

1. `GetActiveKey` returns the one active public JWK and its rotation facts.
2. `ListPublishedKeys` returns public active/overlap JWKs and their rotation facts.
3. `SignEs256(kid, signingInputBase64url)` accepts only a currently published `kid` and base64url JWS signing input, returning base64url fixed-width JOSE `r || s` signature.

The agent resolves opaque key / optional credential references inside its own boundary, authenticates to the backend with workload identity, and never returns private material, backend credentials, a DER private key, or arbitrary key-reference selection. Socket/agent absence, permission or peer mismatch, backend/key-reference failure, invalid preflight, TCP/DNS endpoint substitution, or an attempt to sign with an unpublished `kid` rejects Auth readiness or the exchange request fail closed.

### Protected provider binding semantics

The configured signing-key reference is one RFC 7512 PKCS#11 URI which pins token serial, private-key `CKA_ID` (`id`) and `type=private`; it is opaque to callers and cannot be changed by a request, a `kid` or service discovery. The signer-agent obtains the matching non-extractable P-256 public-key object with the same token serial / `CKA_ID`, derives its public ES256 JWK, and derives `kid` as the RFC 7638 SHA-256 JWK thumbprint. Auth accepts neither an arbitrary slot/object selector nor a `kid` that has been retired and reintroduced.

Deployment/SRE owns a read-only manifest under `docker/grpc-trust/execution-token-signer/config/**`, supplied only to the agent at `EXECUTION_SIGNER_ROTATION_MANIFEST_PATH`. A record binds canonical PKCS#11 URI and expected `kid` to RFC 3339 UTC `publishNotBefore`, `signingNotBefore`, `signingNotAfter` and `retireAfter`. The agent cross-checks the record with its HSM-derived JWK / `kid`; it has exactly one key eligible for signing (`signingNotBefore <= now < signingNotAfter`) and publishes all and only keys in their overlap window (`publishNotBefore <= now < retireAfter`). `retireAfter` must be no earlier than `signingNotAfter + 300 seconds maximum Token TTL + 60 seconds clock skew`. The existing agent operations expose only the validated public JWK and rotation facts; zero/multiple active keys or any manifest/key/timeline mismatch fails readiness.

Workload identity is the default backend credential. If a PKCS#11 backend requires additional authentication, only the agent resolves an opaque credential reference through the deployment secret broker; no PIN, resolved credential, private key or raw session handle enters Auth configuration, DI, logs, application/domain code or the socket response. The agent logs in as `CKU_USER` only for the configured token/slot, keeps a time-bounded session lease, refreshes before expiry, and on failure zeroizes credential buffers, logs out, closes the session and fails the sign/readiness operation. The required local security integration asset is SoftHSM2 at `docker/grpc-trust/execution-token-signer/local/softhsm2/**`: a sensitive, non-extractable P-256 key is generated in its token and the token/PIN are mounted only to the agent as a permission-restricted secret file. Integration runs the actual agent over UDS and proves signature verification/rotation plus private-key export refusal, manifest mismatch, credential-lease failure and unavailable agent/HSM fail-closed behavior.

### Request semantics

逻辑请求至少表达：

- `targetAudience`：一个 registered service audience。
- `requestedPermissionCodes`：非空、去重、规范排序后的精确集合；SELF_SERVICE 可由 RPC declaration 形成受控的空业务 Code 集，但仍需 mode claim / server policy。
- 当前可信 execution reference：由 server runtime 注入，不由业务 DTO 重建。

对于多跳 exchange，STS 保持可信 `sub`、principal type、tenant、org、session / delegation attribution 与 request correlation，但把 `client_id`、`aud` 和 `cnf` 绑定到申请当前下一跳的直接 workload。

### Authorization semantics

- HUMAN / BUSINESS：requested Codes 必须是该 principal 在当前 scope / tenant / policy 下的有效子集。
- MACHINE / BUSINESS：requested Codes 必须是 Machine Principal grant 的有效子集。
- DELEGATED / BUSINESS：requested Codes 必须同时满足 HUMAN grant、delegation grant、agent/tool upper bound 与 target policy。
- INTERNAL：requested Codes 必须是 `kind=INTERNAL`，且当前 workload 的 issuance policy 明确允许申请；INTERNAL Code 不从 HUMAN / MACHINE role 继承。
- SELF_SERVICE：STS 不把 body target 编入身份。目标服务从已验证 principal 派生 target，并按 RPC declaration 决定是否允许 DELEGATED。

请求任何未获准 Code 时整体拒绝，不静默扩大，也不以“尽可能签发部分集合”掩盖调用方配置错误。调用方如需要更小集合，应显式重试更小请求。

### Response semantics

成功返回：

- `accessToken`：短期 signed JWT。
- `tokenType = Bearer`。
- `expiresAt` / `expiresIn`。
- `kid` 或可由 JWT header 读取的 key reference。
- 规范化的 granted Permission Code 集与 target audience，便于调用端正确 cache；不得返回 Permission 数据库内部结构。

不返回 refresh token。

## 4. ExecutionToken Claims

### Cryptographic profile and registry

ExecutionToken is a compact JWS with protected header `typ=at+jwt`, `alg=ES256` and a non-empty, globally unique, never-reused `kid`. `ES256` is the only accepted algorithm. Verifiers reject `alg=none`, every HMAC algorithm, a mismatched key type, and unsupported JOSE headers including dynamic key-source headers. JWT signing private keys are KMS/HSM-backed or equivalently protected and never distributed to callers or resource services.

Every environment has one exact HTTPS issuer. Auth owns a controlled registry containing that issuer, stable registered audiences, permitted workload SPIFFE IDs and their issuance policy. A service audience is exactly `urn:oes:service:<service-name>`; it is not a hostname, is not caller-configurable, and no wildcard or multi-audience Token is valid. The Token header and claims never supply a JWKS URL, trust domain or registry override.

The issuer publishes authorization-server metadata and a HTTPS `jwks_uri`. Resource services are configured only with trusted issuer metadata; they do not discover keys from a Token. `iss` equals the registered environment issuer exactly, `aud` equals the one target audience exactly, and `typ` must equal `at+jwt`.

至少包含：

| Claim                         | Required                          | Semantics                                                                            |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `iss`                         | yes                               | Auth / STS registered issuer。                                                       |
| `aud`                         | yes                               | 唯一 target service audience。                                                       |
| `sub`                         | yes                               | 获授权 execution principal id。                                                      |
| `principal_type`              | yes                               | `HUMAN`、`MACHINE` 或 `DELEGATED`。                                                  |
| `client_id`                   | yes                               | 申请并直接使用本 Token 的 verified SPIFFE ID。                                       |
| `tenant_id`                   | TENANT                            | 唯一 tenant；不允许 wildcard。                                                       |
| `org_id`                      | conditional                       | 已验证且场景适用时携带。                                                             |
| `scope`                       | yes                               | 空格分隔、规范排序的 Permission Code 子集。                                          |
| `jti` / `iat` / `nbf` / `exp` | yes                               | 唯一性与短期时效。                                                                   |
| `cnf`                         | yes                               | 仅含标准 `x5t#S256`：当前 workload mTLS 叶证书 DER 的 SHA-256 base64url thumbprint。 |
| `act` / `delegation_id`       | DELEGATED                         | 代理归因与 delegation reference。                                                    |
| `session_id`                  | HUMAN / DELEGATED when applicable | 关联 active human session；不是资源服务在线 introspection 要求。                     |
| `authz_version`               | conditional                       | principal / session / credential 最低安全版本。                                      |

Token TTL maximum is 5 minutes. Implementations may shorten it by risk but callers cannot request arbitrary lifetime. The allowed algorithm, issuer and registry are fixed by this contract; callers cannot select them.

## 5. Local Validation Contract

目标服务必须本地验证：

1. JWT 格式、允许算法、签名与可信 `kid`。
2. exact issuer、`nbf / iat / exp` 与受控 clock skew。
3. exact target audience。
4. `client_id` 与 mTLS `VerifiedWorkloadIdentity` 一致。
5. `cnf.x5t#S256` 与当前 mTLS channel client leaf certificate thumbprint 一致。
6. tenant / org 与 RPC mode、resource ownership 一致。
7. required Permission Code 的 `all / any` 规则。
8. principal type、delegation 与 SELF / BUSINESS / INTERNAL mode 兼容。
9. 本地 emergency deny cache / minimum security version 未拒绝。

验签成功的正常 RPC 不调用 Auth introspection。JWKS cache maximum age is 5 minutes. Unknown `kid` can trigger one controlled JWKS refresh; refresh failure, an untrusted key, an issuer mismatch or any unsupported header must fail closed without bypassing signature validation.

## 6. JWKS, Rotation And Availability

- Auth 实例共享 issuer 与 active signing key material，通过 `kid` 发布 JWKS。
- New key is published through JWKS before use and must be available through the 5-minute maximum JWKS cache window before signing Tokens. Old public keys stay published until every Token they signed has expired plus a 60-second clock-skew window. Every `kid` is unique and never reused.
- 资源服务缓存 JWKS，并在后台或未知 `kid` 时刷新；已有可验证 key 的正常流量不依赖 Auth 在线。
- STS 无状态横向扩展。容量按 exchange / cache miss 峰值、key rotation 与故障恢复设计，不按每个 gRPC RPC QPS 设计。
- 调用方只能把 Token 缓存在本进程，并在过期前留出 refresh margin；禁止共享 Bearer Token pool。
- Production signing keys rotate at least every 90 days and immediately after suspected compromise. Production workload leaf certificates have a maximum 24-hour lifetime and renew before two thirds of their lifetime. Token cache keys include `cnf.x5t#S256`; after a certificate rotation, the caller exchanges a new Token rather than presenting a Token bound to the previous certificate.
- Production, staging and local use distinct SPIFFE trust domains, CAs, issuer URIs and signing keys. Local security integration tests use actual mTLS with per-workload certificates and cover missing/unknown certificates, mismatched SPIFFE ID, cross-certificate Token replay, certificate rotation and JWKS signing-key rotation.

## 7. API Key Exchange

API Key is an external-entry credential, not an internal gRPC credential or an ExecutionToken. The full credential lifecycle is frozen in [external-api-key-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/external-api-key-security.md), and its public HTTP exchange is frozen in [external-api-key-exchange.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/external-api-key-exchange.md).

- API Key belongs to one active TENANT Integration Machine; the key is not a principal and never enters gRPC metadata.
- Gateway submits the credential to Auth over its trusted internal path using the verified Gateway workload and exact INTERNAL issuance policy. Auth verifies credential, machine and tenant status, asks Permission Service for the machine's currently granted `externalApiEligible` BUSINESS Code snapshot, and returns only a Gateway-bound external-access result; no caller-selected capability, role, tenant, audience or expiry is accepted.
- The external caller receives a short-lived Gateway-only external access token. When it invokes an approved external HTTP endpoint, Gateway derives trusted execution context and obtains the separate target-audience ExecutionToken required for the internal mTLS hop.
- Revoked, expired, superseded-after-overlap, disabled-machine, suspended-tenant, wrong-tenant, or disallowed-entry requests fail closed. Marketplace, shared third-party App principals, App installation and cross-tenant developer-platform models remain out of scope.

## 8. Revocation And Replay

### Emergency revocation fact

`auth-service` is the sole owner and publisher of the security fact `auth.execution-token.revoked`, with `eventVersion = 1`. The Event platform owns the CloudEvents security transport, event catalog, subjects, durable consumers and recovery topology. This contract owns the Auth meaning of the fact and must be the source used by that Event-owned recording.

One event revokes exactly one selector; selectors cannot be combined into a broad, ambiguous payload:

| Selector kind           | Matching Token claim / Auth fact                                  | Effect                                                  |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `TOKEN_JTI`             | exact `jti`                                                       | Rejects only that issued Token.                         |
| `PRINCIPAL`             | exact `sub` and principal type                                    | Rejects applicable Tokens for that execution principal. |
| `SESSION`               | exact `session_id`                                                | Rejects applicable Tokens bound to that Auth session.   |
| `CREDENTIAL`            | Auth-owned credential reference                                   | Rejects applicable Tokens issued from that credential.  |
| `MINIMUM_AUTHZ_VERSION` | one opaque security subject plus required minimum `authz_version` | Rejects Tokens below that minimum version.              |

The Auth-owned semantic payload contains only the opaque selector reference, selector kind, a strictly increasing `revocationVersion` for that selector, `effectiveAt`, `denyUntil`, a sanitised `reasonCode`, and audit / trace correlation references. `denyUntil` is no earlier than the latest possible expiry of any affected Token plus the configured clock-skew allowance. Execution scope and its conditional tenant boundary belong to the Event-owned transport envelope and must not be duplicated or inferred from the selector.

The payload must not contain an ExecutionToken bearer value, API Key secret, credential verifier, private key material, raw incident narrative, recoverable personal data, or a field that restores a revoked Token. `reasonCode` is a stable sanitised category such as `TOKEN_COMPROMISE`, `SESSION_COMPROMISE`, `PRINCIPAL_COMPROMISE`, `CREDENTIAL_COMPROMISE` or `EMERGENCY_AUTHORIZATION_CHANGE`; it is not an operator-supplied explanation.

### Issuance, ordering and recovery

- Auth creates the local security decision, immutable authentication audit fact and publication intent atomically. It publishes only through the Event-owned security-critical transport.
- Only an Auth-controlled security workflow, an authorized security administrator, or a verified security detector may trigger an emergency revocation. Other services cannot publish a revocation fact or self-assert a selector.
- The selector version is monotonic. Consumers retain the highest applicable version and treat same-version equivalent delivery as idempotent; duplicate, delayed or older delivery cannot reduce a deny decision or restore access.
- Emergency revocation is for high-risk incidents requiring action before normal expiry. Ordinary role, grant, session and credential changes continue to converge through the short ExecutionToken TTL and do not publish emergency revocations.
- A revocation is one-way for Tokens already issued. If an incident is corrected, the subject resumes only by obtaining a newly exchanged Token with the then-current security state; Auth does not publish an "unrevoke" event.
- Auth may remove its revocation fact only after `denyUntil`. Resource services may remove equivalent local denial state only under the Event-owned delivery and recovery contract; neither cleanup path re-validates an old Token.

### Consumer validation and availability

Resource services validate the revocation state locally after normal JWT, issuer, audience, workload-binding and authorization checks. A matching selector or lower-than-required `authz_version` fails with `EXECUTION_TOKEN_REVOKED`; successful validation never causes Auth introspection.

Consumers must apply the Event-owned security transport contract for durable catch-up, monotonic delivery, local state persistence, readiness, scope-aware failure and alerting. In particular, after startup, recovery or a detected delivery gap, a service cannot reopen its ExecutionToken-protected path until it proves that revocation state has caught up. While it cannot do so, it fails closed for the affected execution scope; it must not fall back to Token TTL, legacy body identity or an Auth hot-path lookup.

- 普通 role / grant / session / credential 变化允许在 Token TTL 内收敛。
- Token 合法复用不是业务幂等。所有有副作用 command 仍使用 tenant + caller + operation 范围内的 idempotency key。
- 高危操作不能仅靠普通 ExecutionToken 防重放；必须使用有效 delegation、适用 step-up 和冻结的 ActionGrant。ActionGrant 绑定 operation、target、输入摘要与 idempotency reference，并由目标服务在业务写入事务中一次性消费。

## 9. Stable Error Categories

- `EXECUTION_AUTHENTICATION_REQUIRED`
- `EXECUTION_WORKLOAD_UNTRUSTED`
- `EXECUTION_PRINCIPAL_INACTIVE`
- `EXECUTION_TENANT_MISMATCH`
- `EXECUTION_AUDIENCE_INVALID`
- `EXECUTION_PERMISSION_NOT_GRANTED`
- `EXECUTION_WORKLOAD_POLICY_DENIED`
- `EXECUTION_DELEGATION_DENIED`
- `EXECUTION_API_KEY_INVALID`
- `EXECUTION_API_KEY_EXPIRED`
- `EXECUTION_API_KEY_REVOKED`
- `EXECUTION_TOKEN_REVOKED`

transport status 映射由 Gateway / common error boundary 统一处理；不得向外泄露 secret、grant graph 或“哪个 key 接近匹配”等诊断信息。

## 10. Acceptance

1. 同一 Token 在正确 audience / workload / TTL 内可复用，换 workload、audience 或 permission set 后不能复用。
2. Token 从另一 mTLS workload 重放因 `cnf` / `client_id` 不匹配失败。
3. 资源服务在 Auth 停机但 JWKS 与未过期 Token 仍有效时继续本地验签；新的 exchange 明确失败而非绕过。
4. INTERNAL Code 不能由业务角色获得，未经 workload issuance policy 的服务不能申请。
5. DELEGATED Token 的 Code 不超过 HUMAN grant、delegation 与 tool upper bound 的交集。
6. API Key 不进入内部 gRPC metadata；下游只看到 target-audience ExecutionToken。
7. key rotation overlap 期间新旧合法 Token 均可验签，过期旧 key 在安全窗口后退出。
8. 每一种冻结 selector 的 emergency revocation 都只拒绝其精确范围；重复、延迟或旧版本事件不会恢复访问，且在 `denyUntil` 前拒绝目标 Token / principal / session / credential / version。
9. security consumer 启动、恢复或发现 delivery gap 后，在 Event-owned catch-up 与 readiness 完成前，对受影响 execution scope fail closed；不会回退到 Token TTL、legacy identity 或 Auth hot-path lookup。
10. `alg` 非 `ES256`、错误或复用的 `kid`、错误 `typ`、Token 自带 key-source header、错误 issuer 或 multi-audience Token 全部拒绝。
11. unknown `kid` 只触发一次受控 JWKS refresh；无法从已配置 issuer 获得可信 key 时拒绝，不能访问 Token 提供的 URL。
12. 正确 SPIFFE ID 但不同叶证书、或正确证书但错误 SPIFFE ID / `client_id` 的调用都因三重绑定失败；证书轮换后旧 Token 必须失败，新 exchange 的 Token 必须成功。
13. local security integration 使用独立 local CA 与 trust domain 完成真实 TLS 握手，不以 mock identity 替代上述绑定与轮换验证。
