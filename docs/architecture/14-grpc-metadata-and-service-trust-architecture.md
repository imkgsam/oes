# OES 可信 gRPC Metadata、ExecutionToken 与服务信任架构

```text
status: FROZEN_TRUSTED_GRPC_METADATA
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
implementationPacket: docs/plans/features/trusted-grpc-execution-context.md
requiredDeferredDesigns:
  - emergency-execution-revocation-event-contract
  - principal-role-binding-persistence-contract
resolvedDeferredDesigns:
  - token-cryptography-and-workload-identity-contract
  - external-api-key-security-contract
  - delegated-execution-and-action-grant-contract
```

> `auth-service`、`identity-service`、`permission-service` 的长期职责分别以对应服务真相源为准。本文只冻结跨服务 gRPC 传输身份、执行身份、授权上下文与多跳传播规则。

## 1. 目的

本文回答四个项目级问题：

- 当前直接调用工作负载是谁，如何证明。
- 本次调用代表哪个人或机器主体，属于哪个 tenant / org。
- 本次调用可以对目标服务执行哪些 Permission Code。
- 多跳调用如何保持最小授权、审计与 trace continuity，而不信任 request body 中重复的身份字段。

本文覆盖：

- API Gateway / BFF 到内部服务的首跳。
- 内部服务到下游服务的多跳。
- Cron、Robot、AI、内部平台任务与外部 Integration Machine。
- 有人类 operator、受委托 operator 与没有人类 operator 的技术调用。

## 2. 根因与当前调用形态

仓库只读审计基线：

- 21 个 gRPC 服务。
- 51 个 gRPC Controller 文件。
- 560 个实际 RPC 方法。
- 约 360 个 RPC 没有任意服务端入口 Guard。
- 只有 44 个 RPC 使用公共 `@RequirePermissions`；Permission Service 另有 61 个自定义管理权限门。
- 256 个 active Permission Code 中，208 个用于 Gateway decorator，只有 61 个用于 gRPC 服务端 decorator。
- 生成器配置 `addGrpcMetadata=false`；现有客户端依赖 `...rest: any` 传 metadata。
- 556 个生成客户端调用中有 19 个仍只传 request，开启显式 metadata signature 后必须修复。

根因不是缺少 tenant 字段或缺少 Permission Code，而是信任根分散且边界不一致：

- `x-internal-service-name` 由调用方自报，不能证明工作负载身份。
- 多个服务共享 operator-context 签名能力，无法保证只有中央认证服务能签发执行身份。
- `AuthenticatedOperatorGuard`、`PermissionGuard` 依赖额外 reflector metadata；接口漏标时可能表面挂 Guard、实际不消费 operator context。
- Asset、Site、Finance、CRM、Public Entry、Terminal 等路径仍从 request body 读取 tenant、scope、operator 或 trace。
- Gateway 的 legacy 单项 `checkPermission` 没有把 tenant 纳入实际授权查询。
- Permission PDP 允许调用方提交 subject facts；这些事实不能取代已验证执行主体。

因此，当前 signed `operator_context`、自报 service name 与 body identity 只属于待删除的历史实现，不再是目标架构。

## 3. 冻结结论

OES 目标信任模型由三部分组成：

1. mTLS 工作负载身份：证明当前直接调用方和目标服务。
2. Auth / STS 签发的短期 ExecutionToken：证明本次执行主体、tenant、audience 与获准 Permission Code。
3. 方法级 RPC authorization declaration：由目标服务声明该方法是 BUSINESS、SELF_SERVICE 或 INTERNAL，并在本地执行统一授权。

禁止：

- 让 request body 建立或提升 tenant、operator、scope 或服务身份。
- 把 `x-internal-service-name`、网络位置、私有 IP 或 allowlist header 当作可信根。
- 每跳由业务服务自行签发或重签 operator token。
- 每个 RPC 在线调用 Auth 做 token introspection 或重新签发。
- 建立第二套 Scope 目录或 Permission Code 到 Scope 的转换表。
- 为任何服务增加 feature-specific body fallback。

Terminal Device 的 PDA 设备证明不改变这三层模型：Gateway SYSTEM MACHINE ET 证明内部 caller/workload，Terminal Device Service 自有的随机 `deviceCredential` 只证明外部请求持有某台已 enrollment PDA 的设备 secret。它不是 ExecutionToken source credential、Machine Principal、Permission grant 或普通 metadata；只能进入该 owner 的设备判定/heartbeat/diagnostic request 字段并由 owner 验证。Admin 13 RPC 使用 HUMAN WEB BUSINESS ET，PDA 四 RPC 使用准确 Gateway MACHINE INTERNAL ET；两组统一使用 `aud=urn:oes:service:terminal-device-service`，拒绝 DELEGATED 和 body authority。

## 4. 两类身份

### 4.1 Workload Identity

Workload Identity 表示当前网络直连工作负载，例如：

- `api-gateway`
- `site-service`
- `asset-service`
- `cron-worker`
- `ai-orchestrator`

长期由部署层 mTLS / SPIFFE-compatible identity 提供。代码层只消费平台已经验证的 `VerifiedWorkloadIdentity`，不管理证书签发、轮换或根证书。

### 4.2 Execution Principal

Execution Principal 表示本次业务执行代表谁：

- `HUMAN`：用户直接操作。
- `MACHINE`：Cron、Integration、Robot 或平台自动化以自己的授权运行。
- `DELEGATED`：AI / Robot 在受控委托中代表一个 HUMAN 执行。

Workload 与 Execution Principal 不合并。Gateway 是工作负载，不自动成为业务 actor；AI worker 也不能因为自己是可信工作负载就继承用户权限。

## 5. ExecutionToken

### 5.1 最小 claims

ExecutionToken 使用短期、签名 JWT，至少包含：

```text
iss
aud
sub
principal_type = HUMAN | MACHINE | DELEGATED
client_id
tenant_id? / org_id?
scope
jti / iat / nbf / exp
cnf
act? / delegation_id? / session_id?
session_terminal?
authz_version?
```

语义：

- `aud` 只允许一个目标服务 audience；不得签发项目级通用 audience。
- `sub` 是获授权主体。
- `client_id` 是申请本 Token 的直接调用工作负载。
- `scope` 是空格分隔的 Permission Code 子集，不是另一套权限命名。
- `act` 仅在 DELEGATED 时记录受控代理主体。
- `session_terminal` 仅来自 Auth active session truth，并与同一 Token 的 `session_id` 绑定；HUMAN session Token 必须携带，MACHINE Token 不携带。它允许目标方法声明精确的 `WEB`、`BROWSER_EXTENSION`、`PDA` 等 session-entry constraint，不是 Permission Code 或 caller body field。
- `cnf` 绑定当前调用工作负载的 mTLS certificate / proof-of-possession identity。
- TENANT 数据面 Token 必须有唯一 `tenant_id`；不存在 `tenant=*`。
- SYSTEM Token 只表示平台控制面，不自动允许访问任意 tenant 数据。

