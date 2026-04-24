# Admin User Discovery

## 1. 目标

- 为管理员会话管理补齐“目标用户发现”能力。
- 让管理员可以通过邮箱、手机号或 `userId` 搜索目标用户。
- 让搜索结果提供足够的 account / tenant 摘要，帮助管理员确认是否选中了正确目标。
- 选中目标用户后复用既有管理员用户会话列表，不重做 session 查询模型。

## 2. 不做什么

- 不做租户选择器。
- 不做完整用户目录。
- 不做分页、高级筛选、导出或批量操作。
- 不做显示名模糊搜索。
- 不做用户名 / login handle 搜索。
- 不返回角色、权限摘要或完整用户详情。
- 不让前端绕过 BFF 直接消费 `identity-service`。
- 不改变现有管理员会话管理主线。

## 3. 上游依赖

- architecture:
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- collaborations:
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
  - authorization decision flow, if search visibility requires additional policy semantics
- contracts:
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
  - [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
- design workspace:
  - [admin-user-and-tenant-discovery.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/admin-user-and-tenant-discovery.md)

## 4. 当前结论

- 当前 feature 是管理员会话管理的“目标发现层”，不是用户目录管理。
- 第一阶段只新增管理员用户搜索，不新增租户选择器。
- 搜索入口是单个 `keyword`，由 BFF 在管理员可见范围内解释为邮箱、手机号或 `userId`。
- 搜索结果返回用户摘要与 `accountSummaries[]`，但不返回 session 明细。
- 用户搜索结果点击后进入既有 `GET /auth/admin/users/:userId/sessions` 用户会话列表。
- 搜索最多返回 10 条结果，不做分页。
- 邮箱和手机号默认脱敏展示。
- 管理员可见范围由 BFF / 下游服务根据当前 operator context 和权限边界裁剪，前端不自行拼 scope。
- 系统管理员暂时继续使用现有 `tenantId` 文本筛选能力；可视化租户选择器后置。

## 5. 契约真相位置

- 当前新增契约真相：
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
- 预期新增接口：
  - `GET /auth/admin/users/search`
- 既有复用接口：
  - `GET /auth/admin/users/:userId/sessions`
  - `GET /auth/admin/online-users`
  - `POST /auth/admin/sessions/:sessionId/revoke`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结用户搜索范围、返回摘要、非范围和契约方向 | `docs/plans/features/**`, `docs/contracts/api-gateway/**`, `docs/plans/designs/**` | design workspace 与现有 admin session packet | feature packet + contract 草案 | completed |
| producer owner | 实现 BFF 黑盒搜索契约，聚合 identity 用户/account 摘要与 auth 在线 session 统计 | `src/services/api-gateway/**`, 必要时 `src/services/system/identity-service/**`, 必要时 `src/services/system/auth-service/**` | feature packet + contract | 可运行 BFF 能力与测试 | completed |
| consumer owner | 在管理员会话管理页接入用户搜索入口，复用现有用户会话列表 | `app/web/apps/tenant-web/**` | BFF contract | 前端搜索体验与验证 | completed |
| review / integration owner | 审核搜索范围、脱敏、权限可见性和现有会话管理无回归 | 只读全局，必要时最小修正 | producer / consumer 输出 | 集成验证结论 | completed |

## 7. 当前 slice

- slice:
  - 第一阶段管理员目标用户搜索。
- status:
  - implemented
- scope:
  - `keyword` 搜索目标用户。
  - 返回目标用户摘要。
  - 返回 `accountSummaries[]` 定位信息。
  - 返回在线状态与活跃 session 数。
  - 点击搜索结果进入既有用户会话列表。
- ready definition:
  - BFF contract 字段冻结。
  - 权限范围和脱敏语义明确。
  - tenant-web 搜索 UI 不引入完整用户目录。

## 8. 主线范围

- 本线程主线：
  - 冻结并实现管理员用户搜索能力。
  - 将搜索结果作为现有管理员会话管理页的补充入口。
- 本线程不做：
  - 租户选择器。
  - 用户目录。
  - 用户详情页。
  - 登录历史页。
  - 角色 / 权限诊断。
  - 批量会话操作。
- 偏移返回条件：
  - 如果需要新增跨域用户目录模型，暂停并升级 architecture / ADR。
  - 如果需要改变管理员可见范围语义，暂停并更新 authorization 相关真相源。
  - 如果需要前端直接读取 `identity-service`，暂停并回到 BFF contract。

## 9. 实现确认

- `identity-service` 现有查询能力已满足邮箱、手机号和 `userId` 搜索，不需要新增 proto 契约。
- `activeSessionCount` 当前由 BFF 通过 `adminListUserSessions` 聚合得到；第一阶段维持最多 10 条结果的受控 fan-out。
- 脱敏规则由 BFF 固定输出，当前返回 `emailMasked` 与 `phoneMasked`。
- tenant-bound 与 system scope 的搜索可见范围已由 BFF 基于当前 operator context 做过滤。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-18 | 租户选择器 | Sidecar | 当前阶段如果纳入会牵涉租户目录与跨租户筛选复杂度 | 后置，待系统管理员排查体验再次成为痛点时单独设计 | `docs/plans/backlog.md` 或新 feature | open |
| 2026-04-18 | 显示名模糊搜索 | Blocker-Later | 重名和误匹配风险较高，容易把搜索能力推向用户目录 | 第一阶段不做；后续如需要，单独冻结匹配与展示规则 | future feature packet | open |
| 2026-04-18 | 角色 / 权限摘要 | Sidecar | 会把目标发现层扩展成权限诊断工具 | 第一阶段不返回；权限诊断后续独立设计 | future feature packet | open |
| 2026-04-18 | 搜索结果离线用户展示 | Blocker-Now | 影响 BFF 查询范围与空会话状态体验 | 第一阶段允许返回离线用户摘要，并用 `isOnline` 与 `activeSessionCount` 表达状态 | 当前 contract | closed |
| 2026-04-18 | `username` / login handle 语义 | Blocker-Now | `username` 容易被误解为真实姓名或展示名，且真实姓名不应由 `identity-service` 拥有 | 第一阶段从搜索输入中移除；`identity.username` 暂按 legacy login handle 理解，真实姓名搜索未来通过 `party-service` 协同设计 | `identity-service` 职责卡 + future architecture/ADR | closed |

## 11. 验收标准

- 管理员可以通过邮箱、手机号或 `userId` 搜索目标用户。
- 搜索结果只包含当前管理员可见范围内的用户。
- 搜索结果展示用户基础摘要、脱敏联系方式、account / tenant 摘要、在线状态和活跃 session 数。
- 搜索结果最多返回 10 条，不做分页。
- 点击某个搜索结果后进入既有用户会话列表。
- 前端不直接调用 `identity-service`。
- 第一阶段未纳入的租户选择器、完整用户目录、显示名模糊搜索、角色 / 权限摘要不会混入实现。
- 第一阶段不引入 `username` / login handle 搜索；若未来需要唯一登录名搜索，先冻结 identity login handle 语义。

## 12. 关闭条件

- `GET /auth/admin/users/search` contract 已冻结并实现。
- BFF 已按管理员 scope 裁剪搜索结果。
- tenant-web 管理员会话页已接入搜索入口。
- 搜索结果能进入既有用户会话列表。
- 聚焦测试与 tenant-web typecheck 通过。

## 13. 备注

- 本 feature 从 `docs/plans/designs/admin-user-and-tenant-discovery.md` 收口而来。
- workspace 文件保留为设计过程记录；稳定契约以 `docs/contracts/api-gateway/auth-bff-admin-security.md` 为准。
- 当前 feature 是 `admin-session-management` 的后续增强，不修改其已完成主线定义。
