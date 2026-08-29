# Auth ExecutionToken And STS Contract

```text
status: FROZEN
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/auth-service.md
```

> 本文只冻结 Auth / STS 的黑盒凭据交换、Token、JWKS 与撤销语义。Auth 的长期 owner 边界以 [auth-service.md](../../architecture/services/auth-service.md) 为准；Permission grant 与 policy 以 [permission-service.md](../../architecture/services/permission-service.md) 为准。

## 1. Scope

本契约覆盖：

- Gateway 使用已验证用户 session 为首跳获取 ExecutionToken。
- 内部服务使用 mTLS workload identity 与当前可信执行上下文为下一跳换 target-audience Token。
- Cron、Robot、AI worker 以 Machine Principal 或 delegation 建立 root execution。
- tenant Integration Machine 使用 API Key 在 Gateway / Auth 入口认证并换 Token。
- 资源服务取得 JWKS 并消费紧急撤销事实。

本契约不开放外部直连 gRPC，也不定义用户登录 access / refresh token。内部 MACHINE root 的 exact selector 与 Identity resolution 以本文和 [machine-principal-resolution.md](../identity-service/machine-principal-resolution.md) 为准；高危 ActionGrant 的生命周期、绑定与消费规则以 [delegated-execution-and-action-grant.md](./delegated-execution-and-action-grant.md) 为准。

## 2. Trust Inputs

STS 只接受平台已经验证的输入：

- 直接调用方的 `VerifiedWorkloadIdentity`，来自 mTLS / SPIFFE-compatible identity。
- HUMAN 的 Auth-verifiable active session/access source credential；MACHINE root 的 current verified mTLS/SPIFFE、typed exact selector，以及 Identity-resolved active Machine Principal / `MachineWorkloadBinding` owner facts。
- 多跳时的 current signed ExecutionToken subject credential；其 exact audience 必须标识当前 verified exchanging workload service。
- DELEGATED 的 active human session / principal、delegation grant 与 agent/tool upper bound。
- Permission Service 返回的 principal grant / policy decision 与 workload INTERNAL issuance decision。
- 可信 tenant / org、target audience、精确 requested Permission Code 集、request / trace correlation。

Common 只在 mTLS-protected exchange channel 的 transport-private scope 携带 HUMAN/OBO/API Key/DELEGATED opaque credential，不把 bearer 放入 `TrustedExecutionContext`、application/domain input、日志或审计。metadata 是 credential carrier，不是 authority；MACHINE root 不携带 bearer，而由 Auth 组合 current verified transport facts、typed exact selector 与 Identity owner decision 建立 principal。调用方不能通过 request body、ordinary metadata、legacy signed operator context 或 selector 自报或覆盖 subject、principal type、tenant、operator、workload identity、delegation upper bound、permission grant 或 `cnf`。

面向 tenant 的合法业务目标与 subject tenant 是两个边界。Gateway 从 canonical HTTP path `:tenantId` 建立的 verified request target 不进入 ExecutionToken claim、ordinary metadata 或 `ExchangeExecutionToken` request；downstream adapter 只可把规范化 id 序列化为 target service 自己定义的 business selector field。该 HTTP provenance 不跨 gRPC 自动成为 authority。TENANT subject 的 `tenant_id` 仍只表达已验证 principal tenant；SYSTEM subject 不因本次 request target 获得 `tenant_id`。Auth 不判断 SYSTEM 的 tenant target range，也不把 target tenant 编入 Token cache key。

For HUMAN, OBO, API Key and DELEGATED exchange, the exact bearer carrier on `ExchangeExecutionToken` remains `authorization: Bearer <source-credential>`. This method interprets that bearer as an Auth-verifiable source/subject credential, not as a caller-declared target-service grant. Credential type/profile, issuer, signature, lifetime, session/security state and owner references must validate before any Permission decision. For a multi-hop ExecutionToken subject credential, Auth additionally requires the Token's exact `aud` to identify the verified exchanging workload service; its original `client_id` / `cnf` remain upstream-hop evidence and are never rewritten as proof of the new hop. The newly issued Token binds the current exchanger's SPIFFE ID and certificate thumbprint.

For MACHINE root, `authorization` must be absent and the request must contain exactly one typed `machine_execution_selector`. Auth combines its three non-authoritative references with the current `VerifiedWorkloadIdentity.spiffeId` and calls `IdentityQueryService.ResolveMachinePrincipalForAuth` through the exact Auth mTLS policy; that resolver rejects Authorization metadata and requires no Identity-audience ExecutionToken. Auth derives MACHINE `sub`, scope and any tenant/org only from the live owner decision, then obtains the applicable Permission decision. Selector, mTLS or deployment configuration alone grants nothing. This route is used only when no inbound HUMAN subject Token exists; bearer plus selector, missing selector, ambiguous binding or stale version is rejected before Permission or signing.