默认 TTL 目标为约 5 分钟；具体上下限由 Auth contract 冻结。Token 不签发 refresh token。

### 5.2 签发与验证

- 只有 `auth-service` / STS 持有 ExecutionToken 签发权。
- Auth 实例无状态横向扩展，通过 `kid` 与 JWKS 支持密钥轮换。
- 目标服务本地验证签名、issuer、时间、audience、scope、cnf 与紧急 deny cache。
- 若方法声明 exact session terminal，目标服务同时本地验证签名 `session_terminal`；Gateway 的路由检查不能替代该资源服务约束。
- 普通 RPC 不在线访问 Auth；Auth 不在每次调用的热路径。
- 普通撤销允许受短 TTL 限制的收敛窗口；紧急撤销通过安全事件更新本地 deny cache / minimum security version。

### 5.3 Token cache

调用端只使用严格进程内 cache。cache key 至少包含：

```text
subject + principal type + actor/delegation
+ tenant + org
+ target audience + exact permission-code set
+ cnf/workload binding
+ session/security version
```

禁止建立 Redis 或其他多服务共享 Bearer Token 池。Redis 可保存授权事实、撤销版本或限流状态，但不能成为可被多个服务取用的 Token 仓库。

Token 合法复用不等同于攻击重放。防护分层为：

- mTLS + `cnf` 阻止 Token 被另一工作负载直接使用。
- 短 TTL、最小 audience 与最小 Permission Code 缩小泄露影响。
- command idempotency 阻止同一业务命令重复产生副作用。
- 高危操作使用 [DG-4 冻结的 ActionGrant](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/delegated-execution-and-action-grant.md)：它绑定 operation、target、canonical input digest 与 idempotency reference，并由目标服务随业务写入一次性消费。

### 5.4 DG-1 密码学与工作负载互操作基线

本节冻结 ExecutionToken、mTLS 工作负载身份与资源服务验证之间的跨服务互操作规则；Auth 的长期职责以 `docs/architecture/services/auth-service.md` 为准，黑盒字段与错误以 `docs/contracts/auth-service/execution-token.md` 为准。

- ExecutionToken 是 `typ=at+jwt` 的 JWS，唯一允许的签名算法为 `ES256`；验证器固定 allowlist，拒绝 `alg=none`、HMAC、未登记算法及不受支持的 JOSE header。每个 `kid` 唯一且不得复用。
- 每个环境有一个精确 HTTPS issuer；`aud` 使用稳定、非部署地址的单一服务标识 `urn:oes:service:<service-name>`。资源服务只接受自身精确 audience，绝不接受 wildcard、数组式多 audience 或由调用方指定的 audience。
- Auth / STS 维护受控 registry，登记环境 issuer、服务 audience、允许的 SPIFFE ID 与 workload-to-audience issuance policy；部署层拥有 trust bundle、证书签发与轮换。调用方、Token 或请求 body 都不能动态扩展 registry。
- 每个直接调用 workload 用独立的 X.509-SVID 风格 mTLS 叶证书证明其 SPIFFE ID。生产优先 TLS 1.3，TLS 1.2 仅是兼容下限；生产、预发和本地使用彼此独立的 trust domain。
- `client_id` 必须等于经 TLS 验证的 SPIFFE ID；`cnf` 唯一采用标准 `x5t#S256`，即当前 mTLS 客户端叶证书 DER 的 SHA-256 base64url 指纹。资源服务必须同时验证 trust bundle / SPIFFE ID、`client_id` 和 `cnf`，三者任一不符即拒绝。
- mTLS 若在代理终止，该代理是受信任 transport boundary，且只能经已认证的本地通道提供不可伪造的 `VerifiedWorkloadIdentity`；普通 gRPC / HTTP header 不能承载该证明。
- JWT signing private key 只在 KMS、HSM 或等价受控密钥系统中使用；新 JWKS key 必须先发布且完成最长 JWKS cache 窗口传播，再开始签发。旧 public key 保留至其最后签发 Token 过期并越过 clock-skew 窗口。
- production mTLS 叶证书最长有效期为 24 小时，并在寿命的三分之二前自动续期；签名 key 至少每 90 天轮换且在疑似泄露后立即轮换。证书变更使旧 `cnf` Token 失效，调用方重新 exchange；进程内 Token cache key 必须包含证书指纹。
- 本地环境同样运行真实 mTLS：使用独立 local trust domain、local CA、每 workload 独立证书和独立 JWT signing key。单元测试可 mock `VerifiedWorkloadIdentity`，但安全集成测试必须覆盖真实 TLS、跨证书重放、错误 SPIFFE ID 与证书/签名 key 轮换。

### 5.5 DG-1 Auth runtime host and protected signer binding

ExecutionToken 的冻结 proto `ExecutionTokenService` 是 Auth / STS 的内部 RPC surface，不是待实现 HTTP controller 的可选替代。Auth 必须在既有 `auth_service` gRPC host、既有 `GRPC_LISTEN_HOST:GRPC_LISTEN_PORT` 上同时加载 Auth proto 与 ExecutionToken proto，并挂载 `ExchangeExecutionToken` 和 `GetExecutionTokenJwks` 的 generated controller mapping。Exchange 只从 Common transport runtime 已验证的 workload identity 与 execution context 取得身份事实；proto request 只能携带 target audience 与精确 Permission Code 集。

`GetExecutionTokenJwks` 是内部 gRPC verifier 的 JWKS 路径。与此同时，Auth 必须在精确 HTTPS issuer host 上真实发布 RFC 8414 authorization-server metadata 与该 metadata 所声明的 absolute `jwks_uri`；未被 HTTPS host 实际挂载的 controller 不构成发布。HTTP metadata 只发布 public verification facts，不能替代内部 gRPC service，也不能接受 Token 提供的 issuer、JWKS URL 或 trust-domain override。

Auth 模块只允许一条 fail-closed signing DI chain：deployment-provided `KmsHsmExecutionTokenClient` → `KmsHsmExecutionTokenSigningAdapter` → `ExecutionTokenSigningPort` → exchange/JWKS application services。启动前必须解析并验证精确 issuer、metadata/JWKS public endpoint、opaque signing-key reference 与 immutable workload/audience registry；private key、PEM、private JWK 或本地 signing secret 不得进入 config、DI value 或应用进程。缺少受保护 client、key reference 或有效 key publication timeline 时，Auth 不得开始接受 ExecutionToken exchange 或 JWKS 请求，也不得回退为 memory/file signer。

