# permission-service 职责卡

## 1. Purpose

`permission-service` 是 OES 的授权事实与授权判定服务，负责回答“谁在什么上下文下可以做什么、能看到哪些入口、能从哪些终端进入系统”。

本文是 `permission-service` 的唯一稳定设计真相源。其他文档可以记录契约、协同流程、feature 状态或实现步骤，但不得重新定义本服务的核心对象、边界、命名或长期职责。

## 2. Owns

- `Permission` 运行时 catalog、权限码注册事实、权限引用关系与权限管理审计。
- `Role`、`RoleTemplate`、`AccountRole`、role-permission 绑定与账号授权 grant 真相。
- `Scope`、`Policy`、授权判定、授权决策记录与 policy AST 评估能力。
- 当前 session 的 access summary：effective roles、effective action codes、运行时权限摘要。
- 第一阶段 navigation governance 真相：
  - `NavigationEntry Registry`
  - `RoleNavigationVisibility`
  - `RoleLandingPolicy`
- Terminal Access Policy 真相：
  - role terminal access
  - account terminal access override
  - effective terminal access decision
- onboarding 场景下的初始 role instance ensure 与 account role grant 真相。

## 3. Does Not Own

- 用户认证、认证凭据、MFA、OTP、challenge、session、refresh token、access token 或 token 签发语义。
- `User`、`UserAccount`、账号登录身份、contact asset、machine principal 或 employee binding 真相。
- 租户、组织、员工、Party 或业务资源主数据；员工与任职真相以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- 前端 route、菜单层级、icon、layout、页面文案、terminal-specific UI 呈现配置。
- 用户个人 landing page 偏好。
- 业务聚合生命周期、不变量、流程状态合法性或业务规则。

## 4. Core Objects

### 4.1 Permission

`Permission` 是全局权限 catalog 的运行时事实对象。

稳定规则：

- `Permission.code` 全局唯一，作为运行时持久化和授权判定使用的稳定标识。
- `Permission.code` 不作为常规可编辑字段开放。
- `Permission` 不按租户复制。
- `Permission.module` 与 `description` 是可治理元数据。
- 删除 permission 前必须检查 role / policy 引用关系。

权限码的代码语义源位于 `src/common/src/authorization/permission-codes/**`。`permission-service` 负责将统一权限码定义同步为运行时 catalog，并拥有数据库中的当前注册事实。业务服务不得自行向 permission 数据库散写权限码。

### 4.2 Role

`Role` 分为三类：

- `SYSTEM_TEMPLATE`
  - 全局模板角色。
  - 由系统管理员治理。
  - 用于派生租户角色实例。
  - 不得直接分配给账号。
- `SYSTEM_INSTANCE`
  - 系统级真实角色。
  - 可分配给不绑定租户的系统账号。
  - 用于系统管理员 access summary、接口授权与系统导航解析。
- `TENANT_INSTANCE`
  - 租户级真实角色。
  - 必须属于具体 tenant。
  - 可分配给租户账号。
  - 用于租户管理员与租户成员 access summary、接口授权与租户导航解析。

稳定规则：

- role template 与 role instance 必须通过 `roleKind` / `scopeLevel` 显式区分。
- 从 template 派生 tenant role instance 时，实例继承 template code，可覆盖 `name / description`，并复制 template 当前 permission 集合。
- tenant role instance 的后续 permission 绑定与 template permission 绑定彼此独立，不做运行时继承。
- disabled role 不参与 access summary、terminal access 或授权判定。

详细 role kind 与 account-role scope 决策见 [0002-system-role-instance-and-account-role-scope.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0002-system-role-instance-and-account-role-scope.md)。

### 4.3 AccountRole / Grant

`AccountRole` 是账号与 role instance 的绑定事实。

稳定规则：

- 系统级绑定：`scopeLevel = SYSTEM`，`tenantId = null`，role 必须是 `SYSTEM_INSTANCE`。
- 租户级绑定：`scopeLevel = TENANT`，`tenantId` 必填，role 必须是同 tenant 的 `TENANT_INSTANCE`。
- `SYSTEM_TEMPLATE` 不得绑定账号。
- account-role 可以包含 `effectiveAt / expiresAt`，当前有效绑定才参与 access summary、terminal access 与授权解析。
- 不存在的撤销可按幂等成功处理。
- checkbox list 类账号角色设置使用按 scope 全量替换语义；单条授予可支持有效期窗口。

