# 登录后 Account Context 切换

## 1. 目标

- 让已登录用户在右上角头像菜单中进入“切换上下文”流程。
- 让用户在自己可用的 `TENANT` context 与 `SYSTEM` context 之间切换。
- 切换后由后端重新建立当前 session context，而不是只在前端本地切换展示状态。
- 切换后重新刷新 token、session context、access summary 与首页导航。

## 2. 不做什么

- 不引入 `workspace` 新模型。
- 不引入独立于 `UserAccount` 之外的新 context 模型。
- 不在第一阶段处理 `org` 级二次切换。
- 不在第一阶段做多标签并行多 context。
- 不在第一阶段做最近使用、收藏、搜索、分组折叠等增强交互。
- 不在第一阶段做切换审批、二次验证或额外安全挑战。
- 不在第一阶段做 context 切换通知联动。

## 3. 上游依赖

- architecture:
  - [unified-web-account-context.md](../../architecture/platforms/unified-web-account-context.md)
- services:
  - [auth-service.md](../../architecture/services/auth-service.md)
  - [identity-service.md](../../architecture/services/identity-service.md)
  - [permission-service.md](../../architecture/services/permission-service.md)
- collaborations:
  - [account-context-switch.md](../../architecture/collaborations/account-context-switch.md)
- contracts:
  - [auth-bff-login.md](../../contracts/api-gateway/auth-bff-login.md)
  - [access-summary.md](../../contracts/api-gateway/access-summary.md)
  - [navigation-summary.md](../../contracts/api-gateway/navigation-summary.md)
- adr:
  - [0001-unified-web-scope-aware-user-account.md](../../adr/0001-unified-web-scope-aware-user-account.md)
  - [0002-system-role-instance-and-account-role-scope.md](../../adr/0002-system-role-instance-and-account-role-scope.md)

## 4. 当前结论

- 本 feature 的长期协同规则以上游协同蓝图为准，packet 只保留执行必需结论。
- 当前阶段切换的是 `account context`，不是引入新的 `workspace` 模型。
- 可切换目标包括当前用户拥有的其他 `TENANT` context 与有效 `SYSTEM` context。
- 上下文切换必须由后端重建 session context 并重新签发 token，不能只做前端本地状态切换。
- 切换成功后前端必须刷新 token、`session context`、`access summary`、首页导航与 shell 状态。
- 目标 context 已失效时必须返回稳定错误语义，而不是前端静默失败。

## 5. 契约真相位置

- 稳定设计真相：
  - [unified-web-account-context.md](../../architecture/platforms/unified-web-account-context.md)
- 当前黑盒契约真相：
  - [auth-bff-login.md](../../contracts/api-gateway/auth-bff-login.md)
  - [access-summary.md](../../contracts/api-gateway/access-summary.md)
  - [navigation-summary.md](../../contracts/api-gateway/navigation-summary.md)
- 当前阶段已落地：
  - `GET /auth/session/contexts`
  - `POST /auth/session/switch-context`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结 feature 设计、补 feature packet、补 BFF 黑盒契约 | `docs/plans/features/**`, `docs/contracts/api-gateway/**`, 必要时 `docs/architecture/**` | 当前架构文档、现有 auth-bff 与 tenant-web 状态 | 冻结后的 feature packet 与契约草案 | completed |
| implementation owner | 单线程完成前后端闭环实现，覆盖 BFF、必要下游、tenant-web 切换入口与刷新链路 | `src/services/api-gateway/**`, 必要时 `src/services/system/auth-service/**`, 必要时 `src/services/system/identity-service/**`, `app/web/apps/tenant-web/**` | feature packet、黑盒契约 | 可运行实现与验证结果 | completed |
| review / integration owner | 审核边界、收口联调、确认 token/context/access/nav 切换一致性 | 只读全局，必要时最小修正 | design + implementation 结果 | review 结论、集成验证结果 | completed |

## 7. 当前 slice

- slice:
  - 第一阶段 context switch 闭环
- status:
  - completed
- scope:
  - 登录后从头像菜单进入上下文切换流程
  - BFF 列出可切换 context
  - BFF 执行切换并重新签发 token
  - 前端刷新当前 shell 状态
- completion:
  - 已冻结最小契约并完成前后端闭环实现
  - 已完成 `TENANT <-> SYSTEM` 双向切换验证

## 8. 主线范围

- 本线程主线：
  - 形成并落地第一阶段 account context switch 闭环
- 本线程不做：
  - 第二阶段增强交互
  - 通知联动
  - `org` 二次切换
- 偏移返回条件：
  - 若需要引入新上下文模型或修改稳定架构边界，则暂停并升级到 architecture / ADR

## 9. 阻塞 / 依赖

