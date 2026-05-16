# Navigation Entry Management

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只记录 Navigation Entry Management feature 的范围、执行状态与验收要求；NavigationEntry、RoleNavigationVisibility、RoleLandingPolicy 的 owner、命名和长期边界不在本文重复定义。

## 1. 目标

- 提供 OES 第一阶段的 navigation governance 管理闭环。
- 建立稳定的 `NavigationEntry Registry`、`RoleNavigationVisibility`、`RoleLandingPolicy` 管理面，而不是引入后端统一菜单树配置。
- 让系统管理员能够管理稳定 entry、为 role 配置可见 entries，并为 role 配置默认 landing entry。
- 保持当前导航边界不变：BFF 只输出 `navigation.visibleEntries` 与 `navigation.defaultEntry`，前端继续维护 `entryKey -> route / menu / icon / layout` 映射。

## 2. 不做什么

- 不做后端统一菜单树管理。
- 不持久化 Web route、菜单层级、icon、layout 或 terminal-specific UI 配置。
- 不做用户个人 landing page 偏好配置。
- 不做 account 级 landing override。
- 不把 feature / plugin enablement 接入真实 visibility 过滤链路；当前系统暂不继续向租户级模块化设计演进。
- 不新增独立 navigation BFF；管理接口继续放在现有 `permission-management` 管理薄代理体系内。
- 不在第一阶段做 entry 真删除；优先 create / update / enable-disable。
- 不开放复杂 policy expression 引擎。

## 3. 上游依赖

- architecture:
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
- contracts:
  - [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- plans:
  - navigation entry governance 的设计过程已回写到 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)、[navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md) 与 [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)，不再保留独立 design workspace。
  - [role-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/role-management.md)

## 4. 当前结论

- 当前 feature 的目标是“navigation governance 管理闭环”，不是“菜单后台配置中心”。
- Navigation governance 的 owner、核心对象、解析规则与非目标以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- BFF 响应形状与默认入口解析 contract 以 [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md) 为准。
- 管理接口分组以 [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md) 为准。
- tenant 侧 `组织与人员` dedicated entry 是本 feature 的消费结果之一，不改变 tenant-org / HR / identity 的服务边界；HR `Employee / Employment` 设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。

## 5. 契约真相位置