HR、Identity、TenantOrg、BFF 或其他服务只能请求授权 grant，不能直接写 account-role 绑定。

## 5. Authorization Model

### 5.1 checkPermission

`CheckPermission` 是入口级、能力级、粗粒度 RBAC 判定能力，主要供 Gateway guard 与内部服务接口 guard 使用。

稳定规则：

- 用于回答“当前 operator 是否能进入某类能力”。
- 默认基于 effective roles 与 permission codes。
- 不负责业务资源本体授权。
- 不替代 domain rule。

### 5.2 checkResource / buildQueryScope

新业务资源授权应优先采用项目级授权分层：

- 单资源命令或详情查询：application 层加载最小 resource facts 后执行 `checkResource`。
- 列表、搜索、分页、导出前范围筛选：application/query 层执行 `buildQueryScope`。

`permission-service` 拥有可被复用的授权事实、policy 能力与授权查询能力，但不拥有业务资源本体。资源事实与业务状态必须由对应业务服务提供。

项目级规则以 [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md) 为准。

### 5.3 CheckPermissionWithContext

`CheckPermissionWithContext` 只作为历史兼容 RPC 与 policy AST 评估能力载体保留。

稳定规则：

- 不作为新业务资源授权的标准接入方式。
- 不应继续被新业务当作统一资源授权 RPC 扩散。
- 新业务资源授权必须优先落到 application 层 `checkResource / buildQueryScope`。

## 6. Policy

`Policy` 是围绕 permission 的授权策略事实。

稳定规则：

- Policy 必须绑定明确存在的 `permissionCode`。
- 当前正式持久化条件格式为受限 `conditionAstJson`。
- policy 只表达访问边界、安全边界或查询范围边界，不承载业务聚合生命周期、不变量或流程规则。
- 决策优先级为 `DENY > ALLOW > default deny`。
- 当某 permission 没有启用中的 policy 时，RBAC 通过即可允许。
- 当某 permission 存在启用中的 policy 时，必须进入 policy 评估；未命中允许规则时默认拒绝。

管理端当前阶段只开放 readonly governance。Policy create / update / delete / enable / disable、rule builder、explain / impact preview 必须作为独立 feature 重新冻结后再开放。

## 7. Access Summary

`permission-service` 拥有当前账号 access summary 的计算真相。

Access summary 包含：

- effective role summaries
- effective action codes

稳定规则：

- `auth-bff` 只消费 `permission-service` 的 dedicated access-summary RPC，不应通过管理 RPC 自行拼接 role 与 permission。
- 前端只消费 `actionCodes` 做按钮、操作和 UI action 控制，不从 `roles` 推导权限。
- `roles` 只用于展示、诊断或解释当前 operator context。
- system-scope 账号解析 `SYSTEM_INSTANCE` roles。
- tenant-scope 账号解析当前 tenant 的 `TENANT_INSTANCE` roles。
- active account-role windows、disabled roles 与 scope 必须参与解析。

黑盒契约见 [permission-service/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md) 与 [api-gateway/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)。

## 8. Navigation Governance

`permission-service` 第一阶段拥有 navigation governance 的事实与运行时解析能力。

拥有的事实：

- `NavigationEntry Registry`
- `RoleNavigationVisibility`
- `RoleLandingPolicy`

稳定规则：

- 后端跨终端契约只返回 `visibleEntries` 与 `defaultEntry`。
- `defaultEntry` 必须从当前 `visibleEntries` 中选择。
- role landing policy 不授予 entry visibility，只在可见 entry 中选择默认入口。
- 多 role landing 冲突使用 `RoleLandingPolicy.priority`。
- feature / plugin enablement 不进入当前 navigation visibility 主链。
- `api-gateway/auth-bff` 消费解析结果并组成 session context，不拥有导航治理真相。
- 前端拥有 `entryKey -> route / page / screen` 映射、菜单层级、icon、layout 与 terminal-specific rendering。

本服务不把 navigation governance 扩展成后端统一菜单树或 Web route 配置中心。