For synchronous HUMAN OBO, Common sends exactly one current-hop subject credential through `authorization`: the Auth-issued ExecutionToken whose exact `aud` is the verified MES/WMS/Procurement/SRM exchanger itself. Auth verifies issuer/signature/time/security state, `principal_type=HUMAN`, non-empty `tenant_id`, session attribution, exact self-audience and current exchanger mTLS/SPIFFE/leaf. Auth resolves the stable actor by immutable verified-SPIFFE/self-audience registry selectors and validates the referenced Identity-owned SYSTEM Machine Principal/binding through existing `ResolveMachinePrincipalForAuth`; no new Identity RPC or caller-selected actor is introduced.

The immutable registry extends each existing workload policy with one optional deployment-owned `humanObo` block containing exact `selfAudience`, `actorMachinePrincipalId`, `actorBindingId`, canonical positive-decimal `actorBindingVersion`, and a non-empty unique `targetAudiences` subset of that policy's existing `audiences`. Workload SPIFFE records and OBO `selfAudience` values are each globally unique; audiences are canonical service URNs with no wildcard. Duplicate/ambiguous selectors, unknown or malformed fields, empty/duplicate targets, a target outside the existing audience set, or two records claiming one self audience rejects Auth startup.

At exchange time, verified SPIFFE, subject-token audience, requested target and the registry record must match exactly. Auth sends only the registry-owned principal/binding/version selector plus verified SPIFFE to existing `ResolveMachinePrincipalForAuth` and requires an active matching `SYSTEM MACHINE`, identical binding/version/SPIFFE and no tenant. A stale or mismatched owner decision, missing OBO policy, Identity outage, or actor data supplied through request/body/ordinary metadata rejects before Permission or signing. The registry selects; Identity remains actor owner; Permission still decides only workload -> target -> INTERNAL Code.

The resulting Item Master Token preserves the subject Token's `sub`, `principal_type=HUMAN`, `tenant_id`, applicable org/session and security version. Its `act` identifies the current SYSTEM MACHINE actor, while `client_id` and `cnf` bind the direct exchanger workload/current leaf; its `exp` is no later than the subject Token expiry. Permission separately allows the exact exchanger workload -> Item Master audience -> INTERNAL Code and neither receives nor supplies tenant authority. Auth persists subject `jti` -> target `jti`, subject, actor, tenant, workload, target audience, Permission decision reference and trace before returning the Token. Missing/invalid subject, wrong audience/workload/certificate, actor mismatch, expiry, denied Permission or audit failure rejects the complete exchange. Background work without a HUMAN subject Token has no fallback in this profile.

The frozen target shape for `MES -> Item Master` is:

```json
{
  "sub": "account:user-123",
  "principal_type": "HUMAN",
  "tenant_id": "tenant-A",
  "act": {
    "sub": "machine-principal:mes-service",
    "principal_type": "MACHINE",
    "scope_level": "SYSTEM"
  },
  "aud": "urn:oes:service:item-master-service",
  "client_id": "spiffe://oes/mes-service",
  "scope": "item_master.internal.manufacturable_item.resolve",
  "cnf": { "x5t#S256": "MES_CERT_HASH" }
}
```

`act` is exactly one direct-actor object, not a caller-supplied or recursively nested chain. On every exchange Auth replaces prior-hop `act` with the current verified exchanger actor and preserves the complete chain only through durable subject-`jti` -> target-`jti` audit links.

## 3. ExchangeExecutionToken

### Runtime host and protected signing binding

`ExecutionTokenService.ExchangeExecutionToken` and `ExecutionTokenService.GetExecutionTokenJwks` are both mounted on the existing Auth `auth_service` gRPC host. The Auth transport must load the frozen ExecutionToken proto alongside the existing Auth proto; a standalone HTTP controller is not an implementation of either RPC. `ExchangeExecutionToken` accepts the declared target audience, requested Permission Code fields and one optional typed MACHINE selector. Verified workload identity, certificate thumbprint and current execution context are injected by the trusted Common transport/runtime and cannot be reconstructed from the request body or metadata headers.

`GetExecutionTokenJwks` is the internal gRPC JWKS discovery path. Auth additionally publishes RFC 8414 authorization-server metadata on the exact configured HTTPS issuer host and the absolute `jwks_uri` advertised there. The HTTPS publisher exposes only the same public ES256 verification facts; it does not open ExecutionToken exchange over HTTP or replace the gRPC service.

The Auth runtime has exactly one production signing binding: deployment-provided `KmsHsmExecutionTokenClient` → `KmsHsmExecutionTokenSigningAdapter` → `ExecutionTokenSigningPort`. Bootstrap requires an exact issuer, public metadata/JWKS endpoint, opaque signing-key reference and immutable workload/audience registry. An absent protected client, invalid configuration or invalid active/public key timeline prevents the runtime from accepting exchange or JWKS requests. A later protected signing failure makes new exchange fail closed; no in-memory, file, PEM, private-JWK or environment-secret signer fallback exists. Local security integration uses the same port against a KMS/HSM-compatible non-exportable test key boundary; fake signers are unit-test-only.

