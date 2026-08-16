# ADR 0015: Workload Identity 与短期 ExecutionToken

```text
status: ACCEPTED
decisionDate: 2026-07-27
architectureTruthSource: docs/architecture/platforms/grpc-metadata-and-service-trust.md
executionTokenContract: docs/contracts/auth-service/execution-token.md
authorizationContract: docs/contracts/permission-service/principal-authorization.md
```

## Context

OES 的外部请求经 API Gateway / BFF 进入，随后通过 gRPC 调用一个或多个内部服务。Cron、Robot、AI worker 与外部 Integration 也会在没有 HTTP 用户入口的情况下发起内部执行。仓库当前同时存在自报 `x-internal-service-name`、共享 HMAC 签名的 `operator_context`、request body tenant / operator 字段和多种不一致的 gRPC Guard；这些机制无法统一证明直接调用工作负载、本次执行主体、tenant 边界和目标服务授权。

直接透传一个用户 Token 也不能解决多跳问题：它通常没有下一跳 audience，不能表达当前工作负载的调用资格，并且会扩大泄露与重放半径。另一方面，让每个 RPC 在线访问 Auth 做 introspection 或签发会把 Auth 放进业务热路径，形成可用性与延迟瓶颈。

OES 需要一个同时覆盖 HUMAN、MACHINE、DELEGATED、多跳、外部 API Key 与纯技术调用的终态模型，并通过逐服务迁移在当前全部 gRPC RPC 中停止信任重复 body identity。

## Decision

### 1. 分离工作负载身份与执行身份

- 部署层 mTLS / SPIFFE-compatible identity 证明当前直接调用工作负载；应用代码只消费已验证的 `VerifiedWorkloadIdentity`。
- `auth-service` 内的 STS 独占签发短期 ExecutionToken，证明本次执行主体、tenant / org、目标 audience 与获准 Permission Code。
- 工作负载身份不能替代业务主体；业务主体也不能证明当前直接调用服务。

### 2. Execution Principal

Execution Principal 只有三种稳定模式：

- `HUMAN`：用户直接执行。
- `MACHINE`：Cron、Integration、Robot 或平台自动化以自身授权执行。
- `DELEGATED`：AI / Robot 在受控 delegation 中代表 HUMAN 执行。

平台 Robot template 不是 principal。租户安装 template 时创建独立 TENANT Machine Principal；个人触发的无人值守任务不长期继承创建者权限。DELEGATED 的有效权限是 human grant、agent/tool upper bound、delegation grant、tenant 边界与目标 RPC 要求的交集。

### 3. Token 形态与验证