黑盒契约见 [api-gateway/navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)。

## 9. Terminal Access Policy

Terminal Access Policy 控制账号是否允许从指定人类交互终端建立或继续 session。

`permission-service` 拥有：

- role terminal access facts
- account terminal access override facts
- effective terminal access resolution
- terminal access management audit

稳定规则：

- 终端准入是登录 / refresh 链路的服务端准入能力，不是前端入口隐藏，不是 navigation visibility。
- `auth-service` 在 account selection 后、MFA 前，以及 refresh 时消费 `ResolveAccountTerminalAccess`。
- account override 存在时完全替代 role union。
- role terminal access 使用 active roles 的 allow union。
- 空 override 表示账号级全终端封禁。
- `DEFAULT` 不是合法登录 terminal；`API / MACHINE` 不属于人类账号 terminal access，应走 machine auth / service account。

协同蓝图见 [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)，黑盒契约见 [terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)。

## 10. Onboarding Grant

`permission-service` 拥有 onboarding 场景中的 role ensure 与 account role grant 真相。

稳定规则：

- employee onboarding 中，HR 可请求 `GrantInitialAccessForEmployeeAccount`，但不拥有 grant 真相。
- tenant onboarding 中，TenantOrg 可请求 `EnsureTenantRoleInstanceFromTemplate` 与 `GrantInitialAccessForTenantAccount`，但不拥有 role instance 或 grant 真相。
- TenantOrg 的 tenant lifecycle、onboarding 编排与 tenant 引用语义以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只冻结 permission 侧授权 owner。
- Identity 不直接写角色绑定。
- BFF 不展开角色推导，也不持久化 account-role。
- grant 请求必须幂等，并记录 operator / trace / audit metadata。
- access package 只冻结 owner，不在当前阶段冻结通用 shape。

契约见 [onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md) 与 [tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)。

## 11. External Interfaces

典型上游入口：

- `api-gateway`
- `auth-service`
- `identity-service`
- `tenant-org-service`
- `hr-service`
- 平台服务与业务服务

典型契约位置：

- [permission-service/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
- [permission-service/terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)
- [permission-service/onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md)
- [permission-service/tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)
- [api-gateway/permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- [api-gateway/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
- [api-gateway/navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)

## 12. Upstream Dependencies

- `identity-service`
  - 提供账号存在性、账号 scope、tenant 引用、operator 身份上下文等事实。
- `auth-service`
  - 提供认证链路与 session/token 调用时机，并消费 terminal access 判定。
- `tenant-org-service`
  - 发起 tenant onboarding grant 请求，但不拥有 grant 真相。
  - `Tenant` 与 onboarding 编排边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- `hr-service`
  - 发起 employee onboarding grant 请求，但不拥有 grant 真相。
- 业务服务
  - 提供资源归属、业务状态与领域规则事实，供资源授权链路消费。

## 13. Published Facts

- permission catalog 与 permission 引用关系。
- role、role template、role instance 与 account-role grant 事实。
- 授权是否通过及其 reason / explain 语义。
- 当前账号 effective roles 与 action codes。
- 当前 account / scope / terminal 的 terminal access 判定。
- 当前 role / scope / terminal 的 navigation visibility 与 default entry。
- onboarding 初始授权 grant 结果。

## 14. Non-goals

- 不拥有用户、租户、组织、员工、Party、session 或业务资源主数据。
- 不在 Gateway、DTO、前端或其他服务中复制本服务内部 role / policy 模型。
- 不让其他服务直接写 account-role 或 role-permission 绑定。
- 不替代业务域自己的 domain rule。
- 不把 policy 当作业务流程状态机。
- 不把 navigation governance 扩展为菜单树、route、icon、layout 或终端 UI 配置中心。
- 不把 terminal access 与 navigation visibility 混为同一套规则。
- 不把历史 `CheckPermissionWithContext` 扩展为新业务资源授权标准入口。

## 15. Related References

- [07-permission-code-source.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
- [09-role-based-permission-resolution.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/09-role-based-permission-resolution.md)
- [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
- [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
- [0002-system-role-instance-and-account-role-scope.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0002-system-role-instance-and-account-role-scope.md)
- [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md)
