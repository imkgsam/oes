# Machine Workload Source Credential Contract

```text
status: FROZEN
implementationStatus: FROZEN_PENDING_IMPLEMENTATION
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/auth-service.md
identityContract: docs/contracts/identity-service/machine-principal-resolution.md
```

> 本文只冻结第一方内部 MACHINE root source credential 的黑盒安全语义。Auth 长期 owner 边界以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准；Machine Principal 与 workload binding owner 以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。

## 1. Purpose And Boundary

`MachineWorkloadSourceCredential` 供没有入站 HUMAN/session 或上游 ExecutionToken 的第一方 Cron、Robot、worker 向 Auth / STS 建立 root MACHINE execution。

它是 Auth 签名的独立、短期、certificate-bound JWS profile：

- 不是 ExecutionToken，不授予 target audience 或 Permission Code；
- 不是外部 API Key 或 Gateway-only external token；
- 不是 Identity Machine Principal 或 `MachineWorkloadBinding`；
- 不是 Permission role/grant/policy；
- 不是 refresh token，也不允许静默续期；
- 不开放 public HTTP、external gRPC 或第三方 integration 使用。

外部 API-key exchange、DELEGATED、AI、ActionGrant 与业务 feature 不在本文范围。

## 2. Ownership And Lifecycle

Auth 独占 credential profile、受控登记/签发、验证、expiry、revocation 与 authentication audit。Identity 和 Permission 不保存 credential JWS、verifier 或 bearer value。

稳定生命周期：

1. Initial issuance 只发生在受控 machine/workload enrollment 中，并要求 Identity 已存在 active Machine Principal 与 active `MachineWorkloadBinding`。
2. 每个 credential 引用一个明确 Machine Principal 与一个明确 binding reference/version；该引用不能由 exchange caller 临时选择或替换。
3. credential 最长有效 15 分钟，且 `exp` 不得晚于签发时当前 mTLS leaf certificate 的 `notAfter`。
4. 没有 refresh token。继续运行只能经过受控 reissuance，重新绑定当时的 active Identity binding 与当前 leaf certificate。
5. credential revoke 立即阻止新 STS exchange；Machine Principal 或 binding disabled/stale 同样阻止新 exchange。
6. 已签发 ExecutionToken 的普通收敛仍使用既有 5 分钟最大 TTL；紧急事件只复用 DG-2 `CREDENTIAL`、`PRINCIPAL` 或 `MINIMUM_AUTHZ_VERSION` selector。

### 2.1 Controlled actors and transport

- `IdentityManagementService.EnrollMachineWorkloadBinding` 与 `DisableMachineWorkloadBinding` 只接受普通 mTLS + target-audience ExecutionToken 保护的 HUMAN 或受控 SYSTEM MACHINE 管理调用，并要求 BUSINESS Code `identity.machine.workload_binding.manage`。
- `MachineWorkloadSourceCredentialService.IssueMachineWorkloadSourceCredential` 只接受当前 workload 本身的 mTLS connection。该调用不依赖一个尚未建立的 ExecutionToken，但也不是“仅持有 mTLS 即放行”：Auth 必须使用请求中的非秘密 principal/binding selector 调用 Identity owner resolver，确认该 active binding 精确绑定当前 transport-verified SPIFFE ID。
- initial issuance 和 reissuance 共用同一 `IssueMachineWorkloadSourceCredential` RPC。调用方不能请求 lifetime、tenant、org、Permission Code 或 certificate thumbprint。
- Issue controller 取得的 `certificateNotAfter: Date` 必须与 SPIFFE ID、leaf thumbprint 一样来自 Common `GrpcWorkloadIdentityProvider` 的同一次 transport-verified peer resolution；Common 从同一份 leaf certificate DER 解析 `notAfter`，不得读取 request、metadata、environment 或 caller configuration 中的证书到期事实。该值是 issuance-only 的结构扩展，不改变通用 `VerifiedWorkloadIdentity` 契约，也不是 proto 字段。
- Common 在 DER 解析失败、`notAfter` 不是有效时间或 `notAfter <= resolution time` 时必须在进入 Auth issuance 前 fail closed。Auth 仍计算 `min(now + 15 minutes, certificateNotAfter)`，结果不晚于 `now` 时不签名、不持久化 credential，也不调用 Permission。
- `RevokeMachineWorkloadSourceCredential` 只接受普通 mTLS + target-audience ExecutionToken 保护的 HUMAN 或受控 SYSTEM MACHINE 管理调用，并要求 BUSINESS Code `auth.machine_workload_source_credential.revoke`。
- 上述 RPC 都挂载在既有 Auth / Identity internal gRPC host，不增加 public HTTP、external gRPC 或第二个 Permission mTLS-only bootstrap。`ResolveWorkloadIssuance` 仍是 Permission 发证控制面唯一的 mTLS-only bootstrap primitive。

