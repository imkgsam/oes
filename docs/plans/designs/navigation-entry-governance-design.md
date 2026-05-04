# Navigation Entry Governance Design

## 1. 目标

- 为 OES navigation entry 持久化与管理页面建立设计工作台。
- 将当前讨论确认的方向沉淀为可接续的设计过程记录。
- 明确导航治理以 `role` 为配置中心，而不是以后端菜单树或用户个人偏好为中心。
- 在进入 feature packet、contract 或 architecture 回写前，先记录已冻结判断、开放问题与回写目标。

## 2. 当前范围

本 workspace 负责：

- Navigation entry registry 的职责边界。
- Role 维度的 entry 可见性配置。
- Role 维度的 default landing entry 配置。
- `defaultEntry` 运行时解析原则。
- 后端导航真相与前端终端呈现之间的责任边界。

本 workspace 不负责：

- 直接实现前端管理页面。
- 直接新增 BFF / gRPC / service / Prisma 代码。
- 直接修改 `navigation-summary` 稳定 contract。
- 后端持久化 Web route、菜单层级、icon、layout 或 terminal-specific UI 配置。
- 用户个人 landing page 偏好配置。
- account 级 landing override。
- feature / plugin enablement 模型；该方向已永久后置，当前系统暂不继续向租户级模块化设计演进。
- 复杂 policy expression 引擎。

## 3. 涉及对象

- services:
  - `api-gateway`
  - `permission-service`
- features:
  - future `navigation-entry-management`
  - role management
  - tenant-web shell navigation
- collaborations:
  - authorization decision flow
  - unified web account context
  - gateway / BFF navigation summary

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-18 | Navigation 管理页面不应设计成后端统一菜单树管理；后端不持久化 Web route、菜单层级、icon、layout 作为跨端真相。 | architecture / frontend boundary | `docs/contracts/api-gateway/navigation-summary.md` + feature packet |
| 2026-04-18 | 导航治理应拆为 `Entry Registry`、`Role Navigation Visibility`、`Role Landing Policy` 三块。 | domain model / management UI | feature packet + possible architecture note |
| 2026-04-18 | Role 管理是导航配置的主入口；系统管理员在 role 上配置可见 entries 与 default landing entry。 | product behavior / management UI | feature packet |
| 2026-04-18 | 用户不支持自定义 landing page；landing entry 是岗位 / role 工作入口治理，不是个人偏好。 | product behavior / governance | feature packet |
| 2026-04-18 | Role default landing entry 必须来自该 role 可见 entry 集合；landing 配置不能授予可见性或权限。 | runtime resolver / validation | contract + feature packet |
| 2026-04-18 | BFF 对前端仍只输出 `navigation.visibleEntries` 与 `navigation.defaultEntry` 作为稳定导航摘要。 | BFF contract / frontend consumption | `navigation-summary` contract |
| 2026-04-18 | 前端继续拥有 `entryKey -> route / menu / icon / layout` 映射，且只负责本端呈现。 | frontend architecture | tenant-web feature packet |
| 2026-04-18 | 第一阶段由 `permission-service` 承载 `NavigationEntry Registry`、`RoleNavigationVisibility`、`RoleLandingPolicy` 的治理真相；BFF 只消费与聚合，不持久化导航治理规则。 | service ownership / runtime boundary | architecture service doc + feature packet |
| 2026-04-18 | 多 role landing 冲突第一阶段使用 `RoleLandingPolicy.priority` 解决，而不是 `role assignment priority`。 | runtime resolver / management semantics | feature packet + contract note |
| 2026-04-18 | feature / plugin enablement 不进入真实 visibility 过滤链路。 | runtime resolver / scope control | backlog + feature packet |
| 2026-04-20 | feature / plugin enablement 已永久后置；当前系统暂不继续向租户级模块化设计演进。 | product / architecture direction | backlog + feature packet |
| 2026-04-18 | 管理面采用双层结构：系统级 `Navigation Entry` 管理页负责 registry，Role 详情页中的 `Navigation` tab 负责 visibility 与 landing 配置。 | management UI / operator workflow | feature packet |
| 2026-04-18 | 第一阶段推荐增加 resolver preview 能力，供管理员在配置 role navigation 后预览最终 `visibleEntries` 与 `defaultEntry`。 | admin troubleshooting / management API | feature packet + management contract |
| 2026-04-18 | 第一阶段管理接口继续放在现有 `permission-management` 管理薄代理体系内，不新增独立 BFF；推荐在同一 contract 中新增 `navigation-entry` 与 `role-navigation` 分组。 | contract organization / gateway ownership | `permission-management` contract + feature packet |
| 2026-04-18 | `resolver preview` 第一阶段应作为正式管理 API 暴露，而不是只藏在 role 页面本地编排里。 | operability / automated verification | management contract + feature packet |
| 2026-04-18 | `resolver preview` 第一阶段正式接口应支持多 role 组合输入；Role 页面做单 role 预览时复用同一接口并传单元素 `roleIds[]`。 | preview API boundary / runtime fidelity | management contract + feature packet |

