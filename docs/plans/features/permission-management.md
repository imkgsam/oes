# Permission Management

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只记录 Permission Management feature 的范围、状态与前端接入约束；`Permission`、权限码、Role / Policy / AccountRole 边界不在本文重新定义。

## 1. 目标

- 提供 tenant-web 管理端的 Permission 管理最小闭环，为后续 Role Management 提供稳定 permission catalog 与 selector 基础。
- 复用已冻结的 Gateway permission-management contract，不新增 permission-service 契约、proto 或权限模型。
- 在现有 auth-bff navigation summary 中补充 `admin.permission-management` entry，让页面可以进入左侧导航。
- 让系统管理员能够维护全局 permission 字典的可变元数据，并让管理员能够查看 permission 被哪些 role 引用。
- 明确 Permission Management 是权限平台产品化第一步，Role Management 依赖它完成可视化选择与引用理解。

## 2. 不做什么

- 不修改 `Permission.code`，权限码仍是稳定标识，不作为常规可编辑字段开放。
- 不做权限码生命周期审批、发布、废弃流程。
- 不做批量导入 / 批量创建 UI。
- 不让租户管理员创建或删除全局 permission。
- 不做 Role 管理、AccountRole 管理或 Policy 管理。
- 不新增或修改 permission-service、proto、operator context、租户模型或权限语义。
- 不新增新的 HTTP endpoint；只允许在现有 `GET /auth/session/context` navigation summary 中补充当前页面 entry。

## 3. 上游依赖