### 2.2 Frozen Auth proto surface

Future proto `src/common/src/contracts/auth_service/machine_workload_source_credential.proto` 使用 package `auth_service` 与新 service `MachineWorkloadSourceCredentialService`。

```proto
service MachineWorkloadSourceCredentialService {
  rpc IssueMachineWorkloadSourceCredential(IssueMachineWorkloadSourceCredentialRequest) returns (IssueMachineWorkloadSourceCredentialResponse);
  rpc RevokeMachineWorkloadSourceCredential(RevokeMachineWorkloadSourceCredentialRequest) returns (RevokeMachineWorkloadSourceCredentialResponse);
}
```

`IssueMachineWorkloadSourceCredential` request 字段与 field number 固定为：

| Field | Number | Type | Meaning |
| --- | ---: | --- | --- |
| `machine_principal_id` | 1 | `string` | 非秘密 principal selector；必须由 Identity owner decision 复核。 |
| `machine_workload_binding_id` | 2 | `string` | 非秘密 binding selector；不单独构成 authority。 |
| `machine_workload_binding_version` | 3 | `int64` | 调用方已知的精确 binding version；任何 stale value 拒绝。 |

response 字段与 field number 固定为：

| Field | Number | Type |
| --- | ---: | --- |
| `source_credential` | 1 | `string` |
| `credential_id` | 2 | `string` |
| `token_type` | 3 | `string`，成功时固定 `Bearer` |
| `issued_at_unix_seconds` | 4 | `int64` |
| `expires_at_unix_seconds` | 5 | `int64` |
| `machine_principal_id` | 6 | `string` |
| `machine_workload_binding_id` | 7 | `string` |
| `machine_workload_binding_version` | 8 | `int64` |
| `audit_correlation_id` | 9 | `string` |
| `supersedes_credential_id` | 10 | `string` |

`RevokeMachineWorkloadSourceCredential` request 固定为 `string credential_id = 1` 与 allowlisted `string reason_code = 2`。response 固定为 `string credential_id = 1`、`string status = 2`、`int64 revoked_at_unix_seconds = 3`、`bool already_revoked = 4`、`string audit_correlation_id = 5`。对同一 credential 重复 revoke 返回首次撤销事实，不改写时间、操作者或重复产生审计事实。

### 2.3 Frozen JWS profile

Source credential 复用 DG-1 既有 protected ES256 signer / issuer / JWKS lifecycle，但使用与 ExecutionToken 不同的 strict profile：

- protected header：`typ=oes-machine-source+jwt`、`alg=ES256`、已发布且不可复用的 `kid`；
- standard claims：exact Auth `iss`、`aud=urn:oes:service:auth-service`、`sub=machine principal id`、`jti=credential_id`、`iat`、`nbf`、`exp`；
- workload binding claims：`client_id=verified workload SPIFFE ID`、`cnf.x5t#S256=current leaf thumbprint`、`machine_workload_binding_id`、`machine_workload_binding_version`、`profile_version=1`；
- 禁止 tenant/org、Permission Code、role/grant、target service audience 或 caller-selected lifetime claim。

Verifier 必须固定检查该 `typ`、Auth audience、profile version、signature/time/revocation 以及当前 SPIFFE/leaf binding；它不能把 `typ=at+jwt` ExecutionToken 或其他 Auth-signed JWT 当作该 profile。

## 3. Presentation And Verification

worker 使用当前 mTLS connection 调用既有 `ExecutionTokenService.ExchangeExecutionToken`，并通过 transport-private `authorization: Bearer <source-credential>` 提交该 credential。请求 body 不新增 principal、tenant、SPIFFE、certificate 或 credential 字段。

Common 只传递 opaque bearer，不解析 profile，也不将其复制到 `TrustedExecutionContext`、application/domain input、日志或审计。

Auth 必须在任何 Permission lookup 或签名前按顺序完成：

