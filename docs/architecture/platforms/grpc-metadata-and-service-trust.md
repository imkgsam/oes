# OES Trusted gRPC And Execution Context

```text
status: STABLE
decision: docs/adr/0015-workload-identity-and-execution-token.md
delegationDecision: docs/adr/0016-delegated-execution-and-action-grant.md
migrationState: SERVICE_MIGRATION_IMPLEMENTED_VERIFIED_21_OF_21
```

## 1. Scope

本文定义内部 gRPC 的工作负载身份、执行主体、租户上下文、Permission Code、逐跳传播与目标服务准入规则。服务业务对象、RPC 业务字段及 exact Code 映射由对应服务 truth source 与 contract 负责。

## 2. Trust Model

一次可信内部调用同时需要：

1. **mTLS workload identity**：证明当前直连调用方及目标服务；
2. **Auth 签发的短期 ExecutionToken**：证明本次执行主体、适用的 subject tenant、audience、actor 与获准 Code；
3. **target-owned method declaration**：目标服务声明 RPC 的 mode、principal、terminal、Code、workload allowlist，以及是否为 dedicated SYSTEM tenant-target interface，并在本地 fail closed。

下列内容没有 authority：

- request body 中用作 subject tenant、operator、scope、actor、trace 或 audit identity 的副本；target-owned RPC 可以有 tenant business selector，但 selector 本身不建立 authority；
- 普通 metadata、`x-internal-service-name`、私有网络位置或调用方自报 header；
- Gateway 已完成的入口权限检查；
- observability、日志或审计投影中的身份副本。

## 3. Execution Principals

| Principal | Meaning |
| --- | --- |
| `HUMAN` | 当前 HUMAN session 直接发起或在同步 OBO 链中保持为 subject。 |
| `MACHINE` | Cron、Integration、Robot 或平台 workload 以自身授权执行。 |
| `DELEGATED` | Agent/Robot 在受控 DelegationGrant/ActionGrant 下代表 HUMAN 执行。 |

Workload 与 execution principal 始终分离。Gateway、业务服务或 AI worker 是 workload，不因此自动获得业务权限。

## 4. ExecutionToken

ExecutionToken 是 target-audience、certificate-bound、短期签名 JWT，至少包含：

```text
iss, aud, sub, principal_type, client_id, scope,
jti, iat, nbf, exp, cnf,
tenant_id?, org_id?, session_id?, session_terminal?,
act?, delegation_id?, authz_version?
```

稳定规则：

- `aud` 只对应一个目标服务；不存在项目级通用 audience。
- `scope` 只包含 canonical Permission Code 子集，不建立第二套 scope 词表。
- `cnf` 绑定当前调用 workload 的证书或等价 proof-of-possession。
- HUMAN session Token 的 `session_terminal` 来自 Auth session truth；MACHINE Token 不伪造 terminal。
- `act` 只表达当前 direct actor，不递归嵌套整条 actor chain；完整链路通过相邻 Token `jti` 审计关联。
- 目标 Token 的有效期不晚于来源 credential/subject Token。
- bearer 只存在于 request-isolated private transport scope，不进入 DTO、domain input、普通 metadata、日志或审计正文。

## 5. RPC Admission Modes

### BUSINESS

- 由业务 owner 定义 exact Permission Code 与资源规则。
- TENANT HUMAN 调用必须匹配 Token subject tenant、target-owned tenant selector、session terminal、audience、certificate 与 Code。
- SYSTEM HUMAN 调用保持 tenantless。只有 method declaration 明确冻结为 dedicated SYSTEM tenant-target interface，且 exact caller workload、SYSTEM principal、与 Gateway 相同的 canonical Code 及平台 target range 全部匹配时，tenant selector 才可用于该调用；`allowedScopeLevels=SYSTEM` 只提供 Permission eligibility。
- MACHINE 或 DELEGATED 只有在该 RPC 明确声明时才可进入。

### SELF_SERVICE

- target 只能从 verified subject/session 派生；请求不得任意选择他人 target。
- self-service capability 不等于管理员 Permission Code。

### INTERNAL

- 必须声明 exact workload allowlist、principal/actor shape、audience 与 INTERNAL Code。
- 网络位置或“来自内部服务”不是准入条件。
- HUMAN_OBO 必须保持原 HUMAN subject，并以当前 SYSTEM MACHINE workload 作为 direct actor。

未声明、重复声明、未知 mode、错误 Code、错误 workload 或缺少 trusted runtime 均拒绝启动或拒绝请求。

## 6. Propagation

### Gateway To Service

Gateway 先完成 HTTP/session 边界校验，再使用当前 request-private source credential 向 Auth 兑换目标 audience Token。Gateway 的 HTTP permission decorator 不替代目标服务本地声明。

canonical HTTP path target 在 Gateway request 内保持 private verified value；downstream adapter 只能把规范化 id 写入 target service 自己定义的 exact business selector field。HTTP guard provenance 不作为普通 metadata 或 signed context 跨越 gRPC，目标服务必须用 Token、method declaration、workload、Code 与 range 重新授权 selector。TENANT 以 Token tenant equality 约束；SYSTEM Token 不新增 tenant claim。

### HUMAN OBO

服务收到有效 HUMAN Token 后，只把当前跳 Token 的不可序列化 private handle 交给 Auth STS。Auth 验证 subject、当前 exchanger workload、Identity binding 与 Permission decision，再签发下游 audience Token：