The protected provider accepts only an opaque signing-key reference and, when deployment cannot use workload identity directly, an opaque credential reference resolved inside the provider. Neither is private key material. Before readiness, Auth must read active and overlap public keys, validate unique `kid`, ES256/P-256 JWK and every publication/signing/retirement boundary, then sign a bootstrap challenge through the provider and verify it with the active public JWK. Failure rejects startup; a throwing placeholder is not a valid production binding. The exact issuer authority serves TLS itself or uses an approved proxy that forwards only RFC 8414 metadata and configured JWKS routes over an authenticated local channel; plain HTTP, arbitrary Host-header routing and proxy-synthesized JWKS are invalid.

The executable provider is the pod-local `execution-token-signer-agent`, a Go static binary under `docker/grpc-trust/execution-token-signer/cmd/agent/**` with its own local `go.mod`, reached only through deployment-configured `AUTH_EXECUTION_SIGNER_SOCKET_PATH` Unix domain socket with least-privilege mount permissions and peer authentication. It is a sidecar infrastructure component, not a public OES service. Its signing backend is a PKCS#11-compatible HSM/KMS gateway with a non-exportable P-256 key; local integration uses the same agent protocol with a PKCS#11-compatible test HSM. The wire protocol is newline-delimited JSON-RPC 2.0. The ExecutionToken client may invoke only these signing operations:

1. `GetActiveKey` returns the one active public JWK and its rotation facts.
2. `ListPublishedKeys` returns public active/overlap JWKs and their rotation facts.
3. `SignEs256(kid, signingInputBase64url)` accepts only a currently published `kid` and base64url JWS signing input, returning base64url fixed-width JOSE `r || s` signature.

ADR 0017 reuses the same Auth-local process/socket for the separately domain-bound `GetExternalApiKeyVerifierStatus` and `ComputeExternalApiKeyVerifier` methods defined only by the External API Key contract. Those methods use a distinct non-exportable HMAC key, cannot select or affect the ES256 key, and do not turn `SignEs256` into an arbitrary algorithm/key operation. The historical signer-agent name/path is retained during DG-3; no ExecutionToken claim, signing profile, key lifecycle or verifier behaviour changes.

The agent resolves opaque key / optional credential references inside its own boundary, authenticates to the backend with workload identity, and never returns private material, backend credentials, a DER private key, or arbitrary key-reference selection. Socket/agent absence, permission or peer mismatch, backend/key-reference failure, invalid preflight, TCP/DNS endpoint substitution, or an attempt to sign with an unpublished `kid` rejects Auth readiness or the exchange request fail closed.

### Protected provider binding semantics

The configured signing-key reference is one RFC 7512 PKCS#11 URI which pins token serial, private-key `CKA_ID` (`id`) and `type=private`; it is opaque to callers and cannot be changed by a request, a `kid` or service discovery. The signer-agent obtains the matching non-extractable P-256 public-key object with the same token serial / `CKA_ID`, derives its public ES256 JWK, and derives `kid` as the RFC 7638 SHA-256 JWK thumbprint. Auth accepts neither an arbitrary slot/object selector nor a `kid` that has been retired and reintroduced.

Deployment/SRE owns a read-only manifest under `docker/grpc-trust/execution-token-signer/config/**`, supplied only to the agent at `EXECUTION_SIGNER_ROTATION_MANIFEST_PATH`. A record binds canonical PKCS#11 URI and expected `kid` to RFC 3339 UTC `publishNotBefore`, `signingNotBefore`, `signingNotAfter` and `retireAfter`. The agent cross-checks the record with its HSM-derived JWK / `kid`; it has exactly one key eligible for signing (`signingNotBefore <= now < signingNotAfter`) and publishes all and only keys in their overlap window (`publishNotBefore <= now < retireAfter`). `retireAfter` must be no earlier than `signingNotAfter + 300 seconds maximum Token TTL + 60 seconds clock skew`. The existing agent operations expose only the validated public JWK and rotation facts; zero/multiple active keys or any manifest/key/timeline mismatch fails readiness.

Workload identity is the default backend credential. If a PKCS#11 backend requires additional authentication, only the agent resolves an opaque credential reference through the deployment secret broker; no PIN, resolved credential, private key or raw session handle enters Auth configuration, DI, logs, application/domain code or the socket response. The agent logs in as `CKU_USER` only for the configured token/slot, keeps a time-bounded session lease, refreshes before expiry, and on failure zeroizes credential buffers, logs out, closes the session and fails the sign/readiness operation. The required local security integration asset is SoftHSM2 at `docker/grpc-trust/execution-token-signer/local/softhsm2/**`: a sensitive, non-extractable P-256 key is generated in its token and the token/PIN are mounted only to the agent as a permission-restricted secret file. Integration runs the actual agent over UDS and proves signature verification/rotation plus private-key export refusal, manifest mismatch, credential-lease failure and unavailable agent/HSM fail-closed behavior.

### Independent authority upper bound and Token reuse

