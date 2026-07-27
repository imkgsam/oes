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

本契约不开放外部直连 gRPC，不定义用户登录 access / refresh token，也不定义高危 ActionGrant 的具体字段。

## 2. Trust Inputs

STS 只接受平台已经验证的输入：

- 直接调用方的 `VerifiedWorkloadIdentity`，来自 mTLS / SPIFFE-compatible identity。
- HUMAN 的 active session truth，或 MACHINE 的 active Machine Principal 与有效 API Key credential。
- DELEGATED 的 active human session / principal、delegation grant 与 agent/tool upper bound。
- Permission Service 返回的 principal grant / policy decision 与 workload INTERNAL issuance decision。
- 可信 tenant / org、target audience、精确 requested Permission Code 集、request / trace correlation。

调用方不能通过 request body 自报或覆盖 subject、principal type、tenant、operator、workload identity、delegation upper bound、permission grant 或 `cnf`。

## 3. ExchangeExecutionToken

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

至少包含：

| Claim | Required | Semantics |
| --- | --- | --- |
| `iss` | yes | Auth / STS registered issuer。 |
| `aud` | yes | 唯一 target service audience。 |
| `sub` | yes | 获授权 execution principal id。 |
| `principal_type` | yes | `HUMAN`、`MACHINE` 或 `DELEGATED`。 |
| `client_id` | yes | 申请并直接使用本 Token 的 workload identity。 |
| `tenant_id` | TENANT | 唯一 tenant；不允许 wildcard。 |
| `org_id` | conditional | 已验证且场景适用时携带。 |
| `scope` | yes | 空格分隔、规范排序的 Permission Code 子集。 |
| `jti` / `iat` / `nbf` / `exp` | yes | 唯一性与短期时效。 |
| `cnf` | yes | 当前 workload mTLS identity / proof-of-possession binding。 |
| `act` / `delegation_id` | DELEGATED | 代理归因与 delegation reference。 |
| `session_id` | HUMAN / DELEGATED when applicable | 关联 active human session；不是资源服务在线 introspection 要求。 |
| `authz_version` | conditional | principal / session / credential 最低安全版本。 |

默认 TTL 目标约 5 分钟。实现可以在冻结上限内按风险缩短，但不能由调用方请求任意长寿命。签名算法、key size 与精确 issuer URI 属于安全配置，必须通过 deployment contract 固定且不得接受 `alg=none` 或调用方指定算法。

## 5. Local Validation Contract

目标服务必须本地验证：

1. JWT 格式、允许算法、签名与可信 `kid`。
2. exact issuer、`nbf / iat / exp` 与受控 clock skew。
3. exact target audience。
4. `client_id` 与 mTLS `VerifiedWorkloadIdentity` 一致。
5. `cnf` 与当前 channel workload proof 一致。
6. tenant / org 与 RPC mode、resource ownership 一致。
7. required Permission Code 的 `all / any` 规则。
8. principal type、delegation 与 SELF / BUSINESS / INTERNAL mode 兼容。
9. 本地 emergency deny cache / minimum security version 未拒绝。

验签成功的正常 RPC 不调用 Auth introspection。未知 `kid` 可以触发一次受控 JWKS refresh；refresh 失败必须 fail closed，不能跳过签名校验。

## 6. JWKS, Rotation And Availability

- Auth 实例共享 issuer 与 active signing key material，通过 `kid` 发布 JWKS。
- 新 key 先发布，再用于签发；旧 key 至少保留到其签发 Token 全部自然过期及 clock-skew 窗口结束。
- 资源服务缓存 JWKS，并在后台或未知 `kid` 时刷新；已有可验证 key 的正常流量不依赖 Auth 在线。
- STS 无状态横向扩展。容量按 exchange / cache miss 峰值、key rotation 与故障恢复设计，不按每个 gRPC RPC QPS 设计。
- 调用方只能把 Token 缓存在本进程，并在过期前留出 refresh margin；禁止共享 Bearer Token pool。

## 7. API Key Exchange

- API Key 属于一个 active TENANT Integration Machine；key 本身不是 principal。
- secret 只在创建时显示一次，Auth 持久化不可逆 hash 与 credential metadata。
- API Key 认证检查 credential status / expiry、Machine Principal lifecycle、tenant lifecycle 与调用入口 policy。
- 成功后只返回 ExecutionToken，不把 API Key secret 或内部 gRPC credential 传播到下游。
- 撤销、过期、轮换后旧 key、machine disabled、tenant mismatch 均拒绝。
- 每个 tenant 独立创建 Integration Machine 与 credential。Marketplace、共享第三方 App principal、App installation 与跨 tenant developer platform 已取消，不在本契约预留。

## 8. Revocation And Replay

- 普通 role / grant / session / credential 变化允许在 Token TTL 内收敛。
- 紧急事件可按 `jti`、principal、session、credential 或 minimum `authz_version` 更新服务本地 deny cache。
- Token 合法复用不是业务幂等。所有有副作用 command 仍使用 tenant + caller + operation 范围内的 idempotency key。
- 高危操作不能仅靠普通 ExecutionToken 防重放；必须使用另行冻结的 step-up / ActionGrant，绑定 operation、target、输入摘要和一次性消费。

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
8. emergency deny fact 到达后，在自然过期前拒绝目标 Token / principal / version。