- 主线阻塞已清空，当前为已完成状态。
- 已确认 `auth-bff` context list / switch context 契约收口到 [auth-bff-login.md](../../contracts/api-gateway/auth-bff-login.md)。
- 已确认切换响应采用“新 token 对 + 最小 switched context summary”，由前端随后刷新 `session/context` 与 `session/access-summary`。
- 已确认 `identity-service` 的 `GetAccountsByUserId` 可作为 account context 列表事实源；如需 `tenantName`，由 BFF 聚合 `GetTenantById`。
- 已确认 `SYSTEM` scope 的 `tenantId` 语义收敛为“system scope 不携带有效 tenant 绑定”。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-14 | `workspace` 是否需要成为独立模型 | Blocker-Now | 若需要新模型则当前 feature 定义失效 | 已确认第一阶段不引入 `workspace` 新模型，继续按 account context 设计 | 当前 feature packet | closed |
| 2026-04-14 | context 失效时前端如何提示 | Blocker-Later | 影响错误交互一致性，但不阻塞当前设计方向 | 后续在 BFF 契约中冻结统一错误码与提示语义 | `docs/contracts/api-gateway/**` | open |
| 2026-04-14 | `identity-service` 可切换 context 事实源是否已存在 | Blocker-Now | 若无现成查询能力，则 context list 无法落地 | 已确认 `GetAccountsByUserId` 可复用；如需 `tenantName`，由 BFF 额外聚合 `GetTenantById` | 当前 feature packet | closed |
| 2026-04-14 | `SYSTEM` scope 的 `tenantId` 在 JWT 与 request context 中语义不一致 | Blocker-Now | 若不先统一，switch-context 实现容易继续依赖空字符串补丁 | 已统一 token payload / request context 的 system-scope tenant 语义 | implementation thread | closed |
| 2026-04-14 | context 切换是否需要通知联动 | Sidecar | 不影响第一阶段上下文切换主线 | 后续如确认纳入安全治理，再进入独立 feature 或 backlog | [intake.md](../intake.md) / [backlog.md](../backlog.md) | open |
| 2026-04-15 | 后端重启后服务端 session 失效、但前端 token 未过期时的 401 兜底体验 | Blocker-Later | 用户可能停留在“本地看似已登录，但任意受保护请求持续 401”的半失效状态，影响切换上下文与自助安全等后续交互一致性 | 当前尚未稳定复现，先保留为待验证问题；后续需确认是 refresh 未触发、refresh 失败后未统一强退、还是部分请求未走统一拦截器，再冻结“401 -> refresh -> force logout / login expired”语义 | 当前 feature packet，后续视结论回写 `docs/contracts/api-gateway/**` 或迁入 [backlog.md](../backlog.md) | open |

## 11. 验收标准

- 用户可在登录后从头像菜单进入“切换上下文”流程。
- 前端可以读取当前用户可切换的 context 列表。
- 当前 context 会被明确显示且不可选择。
- 用户可以切换到其他有效 `TENANT` context。
- 用户可以切换到有效 `SYSTEM` context。
- 切换后 token 已更新为新 context。
- 切换后 `session context`、`access summary`、首页导航与权限状态均刷新为新 context。
- 目标 context 失效时，返回稳定错误语义，而不是前端静默失败。
- 审计能够记录 context 切换行为。

## 12. 关闭条件

- feature packet 已冻结为当前阶段执行真相。
- `auth-bff` 黑盒契约已补齐并落地。
- 实现线程已完成前后端闭环。
- 已验证系统 context 与 tenant context 的双向切换主链。

## 13. 当前实现状态

- 已实现 `GET /auth/session/contexts` 与 `POST /auth/session/switch-context`。
- 已在 `tenant-web` 右上角头像菜单接入“切换上下文”入口。
- 已支持展示当前 context 与其他可切换 context。
- 已支持切换后重签 token，并刷新：
  - `GET /auth/session/context`
  - `GET /auth/session/access-summary`
  - 当前首页、导航与 tabbar 状态
- 已完成模块级编译、前端 typecheck / build，以及关键 controller / use case 测试。
- 已完成用户手动回归，确认 `TENANT <-> SYSTEM` 双向切换、首页切换与非首页切换均正常。

## 14. 残余后续项

- `context` 失效时的统一错误码与前端提示语义，后续继续在 BFF 契约中冻结。
- 后端重启导致服务端 session 失效、但前端 token 仍未过期时的 401 兜底体验，当前仍属待稳定复现问题；后续需结合 refresh 链路与统一强退语义继续冻结。
- 通知联动、安全增强等第二阶段能力继续保留在候选 / backlog，不回流到当前已完成主线。

## 15. 备注

- 当前判断该 feature 更适合“一个设计线程 + 一个实现线程做前后端闭环”，而不是机械拆成前后端双线程并行。
