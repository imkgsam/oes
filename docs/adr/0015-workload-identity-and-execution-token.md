# ADR 0015: Workload Identity 与短期 ExecutionToken

```text
status: ACCEPTED
decisionDate: 2026-07-27
architectureTruthSource: docs/architecture/14-grpc-metadata-and-service-trust-architecture.md
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
- 每个 Token 只有一个 `aud`，只面向一个目标服务。
- 标准 `scope` claim 直接携带本次获准的 Permission Code 子集，不建立第二套 Scope 目录或转换表。
- `cnf` 将 Token 绑定到申请方工作负载的 mTLS identity。
- 目标服务本地校验签名、issuer、时间、audience、scope、tenant、`cnf` 与紧急 deny state；普通 RPC 不在线调用 Auth。
- Auth 以无状态实例横向扩展，使用 `kid` / JWKS 轮换签名密钥。普通撤销依赖短 TTL；紧急撤销通过安全事件更新本地 deny cache 或 minimum security version。

### 4. 多跳与 cache

每一跳调用下游时，调用方使用当前已验证执行上下文向 STS 获取目标 audience Token；不得原样转发上游 Token，也不得由业务服务自行重签。

调用端可按 subject、principal type、delegation、tenant、org、audience、精确 Permission Code 集、`cnf` 与安全版本建立严格进程内 cache。禁止创建 Redis 或其他跨服务共享 Bearer Token 池。合法 cache 复用由 mTLS + `cnf`、短 TTL、最小 audience、命令幂等与高危 ActionGrant 共同控制风险。

### 5. API Key 与机器授权 owner

- `identity-service` 拥有 Machine Principal identity 与 lifecycle。
- `auth-service` 拥有 API Key credential、认证、轮换、撤销与交换 ExecutionToken 的 STS 能力。
- `permission-service` 拥有 HUMAN / MACHINE 的角色、grant、policy 与授权判定。
- 长期绑定模型收敛为 `PrincipalRoleBinding`，显式记录 principal type / id、scope level、tenant 与 role；不把机器伪装为 `UserAccount`。
- INTERNAL kind Permission Code 只由 STS workload issuance policy 授予，不能进入人类或租户机器业务角色。

外部 App 只能创建 tenant-scoped Integration Machine 与 API Key，并通过 Gateway / Auth 换取 ExecutionToken；外部调用方不直接访问内部 gRPC。Marketplace、第三方开发者平台、共享 App 主体与一个 App 被多个 tenant 安装的模型已取消，不做架构预留。

### 6. RPC authorization declaration

每个 gRPC RPC 必须且只能声明一种方法级模式：`BUSINESS`、`SELF_SERVICE` 或 `INTERNAL`。Gateway HTTP `RequirePermissions` 保留为外部入口第一层授权；服务端仍独立验证 ExecutionToken 和资源边界。漏标或重复标注必须由启动扫描或架构测试阻止。

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

## Consequences

正向结果：

- Auth 不在普通 RPC 热路径；验签成本由目标服务本地承担，STS 仅在 cache miss 或上下文变化时参与。
- HUMAN、MACHINE、DELEGATED 与纯技术调用使用同一执行模型。
- audience、Permission Code 与 workload binding 将多跳权限收敛到最小集合。
- 所有 gRPC 服务最终不再因重复 body tenant/operator 形成 confused-deputy 边界。
- Permission Code 继续作为 RBAC 与 Token scope 的同一能力词汇，不引入平行授权目录。

成本与风险：

- `addGrpcMetadata=true` 是全仓生成签名变更，必须修复已盘点的 caller、controller 与 fixture 编译影响。
- mTLS identity、JWKS、STS issuance policy、deny event 与本地 cache 都需要部署和运行治理。
- 短 TTL 意味着普通撤销存在有限收敛窗口；高危动作仍需独立 step-up / ActionGrant。
- 逐服务迁移期间尚未切换的目标仍存在旧边界；每个目标切换前必须准备全部 caller，切换后的 server method 只接受新信任模型。

## Related Documents

- [可信 gRPC Metadata 架构](/Users/acehood/Documents/GitHub/oes/docs/architecture/14-grpc-metadata-and-service-trust-architecture.md)
- [Permission Code 语义源](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
- [ExecutionToken Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/execution-token.md)
- [Principal Authorization Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/principal-authorization.md)
- [Trusted gRPC Feature Packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/trusted-grpc-execution-context.md)