- Token 是签名 JWT，默认 TTL 约 5 分钟，不提供 refresh token。
- ExecutionToken JWS 固定使用 `typ=at+jwt`、`alg=ES256` 与唯一、不可复用的 `kid`。签名私钥只在 KMS/HSM 或等价受控密钥系统中使用；验证器固定 allowlist，拒绝算法降级与未受支持 JOSE header。
- 每个 Token 只有一个 `aud`，只面向一个目标服务。
- 每个环境有一个精确 HTTPS issuer；audience 是稳定的 `urn:oes:service:<service-name>`，不随部署地址变化。Auth / STS 拥有受控 issuer / audience / workload registry，资源服务只接受自身精确 audience。
- 标准 `scope` claim 直接携带本次获准的 Permission Code 子集，不建立第二套 Scope 目录或转换表。
- `client_id` 必须等于经 mTLS 验证的 SPIFFE ID；`cnf` 采用标准 `x5t#S256`，将 Token 绑定到申请方当前 mTLS 叶证书。资源服务同时验证 trust bundle / SPIFFE ID、`client_id` 与 `cnf`。
- 目标服务本地校验签名、issuer、时间、audience、scope、tenant、`cnf` 与紧急 deny state；普通 RPC 不在线调用 Auth。
- Auth 以无状态实例横向扩展，使用 `kid` / JWKS 轮换签名密钥。新 key 先发布、后签发，旧 public key 保留至最后 Token 过期及 clock-skew 窗口；签名 key 至少每 90 天轮换。普通撤销依赖短 TTL；紧急撤销通过安全事件更新本地 deny cache 或 minimum security version。
- workload 使用独立短期 X.509-SVID 风格证书；production、staging 与 local 使用独立 trust domain。production leaf certificate 最长 24 小时并在寿命三分之二前自动续期；证书轮换后必须重新 exchange Token，不能跨证书复用。
- ExecutionToken 的冻结 proto service 必须挂载在既有 Auth gRPC host；`ExchangeExecutionToken` 只消费 Common transport 注入的可信 execution / workload facts，`GetExecutionTokenJwks` 是内部 verifier 的 RPC discovery surface。Auth 还必须在精确 HTTPS issuer host 发布 RFC 8414 metadata 与 metadata 声明的 absolute `jwks_uri`；未挂载的 HTTP controller 不构成 JWKS 发布。
- Auth 使用 deployment-bound `KmsHsmExecutionTokenClient`，经唯一 `KmsHsmExecutionTokenSigningAdapter` / `ExecutionTokenSigningPort` 链路签发。issuer、public metadata/JWKS endpoint、opaque signing-key reference 与 immutable registry 缺失或无效时启动 fail closed；禁止 memory/file/PEM/private-JWK/environment-secret signer。Local integration 使用同一非导出 protected-key boundary；unit fake 不得成为 runtime fallback。
- protected provider 只接收 opaque signing-key reference 和（仅当 workload identity 不足时）deployment-resolved opaque credential reference；reference 绝不承载或导出 private key。Auth readiness 必须以 active/overlap public-key timeline 校验和 provider-sign/bootstrap-challenge 的本地公钥验签为前置条件。issuer HTTPS authority 必须真实 TLS 终止或经 approved proxy 转发到 authenticated Auth metadata channel；plain HTTP、Host-header routing 或静态伪造 JWKS 不构成发布。
- concrete provider asset 固定为每个 Auth workload 一实例的 `execution-token-signer-agent` sidecar：Auth infrastructure 通过 pod-local `AUTH_EXECUTION_SIGNER_SOCKET_PATH` Unix socket 调用，sidecar 以 workload identity 对接 PKCS#11-compatible HSM/KMS gateway，并持有 non-exportable P-256 key。它不是新的 OES 服务；没有 public ingress、业务数据库或跨 tenant state。Auth client/adapter 归 Auth infrastructure path class；Go static sidecar binary（`docker/grpc-trust/execution-token-signer/cmd/agent/**` 与 local `go.mod`）、socket mount、PKCS#11 module 与 local HSM harness 归既有 EXEC-CRYPTO deployment path class。ExecutionToken namespace 使用 newline-delimited JSON-RPC 2.0，只公开 active key、published overlap keys 与指定 published `kid` 的 ES256 signing，绝不返回私钥、backend credential 或任意 key selection。ADR 0017 可在同一 Auth-local process/socket 增加独立、固定的 API-key verifier namespace；它使用另一把 non-exportable HMAC key，不能选择或影响 ES256 key，且不改变本 ADR 的 ExecutionToken contract。
- opaque signing-key reference 固定为 RFC 7512 PKCS#11 URI，pin token serial、private-key `CKA_ID` / `id` 与 `type=private`，由 agent 用同一 serial / ID 获取 public key；不得由 Auth request、`kid` 或 runtime discovery 选择其他 key。agent 从 HSM-derived ES256 P-256 JWK 计算 RFC 7638 thumbprint `kid`，并以 deployment/SRE 拥有的只读 `docker/grpc-trust/execution-token-signer/config/**` rotation manifest 校验 canonical URI、expected `kid` 与 RFC 3339 UTC publication/signing/retirement timeline。恰有一个 active signer；`retireAfter` 至少覆盖 `signingNotAfter + 300s Token TTL + 60s skew`，manifest/HSM mismatch fail closed。backend 默认使用 workload identity；额外 credential 只能由 agent 内的 secret broker 以 opaque reference 解析，并按 `CKU_USER` time-bounded session lease 刷新/失败清零、logout、close 和 fail closed。local integration 固定使用 `docker/grpc-trust/execution-token-signer/local/softhsm2/**` 的 SoftHSM2 token 内 sensitive、non-extractable P-256 key 与仅 agent 可读 PIN secret file；实际 UDS agent 测试必须证明 export refusal、rotation、manifest/credential mismatch 和 agent/HSM outage fail closed。
- `requestedPermissionCodes` 仅是最小能力申请，绝不建立授权。Auth 从 Auth/Identity 可验证的 source credential 恢复 HUMAN/MACHINE/DELEGATED principal，以 Permission Service `ResolvePrincipalAuthorization` 的独立 decision 形成 BUSINESS 上限，以 `ResolveWorkloadIssuance` 形成 INTERNAL workload→audience→Code 上限；必须全部获准且 subject、actor workload、audience、kind、decision reference 与 `authzVersion` 一致，tenant/org 也必须来自已验证 subject credential 或 owner decision 后才签名。同步 HUMAN OBO 的 INTERNAL decision 只授权 actor workload→audience→Code，既不改变 HUMAN subject，也不提供 tenant authority。caller request、legacy operator roles、Auth 本地 Permission 副本或同源集合比较不能成为上限；依赖失败、部分批准或 mismatch 全部 fail closed。
- Permission issuance control plane 使用现有 mTLS / SPIFFE workload identity 建立非循环 trust root：`ResolveWorkloadIssuance` 是唯一不预先要求 ExecutionToken 的 bootstrap authorization primitive，只接受环境注册的准确 `auth-service` identity 调用这一准确方法，并独立判断 original verified workload → target audience → INTERNAL Code。该 method policy 不能扩散到其他 Permission RPC、其他 workload 或 wildcard。`ResolvePrincipalAuthorization` 仍要求准确 Auth mTLS identity 加 certificate-bound `aud=permission-service` ExecutionToken 与 exact Code `permission.internal.principal_authorization.resolve`；它只形成 HUMAN/MACHINE/DELEGATED BUSINESS Code 发证上限，不接收 resource/domain facts，SELF_SERVICE 不调用。Permission 不签发 Token，Auth 对任一 denied/partial/mismatch decision 均不签名。
- source credential 只由 Common transport-private runtime 在 mTLS-protected exchange channel 携带：首跳使用 Auth 可复核的 active session/access credential，多跳使用当前 signed ExecutionToken 作为 subject credential 并要求其 `aud` 精确对应 verified exchanger workload，API Key root 使用既有 Gateway-only external credential，MACHINE root 使用 Auth-owned `MachineWorkloadSourceCredential` 与 Identity-owned binding resolution，DELEGATED 使用对应 owner credential/reference。metadata 只是 opaque credential 的载体；裸 subject/tenant/terminal/Code、request body、ordinary metadata 与 signed operator-context 都不是 authority。对于 session-bound HUMAN execution，Auth 从同一 active session truth 把单值 `session_id` 与 `session_terminal` 一并签入；目标 RPC 的声明层统一使用非空、去重、不可变的 `sessionTerminals` 精确允许集合，当前 Token 的单值 terminal 必须命中该集合。声明层不得同时或继续提供单值 `sessionTerminal` 字段，所有既有声明一次性迁移为数组；MACHINE Token 不携带 session claim。Token 按 principal/tenant/audience/exact Code set/delegation/session-terminal/security version/`cnf` tuple 缓存和复用，不按 RPC 签发；目标服务继续独占 RPC mode、Code、terminal allowlist 与 resource/domain enforcement，Auth 不维护 target-RPC registry。
- 同步 HUMAN 多跳采用 OBO：当前服务把它已验证、且 `aud` 精确等于自身的入站 ExecutionToken 作为下一跳唯一 subject credential；Auth 重新验证 Token 与当前 exchanger 的 mTLS/SPIFFE 身份，为目标 audience 签发新 Token。新 Token 保持原 HUMAN `sub/principal_type/tenant/org/session`，用 `act` 记录当前直接 SYSTEM MACHINE actor，并把 `client_id/cnf` 绑定该 actor 的 workload/leaf certificate；`exp` 不晚于 subject Token。OBO 是身份传播，不是第四种 RPC mode；BUSINESS、SELF_SERVICE、INTERNAL 仍描述目标能力与授权规则。没有入站 subject 的 Cron/Robot/worker 继续使用 MACHINE root，不得伪造 HUMAN OBO。

