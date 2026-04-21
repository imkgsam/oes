# Role Management

## 1. 目标

- 提供管理员角色管理工作台，优先完成 `Role Instance` 与 `Role Template` 的管理闭环。
- 复用已冻结的 Gateway permission-management contract，并在必要时补最小只读查询契约，不改权限语义与核心模型。
- 让管理员能够基于全局 permission catalog 维护角色权限，并支持从模板实例化租户角色。
- 为后续 `account-management` 与 `policy-governance` 保留清晰边界。

## 2. 不做什么

- 不做账号角色分配；账号授权绑定进入后续 `account-management` feature。
- 不做 Policy 管理、Policy Rule Builder、Policy Explain 页面。
- 不开放自由编辑 `conditionAstJson`。
- 不新增或修改 permission-service、Gateway、proto、operator context、租户模型或权限语义。
- 不做批量替换角色权限集合；当前 contract 只有单条 assign / revoke。
- 不让前端从 role 推导 action permission；前端动作控制继续消费 access summary 的 `actionCodes`。

## 3. 上游依赖

- architecture:
  - [07-permission-code-source.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
  - [09-role-based-permission-resolution.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/09-role-based-permission-resolution.md)
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
- contracts:
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
  - [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
- adr:
  - [0002-system-role-instance-and-account-role-scope.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0002-system-role-instance-and-account-role-scope.md)

## 4. 当前结论

- 权限平台能力推进顺序采用：
  - `Permission Catalog / Selector`
  - `Role Management`
  - `Account Management`
  - `Access Summary / Navigation / ActionCodes 收口`
  - `Policy Governance Readonly`
  - `Policy Rule Builder`
  - `Policy Explain / Impact Preview`
  - `Resource Policy Business Rollout`
- 当前 feature 是推进顺序中的 `Role Management`，不是整个权限平台一次性落地。
- 当前主线任务已校正为：先完成 tenant-web `Permission Management` 第一阶段，再进入本 `Role Management`。
- `Permission Catalog / Selector` 不再视为本 feature 内的轻量依赖，而是前置 feature：
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/permission-management.md)
- 页面建议采用单入口双 Tab：
  - `角色实例`
  - `角色模板`
- `角色实例` 覆盖 `SYSTEM_INSTANCE` 与 `TENANT_INSTANCE`。
- `角色模板` 覆盖 `SYSTEM_TEMPLATE`，并支持从模板创建 tenant role instance。
- `SYSTEM` scope 进入同一路径时可见 `角色实例 + 角色模板`。
- `TENANT` scope 进入同一路径时只可见 `角色实例`，但仍可读取模板目录并通过“从模板创建”生成本租户角色实例。
- role / template 的权限维护共用同一套 permission selector 与单条 assign / revoke 编排。
- system / tenant scope 的最终可见性与可操作性由 Gateway guard 与 permission-service operator scope 约束；前端只做输入约束和交互提示。
- Gateway role list read model 负责把 `tenantId / templateRoleId` enrich 为 `tenantName / templateRoleName`，前端不再自己逐行补名字。
- Policy 虽然后端 AST、校验、Explain 能力已经存在，但管理端应后置到独立 feature，先以只读治理台起步，而不是马上开放复杂编辑器。

## 5. 契约真相位置

- 当前 HTTP 黑盒契约真相：
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- 当前已存在并可供前端消费的 role instance 接口：
  - `GET /role`
  - `POST /role`
  - `GET /role/:id`
  - `PATCH /role/:id`
  - `PATCH /role/:id/enabled`
  - `GET /role/:id/permissions`
  - `POST /role/:id/permissions`
  - `DELETE /role/:id/permissions/:permissionId`
  - `DELETE /role/:id`
- 当前已存在并可供前端消费的 role template 接口：
  - `GET /role-template`
  - `POST /role-template`
  - `GET /role-template/:id`
  - `PATCH /role-template/:id`
  - `PATCH /role-template/:id/enabled`
  - `GET /role-template/:id/permissions`
  - `POST /role-template/:id/permissions`
  - `DELETE /role-template/:id/permissions/:permissionId`
  - `POST /role-template/:id/instantiate`
  - `DELETE /role-template/:id`
- 当前 feature 只消费上述契约；如实现中发现字段或语义缺口，先回到 contract / feature packet，不在前端临时绕过。

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结 permission / role / policy 大板块推进顺序，并收敛当前 role-management feature 边界 | `docs/plans/features/role-management.md`, 必要时 `docs/plans/backlog.md` | 架构文档、ADR、permission-management contract、用户确认的优先级 | 当前 feature packet | completed |
| consumer owner | 基于已冻结 contract 接入 tenant-web role 管理工作台 | `app/web/apps/tenant-web/src/api/**`, `app/web/apps/tenant-web/src/modules/**`, `app/web/apps/tenant-web/src/views/admin/**` | 当前 feature packet、permission-management contract、permission-management selector 基础 | 可用前端页面与前端验证结果 | completed |
| review / integration owner | 检查实现是否越界进入 account-role / policy，验证页面与 contract 对齐 | 只读全局，必要时最小文档收口 | feature packet、实现结果、验证结果 | review 结论与关闭判断 | pending |

## 7. 当前 slice

- slice:
  - tenant-web Role Management 第一阶段落地
- status:
  - implementation-complete
- scope:
  - Permission selector / lookup
  - Role Instance 管理
  - Role Template 管理
  - Role / Template 权限维护
  - 从模板实例化 tenant role instance
- ready definition:
  - 已确认权限平台大板块推进顺序
  - 已确认 Permission Management 是当前前置主线
  - 已确认当前 feature 不做 account-role 与 policy
  - 已确认采用单页双 Tab 管理工作台
  - 已确认复用现有 Gateway contract，不改后端契约

## 8. 主线范围

- 当前主线任务：
  - 基于现有 Gateway `permission-management` contract，tenant-web `Role Management` 第一阶段已完成实现。
  - 页面主形态为 `/admin/role-management` 单入口能力自适应工作台：`SYSTEM` scope 为双 Tab，`TENANT` scope 收口到角色实例。
  - 本 feature 复用前置 `permission-management` 产出的 permission selector / lookup 基础。
  - 角色实例页把“从模板创建”提升为主入口，“直接创建”为次入口。
  - Gateway 现有 `/role` HTTP 返回已 enrich `tenantName / templateRoleName`。
  - 角色实例创建 / 模板实例化场景补充了最小租户目录只读查询，用于把手填 `tenantId` 升级为租户选择器。
  - 从模板实例化角色时实例 `code` 继承模板 `code`，页面与 BFF 不再提供 code 覆盖入口；停用模板不进入实例化选择器。
  - 当前主线完成后，下一条独立主线是 `account-management`。
  - Policy 管理进入更后置主线，先做 readonly governance，再评估受限 rule builder 与 Explain / Impact Preview。
- 本线程不做：
  - account-role 管理
  - policy 管理
  - 新后端 contract
  - 权限码生命周期治理
  - 业务域 resource policy 接入
- 偏移返回条件：
  - 需要新增 / 修改权限语义相关后端契约
  - 需要改变 role kind、scopeLevel、AccountRole 语义
  - 需要让前端直接消费 permission-service 内部模型
  - 需要开放 Policy 编辑或 account-role 绑定

## 9. 阻塞 / 依赖

- 当前后端 permission / role / role-template / account-role 管理接口已完成首批 Gateway HTTP 到 permission-service gRPC 验证。
- tenant-web 当前尚未提供 role-management 前端 API client 与页面入口。
- tenant-web 当前尚未提供 permission-management 前端 API client 与页面入口；该能力已前移为当前主线。
- role-management 的权限分配体验依赖前置 permission-management 产出的 selector / lookup 基础。
- system scope 下的 tenant role instance 创建与模板实例化依赖 identity-service 提供租户目录只读查询，以支持租户选择器。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-18 | Permission / Role / Policy 大板块优先级 | Blocker-Now | 若不先排序，Role 页面容易混入 AccountRole 与 Policy | 已确认按 Permission selector -> Role -> AccountRole -> Policy 的顺序推进 | 当前 feature packet | closed |
| 2026-04-18 | Permission 管理前端尚未实现 | Blocker-Now | 若直接进入 Role Management，会缺少稳定 permission selector / lookup 基础 | 已前移为当前主线，先实现 `permission-management` feature | [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/permission-management.md) | closed |
| 2026-04-18 | AccountRole 是否进入 Role Management | Blocker-Now | 若混入会引入 account 搜索、identity 展示和 scope 绑定，扩大当前 feature | 当前 feature 明确不做，后续进入 `account-management` | 后续 feature packet | closed |
| 2026-04-18 | Policy 管理是否与 Role 管理一起做 | Blocker-Now | Policy 是高风险授权策略能力，过早开放编辑器会增加治理风险 | 当前 feature 不做 Policy；后续先做 readonly governance，再做受限 builder | 后续 feature packet / backlog | closed |
| 2026-04-19 | Tenant selector 是否必须先做 | Blocker-Later | system admin 在模板实例化时手填 `tenantId` 的可用性较差 | 已补 identity-service 最小租户目录只读查询，并在 role-management 中改为租户选择器 | 当前 feature packet | closed |
| 2026-04-19 | 模板实例化是否允许覆盖 role code | Blocker-Now | 若允许覆盖，会破坏模板作为稳定角色契约来源的语义，并让前端隐藏输入无法形成后端保证 | 已收口为实例继承模板 `code`，只允许覆盖 `name / description` | 当前 feature packet / Gateway contract | closed |

## 11. 验收标准

- 管理员可以从 tenant-web 进入一个明确的 `角色管理` 页面。
- 页面可以在 `角色实例` 与 `角色模板` 两个管理面之间切换。
- 角色实例列表支持分页、关键词、scopeLevel、tenantId 过滤。
- 角色实例列表中的租户与来源模板优先显示可读名称，而不是原始 ID。
- 管理员可以创建 system role instance 与 tenant role instance。
- 管理员可以编辑 role instance 的 `name / description`。
- 管理员可以启用 / 停用 role instance。
- 管理员可以删除 role instance，并能看到删除失败的稳定错误提示。
- 管理员可以查看 role instance 已绑定 permissions。
- 管理员可以给 role instance 单条分配 / 撤销 permission。
- 租户管理员可以进入 `角色管理`，但只看到 `角色实例` 面，并且实例创建默认绑定当前租户。
- 角色模板列表支持分页和关键词过滤。
- 管理员可以创建、编辑、启停、删除 role template。
- 管理员可以查看并维护 role template permissions。
- 管理员可以从 role template 创建 tenant role instance；租户管理员通过实例页主入口完成该流程。
- 从 role template 创建 tenant role instance 时，实例 `code` 继承模板 `code`，不提供手动修改入口。
- 停用的 role template 不出现在实例化选择器中。
- system scope 下的角色实例创建与模板实例化使用租户选择器，而不是手填 `tenantId`。
- 页面不提供 account-role 绑定入口。
- 页面不提供 Policy 编辑入口。
- 前端不从 roles 推导 actionCodes。

## 12. 关闭条件

- 当前 feature packet 已冻结为第一阶段执行真相。
- implementation plan 已基于本 packet 产出。
- tenant-web role-management 页面、API client 与路由已落地。
- identity-service / Gateway / tenant-web 的租户选择器链路已落地。
- 前端 typecheck / build 通过。
- 如条件允许，完成 Gateway + tenant-web 的浏览器级 smoke 验证。
- 后置的 account-role、policy、tenant selector 增强均未混入本 feature 主线。

## 13. 备注

- 当前 feature 是权限平台产品化的第一条管理端主线，但不是权限平台全部能力。
- Role Management 完成后，下一条优先 feature 应是 `account-management`，让角色真正绑定到账号并反映到 access summary。
- Policy Management 应独立推进，且第一阶段建议从 readonly governance 做起，再进入受限规则表单与 Explain / Impact Preview。
