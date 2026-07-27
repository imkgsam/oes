# OES 可信 gRPC Metadata、ExecutionToken 与服务信任架构

```text
status: FROZEN_TRUSTED_GRPC_METADATA
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
implementationPacket: docs/plans/features/trusted-grpc-execution-context.md
requiredDeferredDesigns:
  - token-cryptography-and-workload-identity-contract
  - emergency-execution-revocation-event-contract
  - external-api-key-security-contract
  - delegated-execution-and-action-grant-contract
  - principal-role-binding-persistence-contract
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
authz_version?
```

语义：

- `aud` 只允许一个目标服务 audience；不得签发项目级通用 audience。
- `sub` 是获授权主体。
- `client_id` 是申请本 Token 的直接调用工作负载。
- `scope` 是空格分隔的 Permission Code 子集，不是另一套权限命名。
- `act` 仅在 DELEGATED 时记录受控代理主体。
- `cnf` 绑定当前调用工作负载的 mTLS certificate / proof-of-possession identity。
- TENANT 数据面 Token 必须有唯一 `tenant_id`；不存在 `tenant=*`。
- SYSTEM Token 只表示平台控制面，不自动允许访问任意 tenant 数据。

默认 TTL 目标为约 5 分钟；具体上下限由 Auth contract 冻结。Token 不签发 refresh token。

### 5.2 签发与验证

- 只有 `auth-service` / STS 持有 ExecutionToken 签发权。
- Auth 实例无状态横向扩展，通过 `kid` 与 JWKS 支持密钥轮换。
- 目标服务本地验证签名、issuer、时间、audience、scope、cnf 与紧急 deny cache。
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
- 高危操作使用另行冻结的短期 ActionGrant / step-up grant，绑定 operation、target 与输入摘要并一次性消费。

## 6. 三种 RPC authorization mode

每个 gRPC RPC 必须在方法旁显式声明且只能声明一种：

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

无入站请求的 Cron / Robot 先建立由 workload 与 Machine Principal 支撑的 root execution context，再使用同一 provider；不建立另一套 metadata 工厂。

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

## 9. Machine、Robot、AI 与 API Key

- 第一方内部服务通过 workload identity 向 STS 认证，不使用长期 API Key。
- 平台 Cron 使用 SYSTEM Machine Principal；进入租户数据面时逐 tenant 获取 Token。
- 租户 Robot 使用 TENANT Machine Principal 与自己的 role / policy。
- 无人值守 Robot 不继承创建者权限。
- 平台 Robot template 不是 principal；租户安装时创建独立 tenant machine principal。
- DELEGATED AI 的有效权限为用户权限、AI / tool 上限、delegation grant、tenant 与目标 RPC 要求的交集。
- 外部 App 只允许创建 tenant Integration Machine + API Key，经 Gateway / Auth 换 ExecutionToken；不开放内部 gRPC。Marketplace、第三方开发者平台、共享 App 主体与跨 tenant 安装模型已取消，不作为后续预留能力。

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
12. 每个 generated RPC 恰有一个 authorization mode，漏标使启动或架构测试失败。
13. 每个已迁移服务的 body tenant、scopeLevel、operatorId 等身份副本被移除，fixture 不能继续依赖它们。
14. Site Runtime HMAC、nonce、method/path/body hash 继续独立验证，不能被 ExecutionToken 替代。
15. 外部 API Key 只能在 Gateway / Auth 使用；撤销、过期、禁用 machine 与 tenant mismatch 均失败。
16. `traceparent / tracestate` 按 W3C 规则传播，审计可用 request / trace / jti 关联完整调用链。
17. 每个服务切换前全部直接 caller 已准备 target-audience Token；切换后 legacy caller 必须失败而不是触发 server fallback。
18. 最终 21 个服务、51 个 Controller、560 个 RPC 全部恰有一个 mode，legacy signer / guard / factory / body identity 引用归零。

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

1. Token cryptography 与 workload identity 互操作 contract：阻塞 production mTLS、JWT verifier 与 key management 定稿。
2. Execution emergency revocation event contract：阻塞紧急撤销和最终 production security acceptance。
3. External API Key security contract：阻塞外部 Integration credential 的创建、交换、轮换与开放。
4. DELEGATED execution 与 ActionGrant contract：阻塞 AI delegation 和需要一次性高危授权的 RPC 开放。
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
- [Principal Authorization Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/principal-authorization.md)
- [Trusted gRPC Feature Packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/trusted-grpc-execution-context.md)