- 当前导航摘要真相：
  - [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
- 当前权限管理真相：
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- 当前 feature 预期新增或扩展的管理 contract 分组：
  - `navigation-entry`
  - `role-navigation`
  - optional `navigation-resolver`
- 当前 feature 完成后，稳定契约应至少覆盖：
  - `GET /navigation/entries`
  - `POST /navigation/entries`
  - `GET /navigation/entries/:entryKey`
  - `PATCH /navigation/entries/:entryKey`
  - `GET /roles/:roleId/navigation`
  - `PUT /roles/:roleId/navigation/visibility`
  - `PUT /roles/:roleId/navigation/landing-policies`
  - `POST /navigation/resolve-preview`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结 navigation governance 第一阶段边界、feature packet 与 contract 方向 | `docs/plans/features/navigation-entry-management.md`, 必要时 `docs/plans/backlog.md` | 服务真相源、现有 navigation / permission 管理 contract | feature packet 与 contract 方向结论 | completed |
| contract / architecture owner | 回写 `permission-management`、`navigation-summary` 与 `permission-service` 服务职责文档 | `docs/contracts/api-gateway/**`, `docs/architecture/services/**` | 当前 feature packet、服务真相源与 contract | 冻结后的管理 contract 与服务职责收口 | pending |
| implementation owner | 实现 permission-service / api-gateway / tenant-web 第一阶段 navigation management 闭环 | `src/services/system/permission-service/**`, `src/services/api-gateway/**`, `app/web/apps/tenant-web/**` | 当前 feature packet、冻结后的 contract | 可运行实现与验证结果 | completed |
| review / integration owner | 检查实现是否越界进入菜单树、个人偏好或 feature/plugin enablement，并验证 session context 导航解析链路 | 只读全局，必要时最小修正 | feature packet、contract、实现结果、验证结果 | review 结论与关闭判断 | pending |

## 7. 当前 slice

- slice:
  - Navigation Entry Management 第一阶段 feature packet 冻结
- status:
  - implementation-complete
- scope:
  - `NavigationEntry Registry`
  - `RoleNavigationVisibility`
  - `RoleLandingPolicy`
  - `resolver preview`
  - 双层管理面：`Navigation Entry` 页面 + `Role Detail > Navigation`
  - session context 中 role-driven `visibleEntries / defaultEntry` 解析主链
- ready definition:
  - 已确认 navigation governance 不做后端菜单树
  - 已确认第一阶段 ownership 落在 `permission-service`
  - 已确认多 role landing 冲突规则
  - 已确认管理 contract 继续放在 `permission-management`
  - 已确认 preview 正式暴露并支持多 role

## 8. 主线范围

- 当前主线任务：
  - 以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 作为服务设计真相源，推进 permission-service、api-gateway、tenant-web 的第一阶段实现。
  - 以 [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md) 作为管理 contract。
  - 以 [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md) 作为 BFF 输出 contract。
- 本线程不做：
  - 独立 navigation BFF
  - 用户个人 landing 配置
  - account 级 landing override
  - feature/plugin enablement 接入 visibility
  - entry 真删除
  - 统一菜单树 / route / icon 管理
- 偏移返回条件：
  - 需要改变 `navigation-summary` 基本响应形状
  - 需要让后端持久化 terminal-specific UI 配置
  - 需要改变 `permission-service` 与 BFF 的职责边界
  - 需要把 feature/plugin enablement 接入主链

## 9. 阻塞 / 依赖

- 当前 `navigation-summary` 已纳入 role landing policy 与 runtime resolver 说明。
- 当前 `permission-management` contract 已包含 `navigation-entry`、`role-navigation`、`navigation-resolver` 分组。
- 当前 `permission-service` 服务职责文档已承认第一阶段 navigation governance ownership。
- 当前系统已存在 navigation entry registry、role navigation visibility、role landing policy 的持久化与管理 API。
- tenant-web 已存在第一版 Navigation Management 页面，包含 entry registry、role navigation JSON 编辑与 resolver preview；后续仍可演进为 Role Detail 内嵌 tab。
- tenant-web 已将租户侧 `组织与人员` 统一入口挂到 dedicated `entryKey`，并保留 legacy route 的兼容跳转，不再把成员页 / 部门页 visibility 直接绑定到旧入口 key。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-18 | navigation governance 是否会滑向后端菜单树管理 | Blocker-Now | 若不先卡住边界，后续 contract 与实现会把 Web IA 强塞进后端真相 | 已确认第一阶段只治理 entry / visibility / landing，不持久化 route/menu/icon/layout | 当前 feature packet | closed |
| 2026-04-18 | navigation governance 归属哪个服务 | Blocker-Now | 若 ownership 不清，BFF、permission-service、前端都可能复制规则 | 已确认第一阶段由 `permission-service` 承载治理真相，BFF 只消费与聚合 | 当前 feature packet + service doc | closed |
| 2026-04-18 | 多 role landing 冲突规则 | Blocker-Now | 若规则未冻结，`defaultEntry` 解析会不稳定 | 已确认使用 `RoleLandingPolicy.priority` | 当前 feature packet + contract | closed |
| 2026-04-18 | preview 是否只做页面内编排 | Blocker-Now | 若没有正式 preview API，管理页和排障工具会复制 resolver 逻辑 | 已确认首期正式暴露 `resolver preview` 管理 API | 当前 feature packet + contract | closed |
| 2026-04-18 | entry registry 是否允许租户级启停 | Blocker-Later | 若允许，会把导航治理变成租户自定义菜单树，并重新引入当前已永久后置的模块启用语义 | 维持系统级 entry enabled，不推进租户级 entry 启停 | 当前 feature packet | closed |
| 2026-04-18 | entry 是否提供真删除 | Blocker-Later | 真删除会引入引用完整性、审计与历史 contract 演化问题 | 第一阶段只做 create/update/enable-disable，删除后置 | 后续 feature / backlog | open |
| 2026-04-18 | feature/plugin enablement 何时进入 visibility 主链 | Sidecar | 当前系统暂不继续向租户级模块化设计演进 | 永久后置；除非未来 ADR 反转，否则不进入 navigation visibility 主链 | [backlog.md](/Users/acehood/Documents/GitHub/oes/docs/plans/backlog.md) | closed |

## 11. 验收标准

- 系统管理员可以管理稳定的 navigation entries，而不是管理后端菜单树。
- 系统管理员可以为 role 配置可见 entries。
- 系统管理员可以为 role 在不同 `scopeLevel + terminal` 下配置 default landing entry。
- role default landing entry 只能从该 role 可见 entries 中选择。
- 用户不具备个人 landing page 自定义能力。
- `resolver preview` 可以返回某组 `roleIds + scopeLevel + terminal` 的最终 `visibleEntries` 与 `defaultEntry`。
- `resolver preview` 支持多 role 组合输入。
- BFF `session/context` 继续只输出 `navigation.visibleEntries` 与 `navigation.defaultEntry`，不输出统一菜单树。
- tenant-web 继续本地维护 `entryKey -> route/menu/icon/layout` 映射，不把这些配置回写到后端。

## 12. 关闭条件

- 当前 feature packet 已冻结为第一阶段执行真相。
- `permission-management` contract 已补齐 navigation governance 管理分组。
- `navigation-summary` contract 已补齐 role landing policy 对 `defaultEntry` 的说明。
- `permission-service` 服务职责文档已补齐 navigation governance ownership。
- implementation plan 已基于本 packet 产出。
- permission-service、api-gateway、tenant-web 的第一阶段实现与聚焦验证完成。
- feature/plugin enablement、个人偏好与菜单树配置均未混入主线。

## 13. 备注

- 当前 feature 既是导航治理能力，也是权限平台产品化能力的延伸，但它不等同于模块或插件配置平台。
- `resolver preview` 的正式暴露是为了避免管理页、排障脚本和测试环境各自复制一份导航解析逻辑。
- feature/plugin enablement 当前永久后置；未来如需反转，必须先回到 architecture / ADR，而不是直接扩展当前实现。