### 4. 多跳与 cache

每一跳调用下游时，调用方使用当前已验证执行上下文向 STS 获取目标 audience Token；不得原样转发上游 Token，也不得由业务服务自行重签。

调用端可按 subject、principal type、delegation、tenant、org、audience、精确 Permission Code 集、`cnf` 与安全版本建立严格进程内 cache。禁止创建 Redis 或其他跨服务共享 Bearer Token 池。合法 cache 复用由 mTLS + `cnf`、短 TTL、最小 audience、命令幂等与高危 ActionGrant 共同控制风险。

HUMAN OBO cache entry 必须绑定不泄露 bearer 的 current subject-token fingerprint/reference、actor workload、target audience、Code set 与 current leaf；cache hit 仍要求当前 request scope 持有同一 subject credential。不同 subject `jti` 不得共享目标 Token，且 cache expiry 不晚于 subject Token expiry。

### 5. API Key 与机器授权 owner

- `identity-service` 拥有 Machine Principal identity、scope/tenant/lifecycle，以及 Machine Principal 与 workload SPIFFE ID 的 `MachineWorkloadBinding`。
- `auth-service` 拥有 API Key credential，也独立拥有第一方内部 `MachineWorkloadSourceCredential` 的 profile、受控登记/签发、验证、expiry、revocation 与认证审计；两者不能复用。Auth 继续独占 Gateway-only external access token 与内部 ExecutionToken exchange 的 STS 能力。
- `permission-service` 拥有 HUMAN / MACHINE 的角色、grant、policy 与授权判定。
- `permission-service` 可在现有 BUSINESS Permission Code metadata 上标记 `externalApiEligible`，供 Auth 在 API Key exchange 时返回最小外部授权快照；该标记不开放 Gateway route、不授予 principal，也不建立第二套 Scope 目录。
- 长期绑定模型收敛为 `PrincipalRoleBinding`，显式记录 principal type / id、scope level、tenant 与 role；不把机器伪装为 `UserAccount`。
- INTERNAL kind Permission Code 只由 STS workload issuance policy 授予，不能进入人类或租户机器业务角色。