Local security integration 复用相同 port 与 lifecycle，但连接 KMS/HSM-compatible protected test signing boundary 和 opaque test key reference。测试 fake 仅可在 isolated unit-test module 中使用；它不能成为 local、staging 或 production provider。KMS/HSM 不可用时 Exchange 必须 fail closed，资源服务继续只在已有可信 JWKS 与未过期 Token 范围内本地验证。

### 5.6 DG-1 protected-signing provider lifecycle

`KmsHsmExecutionTokenClient` 是 Auth infrastructure 的 deployment-bound provider boundary，不是应用层可选 mock。它只接受经启动配置解析的 opaque signing-key reference，以及在部署确有需要时由平台在 provider 内解析的 opaque credential reference；两种 reference 都不包含 private key bytes。默认认证使用 Auth workload identity。private key、PEM、private JWK、seed、可导出的 software key 或其序列化形式不得进入 process environment、Nest config、registry、日志、DI value 或应用内存。

启动顺序固定为：解析精确 issuer、absolute JWKS URI、key reference、immutable workload/audience registry 与可选 credential reference → 构造 protected provider → 读取 active/public overlap keys → 验证唯一 `kid`、ES256/P-256 public JWK、publication/signing/retirement timeline → 使用 provider 签名启动 challenge 并以 active public JWK 本地验证 → 才挂载 gRPC exchange/JWKS 与 issuer HTTPS metadata route。任何一步失败都使 Auth readiness 失败；不能以空 provider、throwing placeholder、临时 memory signer 或明文 key 启动。

issuer HTTPS route 必须在精确 issuer authority 上提供 TLS。若 TLS 在 approved deployment proxy 终止，proxy 只能把 RFC 8414 metadata 与 configured JWKS route 转发到 Auth metadata producer 的受认证本地 channel；普通 HTTP listen port、任意 Host header、或 proxy 静态伪造 JWKS 都不满足此要求。KMS/HSM outage after a successful bootstrap 使新的 exchange 失败；已有 resource-server JWKS cache 按既有 TTL / retirement window 独立工作。

### 5.7 DG-1 executable protected-signing asset allocation

DG-1 的 concrete provider asset 是同一 capability 内、每个 Auth workload 一实例的 `execution-token-signer-agent` sidecar，而非新的 OES 业务服务或新的 capability。它没有外部 ingress、业务数据库、tenant state 或 gRPC 公共契约；只在 Auth pod / deployment 内通过 Unix domain socket 为 Auth 提供受保护签名。Auth repository 的 client / adapter path class 是 `src/services/system/auth-service/src/infrastructure/execution-token-signer/**`；deployment/SRE path class 是 `docker/grpc-trust/execution-token-signer/**`，其中 `cmd/agent/**` 和其 local `go.mod` 构成可运行的 Go static sidecar binary，负责 sidecar image、socket mount、security context、PKCS#11 module mount 与 local integration harness。二者均由既有 EXEC-CRYPTO capability 编排，不能转嫁给业务服务。

agent 的 production signing backend 固定为 PKCS#11-compatible HSM or KMS gateway，且配置为 non-exportable P-256 signing key；local integration 使用同一 agent protocol 对接 local PKCS#11-compatible test HSM。它在自身受保护边界内解析 opaque key / optional credential reference，并以 workload identity 认证 backend。ExecutionToken client 只可向 agent 请求：读取 active key、读取 published overlap keys、对指定已发布 `kid` 的 JWS signing input 执行 ES256 signing；agent 只返回 public JWK / rotation facts 和 fixed-width JOSE `r || s` signature，绝不返回 private material、backend credential 或可选 key reference。ADR 0017 复用同一 process/socket 的独立 API-key verifier namespace 与另一把 non-exportable HMAC key；该扩展不改变本节的 ExecutionToken operation/key boundary。

Auth 与 agent 的 endpoint 是 deployment-configured `AUTH_EXECUTION_SIGNER_SOCKET_PATH` Unix socket，必须有 pod-local mount、least-privilege filesystem ownership/permissions 与 peer authentication；不允许 TCP listener、service DNS、任意 endpoint URL 或 request-supplied socket path。socket protocol 固定为 newline-delimited JSON-RPC 2.0；ExecutionToken namespace 只有 `GetActiveKey`、`ListPublishedKeys` 和 `SignEs256` 三个 method，`SignEs256` 只接收 published `kid` 与 base64url JWS signing input，返回 base64url fixed-width JOSE `r || s` signature。ADR 0017 定义的 API-key namespace 不能接收任意消息、算法或 backend selector。Auth readiness 同时要求 socket agent preflight、public-key timeline 与 sign/verify challenge 成功。agent 缺失、socket identity / permission 不符、PKCS#11 backend 不可用或 key reference 不匹配时保持 fail closed。

### 5.8 DG-1 PKCS#11 provider binding and local protected integration

signing-key reference 的唯一编码是 RFC 7512 PKCS#11 URI。每个 deployment-configured reference 必须固定 token serial、private-key `CKA_ID`（`id`）和 `type=private` object class；可携带 canonical token / object selector 以消除歧义，但不能由 Auth request、`kid` 或 runtime discovery 改写。agent 以相同 token serial 与 `CKA_ID` 定位对应 P-256 public-key object；private key 必须是 non-extractable。Auth 只把这一已配置的 opaque reference 交给其 client binding，永不获得 private material、slot/session handle 或任何第二个 key selector。

Deployment/SRE 在 `docker/grpc-trust/execution-token-signer/config/**` 拥有只读 rotation manifest，并通过 `EXECUTION_SIGNER_ROTATION_MANIFEST_PATH` 交给 agent。每条记录以 canonical PKCS#11 URI 和 expected `kid` 绑定一个 key，并以 RFC 3339 UTC timestamps 表达 `publishNotBefore`、`signingNotBefore`、`signingNotAfter` 与 `retireAfter`。agent 必须从 HSM public-key object 导出 ES256 P-256 JWK，按 RFC 7638 SHA-256 JWK thumbprint 计算 `kid` 并与 manifest 交叉验证；这使 `kid` 永不复用，retired key 也不得重新出现。任一时刻恰有一个 key 满足 `signingNotBefore <= now < signingNotAfter`；所有满足 `publishNotBefore <= now < retireAfter` 的 key 构成 JWKS active/overlap set。`retireAfter` 必须不早于 `signingNotAfter + 300s maximum Token TTL + 60s clock skew`。manifest 与 HSM key/JWK/kid/timeline 不一致、零或多个 active key 都是 readiness failure；agent 的 ExecutionToken namespace 只通过既有三种 RPC 返回已验证的 public JWK、rotation facts 和 signature。

backend authentication 默认由 Auth/signer-agent workload identity 完成。只有 backend 明确需要额外认证时，deployment 才提供仅 agent 可读的 opaque credential reference；agent 通过 deployment secret broker 在自身边界解析它，而不是将 PIN、client secret 或 private key 放入 Auth、环境变量或普通 config。agent 只对 selected token/slot 以 `CKU_USER` 建立 time-bounded session lease，必须在到期前刷新；刷新或 login 失败时必须清零凭据缓冲、logout、close session 并拒绝签名。日志、Auth application/domain、DI value 与 RPC response 均不得获得 PIN、resolved credential、raw PKCS#11 session handle 或可选 key reference。

