# Principal Authorization Contract

```text
status: FROZEN
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/permission-service.md
```

> 本文冻结 Permission Service 对 HUMAN、MACHINE、DELEGATED 与 workload INTERNAL issuance 的黑盒授权语义。核心对象和 owner 以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. Principal And Grant Model

- `HUMAN` principal 通过已验证账号 / session identity 参与角色与 policy 判定。
- `MACHINE` principal 引用 Identity Service 拥有的 Machine Principal，不创建伪用户账号。
- `DELEGATED` 不是可长期绑定角色的独立主体；其结果由 HUMAN grant、delegation 与 agent/tool upper bound 共同约束。
- Delegation credential 和 ActionGrant 均不归 Permission Service 签发；principal issuance decision 只返回 HUMAN grant、可信 delegation reference 与 ToolContract Code 上限的交集，具体 operation / target / resource policy 由独立 delegated authorization 与目标服务继续判定。
- `PrincipalRoleBinding` 是 HUMAN / MACHINE 与 Role instance 的通用绑定事实，至少包含 principal type / id、role、scopeLevel、tenant、effective / expiry 与审计关联。
- SYSTEM binding 只能指向 `SYSTEM_INSTANCE` 且 tenant 为空；TENANT binding 只能指向同 tenant `TENANT_INSTANCE`。

既有 `AccountRole` 迁移为 HUMAN binding 时必须保持 grant identity、role、scope、tenant、有效期与审计关系。迁移不是重新授权。

### Binding lifecycle and temporal behavior

本节只定义调用方可观察的 binding 生命周期；对象 owner、字段归属与长期模型以 `permission-service` 服务真相源为准。

- 一次 grant 返回一个不可变 binding / grant identity。对同一 HUMAN 或 MACHINE、role、scope 与 tenant 的再次 grant，只有在其有效窗口不与既有未关闭窗口重叠时才成功。
- grant 与 binding 查询都必须公开该 identity；调用方保存它用于后续撤销、审计关联和重试，不能用 account / principal 与 role 的组合替代。
- 有效窗口采用开始包含、结束排除的语义；到期或 revoke 都关闭窗口。相邻窗口可以衔接，重叠窗口必须被拒绝，即使并发请求同时通过了前置校验。
- revoke 以 binding identity 为目标。首次成功 revoke 记录关闭时间与可信审计归因；对同一 identity 的重试返回同一已撤销结果，不产生第二次状态变化或审计事件。不存在的 identity 依既有幂等撤销语义处理，不可借此枚举主体授权。
- legacy `AccountRole` 的 account / role selector 只允许在迁移兼容窗口内消费旧数据。canonical revoke 启用后，缺少 binding identity 的请求必须被迁移或拒绝，不能将其猜测为当前或最近 binding；这条规则防止过期撤销重试删除后续 regrant。
- regrant 绝不复活或改写历史 binding，而是创建新的 identity。因而审计、授权决策和回放可以区分每次独立授予。
- access summary、navigation、terminal access 与 `ResolvePrincipalAuthorization` 只使用当前生效、未撤销、未过期且 role enabled 的 HUMAN binding；MACHINE binding 只参与机器 BUSINESS grant / policy 判定，不出现在人类 UI 或终端访问结果。

### AccountRole compatibility, migration and rollback

- 每个既有 `AccountRole` 必须一对一迁移为 HUMAN `PrincipalRoleBinding`，保留原 grant identity、role、scope、tenant、有效期和审计关联；迁移不得改变当前有效授权集合。
- canonical cutover 后，`PrincipalRoleBinding` 是唯一授权写入真相。旧 `AccountRole` 名称如暂时保留，只能作为由 canonical HUMAN binding 重建的单向兼容 projection，调用方不得向两个模型分别写入。
- 迁移必须在切换前和回退前验证 binding 数、有效授权集合、access summary 与审计关联的 parity，并保留可审计的 backfill / cutover / rollback 记录。
- 旧模型不能表示 MACHINE binding 或同一逻辑 binding 的多段历史；在旧版本仍可回退的窗口内不得启用这些新写入语义。窗口结束后，回退目标必须是已支持 canonical binding 的版本，不能以删除、压缩或伪造历史换取回退。
- `permission_management.proto` 必须在任何 canonical binding 实现前公开 grant/read 的 binding identity 与以该 identity revoke 的黑盒输入；具体 proto 字段、RPC 命名和生成代码路径属于受控共享契约写入，未获该路径 lease 的线程不得自行实现或替代。

## 2. Permission Kinds

