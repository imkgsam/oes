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
- `PrincipalRoleBinding` 是 HUMAN / MACHINE 与 Role instance 的通用绑定事实，至少包含 principal type / id、role、scopeLevel、tenant、effective / expiry 与审计关联。
- SYSTEM binding 只能指向 `SYSTEM_INSTANCE` 且 tenant 为空；TENANT binding 只能指向同 tenant `TENANT_INSTANCE`。

既有 `AccountRole` 迁移为 HUMAN binding 时必须保持 grant identity、role、scope、tenant、有效期与审计关系。迁移不是重新授权。

## 2. Permission Kinds

- `BUSINESS` Permission Code 可按 definition metadata 授予 HUMAN 或 MACHINE role。
- `INTERNAL` Permission Code 不能进入 HUMAN / MACHINE role，只能进入 workload issuance policy。
- ExecutionToken 的 `scope` 直接使用 Permission Code，不建立 Scope alias、OAuth-style 第二套业务能力目录或 Permission-to-Scope 转换表。
- `allowedScopeLevels` 与 `assignableTo` 在写入 grant 和计算有效授权时都必须验证。

## 3. ResolvePrincipalAuthorization

该黑盒判定供 Gateway guard、Auth / STS 与受保护 application capability 使用。逻辑输入包括：

- trusted principal reference 与 type；
- trusted scopeLevel、tenant / org；
- requested Permission Code 集；
- action / resource type 与服务拥有的最小 resource facts（如需要）；
- delegation / session security reference（如适用）。

稳定输出包括：

- `allowed`；
- 精确 granted / denied Code；
- scope / tenant decision；
- policy / grant decision reference 与 `authzVersion`；
- 可安全审计的 reason category。

调用方提供的 principal id、tenant 或 subject facts 必须与可信执行上下文及 owner facts 绑定；自由 DTO 中的 subject facts 不能建立或提升授权。Permission Service 不接受“调用方已判断用户是管理员”作为事实。

`all` 要求全部 Code 获准；`any` 只用于多个 Code 对同一动作均构成充分授权。body 值选择不同状态跃迁时，调用方必须拆 command 或在 application 层按目标动作检查，不能用一个宽泛 `any` 放行。

## 4. ResolveWorkloadIssuance

该判定供 Auth / STS 决定一个已验证 workload 能否为指定 target audience 申请 INTERNAL Code。

逻辑输入包括：

- verified caller workload identity；
- target audience；
- requested INTERNAL Code 集；
- execution tenant / org 与 principal attribution；
- issuance policy version。

稳定规则：

- 每个 requested Code 必须 `kind=INTERNAL`，并由 policy 明确允许 caller workload -> target audience -> Code。
- 默认拒绝；网络位置、service name header、同一集群或 HUMAN 业务权限都不能推导 INTERNAL grant。
- policy 只允许申请技术原语，不得把独立业务审批、删除、资金承诺或重要状态跃迁伪装为 INTERNAL。
- 判定不签发 Token；Auth / STS 消费 decision 后签发并绑定 `aud / client_id / cnf`。

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

## 7. Stable Error Categories

- `AUTHORIZATION_PRINCIPAL_UNTRUSTED`
- `AUTHORIZATION_PRINCIPAL_INACTIVE`
- `AUTHORIZATION_SCOPE_MISMATCH`
- `AUTHORIZATION_TENANT_MISMATCH`
- `AUTHORIZATION_PERMISSION_UNKNOWN`
- `AUTHORIZATION_PERMISSION_NOT_ASSIGNABLE`
- `AUTHORIZATION_PERMISSION_DENIED`
- `AUTHORIZATION_DELEGATION_DENIED`
- `AUTHORIZATION_WORKLOAD_POLICY_DENIED`
- `AUTHORIZATION_RESOURCE_FACTS_INVALID`

## 8. Acceptance

1. MACHINE 可以使用合法 BUSINESS role，但不出现在 human access summary、navigation 或 terminal access。
2. INTERNAL Code 绑定到 HUMAN / MACHINE role 时写入失败，运行时也 fail closed。
3. 调用方伪造 subject facts、tenant 或 admin flag 不能改变 decision。
4. SYSTEM Machine 跨 tenant 未逐 tenant 建立授权上下文时失败。
5. DELEGATED decision 不超过 human、delegation、tool upper bound 的交集。
6. AccountRole 到 HUMAN PrincipalRoleBinding 的迁移保持现有有效授权不变。
7. 同一操作要求两个独立 Permission 时 `all` 正确拒绝只持有一个 Code 的主体。
8. workload issuance policy 不允许时，即使 human 有上游 BUSINESS Permission 也不能申请目标 INTERNAL Code。