local integration harness 固定为 `docker/grpc-trust/execution-token-signer/local/softhsm2/**` 的 SoftHSM2 PKCS#11-compatible asset，而不是 software signer fallback。它在 token 内生成 sensitive、non-extractable P-256 test key；token database 和 PIN 只以 permission-restricted secret file 挂载给 signer-agent，Auth 不读取 PIN，且不以 private-key environment variable 传递。集成测试必须运行实际 UDS agent 和 SoftHSM2，覆盖 sign/verify、active/overlap rotation、private-key export refusal、manifest/key mismatch、credential-session lease failure 以及 agent/HSM unavailable 时的 fail-closed 行为。

### 5.9 DG-1 STS authority upper bound and reusable Token granularity

ExecutionToken 的运行粒度固定为“execution principal + tenant / org + target audience + canonical Permission Code set + delegation/security version + current workload certificate binding”，而不是一个 RPC 一个 Token。调用端可在严格进程内 cache 中复用同一 tuple 的 Token；RPC、audience、Code 集、principal、tenant、delegation、`authz_version` 或 `cnf` 任一变化才形成新的 cache entry。Auth / Permission 只参与 exchange/cache miss，普通目标 RPC 继续本地验签和授权，因此不建立 Auth-owned RPC registry、per-RPC Token 或共享 Bearer Token pool。

`requestedPermissionCodes` 只是调用方申请的最小能力集，绝不构成 authorized set。Auth 必须先从可由自身验证的 source credential 建立 execution principal，再把可信 principal/type、tenant/org、requested Codes、delegation/security reference 交给 Permission Service 的 `ResolvePrincipalAuthorization`；INTERNAL 则使用 verified SPIFFE workload、target audience 与 requested INTERNAL Codes 调用 `ResolveWorkloadIssuance`。Permission decision 的 granted/denied Codes、decision reference 与 `authzVersion` 是独立授权上限。任何 requested Code 未获准、未知、kind 混用、tenant/scope/workload/audience 不匹配或 Permission 不可用都使整个 exchange fail closed；Auth 不做部分签发，也不把 request、legacy operator roles 或本地复制的 role/permission 数据提升为授权事实。

source credential 由 Common infrastructure 在受 mTLS 保护的 internal exchange metadata 中作为 opaque credential 携带，metadata 只是载体：首跳 HUMAN 使用 Auth 可复核的 active session/access credential；多跳使用当前已签名 ExecutionToken 作为 subject credential，Auth 校验其 issuer、签名、时间、安全状态，并要求其 `aud` 精确对应正在 exchange 的 verified workload service；API Key root 使用 Auth 已签发的 Gateway-only external access credential；无入站主体的 MACHINE root 使用 Auth-owned、最长 15 分钟且绑定当前 leaf certificate 的 `MachineWorkloadSourceCredential`；DELEGATED 使用对应 owner credential/reference。裸 subject、tenant、Permission Code、ordinary metadata 或 request body 不能替代 credential verification。Common 仅在 transport-private request scope 保留该 opaque source credential，不解析其 profile、principal 或 binding，也不把 bearer value 放入 `TrustedExecutionContext`、application/domain input、日志或审计。

Gateway HUMAN 首跳的 request-scope lifecycle 固定为：`GatewaySessionAuthGuard` 只在 Auth 已验证 access token 与 active session 后，把 bearer 封装为 Common 的不可序列化 handle，并以当前 HTTP request object 为 key 交给 Gateway-private `WeakMap` vault；raw bearer 不得进入 `request.user`、可枚举 request property、DTO、application state、adapter、日志或 ordinary metadata。由于 Nest Guard 不包围后续 handler，Guard 不得在 `canActivate` 内独自运行 Common accessor scope；Gateway 必须在 `main.ts` 以可审查顺序注册一个最外层 global interceptor，在 Guards 全部成功后消费 vault entry，并将 `next.handle()` 的实际 Observable subscription、controller 以及所有 awaited downstream calls 包在同一 transport-private scope 内。成功、异常、超时、取消、断连或后续 Guard 拒绝都必须幂等清理；并发请求必须隔离，public、invalid 与 sessionless route 不得建立 credential scope。HUMAN session 与 external API credential 保持独立 kind 和 verifier，cache hit 也必须先存在当前已验证 request credential；downstream adapter 不得重读 HTTP `Authorization`。Gateway 的 owner、DI 与精确 lease 以 [Gateway / BFF 架构设计](./11-gateway-and-bff-architecture.md) 和 feature packet §5.2 为准。

MACHINE root 的起始链固定为“先登记，后发证”：受权管理者先在 Identity 以正常 ExecutionToken-protected BUSINESS RPC 建立 Machine Principal ↔ exact SPIFFE binding；workload 再用当前 mTLS 向 Auth 提交 principal/binding/version selector。Auth 只在 Identity 证明 active binding 精确对应当前 SPIFFE 后签发 dedicated source JWS，因而该 Auth method 不是一个“仅 mTLS 即授权”的第二信任根。它不改变 Permission `ResolveWorkloadIssuance` 作为 Permission 发证控制面唯一 mTLS-only bootstrap primitive 的规则。

目标服务仍是 RPC authorization declaration 与资源事实的唯一执行 owner。BUSINESS Token 使用 Permission 批准的非空 Code 集；SELF_SERVICE 使用空 Code 集、默认仅 HUMAN，目标必须从可信 `sub` 派生且目标方法决定 `allowDelegated`；INTERNAL 使用 Permission catalog 验证的非空 INTERNAL Code 与 workload-to-audience issuance decision。目标 server runtime 对当前方法执行 mode、principal type、`all/any` Code、tenant/resource 与 domain rule 检查；模式或 Code 不匹配在目标方法 fail closed。Auth 不需要接收 target RPC id 或复制各服务声明。

Auth issuance audit 至少记录 verified source-credential kind/reference、principal/type、tenant/org、verified workload、target audience、canonical requested/granted Codes、Permission decision reference、`authzVersion`、session/delegation reference、certificate thumbprint、`kid`、`jti`、结果、reason category 与 trace correlation；不得记录 bearer、session secret、API Key、private key 或可恢复 credential。验收必须证明 caller-requested Codes 与 independent Permission decision 来自不同 source，并覆盖 forged requested Code、empty/non-empty mode misuse、stale/denied `authzVersion`、workload/audience mismatch、Permission outage、cache reuse 与 target-service mode/resource denial。

