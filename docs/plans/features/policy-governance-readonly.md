# Policy Governance Readonly

## 1. 目标

- 提供权限平台第一阶段的 Policy 只读治理台，让管理员能看清当前已存在的授权策略事实。
- 复用 `permission-service` 已实现的 policy gRPC 查询能力，不在第一阶段开放策略创建、修改、删除、启停或规则编辑。
- 建立从 `Permission -> Policy` 的可视化治理链路，帮助管理员理解某个 permission 是否存在额外 `ALLOW / DENY` 策略约束。
- 为后续 `Policy Explain / Impact Preview` 与受限 `Policy Rule Builder` 保留清晰边界。

## 2. 不做什么

- 不做 Policy 创建、编辑、删除、启停。
- 不开放 `conditionAstJson` 自由编辑。
- 不做受限规则表单或 rule builder。
- 不做 Policy Explain / Impact Preview。
- 不做 Resource Policy Business Rollout。
- 不改变 `CheckPermissionWithContext` 的历史兼容定位。
- 不把 policy 用作业务聚合生命周期、不变量或流程规则。
- 不接入 feature / plugin enablement；该方向已永久后置，当前系统暂不继续向租户级模块化设计演进。

## 3. 上游依赖

- architecture:
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- contracts:
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- plans:
  - [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/permission-management.md)
  - [role-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/role-management.md)
  - [navigation-entry-management.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/navigation-entry-management.md)
- service design:
  - [policy-management.md](/Users/acehood/Documents/GitHub/oes/src/services/system/permission-service/doc/design/policy-management.md)

## 4. 当前结论

- 当前 feature 是 `Policy Governance Readonly`，不是完整 Policy Management。
- 当前权限控制主线已推进到 `Policy Governance Readonly`；`Policy Explain / Impact Preview` 尚未开始，不应被误判为已进入实现。
- `permission-service` 已有 policy 查询、分页、按 permission 查询、AST 存储与 explain 底层能力。
- 当前缺口在 Gateway HTTP 管理薄代理、tenant-web 管理页面、navigation entry 与 feature contract 收口。
- 第一阶段页面只读展示：
  - policy 列表
  - policy 详情
  - permission 关联 policy 列表
  - `effect / subjectType / subjectId / permissionCode / resourceType / tenantId / priority / isEnabled`
  - `conditionAstJson` 的只读格式化展示
- 页面可以提供“跳转权限详情 / 按 permission 过滤 policy”的治理入口。
- 页面不提供任何会改变 policy 状态的操作。
- Policy Explain / Impact Preview 是下一条独立 P1 feature，不混入本 feature。

## 5. 契约真相位置

- 当前 gRPC 下游能力：
  - [policy_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/policy_management.proto)
- 当前已冻结的 Gateway HTTP contract：
  - `GET /policy`
  - `GET /policy/:id`
  - `GET /permission/:permissionCode/policies`
- 当前 feature 预期新增 navigation entry：
  - `admin.policy-governance`
- 当前 feature 预期复用权限码：
  - `permission.policy.list`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design / contract owner | 冻结只读治理边界并回写 Gateway policy readonly contract | `docs/plans/features/policy-governance-readonly.md`, `docs/contracts/api-gateway/permission-management.md`, 必要时 `docs/contracts/api-gateway/navigation-summary.md` | 当前 feature packet、policy gRPC 能力、权限平台推进顺序 | 稳定 contract 与 feature packet | completed |
| producer owner | 接入 Gateway HTTP 只读代理、navigation seed 与内置权限基线 | `src/services/api-gateway/**`, `src/services/system/permission-service/**`, `src/common/src/authorization/**` | 冻结后的 contract | 可供前端消费的只读 HTTP API 与入口可见性 | completed |
| consumer owner | 接入 tenant-web Policy Governance 只读页面 | `app/web/apps/tenant-web/src/api/**`, `app/web/apps/tenant-web/src/views/admin/**`, `app/web/apps/tenant-web/src/modules/**` | Gateway contract、navigation entry | 可用只读治理页面 | completed |
| review / integration owner | 验证本 feature 未越界进入 rule builder、mutation 或 explain，并验证权限边界 | 只读全局，必要时最小文档收口 | producer / consumer 输出 | review 结论与关闭判断 | completed |

## 7. 当前 slice

- slice:
  - Policy Governance Readonly 第一阶段实现完成。
- status:
  - implementation-complete