1. 验证 dedicated MACHINE source profile、issuer、signature、time window 与 credential revocation state。
2. 取得 credential 内不可歧义的 Machine Principal / binding reference、binding version、workload SPIFFE binding 与 leaf-certificate thumbprint binding。
3. 要求 credential SPIFFE ID 等于当前 transport 注入的 `VerifiedWorkloadIdentity.spiffeId`。
4. 要求 credential certificate binding 等于当前 mTLS leaf certificate DER 的 SHA-256 base64url thumbprint。
5. 调用 Identity `ResolveMachinePrincipalForAuth`，确认 principal/binding active、reference 唯一、scope/tenant 与 SPIFFE/version 一致。
6. 仅从 Identity owner decision 派生纯 MACHINE root 的 `sub`、`principal_type=MACHINE`、scope 与适用 tenant/org。HUMAN OBO 不使用本 credential 建立或补充 subject/tenant。
7. BUSINESS issuance 调用 Permission `ResolvePrincipalAuthorization`；INTERNAL issuance 调用 `ResolveWorkloadIssuance`；全部批准后才使用既有 ExecutionToken signer。

Identity resolver 调用本身使用 Auth verified mTLS identity、`aud=identity-service` 的 certificate-bound INTERNAL ExecutionToken 与 exact Code `identity.internal.machine_principal.resolve`。该 Token 通过 Permission 唯一的 `ResolveWorkloadIssuance` bootstrap primitive 获得；本契约不增加另一个 mTLS-only bootstrap interface。

该 credential 对 `SYSTEM` Machine Principal 始终 tenantless；它不因 Item Master 调用而携带、选择或推导 tenant。Item Master 三个同步 HUMAN OBO 资格查询不使用本 credential：它们以当前服务 audience 的入站 HUMAN ET 作为唯一 subject credential，由 Auth 保持 subject/tenant 并记录 direct SYSTEM MACHINE actor。没有可信入站 HUMAN ET 的后台任务在该 OBO profile 下 fail closed。

## 4. Binding And Fail-closed Rules

- mTLS 证明当前连接 workload；source credential 证明 Auth-issued root credential；Identity resolver 证明 active Machine Principal 与 stable workload binding。三者必须同时成立。
- 同一 SPIFFE workload 可以承载多个受控 machine binding，但一次 credential 只能引用一个 binding 并解析到一个 principal。ambiguous binding 或 principal mapping 必须拒绝。
- 正确 SPIFFE ID + 错误 leaf、正确 leaf binding + 错误 SPIFFE、stale binding version、wrong principal/scope/tenant 或 inactive owner fact 均在 Permission lookup 前失败。
- credential 中重复出现的 principal、scope、tenant/org 或 Permission facts 都不构成 authority；与 owner decision 不一致时拒绝，不做字段覆盖或 fallback。
- Auth/Identity/Permission unavailable、timeout 或 malformed decision 全部 fail closed，不允许使用 API-key resolver、legacy operator context、body identity、cached caller facts 或硬编码 root mapping。

## 5. Stable Error Categories

- `EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID`
- `EXECUTION_MACHINE_SOURCE_CREDENTIAL_EXPIRED`
- `EXECUTION_MACHINE_SOURCE_CREDENTIAL_REVOKED`
- `EXECUTION_MACHINE_PRINCIPAL_INACTIVE`
- `EXECUTION_MACHINE_SCOPE_MISMATCH`
- `EXECUTION_MACHINE_WORKLOAD_BINDING_MISMATCH`
- `EXECUTION_MACHINE_CERTIFICATE_BINDING_MISMATCH`
- `EXECUTION_MACHINE_BINDING_STALE`
- `EXECUTION_MACHINE_IDENTITY_UNAVAILABLE`

错误响应不得泄露 credential 内容、签名匹配细节、可枚举 principal/binding 信息、grant graph 或 certificate material。

Identity owner reason 只允许 `MACHINE_PRINCIPAL_NOT_ELIGIBLE`、`MACHINE_PRINCIPAL_SCOPE_INVALID`、`MACHINE_WORKLOAD_BINDING_NOT_ELIGIBLE`、`MACHINE_WORKLOAD_BINDING_PRINCIPAL_MISMATCH`、`MACHINE_WORKLOAD_BINDING_STALE`、`MACHINE_WORKLOAD_SPIFFE_MISMATCH` 与 `MACHINE_RESOLUTION_DEPENDENCY_UNAVAILABLE`。Auth 将 not-found/inactive 合并为不可枚举的 stable MACHINE error；不把 owner storage 细节透出 gRPC boundary。