Permission issuance control plane 采用一个明确的非循环 trust root：`ResolveWorkloadIssuance` 是唯一不预先要求 ExecutionToken 的 bootstrap authorization primitive。它仍运行在 mTLS-protected Permission gRPC host，只消费 transport 注入且不可由 request/header 覆盖的 `VerifiedWorkloadIdentity`，并只允许环境注册的准确 `auth-service` SPIFFE identity 调用这一准确 method。该 method-specific bootstrap policy 不授予任何其他 Permission RPC、BUSINESS 能力或通用 INTERNAL 权限，也不允许 wildcard caller；Permission 仍独立评估 Auth 提交的 original verified workload -> target audience -> requested INTERNAL Code policy，并以全量申请语义返回 decision。`ResolvePrincipalAuthorization` 不是 bootstrap primitive，必须使用准确 Auth mTLS identity 加 `aud=permission-service`、certificate-bound、仅含 `permission.internal.principal_authorization.resolve` 的 ExecutionToken。除明确公共 metadata/JWKS、运维 readiness 与该唯一 bootstrap primitive 外，所有受保护内部 RPC 继续同时要求 mTLS workload identity 和目标专属 ExecutionToken。

冻结的实现 ownership 与路径影响如下：

- EXEC-CRYPTO / Auth owns `src/common/src/contracts/auth_service/execution_token.proto` 的既有 exchange message 语义、`src/services/system/auth-service/src/{application,domain,infrastructure,interfaces,modules}/**` 的 source-credential verifier、Permission adapters、issuance orchestration、audit 与 tests。Proto 不新增 `targetRpcId` / mode 字段，也不改变 claims；仅把 `requested_permission_codes` 从“始终非空”校正为 BUSINESS/INTERNAL 非空、SELF_SERVICE 可为空。
- GRPC / Common owns `src/common/src/authorization/trusted-execution/**` 与 `src/common/src/transport/grpc/**` 的 transport-private source-credential accessor、exchange-client metadata wiring 和 cache propagation；Gateway owns `src/services/api-gateway/src/common/grpc/**` 及 target adapters 的 verified session/external credential supply。Exchange 固定以 `authorization: Bearer <source-credential>` 携带 opaque source credential；它不进入 request DTO 或 `TrustedExecutionContext`，也不恢复 operator-context signer/codec/guard。
- Permission owner extends existing `src/common/src/contracts/permission_service/permission_check.proto` / generated output and `src/services/system/permission-service/**` with the frozen `ResolvePrincipalAuthorization` and `ResolveWorkloadIssuance` black-box decisions. Both are Auth-only issuance-control capabilities: `ResolveWorkloadIssuance` uses the exact mTLS-only Auth bootstrap policy above, while `ResolvePrincipalAuthorization` uses the exact Permission-owned INTERNAL Code and normal ExecutionToken path. Permission remains role/policy truth owner and Auth never reads its database or signs from requested Codes. The Permission surface must be ready before Auth enables the new exchange path; bootstrap SPIFFE registry / method policy are fixed deployment inputs, never caller-provided identity or business Code.
- MACHINE root completion is `FROZEN_PENDING_IMPLEMENTATION` and keeps those owners with only narrow future leases: Auth will own the dedicated source-JWS issuance/verifier/revocation runtime and its contract; Identity will add `MachineWorkloadBinding` enrollment/persistence plus `IdentityQueryService.ResolveMachinePrincipalForAuth` to existing `identity_query.proto`; Permission/Common will register exact INTERNAL Code `identity.internal.machine_principal.resolve` in the existing canonical Permission Code source/generated Identity namespace. The complete writer allowlist, new-file targets, generated-output classification, protected paths and verification commands are frozen only by the “MACHINE root exact implementation lease” manifest in `docs/plans/features/trusted-grpc-execution-context.md`; descriptive directory ranges elsewhere do not grant writes. None of that proto/Common/Identity/Auth runtime is currently reported as implemented. Common transport remains opaque carrier only. No new deployable OES service, public endpoint, second Permission bootstrap, external API-key reuse, Identity credential verifier or Permission SPIFFE-to-principal mapping is allowed.
- MACHINE wire/schema completion freezes `MachineWorkloadSourceCredentialService.IssueMachineWorkloadSourceCredential` / `RevokeMachineWorkloadSourceCredential`, Identity management enroll/disable and `ResolveMachinePrincipalForAuth` exact field numbers through their owner contracts. Issue/reissue uses current workload mTLS plus an already active Identity binding; revoke and binding management use normal BUSINESS ExecutionTokens with `auth.machine_workload_source_credential.revoke` and `identity.machine.workload_binding.manage`. Auth/Identity persist lifecycle changes with their existing local `AuditEvent` sinks in the same database transaction. This adds no public route, refresh token, cross-service FK, raw bearer persistence or second Permission bootstrap.
- Each target-service owner retains its existing service truth/contract and method decorators as the sole RPC mode/Code source. No service publishes a second runtime RPC registry to Auth; caller/target contract tests prove adapter requested Codes match the target declaration, while the target's server runtime remains the enforcement point.

Rollout order is fail-closed: first deliver Permission decisions and their Auth-only trust policy, then Common/Gateway source-credential transport, then Auth verification/adapters/audit, then atomically enable exchange only after all prerequisites pass readiness. During rollout, the rejected self-authorizing path stays disabled; there is no dual-authority window or fallback to signed operator context. After cutover, remove legacy context reconstruction and run focused security tests before resuming target-service migrations.

## 6. 三种 RPC authorization mode

每个已建立 execution context 后的受保护业务或技术 gRPC RPC 必须在方法旁显式声明且只能声明一种。Permission 的唯一 mTLS-only 例外是上节冻结的 `ResolveWorkloadIssuance` 发证 bootstrap primitive：它使用专用的 exact-Auth `VerifiedWorkloadIdentity` policy，不伪装为 SELF_SERVICE、BUSINESS 或一个需要自身先签发 Token 的 INTERNAL RPC。Auth `IssueMachineWorkloadSourceCredential` 是一个不同的 binding-gated credential bootstrap：它不接受尚不存在的 ExecutionToken，但必须同时证明当前 mTLS workload 与预先登记的 active Identity binding，因此不属于 mTLS-only 通用放行。该 exact method 之外不允许复用其 bootstrap policy。

```ts
@AuthorizeBusinessRpc({ all: [PERMISSION_CODE] })
@AuthorizeSelfServiceRpc({ allowDelegated: false })
@AuthorizeInternalCall({ all: [INTERNAL_PERMISSION_CODE] })
```

### 6.1 BUSINESS

- 用于能独立读取或改变业务事实的能力。
- 允许 HUMAN、具备业务授权的 MACHINE、受控 DELEGATED。
- 支持 `{ all: [...] }` 与 `{ any: [...] }`。
- `all` 表示同时需要多个独立能力。
- `any` 只允许用于多个 Code 授权完全相同的动作；不得用 `any` 覆盖由 body 决定的不同状态跃迁。
- resource ownership、审批分离、状态机与金额阈值继续由 application/domain 检查。