`requestedPermissionCodes` is a canonical minimum-scope request, never evidence that any Code is authorized. For BUSINESS, Auth supplies the verified principal/type, tenant/org, requested Codes and applicable session/delegation/security references to Permission Service `ResolvePrincipalAuthorization`. For INTERNAL, Auth supplies verified SPIFFE workload, exact target audience, requested INTERNAL Codes and attribution to `ResolveWorkloadIssuance`. Auth may sign only when every requested Code is independently granted, the decision kind and all trusted bindings match, and the response includes an auditable decision reference plus `authzVersion`. Unknown/denied/mixed-kind Code, partial approval, stale/mismatched decision, tenant/scope/workload/audience mismatch, timeout or Permission unavailability fails the complete exchange. Auth never reads Permission storage and never constructs `authorizedPermissionCodes` from the request, legacy operator roles or a local role/permission copy.

`ResolvePrincipalAuthorization` and `ResolveWorkloadIssuance` are separate Auth-only Permission Service decisions on the existing `PermissionCheckService` surface. Their request values are derived only after Auth has verified the applicable source credential or live MACHINE owner facts plus workload; their response binds exact granted/denied Codes, tenant/scope/workload/audience as applicable, decision reference and `authzVersion`. No resolver echoes requested Codes as granted without evaluating current catalog, binding and policy truth.

`ResolveWorkloadIssuance` is the sole non-circular bootstrap authorization primitive and does not require a pre-existing ExecutionToken. Permission authenticates the direct caller from transport-injected mTLS / SPIFFE `VerifiedWorkloadIdentity`, accepts only the exact environment-registered `auth-service` identity for that exact method, and independently evaluates Auth's original verified workload -> target audience -> requested INTERNAL Code tuple. A valid certificate for another workload, a service-name header, network placement, wildcard policy or the same Auth identity presented to another Permission RPC grants nothing. After this decision allows the complete set, Auth may sign the requested target-audience Token.

`ResolvePrincipalAuthorization` is not a bootstrap method. Auth calls it with its exact mTLS identity plus a certificate-bound `aud=permission-service` ExecutionToken containing the exact INTERNAL Code `permission.internal.principal_authorization.resolve`; that Code is obtainable only through the workload issuance policy above. The resolver accepts typed HUMAN / MACHINE / DELEGATED identity, trusted scope / tenant / org, one target audience, canonical non-empty BUSINESS Codes and applicable session/delegation/tool references. It accepts no role/admin assertion, target RPC id, resource facts or domain state, and SELF_SERVICE does not use it. Both decisions use whole-request semantics: any unknown, wrong-kind, denied, partial or binding mismatch rejects the exchange and the signing port is not called.

The Token cache and issuance unit is the exact tuple of verified principal/type, tenant/org, target audience, canonical granted Code set, session/delegation/security version, applicable `session_terminal`, current actor workload and current workload certificate thumbprint. HUMAN OBO additionally binds a non-reversible subject-token fingerprint/reference; cache hit still requires the same current request-scoped handle, different subject `jti` values cannot share a target Token, and cache expiry is capped by subject expiry. One valid cached Token may be used for multiple RPCs in that audience when each target method's local declaration accepts the Token mode, terminal constraint and Code set. There is no per-RPC Token or Auth-owned RPC authorization registry. A changed tuple produces a separate exchange/cache entry; ordinary target RPCs continue local validation with no Auth/Permission call.

SELF_SERVICE is the only mode that consumes an empty Code set. Auth still requires a verified HUMAN source credential; DELEGATED remains subject to the target method's explicit `allowDelegated`, and MACHINE has no implicit self-service authority. BUSINESS and INTERNAL requests are non-empty. The target server derives self targets from trusted `sub`, validates current method mode/principal compatibility and `all/any` Codes, and applies tenant/resource/domain rules. A Token with an empty set cannot invoke BUSINESS/INTERNAL; a non-empty BUSINESS/INTERNAL Token does not bypass SELF_SERVICE subject derivation or method mode checks.

Successful and denied exchange audit records route kind, applicable source-credential reference or MACHINE selector/Identity decision reference, verified principal/type/workload, tenant/org, audience, canonical requested/granted Codes, Permission decision reference, `authzVersion`, session/delegation reference, certificate thumbprint, `kid`/`jti`, result/reason and trace correlation. A HUMAN OBO success additionally records subject `jti` -> target `jti` and actor attribution; Auth must await durable append before returning the target Token. It excludes bearer values, API Key material, private key material and recoverable credentials.

### Request semantics

逻辑请求至少表达：

- `targetAudience`：一个 registered service audience。
- `requestedPermissionCodes`：去重、规范排序后的精确最小申请集；BUSINESS / INTERNAL 非空，SELF_SERVICE 固定为空。它不携带授权结果。
- `machineExecutionSelector`：仅 MACHINE root 可出现的 optional typed route field，精确包含 `principalId`、`bindingId` 与 canonical positive `bindingVersion`；三者均为非秘密 owner reference，不是身份或授权事实。
- 当前可信 execution reference：由 server runtime 注入，不由业务 DTO 重建。

The additive proto shape keeps `target_audience = 1` and `requested_permission_codes = 2`, and adds `MachineExecutionSelector machine_execution_selector = 3`; the nested fields are `principal_id = 1`, `binding_id = 2`, and `binding_version = 3`. No target RPC, tenant, subject-token, actor, SPIFFE, certificate or caller-supplied mode field is added. The proto comment/contract test must permit an empty repeated field only for SELF_SERVICE semantics. Existing verified source/subject credentials remain carried only by `authorization`; MACHINE root uses selector-only admission and introduces no second bearer carrier.