- `BUSINESS` Permission Code 可按 definition metadata 授予 HUMAN 或 MACHINE role。
- `INTERNAL` Permission Code 不能进入 HUMAN / MACHINE role，只能进入 workload issuance policy。
- ExecutionToken 的 `scope` 直接使用 Permission Code，不建立 Scope alias、OAuth-style 第二套业务能力目录或 Permission-to-Scope 转换表。
- `allowedScopeLevels` 与 `assignableTo` 在写入 grant 和计算有效授权时都必须验证。

## 3. ResolvePrincipalAuthorization

该黑盒判定只供 Auth / STS 在签发 BUSINESS ExecutionToken 前取得独立 principal authorization upper bound。Gateway guard 继续使用 tenant-aware 入口门禁，目标 application 继续使用 `checkResource / buildQueryScope` 与 domain rule；二者不得把本 RPC 扩展为通用在线授权入口。

调用信任固定为：

- 直接 caller 必须是平台 mTLS / SPIFFE transport 已验证的准确 `auth-service` workload；
- caller 必须同时提交 `aud=permission-service`、绑定当前 Auth mTLS 叶证书且含精确 INTERNAL Code `permission.internal.principal_authorization.resolve` 的 ExecutionToken；
- 该 INTERNAL Code 只允许由准确 Auth workload -> Permission audience 的 `ResolveWorkloadIssuance` policy 批准，不进入 HUMAN / MACHINE role，也不接受 wildcard workload policy。

逻辑输入包括：

- trusted principal reference 与 type；
- trusted scopeLevel、tenant / org；
- 一个精确 target service audience；
- 非空、去重并规范排序的 requested BUSINESS Permission Code 集；
- session / security reference（如适用）；
- DELEGATED 时的 trusted human account、delegation reference、AgentPrincipal 与 ToolContract identity / version。

输入不包含 role id、admin flag、caller-computed granted set、target RPC id、action / resource type、业务 resource facts 或 domain state。DELEGATED 的 Token issuance upper bound 只约束可签入 Token 的 Code；operation risk class、具体 target/input、resource policy 与 ActionGrant 仍由后续 delegated authorization / target-service contract 执行。SELF_SERVICE 不调用本 RPC。

稳定输出包括：

- `allowed`；
- 精确 granted / denied Code；
- principal type / reference、scope / tenant / org、target audience 与 requested Code 的 decision binding；
- policy / grant decision reference 与 `authzVersion`；
- 可安全审计的 reason category。

调用方提供的 principal id、tenant 或 subject facts 必须与可信执行上下文及 owner facts 绑定；自由 DTO 中的 subject facts 不能建立或提升授权。Permission Service 不接受“调用方已判断用户是管理员”作为事实。

该 MACHINE source credential/resolver chain 当前为 `IMPLEMENTED_VERIFIED`，并已由 `024579598c1293807d3f1cd5e7003aefd8e8fa0a` 验收集成。对 MACHINE，Auth 调用本 RPC 前必须已经验证 Auth-owned `MachineWorkloadSourceCredential` 的 profile/signature/lifetime/revocation 与当前 SPIFFE/leaf binding，并取得 Identity `ResolveMachinePrincipalForAuth` 对 active principal、scope、tenant/org、`MachineWorkloadBinding` reference/version 的 allowed owner decision。Permission 只消费该 typed owner result 并计算 MACHINE BUSINESS grant；不接收 raw source credential、leaf certificate、SPIFFE-to-principal mapping 或 caller-computed grant。Identity decision 缺失、stale、mismatch 或不可用时不得进入本 RPC 或签名。

该 RPC 固定采用全量申请语义，不接受 caller-selectable `all / any`：只有全部 requested Code 当前存在、`kind=BUSINESS`、适用于 principal/scope 且通过 grant / policy upper bound 时 `allowed=true`。任一未知、不可分配、denied、mixed-kind、tenant/scope/audience/delegation mismatch 或依赖不可用都使整体 `allowed=false`；Permission 可以返回 granted / denied 明细供审计，但 Auth 不得部分签发。

## 4. ResolveWorkloadIssuance

该判定供 Auth / STS 决定一个已验证 workload 能否为指定 target audience 申请 INTERNAL Code。

本 RPC 是 ExecutionToken 发证控制面唯一不预先要求 ExecutionToken 的 bootstrap authorization primitive。它仍要求平台 mTLS / SPIFFE transport 注入的可信 `VerifiedWorkloadIdentity`，且直接 caller 必须是环境注册的准确 `auth-service` workload。该 method-specific bootstrap trust policy 不是 Permission Code、Role grant、Bearer credential 或通用服务白名单；其他 workload、其他 Permission RPC、service-name header、网络位置与 wildcard policy 都不能复用它。

逻辑输入包括：