### 6.2 SELF_SERVICE

- 目标必须从已验证 Execution Principal 派生。
- 默认只允许 HUMAN。
- 低风险能力可显式 `allowDelegated: true`。
- 密码、MFA、Session、API Key、恢复码等敏感能力禁止普通 AI 委托。
- request body 中的 target account / operator 不能覆盖当前主体。

### 6.3 INTERNAL

- 只用于上游已完成业务授权后的受限技术原语。
- 允许没有人类 operator 的纯技术调用。
- 需要 INTERNAL kind Permission Code，并验证直接 workload 与 STS issuance policy。
- 能独立完成审批、删除、重要状态跃迁、资金承诺或业务承诺的 RPC 不得标为 INTERNAL。

### 6.4 Anonymous HTTP ingress to token-only gRPC

匿名 HTTP route 不等于匿名 internal gRPC。当前唯一冻结的 Public Entry 入口是 Gateway 的三个方法：`ResolvePublicRedirect`、`RenderPublicBusinessCard`、`GenerateBusinessCardVCard`。外部访客没有 HUMAN credential；Gateway 使用既有 MACHINE source credential 换取 certificate-bound、`aud=urn:oes:service:public-entry-service` 的 SYSTEM MACHINE BUSINESS ET，并分别只申请现有 `public-entry.short-link.read` 或 `public-entry.business-card.read`。这不建立第四种 RPC mode，也不允许 no-ET gRPC。

目标方法必须同时约束准确 Gateway workload、MACHINE principal、audience/`cnf` 与 exact Code。SYSTEM 不携带虚构 tenant、不是 tenant wildcard；Public Entry owner 通过 shortCode/businessCardId 查找自己的 tenant/resource facts，再执行 active/expiry/readiness/public-safe projection。该 narrow pattern 不能扩散为通用 public bypass、其他 workload 权限或 Gateway 内业务规则复制。

限流、审计、设备绑定、资源事实、幂等、nonce 与防重放不统一塞进这三个 decorator；它们由对应的 transport interceptor、application/domain 或基础设施组件负责。

## 7. 公共 client/server runtime

### 7.1 Generated signature

`src/common/src/contracts/buf.gen.yaml` 的目标配置必须启用 `addGrpcMetadata=true`。在当前 `addNestjsRestParameter=true` 下，生成签名变为：

```ts
method(request: Request, metadata: Metadata, ...rest: any): Observable<Response>
```

Controller interface 同样显式包含 `metadata: Metadata`。生成器变更是全仓签名变更，必须先盘点并修复全部编译影响；新信任 enforcement 再按 feature packet 的逐服务顺序启用，最终覆盖全部服务。

### 7.2 单一 reusable abstraction

`src/common` 提供一个 `TrustedGrpcMetadataProvider`，公开三个语义明确的入口：

```text
forBusinessCall(targetAudience, requiredPermissionCodes)
forSelfServiceCall(targetAudience)
forInternalCall(targetAudience, requiredInternalPermissionCodes)
```

它负责：

- 从当前 `TrustedExecutionContext` 获取已验证 subject、tenant、actor、request 与 trace。
- 向 Auth / STS 请求或从进程 cache 复用目标 audience Token。
- 生成 `authorization`、`x-request-id`、`traceparent`、`tracestate` 与兼容日志关联字段。
- 不接受调用方传入原始 operator、任意 tenant 或已签名 Token 字符串。

Provider 的组装接缝也固定在 Common 内部：公开 `TrustedGrpcMetadataProviderOptions` 只接受既有的 `AsyncLocalTransportPrivateSourceCredentialAccessor`，不接受 `ExecutionTokenExchangeSourceCredentialCarrier` 具体类型。Provider 在自身内部根据同一 accessor 创建并持有私有 Carrier；Carrier 仍不从 `src/common/src/transport/grpc/index.ts` 或其他公共 barrel 导出，也不允许 Gateway 通过 deep import 构造它。`assertCurrent()` 在 cache hit 与 exchange miss 都保持，`createMetadata()` 只在 exchange miss 中输出 Auth STS 所需的私有 bearer metadata。Gateway DI 必须将同一 accessor 实例同时交给 Vault/Interceptor boundary 与 Provider；这是组装接缝澄清，不是新的 carrier 语义或公共传输途径。

MACHINE root path 实现完成后，无入站请求的 Cron / Robot 先用当前 mTLS `VerifiedWorkloadIdentity` 与 Auth-owned `MachineWorkloadSourceCredential` 建立 root execution context：Auth 验证 source JWS 的 profile/signature/lifetime/revocation、SPIFFE 与当前 leaf thumbprint binding，再用 Identity `ResolveMachinePrincipalForAuth` 验证 active principal 与 `MachineWorkloadBinding` version；随后才按 BUSINESS / INTERNAL 分别取得 Permission decision 并签发既有 ExecutionToken。它继续使用同一 provider，不建立另一套 metadata 工厂。

MACHINE source credential issuance 对 leaf lifetime 的可信输入也由该既有 provider 提供：`GrpcWorkloadIdentityProvider` 必须从 grpc-js adapter 已释放的同一份 transport-verified leaf DER 同时派生 SHA-256 thumbprint 与 `certificateNotAfter: Date`。后者仅作为 provider 返回值的结构扩展交给 Auth Issue path；通用 `VerifiedWorkloadIdentity` 保持不变，其他 ExecutionToken verifier consumer 可以继续只消费 SPIFFE ID 与 thumbprint。metadata、request、environment 与 caller configuration 不能注入或覆盖 `notAfter`；DER parse failure、无效日期或已到期 leaf 在 provider boundary fail closed。

### 7.3 Server runtime

公共 server runtime 负责：

- 读取方法 decorator metadata。
- 提取 Verified Workload Identity 与 ExecutionToken。
- 本地验签并执行 mode、aud、cnf、tenant 与 Permission Code 检查。
- 把不可变 `TrustedExecutionContext` 写入 request-scoped / AsyncLocalStorage context。
- 生成授权拒绝与审计关联数据。
- 启动扫描全部 generated RPC handler，缺少或重复 mode 时启动失败。

长期删除：

- `OperatorContextCryptoService`
- `x-operator-context` payload / codec / signer
- `DefaultInternalServiceAuthenticator`
- 把自报 service name 当信任根的 `InternalServiceGuard`
- legacy `AuthenticatedOperatorGuard` / server `PermissionGuard`
- Gateway / 服务私有的 metadata 手写工厂

Gateway HTTP `RequirePermissions` 保留为外部入口的第一层业务授权声明，但其 tenant-aware 判定与下游 Token 获取必须使用可信 session / execution context，不能继续使用 legacy tenant-blind `checkPermission`。