外部 App 只能创建 tenant-scoped Integration Machine 与 API Key，并通过 Gateway/Auth 取得 Gateway-only external access token；Auth 将已验证 Machine 的 externally eligible BUSINESS Code 快照写入该短期 JWT，Gateway 复用既有 `RequirePermissions` 元数据和显式外部 route opt-in 做入口判断，之后才为其内部 mTLS call 换取 target-audience ExecutionToken。外部调用方不直接访问内部 gRPC。具体 credential/exchange 规则以 DG-3 External API Key contracts 为准。Marketplace、第三方开发者平台、共享 App 主体与一个 App 被多个 tenant 安装的模型已取消，不做架构预留。

该 MACHINE root path 的实现状态是 `IMPLEMENTED_VERIFIED`：完整 source-credential runtime、`MachineWorkloadBinding` persistence、resolver proto/runtime 与 INTERNAL Code registration 已由 `024579598c1293807d3f1cd5e7003aefd8e8fa0a` 验收并集成到 current main。无入站 HUMAN/session 或上游 Token 的第一方 Cron、Robot、worker 使用专用 Auth-signed `MachineWorkloadSourceCredential` 建立 root MACHINE execution。该 source JWS 最长 15 分钟且不得超过当前 leaf certificate expiry，不含 Permission Code、没有 refresh token，并同时绑定 Identity `MachineWorkloadBinding` reference/version、准确 SPIFFE ID 与当前 leaf thumbprint。Auth 先验证 credential，再使用受正常 INTERNAL ExecutionToken 保护的 `IdentityQueryService.ResolveMachinePrincipalForAuth` 确认 active principal/binding，最后按 BUSINESS / INTERNAL 分别取得 Permission decision。Machine/binding/credential 任一 disabled、revoked、stale 或 mismatch 都在签发前 fail closed；普通已签发 Token 在 5 分钟最大 TTL 内收敛，紧急场景复用 DG-2 既有 selector，不新增撤销系统。