transport trust failure 使用 `UNAUTHENTICATED` / `PERMISSION_DENIED`，malformed field 使用 `INVALID_ARGUMENT`，inactive/stale/state mismatch 使用 `FAILED_PRECONDITION`，Identity/Permission/signer/audit dependency failure 使用 `UNAVAILABLE`。

leaf DER 无法解析、证书到期时间无效或证书在 transport identity resolution 时已经到期，属于 transport trust failure，不新增可枚举的 certificate-detail error。可信 `certificateNotAfter` 已取得但 Auth 计算得到 non-positive issuance lifetime 时，使用既有 `EXECUTION_MACHINE_CERTIFICATE_BINDING_MISMATCH`，且不得泄露 leaf validity 值。

## 6. Audit

成功与失败记录至少包括 opaque credential/binding reference、principal reference/type、scope、tenant/org、verified SPIFFE ID、leaf thumbprint、binding/lifecycle version、target audience、result、safe reason category 与 trace correlation。

审计不得记录 bearer JWS、私钥、可恢复 credential、API Key、Permission grant graph 或 request-body identity fallback。

Auth 复用既有 local `AuditEvent` sink，稳定 event category 为 `MACHINE_SOURCE_CREDENTIAL_ISSUED`、`MACHINE_SOURCE_CREDENTIAL_REISSUED`、`MACHINE_SOURCE_CREDENTIAL_REVOKED`、`MACHINE_SOURCE_CREDENTIAL_VERIFIED` 与 `MACHINE_SOURCE_CREDENTIAL_REJECTED`。Issue/reissue/revoke 的 credential state 与 audit fact 必须在同一 Auth database transaction 中持久化；未能持久化安全审计时不返回 credential 或成功撤销结果。

### 6.1 Persistence semantics

Auth Prisma 模型 `MachineWorkloadSourceCredential` 固定保存：UUID `id` / JWS `jti`、principal/binding reference、`BigInt` binding version、SPIFFE ID、SHA-256 leaf thumbprint、leaf `notAfter`、profile version、signing `kid`、`issuedAt/expiresAt`、`ACTIVE | SUPERSEDED | REVOKED` state、predecessor reference、revocation facts 与 issuance/revocation audit reference。它不保存 bearer JWS。

Database 和 transaction 必须同时保证：

- `expiresAt > issuedAt`、`expiresAt <= issuedAt + 15 minutes` 且 `expiresAt <= certificateNotAfter`；
- 每个 binding 同时最多一个 `ACTIVE` credential；reissuance 先在同一 transaction 把前一个 active row 标记 `SUPERSEDED`；
- predecessor 与 audit reference 使用 Auth-local FK / uniqueness；principal 与 binding 只是经 owner resolver 验证的跨服务 reference，禁止跨 Identity database FK；
- expired 由 `expiresAt` 推导，不需要后台任务改写为第四个 state；
- source credential 签名完成但 database/audit transaction 失败时，该 bearer 不得返回调用方。

## 7. Acceptance

1. active credential、当前 SPIFFE/leaf、active Identity principal/binding 与 Permission decision 全部匹配时，可签发既有五分钟 target-audience ExecutionToken。
2. forged、wrong-profile、expired 或 revoked source credential 在 Permission lookup 与 signing 前失败。
3. credential 从另一个 SPIFFE workload 或同 SPIFFE 的另一张 leaf certificate 重放时失败。
4. binding disabled/stale、principal inactive、scope/tenant mismatch 或 ambiguous mapping 时失败。
5. leaf certificate 轮换后旧 source credential 失败；受控 reissuance 后的新 credential 可重新 exchange。
6. Identity resolver 使用 normal mTLS + target-audience INTERNAL ExecutionToken；没有新增 bootstrap exception。
7. API Key、external token、ExecutionToken、DELEGATED reference 或 caller-supplied principal facts 不能被当作本 profile 的替代品。
8. credential/principal/binding disable 阻止新 exchange；已签发 ExecutionToken 只按既有 TTL 或 DG-2 selector 收敛。
9. Item Master HUMAN OBO profile 不接受本 Machine source credential 作为替代 subject；它验证 current service-audience HUMAN ET、actor workload policy、Permission decision 与当前 certificate，target expiry 不晚于 subject expiry，并审计保存 subject/target `jti` 与 actor 关联。
10. audit 与 logs 不含 source bearer、secret 或可恢复 credential。