这里的 `tenant` 禁止项同时包括 tenant business target：不得为 Gateway tenant-target binding 新增 Exchange target tenant field。Gateway 可把规范化 target 作为目标 RPC 自己拥有的 explicit business selector field 传播；该 selector 不是 credential 或 trusted transport context。目标服务分别验证 target-audience Token identity、exact workload、Permission Code 与 method declaration，再重新授权 selector 并用 selector 加 resource id 复核 tenant ownership。TENANT 要求 Token tenant 与 selector 相等；SYSTEM Token 保持 tenantless，只有 dedicated SYSTEM tenant-target method/interface 与平台 range 可允许 selector。request selector 不能覆盖 Token subject，Token subject 也不能替代 selector。

对于多跳 exchange，STS 保持可信 `sub`、principal type、tenant、org、session / delegation attribution 与 request correlation，但把 `client_id`、`aud` 和 `cnf` 绑定到申请当前下一跳的直接 workload。

### Authorization semantics

- HUMAN / BUSINESS：Permission Service 必须独立确认 requested Codes 是该 principal 在当前 scope / tenant / policy 下的有效子集。
- MACHINE / BUSINESS：Auth 必须先完成 current workload/certificate verification 与 exact selector 的 Identity principal/binding live resolution；Permission Service 再独立确认 requested Codes 是该 active Machine Principal grant 的有效子集。
- DELEGATED / BUSINESS：Permission decision 必须独立计算 HUMAN grant、delegation grant、agent/tool upper bound 与 target policy 的交集。
- INTERNAL：Permission decision 必须确认 requested Codes 是 `kind=INTERNAL`，且当前 verified actor workload → target audience issuance policy 明确允许；INTERNAL Code 不从 HUMAN / MACHINE role 继承。HUMAN OBO 保持 HUMAN subject，并在目标 Token 中记录 SYSTEM MACHINE actor；纯 MACHINE root 仅在目标契约显式允许时使用 Machine Principal subject。
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
| `session_terminal`            | HUMAN session                     | Auth 从与 `session_id` 相同的 active session truth 签入的稳定 terminal，例如 `WEB`、`BROWSER_EXTENSION` 或 `PDA`；调用方不能提交。 |
| `authz_version`               | conditional                       | principal / session / credential 最低安全版本。                                      |

Token TTL maximum is 5 minutes. Implementations may shorten it by risk but callers cannot request arbitrary lifetime. The allowed algorithm, issuer and registry are fixed by this contract; callers cannot select them.

## 5. Local Validation Contract

目标服务必须本地验证：

1. JWT 格式、允许算法、签名与可信 `kid`。
2. exact issuer、`nbf / iat / exp` 与受控 clock skew。
3. exact target audience。
4. `client_id` 与 mTLS `VerifiedWorkloadIdentity` 一致。
5. `cnf.x5t#S256` 与当前 mTLS channel client leaf certificate thumbprint 一致。
6. subject tenant / org 与 RPC mode、resource ownership 一致；存在 target-owned tenant selector 时，TENANT 必须与 Token tenant 相等，SYSTEM 必须由 dedicated method declaration、exact workload/Code 与平台 target range 明确允许。
7. required Permission Code 的 `all / any` 规则。
8. principal type、delegation 与 SELF / BUSINESS / INTERNAL mode 兼容。
9. RPC 声明了 session-terminal 约束时，`session_terminal` 必须存在并精确匹配；MACHINE 或另一 terminal 不能满足该声明。
10. 本地 emergency deny cache / minimum security version 未拒绝。

验签成功的正常 RPC 不调用 Auth introspection。JWKS cache maximum age is 5 minutes. Unknown `kid` can trigger one controlled JWKS refresh; refresh failure, an untrusted key, an issuer mismatch or any unsupported header must fail closed without bypassing signature validation.

## 6. JWKS, Rotation And Availability

- Auth 实例共享 issuer 与 active signing key material，通过 `kid` 发布 JWKS。
- New key is published through JWKS before use and must be available through the 5-minute maximum JWKS cache window before signing Tokens. Old public keys stay published until every Token they signed has expired plus a 60-second clock-skew window. Every `kid` is unique and never reused.
- 资源服务缓存 JWKS，并在后台或未知 `kid` 时刷新；已有可验证 key 的正常流量不依赖 Auth 在线。
- STS 无状态横向扩展。容量按 exchange / cache miss 峰值、key rotation 与故障恢复设计，不按每个 gRPC RPC QPS 设计。
- 调用方只能把 Token 缓存在本进程，并在过期前留出 refresh margin；禁止共享 Bearer Token pool。
- Production signing keys rotate at least every 90 days and immediately after suspected compromise. Production workload leaf certificates have a maximum 24-hour lifetime and renew before two thirds of their lifetime. Token cache keys include `cnf.x5t#S256`; after a certificate rotation, the caller exchanges a new Token rather than presenting a Token bound to the previous certificate.
- Production, staging and local use distinct SPIFFE trust domains, CAs, issuer URIs and signing keys. Local security integration tests use actual mTLS with per-workload certificates and cover missing/unknown certificates, mismatched SPIFFE ID, cross-certificate Token replay, certificate rotation and JWKS signing-key rotation.