## 5. 推荐第一阶段模型草案

> 这里不是最终 contract 或 schema；冻结后应迁入 feature packet、contract 或 architecture。

### 5.1 NavigationEntry

- `entryKey`
- `name`
- `description`
- `featureKey`
- `supportedTerminals`
- `registryPriority`
- `enabled`
- `entryType`
  - page
  - workspace
  - task
  - abstract

### 5.2 RoleNavigationVisibility

- `roleId`
- `entryKey`
- `scopeLevel`
- `terminal`
- `enabled`

### 5.3 RoleLandingPolicy

- `roleId`
- `scopeLevel`
- `terminal`
- `defaultEntryKey`
- `priority`
- `enabled`

约束：

- `defaultEntryKey` 必须存在于 `NavigationEntry`。
- `defaultEntryKey` 必须被同一 role 的 visibility policy 允许。
- `defaultEntryKey` 必须支持当前 terminal。
- 禁止通过 landing policy 绕过 visibility policy。
- 禁止通过 landing policy 授予 action authorization 或 data authorization。

## 6. 运行时解析草案

推荐解析顺序：

1. 根据 enabled entries、scope、terminal、role visibility 解析 `visibleEntries`。
2. 根据当前 account 的 roles 解析 role landing candidates。
3. 删除不在 `visibleEntries` 中的 landing candidates。
4. 按 `RoleLandingPolicy.priority` 选择 `defaultEntry`。
5. 如果没有可用 landing candidate，则选择 registry priority 最高的 visible entry。
6. 如果仍无可用 entry，则按 scope fallback 到 `workbench.home` 或 `platform.home`。
7. feature / plugin enablement 不参与过滤链路；未来如需反转必须先新增 architecture / ADR。

伪代码：

```ts
const visibleEntries = resolveVisibleEntries(operator, accountContext, terminal)
const landingCandidates = resolveRoleLandingCandidates(operator.roles, accountContext.scopeLevel, terminal)
const visibleLandingCandidates = landingCandidates.filter((candidate) =>
  visibleEntries.includes(candidate.entryKey),
)

const defaultEntry =
  pickByRoleLandingPriority(visibleLandingCandidates) ??
  pickByRegistryPriority(visibleEntries) ??
  fallbackByScope(accountContext.scopeLevel)
```

## 7. 管理页面方向草案

第一阶段推荐采用双层管理面，而不是单一的“菜单配置中心”：

- Navigation Entry 管理：
  - 管理 entry registry。
  - 维护 entry key、名称、说明、所属 feature、支持终端、状态、registry priority。
  - 只负责全局稳定 entry 治理，不在这里配置 role visibility 或 landing。
- Role 管理中的 Navigation 配置 tab：
  - 配置该 role 可见 entries。
  - 配置该 role 在不同 scope / terminal 下的 default landing entry。
  - 配置 `RoleLandingPolicy.priority`。
  - 提供 resolver preview，帮助管理员理解最终 `visibleEntries / defaultEntry`。

页面提示语义：

- default landing 只决定进入系统后的默认落点。
- default landing 不授予 entry 可见性。
- default landing 不授予按钮操作权限或数据权限。
- 用户不可自定义 landing page。

推荐页面布局：

- `Navigation Entry` 页面：
  - 列表与详情编辑。
  - 基础过滤：`entryKey / featureKey / terminal / enabled`。
  - 适合系统管理员维护 registry 元数据。
- `Role Detail > Navigation`：
  - `Visible Entries` 区块：
    - 维护该 role 当前可见 entries 集合。
  - `Landing Policies` 区块：
    - 按 `scopeLevel + terminal` 配置默认 landing entry 与 priority。
    - 只允许从当前 role 可见 entries 中选择。
  - `Preview` 区块：
    - 选择 `scopeLevel + terminal`，展示最终 `visibleEntries` 与 `defaultEntry`。

## 7.1 第一阶段管理接口草案

> 这里是管理面方向建议，不是最终 HTTP / gRPC contract。

推荐继续沿用现有 `permission-management` 的管理薄代理风格，围绕四组能力组织接口，而不是拆成大量细碎的单条 add/remove API。

contract 组织建议：

- `navigation-entry` 组：
  - 负责 registry 元数据管理。
- `role-navigation` 组：
  - 负责 role visibility、landing policy 与 role 维度预览。
- `navigation-resolver` 组：
  - 若 preview 做成全局通用接口，可在同一管理 contract 下作为独立分组存在。
- 不建议：
  - 为 navigation governance 单独再建一套 BFF 编排 contract。
  - 把 entry registry 写进 `auth-bff` 自助会话上下文 contract。

### Entry Registry

- `GET /navigation/entries`
- `POST /navigation/entries`
- `GET /navigation/entries/:entryKey`
- `PATCH /navigation/entries/:entryKey`

第一阶段建议：

- 支持启用 / 禁用，不急于提供真正删除。
- 避免 entry 被 role visibility 或 landing policy 引用后出现悬空删除问题。

