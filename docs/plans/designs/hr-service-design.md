# hr-service Design

## 1. 目标

- 收敛 `hr-service` 的完整服务设计，明确 Employee、Employment、任职组织、岗位、汇报关系与员工生命周期边界。
- 明确 `hr-service` 与 `party-service`、`tenant-org-service`、`identity-service`、`permission-service` 的协同契约。
- 为后续独立 thread 推进 HR feature packet 与实现提供恢复入口。

> 说明：截至 2026-04-23，minimum 第一阶段冻结结果已开始回写到
> [hr-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/hr-service-foundation.md)
> 与相关协同 / contract 文档。本 workspace 继续承担开放问题与后续扩展设计，不再作为 minimum 正式真相源。

## 2. 当前范围

- 本 workspace 负责：
  - `Employee`
  - `Employment`
  - 主组织、兼任组织、任职区间
  - 岗位、组织负责人、汇报关系的边界
  - 员工 onboarding 中 HR 所属步骤
  - 与 `party-service`、`tenant-org-service`、`identity-service`、`permission-service` 的契约接缝
- 本 workspace 不负责：
  - 自然人主体主数据
  - tenant / org tree 真相
  - 账号认证、会话、token
  - 角色、权限、policy 真相
  - payroll、attendance、performance、recruiting 等重 HR 子域

## 3. 涉及对象

- services:
  - `hr-service`
  - `party-service`
  - `tenant-org-service`
  - `identity-service`
  - `permission-service`
  - `api-gateway` / BFF
- frontend areas:
  - 员工管理
  - 员工与账号
  - 员工任职 / 组织归属
  - 调岗 / 兼任 / 离职

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-22 | `hr-service` 拥有 Employee / Employment / 正式任职事实。 | HR 服务职责、员工组织归属 owner | `docs/architecture/services/hr-service.md` |
| 2026-04-22 | 员工创建必须引用 `party-service` 的自然人主体，不复制自然人主数据。 | Employee 模型、onboarding flow | `hr-service` contracts / `party-service` contracts |
| 2026-04-22 | Employment 引用 `tenant-org-service` 的 `tenantId / orgUnitId`，不维护自己的组织树。 | HR 与组织边界 | `hr-service` contracts |
| 2026-04-22 | Account 与登录能力由 `identity-service` 拥有；HR 只发起或展示绑定结果。 | 员工与账号入口 | `identity-service` binding contract |
| 2026-04-22 | 初始角色授予由 `permission-service` 拥有，HR 不写角色绑定。 | 可登录员工 onboarding | `permission-service` onboarding contract |

## 5. 核心职责

### 5.1 Employee

- 表达某个自然人在某个 tenant 内是否构成员工 / 工作人员。
- 引用 `partyId / tenantPartyId`，不复制自然人主数据。
- 管理员工编号、员工状态、入职时间、离职时间等 HR 语义。

### 5.2 Employment

- 表达员工在组织中的正式任职事实。
- 引用 `tenantId / orgUnitId`。
- 维护主组织、兼任组织、临时任职、任职区间。
- 支撑调岗、借调、兼任、离职等生命周期变化。

### 5.3 Position / Reporting Line

- 第一版可先冻结边界，不一定完整实现。
- 目标 owner 在 `hr-service`。
- `tenant-org-service` 不维护组织负责人、岗位或汇报关系。

## 6. 关键使用场景

### 6.1 创建员工但不允许登录

- `party-service` 创建或复用自然人 `Party(Person)` 与 `TenantParty`。
- `hr-service` 基于 `partyId / tenantPartyId` 创建 `Employee`。
- `hr-service` 创建 `Employment`，引用 `orgUnitId`。
- 不创建 account。
- 不赋予角色。
- 适用于暂不开通系统账号的员工、外部劳务、临时人员。

### 6.2 创建员工且允许登录

- `party-service` 创建或复用自然人主体。
- `hr-service` 创建 `Employee` 与 `Employment`。
- `identity-service` 创建或绑定 account，并建立 `Account -> Employee` 映射。
- `permission-service` 为 account 授予初始角色。
- 若 account 或 role 步骤失败，不得污染 `Party / Employee` 真相；需要 onboarding 状态或补偿流程。

### 6.3 员工调岗 / 兼任

- `hr-service` 更新主组织、兼任组织或任职区间。
- `tenant-org-service` 消费任职变化，刷新运行时 org scope 输入或投影。
- 报表、审批、业务查询使用新的组织范围。

### 6.4 报销申请

- `hr-service` 提供员工正式归属组织候选。
- 业务单据提交时冻结 `submitOrgId / ownerOrgId`。
- `tenant-org-service` 校验组织引用并提供组织范围。
- future workflow 按冻结 org 路由。

## 7. 协同契约待冻结

- `party-service -> hr-service`：
  - 创建 / 复用 `Party(Person)`
  - 创建 / 复用 `TenantParty`
  - Employee 引用 `partyId / tenantPartyId`
- `tenant-org-service -> hr-service`：
  - 校验 `tenantId / orgUnitId`
  - 查询 org 摘要供员工任职表单展示
- `hr-service -> tenant-org-service`：
  - 发布或提供 Employment 变更事实
  - 支撑 org scope 的 `HR_DERIVED` 输入
- `identity-service <-> hr-service`：
  - account / employee binding
  - 员工详情展示账号摘要
- `permission-service`：
  - 可登录员工的初始角色授予

## 8. 明确不做

- 不维护组织树。
- 不维护 tenant 主数据。
- 不维护自然人 party 主数据。
- 不拥有 account、session、token。
- 不写角色、权限、policy。
- 不直接实现审批引擎或报表指标。

## 9. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-22 | Employee onboarding 编排 owner 是 BFF、`hr-service` application service，还是 future workflow？ | 创建 party、employee、account、role 跨多个 owner，需要明确失败补偿。 | 设计 onboarding contract。 |
| 2026-04-22 | `Account -> Employee` 映射由 `identity-service` 持久化，HR 是否只发起绑定命令？ | 需要平衡员工管理入口与身份 owner。 | 冻结 binding contract。 |
| 2026-04-22 | 初始角色来自人工选择、模板，还是岗位 / 组织推导？ | 影响前端表单、permission contract 与审计。 | 冻结 role assignment policy。 |

## 10. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/hr-service.md`
- 协同蓝图：
  - `docs/architecture/collaborations/employee-onboarding.md`
- contracts：
  - `docs/contracts/hr-service/**`
  - `docs/contracts/identity-service/employee-binding.md`
  - `docs/contracts/permission-service/onboarding-grant.md`
- feature packet：
  - `docs/plans/features/hr-service-foundation.md`

## 11. 恢复入口

- 下次继续前先读：
  - `docs/architecture/services/hr-service.md`
  - `docs/architecture/services/party-service.md`
  - `docs/architecture/services/tenant-org-service.md`
  - `docs/architecture/services/identity-service.md`
  - `docs/architecture/services/permission-service.md`
  - 本 workspace
- 当前推荐下一步：
  - 基于 feature packet 推进 minimum contract 细化。
  - 在总控线程判断后决定是否进入 `hr-service minimum implementation`。