## 8. 多跳规则

示例：用户执行 Site Sync，Site 调 Asset resolver。

```text
HTTP access token
  -> Gateway 验证用户 session 与 site.management.sync
  -> STS 签发 aud=site-service, scope=site.management.sync
  -> Site 本地验证并执行 @AuthorizeBusinessRpc
  -> Site 用当前已验证 context 向 STS 换取
     aud=asset-service, scope=asset.internal.site_media.resolve
  -> Asset 执行 @AuthorizeInternalCall
```

规则：

- 不把 Site Token 原样传给 Asset，因为 audience 不匹配。
- 不由 Site 自己签名。
- 不建立 `site.management.sync -> asset.internal...` 的 Permission 转换表。
- STS 根据 Site workload 的 issuance policy 判断其能否申请该 INTERNAL Code；Site 已在业务入口验证用户权限。
- 新 Token 保持 subject、tenant、delegation 与 trace 归因，但 audience、scope、client/cnf 绑定到新一跳。
- 如果下游 RPC 本身能独立完成业务承诺，应使用 BUSINESS，并继续验证对应业务 Permission Code，而不是 INTERNAL。

Auth -> Notification 的认证通知是 INTERNAL 的明确实例：用户只向 Auth 请求登录、MFA、contact binding、password recovery 或邀请流程；Auth 完成认证域判断后，以自己的 SYSTEM Machine Principal、准确 Auth workload 与 `notification.internal.auth.dispatch` 调用 Notification。两个 Notification RPC 不接受 HUMAN/DELEGATED/TENANT MACHINE，不消费 body `SourceContext`，也不新增 credential profile。Auth 使用既有 MACHINE source credential、`ResolveWorkloadIssuance` 与进程内 target-ET cache；Notification 的 durable acceptance/provider outbox 不与 Collaboration Task NATS Inbox/DLQ consumer 合并。

## 9. Machine、Robot、AI 与 API Key

- 第一方内部服务通过 workload identity 向 STS 认证，不使用长期 API Key。
- mTLS 只证明“当前连接来自哪个 workload”；无入站主体的 Cron / Robot 还必须提供专用短期 `MachineWorkloadSourceCredential`，由 Identity owner resolution 把该 credential 唯一落到 active Machine Principal。workload certificate、source credential 与 Machine Principal 三者缺一不可，不能互相替代。
- 平台 Cron 使用 SYSTEM Machine Principal；进入租户数据面时逐 tenant 获取 Token。
- 租户 Robot 使用 TENANT Machine Principal 与自己的 role / policy。
- 无人值守 Robot 不继承创建者权限。
- 平台 Robot template 不是 principal；租户安装时创建独立 tenant machine principal。
- Gateway 代表外部 Site Runtime 调用 `site-service` 时，复用现有 `MachineWorkloadSourceCredential`，不新增 Site 专用 credential profile：Gateway workload + current certificate-bound、max-15-minute、no-refresh source credential 作为 STS root，换取 `aud=site-service` 与精确 `site.internal.runtime.*` Code 的 ExecutionToken。
- 上述内部 MACHINE 证明与 `SignedSiteContext` 是并行且都必须成立的两层证明。前者只证明 Gateway workload 和内部 RPC authority；后者只证明外部 Site Runtime 请求的 HMAC、nonce、time、method、path 与 body hash。HMAC 不进入 source-credential carrier，也不成为 principal / tenant authority；MACHINE Token 不替代 Site 对 HMAC 的独立验证。
- DELEGATED AI 的有效权限为用户权限、AI / tool 上限、delegation grant、tenant 与目标 RPC 要求的交集。
- 外部 App 只允许创建 tenant Integration Machine + API Key，经 Gateway/Auth 取得 Gateway-only external access token；Gateway 才在受信任的内部 mTLS hop 换取 target-audience ExecutionToken。Auth 的唯一 Gateway/credential gRPC surface 是 `external_api_key.proto` 的 `ExternalApiKeyCredentialService`：管理方法使用可信 HUMAN context，交换方法只允许 Gateway INTERNAL caller 在 request field 传递 raw key。API Key 与 external token 均不开放内部 gRPC。具体边界以 [External API Key Security Collaboration](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/external-api-key-security.md) 为准。Marketplace、第三方开发者平台、共享 App 主体与跨 tenant 安装模型已取消，不作为后续预留能力。

## 10. Tenant 与业务目标

Token 中 tenant 表示可信调用上下文。Request 仍可携带合法业务目标，例如：

- `siteId`
- `assetId`
- `targetTenantId`
- `targetAccountId`

这些字段不是身份来源。稳定规则：

- TENANT Token 只能操作相同 tenant 的业务资源。
- SYSTEM Token 操作目标 tenant 必须经过平台业务 Permission Code 与资源规则，不存在隐式全租户权限。
- body 中重复的 tenant、scopeLevel、operatorId 必须删除；尚未迁移服务中的同名字段不得被新 runtime 读取为可信上下文。

## 11. 全仓逐服务迁移范围

本 capability 的关闭范围扩大为当前仓库全部 gRPC 边界：

- 21 个服务。
- 51 个 gRPC Controller 文件。
- 560 个 proto RPC。
- 全部 Gateway、service-to-service、Cron / Robot 与测试调用方。
- 因 generated signature 变更暴露的 19 个 request-only client call，以及已经通过 `...rest` 传 metadata 的全部调用。

执行采用“逐目标服务迁移、逐目标服务验收”：

1. 为目标服务盘点全部 RPC、全部直接 caller、body identity、legacy guards 与 fixtures。
2. 由目标服务 owner 在自身 truth source / contract 冻结每个 RPC 的 BUSINESS / SELF_SERVICE / INTERNAL mapping；跨服务线程不能替 owner 猜测业务语义。
3. 先让该目标的所有 caller 能发送正确 target-audience ExecutionToken，再切换目标 server。
4. 目标服务切换时，同一次 service slice 更新 proto、caller、controller、application context、fixtures 与黑盒测试。
5. 切换后的 RPC 只信任新 runtime；Token 失败不能回退到旧 body、operator header 或自报 service name。
6. 完成服务级 acceptance 和 legacy-reference-zero 证明后，才迁移下一个服务。

默认一个 service 是一个迁移与验收单元。若静态调用图证明多个服务形成无法通过 caller preparation 安全拆开的强连通环，则只允许把该最小强连通组作为一次原子 server cutover；不能扩大为无差别全仓同时修改。

Asset + Site 仍是第一个业务解阻优先链，但不再是本 capability 的关闭边界。所有 21 个服务完成前不得宣称项目级迁移完成。

## 12. 黑盒安全与传播验收

最低验收：