### Role Navigation Visibility

- `GET /roles/:roleId/navigation`
- `PUT /roles/:roleId/navigation/visibility`

第一阶段建议：

- 使用“整组覆盖式保存”管理 role 可见 entries，而不是逐条增删接口优先。
- 服务端应校验 entry 是否存在、是否 enabled、是否支持目标 terminal。

### Role Landing Policy

- `PUT /roles/:roleId/navigation/landing-policies`

第一阶段建议：

- 以 `scopeLevel + terminal` 为键提交整组 landing policies。
- 服务端应校验：
  - `defaultEntryKey` 存在；
  - `defaultEntryKey` 属于该 role 可见 entries；
  - `defaultEntryKey` 支持目标 terminal。

### Resolver Preview

- `POST /navigation/resolve-preview`

输入建议：

- `roleIds`
- `scopeLevel`
- `terminal`

第一阶段建议：

- 正式输入模型直接支持多 role 组合，而不是只支持单 role。
- Role 页面中的单 role 预览不需要单独新接口，直接传单元素 `roleIds[]`。
- 这样 preview 可直接覆盖真实账号上下文常见的“多角色组合解析”场景。

输出建议：

- `visibleEntries`
- `defaultEntry`
- optional `resolvedByRoleId`
- optional `fallbackReason`

## 7.2 权限控制建议

第一阶段推荐延续现有权限管理接口的风格：

- role 详情相关读取走 `permission.role_instance.get_by_id`
- role 配置修改走 `permission.role_instance.update`
- 全局 entry registry 读取 / 修改使用新的 navigation management permission codes
- 全局 preview 若允许输入任意 role 组合，建议使用独立 preview permission code

推荐权限码方向：

- `permission.navigation.entry.list`
- `permission.navigation.entry.get_by_key`
- `permission.navigation.entry.create`
- `permission.navigation.entry.update`
- `permission.navigation.resolve_preview`

推荐映射：

- `GET /navigation/entries`
  - `checkPermission(permission.navigation.entry.list)`
- `POST /navigation/entries`
  - `checkPermission(permission.navigation.entry.create)`
- `GET /navigation/entries/:entryKey`
  - `checkPermission(permission.navigation.entry.get_by_key)`
- `PATCH /navigation/entries/:entryKey`
  - `checkPermission(permission.navigation.entry.update)`
- `GET /roles/:roleId/navigation`
  - `checkPermission(permission.role_instance.get_by_id)`
- `PUT /roles/:roleId/navigation/visibility`
  - `checkPermission(permission.role_instance.update)`
- `PUT /roles/:roleId/navigation/landing-policies`
  - `checkPermission(permission.role_instance.update)`
- `POST /navigation/resolve-preview`
  - `checkPermission(permission.navigation.resolve_preview)`

## 8. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-18 | entry registry 是否允许租户级启停？ | entry 级启停容易变成租户自定义菜单树，并重新引入当前已永久后置的模块启用语义。 | 维持系统级 entry enabled；租户级 entry 启停不进入当前路线图。 |
| 2026-04-18 | `Navigation Entry` 管理页是否需要完整 CRUD，还是首期只允许 create/update/enable-disable？ | 真实删除会牵涉 role visibility、landing policy、审计与历史 contract 演化。 | 推荐第一阶段只做 create/update/enable-disable，删除后置。 |

## 9. 真相源回写计划

- 服务职责：
  - 需要回写 `docs/architecture/services/permission-service.md`，明确其第一阶段承载 navigation governance truth，但不拥有 terminal-specific UI 呈现配置。
- 协同蓝图：
  - 如导航解析跨 `permission-service`、feature registry、BFF，需要补充 collaboration 文档。
- contracts：
  - 更新 `docs/contracts/api-gateway/navigation-summary.md`，明确 role landing policy 对 `defaultEntry` 的影响，但不改变响应形状。
  - 扩展 `docs/contracts/api-gateway/permission-management.md`，增加 `navigation-entry`、`role-navigation`、`navigation-resolver` 分组。
- feature packet：
  - 冻结后新增 `docs/plans/features/navigation-entry-management.md`。
- architecture / ADR：
  - feature / plugin enablement 当前永久后置；未来如需接入导航主链，必须先新增 architecture / ADR 反转当前决策。

## 10. 恢复入口

下次继续前先读：

- `docs/contracts/api-gateway/navigation-summary.md`
- `docs/contracts/api-gateway/permission-management.md`
- `docs/architecture/services/permission-service.md`
- `docs/architecture/15-authorization-layering-and-resource-policy-architecture.md`
- `docs/architecture/16-unified-web-account-context-architecture.md`
- `docs/plans/backlog.md#3-platform-deferred`

当前推荐下一步：

- 先转成 `navigation-entry-management` feature packet。
- 再回写 `permission-management` 与 `navigation-summary` contract。
- 同步补充 `permission-service` 服务职责文档中的 navigation governance ownership。