## 7. Machine Workload Root Exchange

实现状态：`DESIGN_FROZEN_PENDING_IMPLEMENTATION`。本节取代不可部署的递归 MACHINE source-credential path；当前 Stage fail-closed 结果继续是失败证据，直至本设计完成实现与验收。

内部 SYSTEM service、Cron、Robot、worker 没有 HUMAN/session 或上游 ExecutionToken 时，直接以 current mTLS/SPIFFE 与 typed exact selector 建立 root MACHINE execution：

- 固定 SYSTEM / `INTERNAL_SERVICE` 的 Machine Principal、binding 与 selector 由 Identity-owned deployment provisioner 在 workload readiness 前按版本化 inventory 幂等建立/核对。它不创建 tenant `AUTOMATION_BOT`，也不输出 secret。
- tenant `AUTOMATION_BOT` 仍由正常 ExecutionToken-protected management flow 创建 principal/binding；job/runtime 只携带自己的 exact selector。一个 shared runner SPIFFE 可有多个 active principal binding，停用其中一个只拒绝该 bot。
- selector 必须由 trusted workload configuration 或 bot/job owner adapter 注入 request-local exchange input，不得直接来自 external request、prompt、ordinary metadata 或业务 body。bot/job owner 先验证 tenant/job→binding 关系；Auth 仍不把该选择当 authority，而以 Identity live owner decision 和 Permission decision 定案。
- Auth 从 transport 取得 SPIFFE、leaf thumbprint/notAfter；selector 不携带 tenant/org、SPIFFE、certificate、Permission Code、role 或 lifetime。Auth 对 selector/version 做 strict canonical validation 后调用 Identity exact pre-context resolver。
- Identity 只在 active principal、active unique binding、exact version、exact SPIFFE 和 scope/tenant/org invariant 全部匹配时返回 allowed owner decision。Auth 再调用 Permission；BUSINESS 使用 resolved principal，INTERNAL 使用 verified workload。只有全量 allowed 才签发最长五分钟、绑定当前 leaf 的 ExecutionToken。
- 缺失/重复 selector、bearer 与 selector 同时存在、stale version、wrong SPIFFE、inactive principal/binding、ambiguous binding、owner/Permission dependency unavailable 或 audit failure 均在 signing 前拒绝。
- certificate rotation 直接使用新 mTLS leaf 重新 exchange；principal/binding disable 阻止新 Token，既有 Token 由五分钟 TTL 与现有 emergency selector 收敛。
- Auth 自身的固定 SYSTEM selector 是 login prerequisite：它先通过 direct MACHINE exchange 建立 owner-resolved MACHINE root，再为 Identity、HR 或 TenantOrg 的 exact Auth-only INTERNAL Code 换取 target-audience ET。固定 Auth principal 不为登录获得 BUSINESS role/`PrincipalRoleBinding`。selector/owner/workload policy/target declaration 未就绪时，对应 login/session capability readiness 与真实 journey 保持失败；不使用 local principal、body identity 或 hardcoded Token 绕过。

Auth login/session INTERNAL routes are fixed as:

| Audience | Code | Methods |
| --- | --- | --- |
| `urn:oes:service:identity-service` | `identity.internal.auth_login_account.resolve` | `ListAuthLoginAccountCandidates`, `ResolveAuthLoginAccount`, `ResolveAuthEmployeeLoginAccount` |
| `urn:oes:service:hr-service` | `hr.internal.auth_login_employee.resolve` | `ResolveAuthLoginEmployee` |
| `urn:oes:service:tenant-org-service` | `tenant_org.internal.auth_session_tenant_lifecycle.resolve` | `ResolveAuthSessionTenantLifecycle` |

Every route requires the exact registered Auth SPIFFE workload, `principal_type=MACHINE`, owner-resolved active SYSTEM principal/binding, exact target audience, one listed INTERNAL Code, current-leaf `cnf`, short expiry and the target method declaration. Permission decides only workload issuance for these Codes; absence of a BUSINESS principal grant is not a denial reason on this route. `ResolveMachinePrincipalForAuth` and `ResolveWorkloadIssuance` remain the only pre-context primitives; all listed target RPCs consume normal target-audience ExecutionTokens.

Rollout is additive and ordered: publish catalog definitions and exact workload policies; publish target proto/controller/application resolvers and method declarations; prove target and Permission readiness; then switch only Auth login/session adapters. An enabled login flow is not ready when any required selector, owner resolver, policy, target declaration/client or audit dependency is missing. Existing generic BUSINESS RPCs remain wire-compatible and are never a second Auth login authority. Rollback switches Auth back to the known baseline fail-closed route while the new Codes/RPCs remain inert, then removes policies/RPCs only after Auth rollback and maximum five-minute Token TTL plus allowed clock skew have drained. No temporary principal grant, dual read authority or wildcard fallback is introduced.