- scope:
  - Gateway `GET /policy`、`GET /policy/:id`、`GET /permission/:permissionCode/policies` 只读代理。
  - `admin.policy-governance` navigation entry 与 system admin 可见性基线。
  - tenant-web `策略治理` 页面、只读详情与 permission 关联策略视图。
  - `conditionAstJson` 只读格式化展示。
- ready definition:
  - 已确认 policy 底层能力存在但管理端未产品化。
  - 已确认只读治理优先于 rule builder。
  - 已确认 feature/plugin enablement 永久后置。
  - 已确认当前 feature 不改变 policy 模型或授权语义。

## 8. 主线范围

- 本线程主线：
  - 冻结 `Policy Governance Readonly` feature packet。
  - 回写 `permission-management` contract 的 policy readonly 分组。
  - 后续基于 contract 实现 Gateway 只读代理与 tenant-web 只读治理页面。
- 本线程不做：
  - policy mutation
  - rule builder
  - explain / impact preview
  - 业务域 resource policy rollout
  - feature/plugin enablement
- 偏移返回条件：
  - 需要开放 policy 创建、编辑、删除或启停。
  - 需要让前端编辑 `conditionAstJson`。
  - 需要改变 policy effect、subject、tenant 或 resource 语义。
  - 需要在页面内执行真实授权 explain 或影响面计算。

## 9. 阻塞 / 依赖

- Gateway 已补齐 policy readonly controller / proxy / adapter。
- tenant-web 已补齐 policy governance API client、路由与页面。
- navigation foundation 已登记 `admin.policy-governance`，并只对 system admin 开放可见性。
- `permission.policy.list` 已复用为当前只读治理入口权限；若后续需要更细的 `get_by_id` 权限码，应先回到 permission code source 与 role foundation。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-20 | Policy 是否直接开放编辑 | Blocker-Now | 编辑会引入高风险授权策略变更、AST 表单、审计与回滚，不适合作为第一阶段 | 第一阶段只读；mutation 后续独立 feature | future feature packet | closed |
| 2026-04-20 | Explain / Impact Preview 是否混入只读治理台 | Blocker-Now | Explain 需要构造 subject/resource/environment 上下文，范围明显大于只读治理 | 作为下一条独立 P1 feature 推进 | future feature packet | closed |
| 2026-04-20 | feature/plugin enablement 是否影响 policy governance | Sidecar | 用户已确认系统暂不继续向模块化设计演进 | 永久后置，不进入当前 feature 或权限摘要 / 导航主链 | [backlog.md](/Users/acehood/Documents/GitHub/oes/docs/plans/backlog.md) | closed |

## 11. 验收标准

- 系统管理员可以从 tenant-web 进入 `策略治理` 页面。
- 页面可以分页展示 policy 列表。
- 页面支持按 `keyword / permissionCode / tenantId / isEnabled` 过滤。
- 页面可以查看 policy 详情。
- 页面可以从 permission 维度查看关联 policy。
- 页面只读展示 `conditionAstJson`，并在 JSON 非空时提供格式化阅读体验。
- 页面不出现创建、编辑、删除、启停 policy 的操作。
- Gateway 只开放 policy 只读 HTTP API。
- 只读 API 复用 permission-service 的 policy gRPC 查询能力。
- 页面入口可见性由 `navigation.visibleEntries` 控制。
- 前端不直接调用 permission-service。
- 不接入 feature/plugin enablement。

## 12. 关闭条件

- feature packet 已冻结为第一阶段执行真相。
- `permission-management` contract 已补齐 policy readonly 分组。
- navigation summary 或 navigation seed 已登记 `admin.policy-governance`。
- Gateway policy readonly controller / proxy / adapter 已实现并有聚焦测试。
- tenant-web policy-governance API client、路由与页面已实现并有聚焦测试。
- 前端 typecheck / build 通过。
- 未混入 policy mutation、rule builder、explain / impact preview 或 feature/plugin enablement。

## 13. 备注

- 当前 feature 的产品目标是“看清楚已有策略”，不是“让管理员立刻改策略”。
- 当前权限控制产品面阶段停留在 `Policy Governance Readonly`；`Policy Explain / Impact Preview` 仍是下一条独立 feature，当前尚未开始。
- `conditionAstJson` 是后端持久化与评估格式，第一阶段只能只读展示。
- 后续如果要推进 policy mutation，应先设计受限规则表单、审计、审批或回滚边界，而不是直接开放 AST 编辑。