- `sub` 与 tenant 仍属于原 HUMAN；
- `act` 是当前 SYSTEM MACHINE workload；
- 下游只接收面向自己的 Token；
- 更深一跳使用上一跳新 Token，不回传或长期保存 Gateway 原 Token。

### MACHINE Root

Machine Principal 生命周期、workload binding 与固定 SYSTEM inventory provisioner 由 Identity 拥有；Auth 组合 current mTLS/SPIFFE、non-secret exact selector、Identity owner decision 与 Permission decision 并签发最长五分钟的 certificate-bound ExecutionToken。selector 不提供 subject、tenant、certificate 或 grant authority；同一 SPIFFE 可按 exact selector 解析多个 tenant bot principal。业务服务不得自行映射 SPIFFE 到 principal 或建立 fallback root。

### DELEGATED

DELEGATED runtime 仅在 DelegationGrant/ActionGrant、ToolContract、risk class、confirmation、idempotency 与 target-side consumption 全部满足对应 ADR/contract 时开放。trusted gRPC 基线本身不授予 AI mutation 权限。

## 7. Tenant, Trace And Audit

- subject tenant/org 来自 verified ExecutionToken 与目标服务规则。SYSTEM subject 不因 request target 获得 tenant。
- tenant business selector 来自 target-owned request contract，不属于 transport identity。TENANT selector 必须等于 Token subject tenant；SYSTEM selector 只在 dedicated SYSTEM tenant-target method/interface 内按平台 range 获准。
- trace/request correlation 来自可信 transport context；payload 同名字段不覆盖它。
- management command 使用 verified principal/workload、subject scope/tenant、重新授权后的 target tenant 与 trace 生成 owner-local audit。
- 调用理由可以作为非权威业务输入，但不能覆盖 operator 或审计来源。
- 每个服务只保存自己拥有的审计事实；跨服务链通过 trace、Token `jti`、delegation/action reference 关联。

## 8. Failure Semantics

以下情况统一 fail closed：

- Token 缺失、过期、签名失败、audience/`cnf`/Code 不匹配；
- workload、principal、actor、terminal 或 tenant 不符合声明；
- Auth、Identity、Permission、certificate 或 owner resolver 不可用；
- body/metadata 试图注入或覆盖可信上下文；
- SYSTEM tenant selector 缺少 dedicated method declaration、exact workload/Code 或不在平台 target range；
- declaration、DI、registry 或 policy 配置缺失/冲突；
- DELEGATED mutation 缺少适用的 confirmation、step-up、ActionGrant 或 idempotency/consumption gate。

认证失败、授权拒绝、前置条件失败和基础设施失败必须保持可区分的稳定错误语义，同时避免泄露 credential 与内部身份细节。

## 9. Ownership

| Capability | Owner |
| --- | --- |
| Workload certificate / SPIFFE identity | deployment/security platform |
| Machine Principal and workload binding | identity-service |
| HUMAN/OBO/API Key/DELEGATED source credentials, ExecutionToken, STS, DelegationGrant, ActionGrant | auth-service |
| Fixed SYSTEM inventory provisioning and non-secret MACHINE selectors | identity-service + deployment binding |
| Permission Code catalog and authorization decision | permission-service |
| Method declaration and business/resource enforcement | target service |
| Transport verification, private carrier and guards | Common infrastructure |
| Edge session/BFF orchestration | API Gateway / BFF |

Common 只能提供 target-neutral transport 和验证机制，不拥有业务 Code、risk class、tenant policy 或服务调用图。

## 10. Current Enforcement Baseline

21 个现有 gRPC 服务的旧 body/ordinary-metadata/signed-operator trust path 已完成迁移与验收。当前基线要求：

- 每个受保护 RPC 恰好有一个 method declaration；
- 服务端只接受目标 audience、mTLS certificate-bound ExecutionToken；
- Gateway 与跨服务 caller 使用 target-specific client/profile；
- request authority 字段已删除并 reserve，service-owned response projection 不受影响；
- legacy fallback、通用 target registration 与 raw production-like gRPC authority 路径不再进入当前实现。

后续新增或修改 RPC 必须直接满足本基线，不再建立“先 legacy、后迁移”的过渡阶段。

## 11. Verification

变更至少验证：

- proto lint/generation 与 field reservation；
- declaration inventory 无缺失、重复或 legacy authority；
- target service、caller、Auth/Identity/Permission/Common 定向测试；
- wrong audience/Code/workload/principal/terminal/tenant/certificate 的负向测试；
- bearer 不进入日志、DTO、异常、序列化或审计正文；
- package build、DI 启动与 owner-local audit/transaction 行为。

运行和排障入口以 [trusted gRPC workload identity runbook](../../runbooks/trusted-grpc-workload-identity.md) 为准。

## 12. Related Truth Sources

- [ADR 0015](../../adr/0015-workload-identity-and-execution-token.md)
- [ADR 0016](../../adr/0016-delegated-execution-and-action-grant.md)
- [Gateway and BFF](./gateway-and-bff.md)
- [Permission Code source](./permission-code-source.md)
- [Auth service](../services/auth-service.md)
- [Identity service](../services/identity-service.md)
- [Permission service](../services/permission-service.md)
- [Delegated execution collaboration](../collaborations/delegated-execution-and-action-grant.md)