- Auth 从当前 exchange context 独立验证的 original caller workload identity；
- target audience；
- 非空、去重并规范排序的 requested INTERNAL Code 集；
- execution tenant / org 与 principal attribution；
- issuance policy version。

稳定规则：

- 每个 requested Code 必须 `kind=INTERNAL`，并由 policy 明确允许 caller workload -> target audience -> Code。
- 默认拒绝；网络位置、service name header、同一集群或 HUMAN 业务权限都不能推导 INTERNAL grant。
- policy 只允许申请技术原语，不得把独立业务审批、删除、资金承诺或重要状态跃迁伪装为 INTERNAL。
- 只有全部 requested Code 获准时 `allowed=true`；任一未知、非 INTERNAL、denied、部分批准、workload/audience/tenant mismatch、stale policy version 或依赖不可用都整体拒绝，Auth 不做部分签发。
- 输出绑定 original workload、target audience、tenant / org attribution 与 requested / granted / denied Code，并返回安全 reason category、decision reference 与 `authzVersion`。
- 判定不签发 Token；Auth / STS 消费 decision 后签发并绑定 `aud / client_id / cnf`。Permission 不接收或记录 source credential / bearer 正文。

### 4.1 ResolveExternalMachineAuthorizationSnapshot

This narrow decision exists only for Auth's External API Key exchange after Auth has independently verified the credential and consumed Identity's eligible Integration Machine result. It is an Auth-only trusted internal call requiring verified `auth-service` workload identity, target audience `permission-service`, certificate binding and exact INTERNAL issuance Code `permission.internal.external_machine.snapshot.resolve`; it is not callable by Gateway, an external client, or a normal HUMAN/MACHINE role.

The trusted input is the MACHINE principal reference derived from Auth's credential and the tenant reference returned by Identity. It contains no raw API Key, external JWT, caller-selected Permission Code, capability, role, target audience, expiry or resource facts.

The stable output contains only:

- `allowed`, the machine/tenant echo, and the effective granted existing `BUSINESS` Permission Codes whose definition metadata marks them `externalApiEligible`;
- the opaque `authzVersion` and safe decision reference; and
- a stable safe `reasonCode` when the machine, tenant, catalog or grant state cannot produce a non-empty external authorization snapshot.

The decision is coarse-grained: it does not expose Gateway routes or pre-authorize any business resource. `allowed=true` requires a non-empty snapshot, exact tenant-scoped active MACHINE grants, and only known `externalApiEligible` BUSINESS Codes. Empty result, tenant mismatch, unknown/ineligible Code, mTLS/Token mismatch, timeout or Permission unavailable fails Auth's exchange closed. Gateway must independently require explicit external-route metadata and compare the relevant existing `RequirePermissions` Code(s) to this snapshot; the target business service continues resource and domain authorization. Permission Service does not sign or store the external Token.

The runtime placement is fixed to the existing `PermissionCheckService` proto, `permission-check.grpc.controller.ts`, `application/queries/authorization/resolve-external-machine-authorization-snapshot.*`, and existing PrincipalRoleBinding / Permission catalog repository boundaries. No controller-local role expansion, Auth-side Permission database access or legacy account-only `CheckPermission` substitute is permitted.

## 5. BUSINESS, SELF_SERVICE And INTERNAL Consumption

- BUSINESS：目标服务验证 Token Code 后仍执行 tenant、resource ownership、状态机、审批分离、金额阈值与 domain rule。
- SELF_SERVICE：target 从可信 HUMAN principal 派生，默认拒绝 MACHINE / DELEGATED；允许 DELEGATED 必须由方法显式声明，认证安全类操作仍禁止。
- INTERNAL：验证 workload issuance、audience、`cnf` 与 INTERNAL Code；允许没有 human operator，但保持 machine / original principal、tenant、request 与 trace 审计归因。

Gateway HTTP `RequirePermissions` 保留。它与目标 gRPC BUSINESS authorization 是两道边界，共用 Permission Code 与可信 tenant，不以任一方替代另一方。

## 6. Machine And Integration Rules

- SYSTEM Machine 可执行平台任务，但进入 tenant 数据面时必须逐 tenant 建立 context；SYSTEM 不等于所有 tenant wildcard。
- TENANT Robot / Integration 只能获得本 tenant role / policy。
- Robot template 不带 grant；安装后创建的 tenant principal 独立授权、撤销和审计。
- 个人创建的定时任务若需代表用户，必须使用有时效、有上限的 delegation，不把创建者当前全部角色复制给 MACHINE。
- 外部 Integration 固定为每 tenant 一个 Machine Principal；Marketplace、共享 App principal 与跨 tenant installation model 已取消。
- 第一方 Cron、Robot、worker 的 root MACHINE authentication 使用 Auth-owned 短期 `MachineWorkloadSourceCredential` + current mTLS workload/certificate binding + Identity-owned `MachineWorkloadBinding` resolution；它与 external API Key path 完全分离。上述认证链不授予 BUSINESS/INTERNAL Code，仍分别依赖本契约的 principal/workload decision。