1. 只有 `x-internal-service-name`、无 mTLS / Token 的调用失败。
2. 缺失、伪造、过期、未生效、错误 issuer / kid 的 Token 失败。
3. 错误 audience、缺少 required Permission Code 或 all/any 不满足时失败。
4. Token `cnf` 与当前 workload identity 不匹配时失败。
5. TENANT Token 不能通过 body tenant 操作另一 tenant；SYSTEM Token 不等于 tenant wildcard。
6. SELF_SERVICE 不能由 body 指定其他 account；敏感 self-service 拒绝 DELEGATED。
7. INTERNAL RPC 可接受合法纯 MACHINE 技术调用，但拒绝未经 STS issuance policy 授权的 workload。
8. 多跳后 audience 与 cnf 改为下一跳，subject / tenant / delegation / request / trace continuity 保持。
9. 目标服务正常验签期间不调用 Auth；Token cache miss 才发生 STS 请求。
10. 从另一工作负载重放 Token 因 cnf 失败；重复 command 因 idempotency 不产生第二次副作用。
11. 紧急撤销事件到达后，本地 deny cache 在 Token 自然过期前拒绝目标 principal / jti / version。
12. 每个 generated RPC 恰有一个 enforcement declaration：已建立 context 的 RPC 使用 BUSINESS / SELF_SERVICE / INTERNAL；`ResolveWorkloadIssuance` 与 `IssueMachineWorkloadSourceCredential` 分别使用各自 exact bootstrap policy。漏标、重复或 bootstrap policy 复用使启动/架构测试失败。
13. 每个已迁移服务的 body tenant、scopeLevel、operatorId 等身份副本被移除，fixture 不能继续依赖它们。
14. Site Runtime HMAC、nonce、method/path/body hash 继续独立验证，不能被 ExecutionToken 替代。
15. 外部 API Key 只能在 Gateway / Auth 使用；撤销、过期、禁用 machine 与 tenant mismatch 均失败。
16. `traceparent / tracestate` 按 W3C 规则传播，审计可用 request / trace / jti 关联完整调用链。
17. 每个服务切换前全部直接 caller 已准备 target-audience Token；切换后 legacy caller 必须失败而不是触发 server fallback。
18. 当前 560 RPC baseline 加上本轮冻结的 5 个 MACHINE RPC 在内，最终全部 generated RPC 恰有一个 mode 或一个明列 exact bootstrap declaration，legacy signer / guard / factory / body identity 引用归零。
19. `ResolveWorkloadIssuance` 在没有 ExecutionToken 时只接受 exact registered Auth SPIFFE identity；其他合法 workload certificate、header identity、wildcard 或对其他 Permission RPC 的同类调用全部失败。
20. Auth 只有在该 bootstrap decision 全量批准 exact original workload / audience / INTERNAL Code 后才签名；unknown、mixed-kind、partial、mismatch 或 Permission unavailable 不产生 Token。
21. `ResolvePrincipalAuthorization` 与其他受保护 Permission RPC 不能继承 bootstrap policy，仍同时要求 mTLS 与目标专属 ExecutionToken。
22. MACHINE root exchange 只有在 source credential profile/signature/lifetime/revocation、当前 SPIFFE、当前 leaf thumbprint、Identity principal/binding/version 与 scope/tenant 全部一致时才进入 Permission；任一 mismatch 在签名前失败，证书轮换后旧 source credential 不能继续使用。

## 13. 兼容与删除纪律

- OES 尚在开发阶段，全仓迁移属于一个 capability，但按目标服务形成可独立审查、验证和回滚的 service slice。
- generated signature 是全局变更，必须先完成全仓编译修复；generated output 不手工编辑。
- caller preparation 可以在目标 server 切换前发送新 metadata；legacy target 在自身切换前继续只使用既有 legacy contract。任何 server method 不得同时接受两套信任来源。
- 禁止实现“ExecutionToken 校验失败则读取 body/header”的降级逻辑，也禁止新增公共 legacy projector 扩散旧协议。
- 如果目标服务仍有无法发送新 Token 的 caller，该服务保持未迁移状态，不能以 server fallback 提前上线。
- 每个服务验收通过后删除该目标在所有 caller / controller / fixtures 中的 legacy body fields、guards 与 factory 使用；最终一个服务完成后从 `common` 删除旧 operator-context API。
- 强连通服务组需要原子切换时，组内仍逐服务完成代码审查与定向测试，只把 server enforcement activation 合并为一个最小发布单元。
- 任何公共 API、Permission metadata、ExecutionToken claim、event 或 proto 变更必须先回写本文、ADR 与对应 contract。

## 14. 必做但后置的独立设计

以下五项已确认为必做，但不在本轮继续展开；Global Command 必须建立独立 design task，并在对应实现 lane 前完成冻结：

MACHINE/workload source credential owner、Machine Principal resolution 与 workload/certificate binding 已冻结在 Auth/Identity 服务真相源及其黑盒 contracts 中，不再属于下列开放设计；实现仍必须按 capability 路由，并不得重开 external API-key、DELEGATED、AI 或 ActionGrant 语义。

1. Token cryptography 与 workload identity 互操作 contract：阻塞 production mTLS、JWT verifier 与 key management 定稿。
2. Execution emergency revocation event contract：阻塞紧急撤销和最终 production security acceptance。
3. External API Key security contract 已冻结：外部 Integration credential 的创建、交换、轮换与开放以 [External API Key Security Collaboration](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/external-api-key-security.md) 为准。Gateway locally verifies five-minute Auth-signed external access tokens; credential revocation stops new exchange and does not add a DG-2 external-token deny-cache dependency.
4. DELEGATED execution 与 ActionGrant contract：已由 [ADR 0016](/Users/acehood/Documents/GitHub/oes/docs/adr/0016-delegated-execution-and-action-grant.md) 冻结；它解除 AI delegation 与一次性高危授权的设计阻塞，但不替代 DG-1 的签名 / workload binding 或 DG-2 的紧急撤销设计。
5. PrincipalRoleBinding persistence contract：阻塞 Permission schema 与 AccountRole 数据迁移。

“后置”表示转交独立设计任务，不表示允许实现 owner 自行决定；对应 gate 未关闭时，相关能力必须保持未开放。

Marketplace 已取消，不进入后置任务清单。

## 15. 相关真相源

- [ADR 0015](/Users/acehood/Documents/GitHub/oes/docs/adr/0015-workload-identity-and-execution-token.md)
- [Permission Code Source](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
- [auth-service](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- [identity-service](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [permission-service](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [ExecutionToken Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/execution-token.md)
- [External API Key Credential Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/external-api-key-security.md)
- [External API Key Exchange Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/external-api-key-exchange.md)
- [Principal Authorization Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/principal-authorization.md)
- [Delegated Execution And ActionGrant Collaboration](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/delegated-execution-and-action-grant.md)
- [Trusted gRPC Feature Packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/trusted-grpc-execution-context.md)