- architecture:
  - [07-permission-code-source.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
- contracts:
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- plans:
  - [role-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/role-management.md)

## 4. 当前结论

- 当前主线任务调整为先实现 tenant-web `Permission Management` 最小闭环。
- 后端 Gateway HTTP 与 permission-service gRPC 的 Permission 管理接口已存在，当前缺口是 tenant-web 管理端页面与前端 API client。
- 页面作为左侧导航入口暴露时需要 `auth-bff` 返回 `admin.permission-management`，当前仅系统范围且带 `system.admin` role code 的账号会拿到该 entry。
- `Permission Management` 完成后，再进入 `Role Management`。
- Permission 管理页面第一阶段采用轻量 CRUD + 引用查看，不扩展成完整权限治理平台。
- Permission selector 应从当前 feature 沉淀，后续供 Role / Policy 页面复用。
- 前端只消费 Gateway `/permission` 组接口，不直接访问 permission-service。
- Permission 的全局事实仍属于 permission-service，前端不复制 permission 语义规则。

## 5. 契约真相位置

- 当前 HTTP 黑盒契约真相：
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- 当前已存在并可供前端消费的 permission 接口：
  - `GET /permission`
  - `POST /permission`
  - `GET /permission/:code`
  - `GET /permission/id/:id`
  - `PATCH /permission/:id`
  - `GET /permission/:id/roles`
  - `DELETE /permission/:id`
- 当前 feature 只消费上述契约；如实现中发现字段或语义缺口，先回到 contract / feature packet，不在前端临时绕过。
- 当前 navigation entry 真相：
  - [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
  - `admin.permission-management`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结 Permission Management 第一阶段边界，并校正权限平台推进主线 | `docs/plans/features/permission-management.md`, `docs/plans/features/role-management.md` | 架构文档、permission-management contract、用户确认的优先级 | 当前 feature packet 与 role-management 依赖修正 | completed |
| consumer owner | 基于已冻结 contract 接入 tenant-web Permission 管理页面与 selector 基础 | `app/web/apps/tenant-web/src/api/**`, `app/web/apps/tenant-web/src/modules/**`, `app/web/apps/tenant-web/src/views/admin/**` | 当前 feature packet、permission-management contract | 可用前端页面、selector 基础与前端验证结果 | completed |
| review / integration owner | 检查实现是否越界进入 role / account-role / policy，验证页面与 contract 对齐 | 只读全局，必要时最小文档收口 | feature packet、实现结果、验证结果 | review 结论与关闭判断 | completed |

## 7. 当前 slice

- slice:
  - tenant-web Permission Management 第一阶段落地
- status:
  - implemented
- scope:
  - `admin.permission-management` navigation entry
  - Permission 列表、分页、模块筛选、关键词搜索
  - Permission 详情
  - Permission 创建
  - Permission 可变元数据编辑：`module / description`
  - Permission 删除
  - 查看引用该 permission 的 roles
  - 沉淀后续 Role 页面可复用的 permission selector / lookup 基础
- ready definition:
  - 已确认 Permission 管理前端尚未实现
  - 已确认当前主线先做 Permission Management
  - 已确认 Role Management 依赖本 feature 完成 selector / lookup 基础
  - 已确认复用现有 Gateway contract，不改后端契约

## 8. 主线范围

- 当前主线任务：
  - 基于现有 Gateway `permission-management` contract，先实现 tenant-web `Permission Management` 第一阶段。
  - 页面入口建议为 `/admin/permission-management`，菜单标题为 `权限管理`。
  - 页面左侧导航 entry 为 `admin.permission-management`，当前仅系统范围且带 `system.admin` role code 的账号可见。
  - 页面主形态为 permission 字典管理表格 + 创建 / 编辑表单 + 引用角色查看。
  - 当前主线沉淀 permission selector / lookup 基础，供后续 Role Management 复用。
  - 当前主线完成后，下一条独立主线是 `role-management`。
- 本线程不做：
  - role 管理
  - account-role 管理
  - policy 管理
  - 新后端 contract
  - 权限码生命周期治理
  - 业务域 resource policy 接入
- 偏移返回条件：
  - 需要新增 / 修改后端契约
  - 需要改变 permission code 来源或生命周期语义
  - 需要让前端直接消费 permission-service 内部模型
  - 需要开放 Role / AccountRole / Policy 编辑

## 9. 阻塞 / 依赖

- 当前后端 permission 管理接口已完成首批 Gateway HTTP 到 permission-service gRPC 验证。
- 当前 auth-bff navigation summary 已发出 `admin.permission-management` entry，并限制为系统范围 `system.admin` 可见。
- tenant-web 当前尚未提供 permission-management 前端 API client 与页面入口。
- role-management 的权限分配体验依赖本 feature 产出的 permission selector / lookup 基础。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-18 | Permission 管理前端尚未实现 | Blocker-Now | 若直接进入 Role Management，会缺少稳定 permission selector / lookup 基础 | 主线前移，先实现 tenant-web Permission Management 最小闭环 | 当前 feature packet | closed |
| 2026-04-18 | Permission 管理导航 entry | Blocker-Now | 若 auth-bff 不发 entry，页面会被 tenant-web visibleEntries 过滤掉 | 在现有 navigation summary 中增加 `admin.permission-management`，并限制为系统范围 `system.admin` 可见 | [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md) | closed |
| 2026-04-18 | Permission 是否做完整生命周期治理 | Blocker-Later | 生命周期审批会显著扩大范围，但不阻塞管理端最小闭环 | 第一阶段只做轻量 CRUD 与引用查看，生命周期治理后置 | 后续 governance feature / backlog | open |
| 2026-04-18 | 批量导入权限码是否进入第一阶段 | Blocker-Later | 批量导入 UI 会引入冲突预览、事务反馈和回滚体验 | 第一阶段不做；如后续需要，单独设计批量导入体验 | 后续 feature packet | open |

## 11. 验收标准

- 管理员可以从 tenant-web 进入明确的 `权限管理` 页面。
- `GET /auth/session/context` 仅在当前账号处于 `SYSTEM` scope 且拥有 `system.admin` role code 时返回 `admin.permission-management`。
- 页面可以分页展示 permission 字典。
- 页面支持按 `module` 与 `keyword` 筛选。
- 管理员可以查看单个 permission 详情。
- 系统管理员可以创建 permission。
- 系统管理员可以编辑 permission 的 `module / description`。
- 页面不允许编辑 `code`。
- 系统管理员可以删除未被引用的 permission，并能看到删除失败的稳定错误提示。
- 管理员可以查看引用某个 permission 的 role 列表。
- 当前实现沉淀的 permission selector / lookup 能被后续 Role Management 复用。
- 页面不提供 Role / AccountRole / Policy 管理入口。

## 12. 关闭条件

- 当前 feature packet 已冻结为第一阶段执行真相。
- implementation plan 已基于本 packet 产出。
- tenant-web permission-management 页面、API client 与路由已落地。
- 前端 typecheck / build 通过。
- 如条件允许，完成 Gateway + tenant-web 的浏览器级 smoke 验证。
- 后置的 role、account-role、policy、permission lifecycle 增强均未混入本 feature 主线。

## 13. 备注

- 当前 feature 是权限平台产品化的第一条管理端主线。
- Permission Management 完成后，下一条优先 feature 是 `role-management`。
- Role Management 完成后，再独立推进 `account-management`，让角色真正绑定到账号并反映到 access summary。
- Policy Management 应独立推进，且第一阶段建议从 readonly governance 做起，再进入受限规则表单与 Explain / Impact Preview。

## 14. 当前实现状态

- `auth-bff`
  - 已在 `GET /auth/session/context` 的 navigation summary 中补充 `admin.permission-management`。
  - 当前账号处于 `SYSTEM` scope 且 access summary 中带 `system.admin` role code 时，该 entry 会进入 `visibleEntries`。
- `tenant-web`
  - 已新增 Permission Management API client。
  - 已新增 `tenant-admin` 动态路由模块。
  - 已新增 `/admin/permission-management` 页面。
  - 页面已支持 permission 列表、筛选、分页、详情、创建、编辑、删除和引用角色查看。
- contracts / plans
  - 已更新 navigation summary 的 entry registry。
  - 已保留 `role-management` 为下一条主线，等待当前 feature 完成后推进。

## 15. 已完成验证

- `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts --runInBand`
- `pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/permission-management/index.spec.ts --dom`
- `pnpm --dir app/web --filter @oes/tenant-web typecheck`
- `pnpm --dir app/web --filter @oes/tenant-web build`