## 7. Stable Error Categories

- `AUTHORIZATION_PRINCIPAL_UNTRUSTED`
- `AUTHORIZATION_PRINCIPAL_INACTIVE`
- `AUTHORIZATION_SCOPE_MISMATCH`
- `AUTHORIZATION_TENANT_MISMATCH`
- `AUTHORIZATION_PERMISSION_UNKNOWN`
- `AUTHORIZATION_PERMISSION_KIND_MISMATCH`
- `AUTHORIZATION_PERMISSION_NOT_ASSIGNABLE`
- `AUTHORIZATION_PERMISSION_DENIED`
- `AUTHORIZATION_DELEGATION_DENIED`
- `AUTHORIZATION_CALLER_WORKLOAD_UNTRUSTED`
- `AUTHORIZATION_TARGET_AUDIENCE_INVALID`
- `AUTHORIZATION_DECISION_BINDING_MISMATCH`
- `AUTHORIZATION_WORKLOAD_POLICY_DENIED`
- `AUTHORIZATION_DEPENDENCY_UNAVAILABLE`

## 8. Acceptance

1. MACHINE 可以使用合法 BUSINESS role，但不出现在 human access summary、navigation 或 terminal access。
2. INTERNAL Code 绑定到 HUMAN / MACHINE role 时写入失败，运行时也 fail closed。
3. 调用方伪造 subject facts、tenant 或 admin flag 不能改变 decision。
4. SYSTEM Machine 跨 tenant 未逐 tenant 建立授权上下文时失败。
5. DELEGATED decision 不超过 human、delegation、tool upper bound 的交集。
6. AccountRole 到 HUMAN PrincipalRoleBinding 的迁移保持现有有效授权不变。
7. 同一操作要求两个独立 Permission 时 `all` 正确拒绝只持有一个 Code 的主体。
8. workload issuance policy 不允许时，即使 human 有上游 BUSINESS Permission 也不能申请目标 INTERNAL Code。
9. 同一 HUMAN 的更高 Permission 不能扩大固定 ToolContract 的上限，也不能使被标为 ActionGrant-required 或 AI-forbidden 的 operation 自动放行。
10. 同一 logical binding 的相邻窗口可以衔接；重叠窗口（包括并发 grant）只有一个能成功持久化。
11. 首次 revoke 关闭 binding 并保留可信审计关联；同一 binding 的重复 revoke 不改变首次撤销事实，也不产生重复审计。
12. revoke 后的 regrant 返回新的 binding identity，旧 identity 仍可供审计与历史授权决策引用。
13. AccountRole backfill 与任何回退前都证明 binding 数、有效授权、access summary 与审计关联一致；旧模型无法表示的新 MACHINE 或多段历史写入不允许伪造性回退。
14. An external machine snapshot returns only currently effective, externally eligible BUSINESS Codes; it never returns INTERNAL Code, a role graph, a Gateway route catalogue, a credential secret or a resource authorization result.
15. Only the verified Auth workload with `permission.internal.external_machine.snapshot.resolve` can obtain a snapshot; missing trust, tenant mismatch, empty/invalid scope or dependency failure produces `allowed=false` or transport denial and Auth issues no external Token.
16. `ResolveWorkloadIssuance` accepts no pre-existing ExecutionToken, but only the exact transport-verified `auth-service` mTLS identity can call that exact method; another valid workload certificate, a header identity or a call to another Permission RPC is denied.
17. `ResolvePrincipalAuthorization` requires both the exact Auth mTLS identity and a certificate-bound `aud=permission-service` ExecutionToken carrying only `permission.internal.principal_authorization.resolve`.
18. BUSINESS and INTERNAL issuance decisions allow only when every canonical requested Code is granted; unknown, mixed-kind, partial or mismatched decisions cause no Token signing.
19. `ResolvePrincipalAuthorization` does not accept resource facts, domain state or caller-derived roles; SELF_SERVICE and concrete resource/domain authorization remain at their existing target-service boundaries.
20. A successful or denied issuance decision binds principal/workload, scope, tenant/org, audience, exact Code set, decision reference and `authzVersion`, and its audit contains no source credential or Token plaintext.
21. MACHINE BUSINESS decision only consumes the active principal/scope/tenant owner result produced after Auth source-credential and Identity binding verification; Permission never parses that credential, resolves SPIFFE identity or substitutes external API-key/hardcoded root mapping.
