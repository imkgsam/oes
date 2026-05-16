# tenant-org-service 职责卡

## 1. Purpose

`tenant-org-service` 是 OES 的租户边界与组织结构真相服务，负责回答“这个 tenant 是什么、tenant 内部如何组织、某个组织引用是否合法、组织层级应如何被解析”。

## 2. Owns

- `Tenant` 真相
- `OrgUnit`、组织树与层级结构真相
- 组织节点类型、组织路径、祖先 / 子孙关系与排序
- 业务对象 `ownerOrgId / submitOrgId / responsibleOrgId` 等组织引用的合法性校验基础
- 组织节点与现实世界 `organization party` 的可选受控关联

## 3. Does Not Own

- 自然人或法定组织主体主数据真相
- 账号认证、会话、登录链路与联系方式资产真相
- `User / UserAccount` 身份映射真相
- account 到 org 的长期归属真相
- `Employee / Employment` 与员工任职真相；这些以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 角色、权限、policy 与授权判定真相
- 客户、供应商、订单、审批实例等业务资源真相

## 4. Core Responsibilities

- 提供 tenant 创建、启停、归档与租户基础标识治理能力
- 提供租户内部组织树、部门、小组、分公司等组织结构治理能力
- 提供组织路径、祖先、子孙、同级等层级解析能力
- 为业务服务、Workflow、Reporting 提供组织引用校验与层级遍历基础
- 为 `hr-service` 提供可被正式任职关系引用的 `OrgUnit` 真相；HR 任职设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 在必要时允许组织节点受控关联到 `party-service` 的 organization party，但不替代主体主数据
- `organizationPartyId` 的基础语义是“组织节点对现实世界 organization party 的可选正式引用”，不是所有 `OrgUnit` 都默认拥有的字段语义
- 当前第一阶段只允许 `ROOT` 与 `BRANCH` 节点持有 `organizationPartyId`；`DEPARTMENT`、`TEAM`、`OTHER` 不得绑定 organization party
- `tenant-org-service` 负责在写入口校验 `organizationPartyId` 是否可被当前节点类型持有，并通过 `party-service` 只读 query 校验目标主体是否存在、是否为可绑定的组织主体、以及是否处于可引用状态；组织主体边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- 拥有 tenant onboarding process manager 状态，负责编排创建 tenant、root org、organization party、first admin account、first admin employee 与初始访问权；下游事实仍由各 owner service 拥有

## 5. Core Model

`Tenant` 是租户边界事实：

- `id`
- `code`
- `name`
- `status`
- `rootOrgId`
- `createdAt / updatedAt`

`OrgUnit` 是租户内部组织节点事实：

- `id`
- `tenantId`
- `parentOrgId`
- `name`
- `type`
- `status`
- `path`
- `depth`
- `sortOrder`
- optional `organizationPartyId`

`TenantOnboardingRun` 是 onboarding process manager 状态：

- 记录 onboarding run、step、失败原因、外部引用与重试状态
- 不替代 party、identity、auth、HR 或 permission 的 owner 数据
- 通过幂等 key 与 request fingerprint 保证重复调用可恢复

`OrgScope` 当前只作为长期能力名保留；本服务当前只拥有组织树层级解析与 org reference validation，不拥有由人员任职派生的正式人员范围。

## 6. Interface Surface

Query 能力：

- `GetTenantById`
- `ListTenants`
- `GetOrgTreeByTenantId`
- `GetOrgUnitById`
- `ValidateOrgReference`
- `GetOrgReferenceSummary`
- `ListAncestorOrgUnits`
- `ListDescendantOrgUnits`

Management 能力：

- `CreateTenant`
- `StartTenantOnboarding`
- `GetTenantOnboarding`
- `RetryTenantOnboarding`
- `UpdateTenantProfile`
- `SuspendTenant`
- `ReactivateTenant`
- `ArchiveTenant`
- `CreateOrgUnit`
- `UpdateOrgUnit`
- `MoveOrgUnit`
- `ArchiveOrgUnit`

接口字段、错误语义与调用上下文以 [tenant-org-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/README.md) 为准；contracts 只能描述黑盒接口语义，不重新定义本服务核心边界。

## 7. Migration / Current State

- `Tenant` 与 org tree owner 已从 `identity-service` 收敛到 `tenant-org-service`。
- `identity-service` 不再拥有 tenant / org 真相；只保留 `tenantId / orgId` 作为身份上下文、引用或审计字段。
- `identity-service` legacy account-org membership 查询与管理契约不迁入 `tenant-org-service`。
- `api-gateway`、`auth-service`、`identity-service` 等调用方如需 tenant lifecycle、tenant 摘要或 org tree 事实，应通过 `tenant-org-service` 消费。

## 8. External Interfaces

- 典型上游入口：`api-gateway`、`auth-service`、`identity-service`、`hr-service`、业务服务
- 典型下游消费方：
  - 需要 tenant 摘要与组织树的 BFF / 前端聚合层
  - 需要组织引用校验与层级解析的业务服务
  - 需要以 `OrgUnit` 为结构基础的 `hr-service`

## 9. Upstream Dependencies

- `identity-service`
  - 提供 `userId / accountId / tenantId` 等身份侧引用事实
- `party-service`
  - 在组织节点需要受控关联现实世界组织主体时提供上游主体事实
- `hr-service`
  - 在需要基于正式员工任职形成 org-based scope 时提供人员任职事实；服务边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- `permission-service`
  - 提供 tenant-org 管理 / 查询权限判定、tenant onboarding 初始角色实例与账号授权事实

## 10. Downstream / Published Facts

- tenant 基础摘要
- 租户内部组织树与组织节点元数据
- 组织节点祖先、子孙、同级与路径等层级解析事实
- 业务对象组织引用是否合法的校验结果
- 组织节点与法定组织主体之间的受控关联结果
- tenant onboarding run 状态、步骤结果与外部引用摘要

## 11. Authorization Boundary

- `tenant-org-service` 不拥有角色、权限、policy 与授权判定真相；这些以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准
- `TenantOrgManagementService` 当前通过 internal service、authenticated operator 与 `PermissionGuard` 保护，并按 tenant / org 管理权限码逐接口授权
- `TenantOrgQueryService` 当前对租户列表、组织树、组织节点详情与层级遍历等人类可见查询接口执行 internal service、authenticated operator 与 `PermissionGuard`；`GetTenantById` 与组织引用校验类接口保留为 internal service 受控能力，不重新定义业务使用权
- onboarding 过程中需要创建初始 tenant 角色或授予 first admin 访问权时，`tenant-org-service` 只调用 `permission-service` 契约，不直接拥有 RBAC 真相

## 12. Non-goals

- 不直接承接认证、会话、令牌或账号凭证逻辑
- 不直接拥有自然人 / 法定组织主体主数据
- 不维护 `UserAccount`、contact assets 或 available account contexts
- 不拥有 account 到 org 的归属真相
- 不拥有 `Employee / Employment`、岗位、汇报关系或薪酬考勤等 HR 语义；这些以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 不在本服务内直接实现业务域自己的订单、客户、供应商或审批规则
- 不把“哪些场景必须关联 organization party”上升为通用 org tree 规则；如 future 场景需要必填，应由对应协同 contract 单独冻结