MACHINE wire/schema completion 进一步冻结：Identity 管理者先用正常 ExecutionToken-protected `EnrollMachineWorkloadBinding` 把 Machine Principal 与 exact SPIFFE ID 登记；workload 再以当前 mTLS + 该 active binding 调用 Auth `IssueMachineWorkloadSourceCredential`。这不是“仅 mTLS 即签发”，Identity owner decision 是不可缺少的第二信任事实。Issue 同时承担 controlled reissuance，每 binding 最多一个 active source credential，新签发以同一 transaction supersede 旧记录。Credential revoke 与 binding disable 都是正常 BUSINESS management RPC，使用 `auth.machine_workload_source_credential.revoke` 与 `identity.machine.workload_binding.manage`；它们不改变 `ResolveWorkloadIssuance` 作为 Permission 唯一 mTLS-only bootstrap primitive 的决定。精确 proto field number、strict JWS profile、Prisma invariant、safe error 与 transactional audit 以 Auth/Identity MACHINE contracts 为准。

### 6. RPC authorization declaration

每个已建立 execution context 后的 gRPC RPC 必须且只能声明一种方法级模式：`BUSINESS`、`SELF_SERVICE` 或 `INTERNAL`。两个 pre-context exact method 必须声明自己不可复用的 bootstrap policy：Permission `ResolveWorkloadIssuance` 是 exact-Auth mTLS-only bootstrap；Auth `IssueMachineWorkloadSourceCredential` 是 current mTLS + pre-enrolled active Identity binding bootstrap。后者不因 mTLS 本身授权。Gateway HTTP `RequirePermissions` 保留为外部入口第一层授权；服务端仍独立验证 ExecutionToken 和资源边界。漏标、重复标注或 bootstrap policy 扩散必须由启动扫描或架构测试阻止。

### 7. 全仓迁移边界

公共 generator 启用显式 gRPC metadata signature，并提供单一 reusable client/server runtime。本 capability 覆盖当前全部 21 个服务、51 个 gRPC Controller 与 560 个 RPC。

默认逐目标服务迁移和验收：先准备该目标的全部 caller，再原子切换该服务的 proto / controller / fixtures / enforcement，并删除该目标的 legacy 信任来源。若静态调用图证明存在无法安全拆分的强连通环，只把最小强连通服务组作为原子 server cutover。任何一个 RPC 都不允许 Token 失败后回退 body tenant/operator 或 legacy header。

Asset + Site 保持第一条业务解阻链，但所有服务 legacy 引用归零前，项目级 capability 不完成。

Site Runtime 现有 HMAC、nonce、method/path/body hash 是独立的外部 credential proof，必须保留；它不能替代内部 ExecutionToken，ExecutionToken 也不能替代 Runtime 防重放校验。

## Alternatives Rejected

### Shared signed `operator_context`

拒绝。多个业务服务共享签名能力会扩大伪造边界，并且不能自然表达单 audience、工作负载绑定和 STS issuance policy。

### Header allowlist 或自报 service name

拒绝。网络位置、私有 IP、`x-internal-service-name` 或普通 header 不能提供可验证的工作负载身份。

### 每 RPC introspection / issuance

拒绝。它把 Auth 放在每次业务调用热路径，增加延迟、级联故障与容量瓶颈。本地 JWT 验证与 JWKS cache 是默认路径。

### 一个 Token 覆盖多个 audience 或整条调用链

拒绝。它扩大 Token 权限与泄露半径，无法强制下一跳证明当前 workload 是否有权申请对应内部能力。

### Redis Token pool

拒绝。共享 Bearer Token 池扩大可读取面、破坏 `cnf` 与进程/workload 边界，并把缓存基础设施变成高价值 credential 仓库。

### Request-body fallback

