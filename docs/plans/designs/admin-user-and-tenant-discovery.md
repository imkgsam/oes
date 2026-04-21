# Admin User Discovery Design

## 1. 目标

- 为管理员会话管理补齐“目标发现层”设计工作台。
- 让管理员可以通过稳定的 BFF 黑盒能力找到目标用户，再进入已有用户会话列表。
- 第一阶段只解决“管理员不要手输 `userId`”这个核心问题。
- 在设计冻结前记录开放问题、已确认判断与未来回写目标。

## 2. 当前范围

本 workspace 负责：

- 管理员用户检索的设计边界。
- `tenant-web` 管理员会话管理页如何延展目标发现入口。
- `api-gateway/auth-bff` 应承接哪些前端黑盒契约。
- 哪些事实仍归属 `identity-service` 或 `auth-service`。

本 workspace 不负责：

- 直接实现前端页面。
- 直接新增 BFF / gRPC / service 代码。
- 重新设计管理员会话管理主线。
- 重新设计登录历史、审计分析或安全运营台。
- 第一阶段不做租户选择器。
- 第一阶段不做完整用户目录、分页、高级筛选或导出。
- 让前端绕过 BFF 直接消费 `identity-service` 或租户内部服务。

## 3. 涉及对象

- services:
  - `api-gateway`
  - `identity-service`
  - `auth-service`
- features:
  - `admin-session-management`
  - future `admin-user-discovery`
- collaborations:
  - authentication and identity collaboration
  - authorization decision flow

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-17 | 当前主题定位为管理员会话管理的“目标发现层”，不替代现有会话管理页。 | feature scope / tenant-web IA | future feature packet |
| 2026-04-17 | 第一阶段只做管理员用户搜索，不做租户选择器。 | feature scope / frontend API | feature packet |
| 2026-04-17 | 前端只能消费 `api-gateway/auth-bff` 暴露的稳定搜索契约，不能直接访问 `identity-service`。 | frontend boundary / BFF responsibility | contract + feature packet |
| 2026-04-17 | 用户检索结果应返回目标用户摘要，不直接返回 session 明细；选中用户后复用现有用户会话列表。 | page flow / API shape | feature packet |
| 2026-04-17 | 搜索只解决定位目标用户问题，不能扩展成完整用户目录。 | feature scope / frontend behavior | feature packet |
| 2026-04-18 | 搜索结果需要包含当前用户的 account / tenant 摘要，避免管理员无法判断多账号用户是否为目标对象。 | API shape / frontend result display | contract + feature packet |
| 2026-04-18 | 第一阶段不支持 `username` 搜索；`identity.username` 暂按 legacy login handle 理解，不作为真实姓名或展示名。 | identity boundary / API shape | identity-service 职责卡 + contract + feature packet |

## 5. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-17 | 搜索结果是否只返回当前在线用户，还是可返回离线用户？ | 管理员会话管理目标偏在线 session 排查，但工单排查常需要先找到离线用户再看空会话状态。 | 建议第一阶段允许返回离线用户摘要，但会话列表可显示空状态。 |
| 2026-04-17 | 管理员可见范围如何过滤搜索结果？ | 需要与当前 `scopeLevel`、tenant-bound 权限和 action codes 一致。 | 契约设计时明确系统管理员 / 租户管理员过滤语义。 |
| 2026-04-17 | 搜索结果需要展示哪些敏感字段和脱敏规则？ | 邮箱、手机号属于身份信息，管理员展示范围需要治理约束。 | 回写到 contract 的 response 字段与 error / masking semantics。 |
| 2026-04-17 | 租户选择器何时恢复设计？ | 当前阶段已确认不做，以免牵涉租户目录和跨租户筛选复杂度。 | 放入后置项，待系统管理员排查体验再次成为痛点时单独设计。 |
| 2026-04-18 | `accountSummaries[]` 是否需要包含角色或权限摘要？ | 角色字段会把用户发现层推向用户目录或权限诊断，增加范围。 | 建议第一阶段不返回角色，只返回 account / tenant / scope 定位信息。 |
| 2026-04-18 | 真实姓名搜索如何设计？ | 真实姓名不是 identity login handle，且重名风险高，需要与 `entity-service` 的 person/entity 模型协同。 | 后续如需要姓名搜索，单独设计 `identity-service + entity-service + auth-bff` 协同蓝图或 feature。 |

## 6. 推荐契约方向草案

> 这里不是最终 contract 正文；冻结后应迁入 `docs/contracts/api-gateway/**`。

- `GET /auth/admin/users/search`
  - purpose: 按管理员可见范围搜索目标用户摘要。
  - query candidates:
    - `keyword`
    - `limit`
  - result candidates:
    - `userId`
    - `displayName`
    - masked `email`
    - masked `phone`
    - `accountSummaries[]`
      - `accountId`
      - `accountDisplayName`
      - `tenantId`
      - `tenantName`
      - `scopeLevel`
    - `isOnline`
    - `activeSessionCount`

## 7. 前端页面延展方向

- 复用现有管理员会话管理页，不新建第二套页面。
- 页面顶部增加目标发现区：
  - 单个用户搜索框。
  - placeholder: `搜索用户邮箱 / 手机号 / userId`。
- 在线用户总览仍保留为默认视图。
- 用户搜索结果作为进入“目标用户会话列表”的另一条入口。
- 搜索结果卡片需要展示 account / tenant 摘要，帮助管理员判断多账号用户是否为目标对象。
- 选中用户后继续复用现有 `GET /auth/admin/users/:userId/sessions` 流程。
- 第一阶段最多返回 10 条结果，不做分页。
- 系统管理员暂时继续使用已有 `tenantId` 文本筛选能力；租户选择器后置。

## 8. 真相源回写计划

- 服务职责：
  - `identity-service` 职责卡需明确 `username` 不是真实姓名，而是 legacy login handle；真实姓名搜索未来应与 `entity-service` 协同设计。
- 协同蓝图：
  - 如搜索可见范围涉及复杂授权判断，回写 authorization decision flow。
- contracts：
  - 新增或扩展 `docs/contracts/api-gateway/auth-bff-admin-security.md`。
- feature packet：
  - 冻结后新增 `docs/plans/features/admin-user-discovery.md`。
- architecture / ADR：
  - 只有当引入跨域搜索模型或管理员可见范围语义变化时才需要升级。

## 9. 恢复入口

下次继续前先读：

- `docs/plans/features/admin-session-management.md`
- `docs/plans/tenant-web-code-refactor-checklist.md#73-管理员用户检索能力后置任务`
- `docs/contracts/api-gateway/auth-bff-admin-security.md`
- `docs/architecture/16-unified-web-account-context-architecture.md`
- `docs/architecture/15-authorization-layering-and-resource-policy-architecture.md`

当前推荐下一步：

- 先冻结第一阶段用户搜索输入字段、`accountSummaries[]` 返回字段与脱敏规则。
- 再判断是否直接转成 feature packet。
- 若字段、权限范围与脱敏语义确认清楚，则不需要继续长期 workspace，可迁入 feature packet 与 BFF contract。