Auth issuance audit records selector/Identity decision reference, verified workload/leaf, target audience, exact login Code, Permission decision/version, result/reason and trace. Target owner audit records the safe resolver outcome and owner references required for correlation. Password, OTP, PIN, employee code, bearer and recoverable credential material are excluded from Token and target audit plaintext.

迁移先 additive 发布 selector wire、Identity exact guard 与 provisioner，再切换 callers 并执行 shadow/parity；随后停止新 source credential issue，最多等待其 15 分钟寿命耗尽。兼容窗口与 rollback window 完成后删除旧 Issue/Revoke RPC、JWS profile、Auth table/provider/config 与 credential-specific revoke Code。删除前可回退旧 path；删除后回退只恢复前一版本完整 schema/runtime，不保留双重权威。

完整 Identity owner、provisioning、wire 与 safe-reason 规则以 [machine-principal-resolution.md](../identity-service/machine-principal-resolution.md) 为准。

## 8. API Key Exchange

API Key is an external-entry credential, not an internal gRPC credential or an ExecutionToken. The full credential lifecycle is frozen in [external-api-key-security.md](./external-api-key-security.md), and its public HTTP exchange is frozen in [external-api-key-exchange.md](../api-gateway/external-api-key-exchange.md).

- API Key belongs to one active TENANT Integration Machine; the key is not a principal and never enters gRPC metadata.
- Gateway submits the credential to Auth over its trusted internal path using the verified Gateway workload and exact INTERNAL issuance policy. Auth verifies its credential record, resolves the machine through Identity using Auth mTLS plus `identity.internal.integration_machine.resolve`, cross-checks the Identity tenant and lifecycle, then resolves the current `externalApiEligible` BUSINESS Code snapshot through Permission using Auth mTLS plus `permission.internal.external_machine.snapshot.resolve`. Any trust, owner-fact, tenant, snapshot or dependency failure denies before signing; no caller-selected machine, capability, role, tenant, audience or expiry is accepted.
- Confirmed verifier-version compromise remediation has one separate SYSTEM INTERNAL issuance policy: the exact environment-registered deployment `security-operations-runner` workload may request only `auth.internal.external_api_key.verifier_version.compromise` for `aud=auth-service`, bound to its current mTLS certificate. No Gateway, HUMAN/tenant MACHINE role, wildcard workload or external JWT can obtain that Code. The RPC and provider-evidence/idempotency semantics remain owned by the External API Key contract.
- The external caller receives a short-lived Gateway-only external access token. When it invokes an approved external HTTP endpoint, Gateway derives trusted execution context and obtains the separate target-audience ExecutionToken required for the internal mTLS hop.
- Revoked, expired, superseded-after-overlap, disabled-machine, suspended-tenant, wrong-tenant, or disallowed-entry requests fail closed. Marketplace, shared third-party App principals, App installation and cross-tenant developer-platform models remain out of scope.

## 9. Revocation And Replay

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

## 10. Stable Error Categories

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
- `EXECUTION_MACHINE_SELECTOR_INVALID`
- `EXECUTION_MACHINE_PRINCIPAL_INACTIVE`
- `EXECUTION_MACHINE_SCOPE_MISMATCH`
- `EXECUTION_MACHINE_WORKLOAD_BINDING_MISMATCH`
- `EXECUTION_MACHINE_CERTIFICATE_BINDING_MISMATCH`
- `EXECUTION_MACHINE_BINDING_STALE`
- `EXECUTION_MACHINE_IDENTITY_UNAVAILABLE`
- `EXECUTION_TOKEN_REVOKED`

`EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID`、`EXECUTION_MACHINE_SOURCE_CREDENTIAL_EXPIRED` 与 `EXECUTION_MACHINE_SOURCE_CREDENTIAL_REVOKED` 只属于 additive compatibility route：停止新 issue 后最多保留到同一 15 分钟 drain 边界，且 direct selector route 不得产生这些类别。它们与旧 Issue/Revoke RPC、profile 和 persistence 在 drain/rollback window 完成后同时删除，不属于 target-state stable errors。

transport status 映射由 Gateway / common error boundary 统一处理；不得向外泄露 secret、grant graph 或“哪个 key 接近匹配”等诊断信息。