拒绝。tenant、operator、scopeLevel 或 permission 的 body 副本不能建立身份或授权。合法业务目标字段仍可保留，但必须与可信上下文和资源归属再次核对。

### Auth-owned RPC registry 或 per-RPC Token

拒绝。它复制目标服务声明、扩大同步与 rollout skew，并把 Token exchange QPS 推向业务 RPC QPS。OES 以 target audience + independently granted minimal Permission Code set 为可缓存 Token 粒度；目标服务在实际方法本地执行唯一 RPC declaration 与资源规则。

### Caller-requested Code 作为 authorized set

拒绝。request 与 authorization upper bound 必须来自独立 source；把 `requestedPermissionCodes` 复制到 execution context、再对同一集合做 subset/equality check 是自我授权，任何实现形态都不满足 STS trust boundary。

## Consequences

正向结果：

- Auth 不在普通 RPC 热路径；验签成本由目标服务本地承担，STS 仅在 cache miss 或上下文变化时参与。
- HUMAN、MACHINE、DELEGATED 与纯技术调用使用同一执行模型。
- mTLS workload、MACHINE source credential 与 Machine Principal identity 分工明确：证书证明连接来源，source credential 证明受控 root credential，Identity binding 决定 `sub` 与 scope/tenant；任何一层都不能单独替代另外两层。
- audience、Permission Code 与 workload binding 将多跳权限收敛到最小集合。
- 所有 gRPC 服务最终不再因重复 body tenant/operator 形成 confused-deputy 边界。
- Permission Code 继续作为 RBAC 与 Token scope 的同一能力词汇，不引入平行授权目录。

成本与风险：

- `addGrpcMetadata=true` 是全仓生成签名变更，必须修复已盘点的 caller、controller 与 fixture 编译影响。
- mTLS identity、JWKS、STS issuance policy、deny event 与本地 cache 都需要部署和运行治理。
- 短 TTL 意味着普通撤销存在有限收敛窗口；高危动作仍需独立 step-up / ActionGrant。
- 逐服务迁移期间尚未切换的目标仍存在旧边界；每个目标切换前必须准备全部 caller，切换后的 server method 只接受新信任模型。

## Related Documents

- [可信 gRPC Metadata 架构](../architecture/platforms/grpc-metadata-and-service-trust.md)
- [Permission Code 语义源](../architecture/platforms/permission-code-source.md)
- [ExecutionToken Contract](../contracts/auth-service/execution-token.md)
- [Machine Workload Source Credential Contract](../contracts/auth-service/machine-workload-source-credential.md)
- [Machine Principal Resolution Contract](../contracts/identity-service/machine-principal-resolution.md)
- [External API Key Credential Contract](../contracts/auth-service/external-api-key-security.md)
- [External API Key Exchange Contract](../contracts/api-gateway/external-api-key-exchange.md)
- [Principal Authorization Contract](../contracts/permission-service/principal-authorization.md)
- [Trusted gRPC Feature Packet](../plans/features/trusted-grpc-execution-context.md)
### 8. Foundation identity/authorization atomic cutover

Fresh static inventory at `ad131ac7e06fa01d21493b05502bd1a567318c68` proves one irreducible cycle among Auth, Identity, Permission, HR and TenantOrg: each target still receives legacy authority from another member whose own inbound edge is not yet trusted. The only allowed migration exception is therefore one single-writer, one-candidate atomic activation for these five targets. Review and focused tests remain service-by-service, but no member may enter Token-only mode, activate a prepared cross-foundation caller or delete legacy authority before all five caller preparations and server compositions are ready.

Auth pre-context credential/challenge/session-source methods are not ExecutionToken-protected resource RPCs. They accept only the exact Gateway mTLS workload and their existing Auth-owned credential, challenge, grant, refresh/session proof, rate-limit and audit policy. Cross-foundation calls after a HUMAN entry use HUMAN_OBO; Auth/Public Entry pre-auth or anonymous lookups use only exact allowlisted SYSTEM MACHINE workloads and method Codes. A request tenant/resource selector is never execution authority. There is no generic service-name, body, ordinary metadata, request-id/trace-id or token-to-legacy fallback.