## 11. Acceptance

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
14. Auth unit test proves `requestedPermissionCodes` never populates the authorized/granted set before an independent Permission response; the signer is not called when that response is absent.
15. A forged BUSINESS Code, a denied Code, a mixed BUSINESS/INTERNAL set, or a partial grant rejects the entire exchange and produces no Token.
16. HUMAN and MACHINE BUSINESS exchange succeeds only with a current `ResolvePrincipalAuthorization` decision bound to the same principal, tenant/scope and requested set; DELEGATED additionally proves the human/delegation/tool intersection.
17. INTERNAL exchange succeeds only with a current `ResolveWorkloadIssuance` decision for the exact SPIFFE workload, target audience and INTERNAL set; HUMAN/MACHINE business grant cannot substitute for it.
18. SELF_SERVICE accepts the canonical empty set only from a verified eligible source principal. The target method derives its subject and rejects BUSINESS/INTERNAL or disallowed DELEGATED mode use; BUSINESS/INTERNAL exchange rejects an empty set.
19. Missing, malformed, expired, revoked or wrong-profile HUMAN/OBO/API Key/DELEGATED source credential; legacy signed operator context; and raw subject/tenant/role metadata all fail before Permission lookup or signing.
20. Multi-hop exchange rejects a subject ExecutionToken whose exact `aud` does not identify the verified exchanging workload service, and the new Token binds the exchanger's own SPIFFE ID/certificate rather than copying the prior hop `client_id`/`cnf`.
21. Permission timeout/unavailability, decision-reference mismatch, stale/denied `authzVersion`, tenant mismatch and workload/audience mismatch fail closed and never invoke the signing port.
22. Two target RPCs with the same principal/tenant/audience/Code/delegation/security/`cnf` tuple reuse one cached Token; changing any tuple member produces a separate cache miss/exchange. No per-RPC Token is introduced.
23. Successful and denied issuance audits contain decision/workload/principal/audience/Code/version/trace evidence and contain no bearer, API Key secret, private key or recoverable credential.
24. `ResolveWorkloadIssuance` succeeds without an ExecutionToken only for the exact Auth mTLS identity and exact method; another valid workload certificate, spoofed header, wildcard or attempt to reuse the bootstrap rule on another Permission RPC fails.
25. Auth obtains `permission.internal.principal_authorization.resolve` only after an all-granted workload issuance decision, then calls `ResolvePrincipalAuthorization` with both matching mTLS and Permission-audience ExecutionToken.
26. Principal authorization never consumes target resource/domain facts or SELF_SERVICE requests, and a denied/partial BUSINESS decision never produces a reduced-scope Token.
27. MACHINE root accepts exactly current mTLS plus one canonical typed selector, obtains one matching active Identity principal/binding/version decision, then obtains the applicable Permission decision before signing; selector or mTLS alone never establishes authority.
28. Correct SPIFFE with stale/wrong/ambiguous selector, disabled binding, inactive principal, scope/tenant mismatch, bearer-plus-selector, missing selector or Identity unavailable rejects the complete exchange.
29. Certificate rotation permits a new direct exchange against the same active selector and binds the new Token to the new leaf; no source credential reissue, refresh token or long-lived API Key is introduced.
30. `ResolveMachinePrincipalForAuth` accepts only exact Auth mTLS for that exact method, rejects Authorization metadata and validates the original workload SPIFFE plus selector against live Identity truth; another caller/method, wildcard, external Integration resolver or header identity fails.
31. A HUMAN source credential signs `session_terminal` only from the same active Auth session as `session_id`; a caller-supplied terminal, a missing terminal on a session-bound Token, or a resource-method terminal mismatch fails closed.
32. Token cache entries for different `session_terminal` values cannot alias, and Browser Activity acceptance proves `WEB` and `BROWSER_EXTENSION` Tokens cannot invoke each other's declared RPC group.
33. HUMAN OBO accepts only the current service-audience inbound ET from the private request scope, preserves HUMAN `sub`/tenant/session, records the exact SYSTEM MACHINE actor, binds the next-hop workload certificate and caps target expiry by subject expiry.
34. Missing, invalid, expired or wrong-audience subject Token; actor spoofing; wrong workload/certificate; direct HUMAN without the required actor; MACHINE root on an OBO-only method; body tenant injection; and an invalid or unbounded `act` chain all fail closed.
35. A deeper synchronous hop uses the Token addressed to the current service as its subject credential; it neither retains the original Gateway Token nor adds a second bearer header.
36. Auth startup rejects duplicate SPIFFE/self-audience OBO policy, malformed or non-canonical selector/version, wildcard/duplicate targets and an OBO target outside the existing workload audience set.
37. OBO exchange rejects missing policy, wrong self/target audience, stale or mismatched Identity principal/binding/version/SPIFFE, non-SYSTEM or tenant-bearing actor, and any caller-supplied actor before Permission/signing.
38. Gateway tenant business selector never appears in `ExchangeExecutionTokenRequest`, Token claims or Token cache key; Auth neither validates nor signs that selector.
39. A target service rejects a TENANT selector that differs from Token `tenant_id`, and rejects a SYSTEM selector unless the exact method is a dedicated SYSTEM tenant-target interface whose workload, Code and platform range all match.
40. Empty inventory provisioning is idempotent; exact re-run is a no-op; manifest/database mismatch or missing fixed binding blocks readiness; emitted selector contains no secret and tenant `AUTOMATION_BOT` is excluded.
41. One shared runner with two tenant bot selectors receives distinct tenant-bound MACHINE Tokens; disabling one principal/binding rejects only that selector and leaves the other bot runnable.
42. Mixed-version rollout supports old caller drain for at most the former 15-minute credential lifetime, proves shadow/parity before cutover, stops new issue before removal, and preserves a tested pre-removal rollback.
43. An external/body/prompt-supplied selector is never forwarded to STS; the bot/job owner resolves it from trusted tenant-bound job state. A shared-runner compromise is contained to that SPIFFE's declared binding set, and high-risk isolation uses a dedicated workload SPIFFE.
