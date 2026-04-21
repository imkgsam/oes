# 管理员会话管理

## 1. 目标

- 提供一个统一的管理员会话管理页面，不再按系统管理员页与租户管理员页拆成两套页面。
- 页面按当前管理员 `scope` 自适应：
  - 系统管理员看到全局可见范围
  - 租户管理员只看到本租户可见范围
- 第一层先展示“当前在线用户列表”，明确哪些用户在线以及每个用户的在线 session 数量。
- 点击某个用户后进入该用户的会话列表，支持会话查看与单条撤销。
- 保持“会话管理”与“登录历史 / 审计查询”边界分离，当前 feature 不扩展成安全分析页面。

## 2. 不做什么

- 不拆成系统管理员页与租户管理员页两套独立页面。
- 不在第一阶段做完整用户搜索器或租户搜索选择器。
- 不在第一阶段做批量撤销、批量操作或批量导出。
- 不在第一阶段做会话详情抽屉。
- 不在第一阶段做登录历史页面。
- 不在第一阶段把该页面扩展成审计分析 / 安全运营页面。

## 3. 上游依赖

- architecture:
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
  - [07-permission-code-source.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- collaborations:
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
- contracts:
  - [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)

## 4. 当前结论

- 当前 feature 的定位是“管理员会话管理”，不是“登录历史页”或“审计分析页”。
- 统一页面按管理员当前 `scope` 自适应，不为不同管理员角色拆分独立 HTTP 接口或独立前端页面。
- 第一层页面展示在线用户总览，而不是直接展示全量 session 明细。
- 在线用户总览只展示“当前至少存在一个活跃 session 的用户”，并显示在线 session 数量。
- 点击用户后进入该用户的会话列表；同一列表中可包含活跃、已撤销、已过期状态，但默认排序应优先展示当前 / 活跃会话，再按最近活跃时间倒序。
- 第一阶段核心动作只有“单条撤销会话”。
- 管理员不允许撤销自己当前正在使用的会话。
- 第一阶段仅保留轻量筛选，不引入新的用户目录型搜索能力。

## 5. 契约真相位置

- 当前稳定设计真相：
  - [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
- 当前已存在能力：
  - `GET /auth/admin/users/:userId/sessions`
  - `POST /auth/admin/sessions/:sessionId/revoke`
- 当前 feature 预期新增或调整的 BFF 黑盒契约：
  - 在线用户总览查询
  - 用户会话列表的轻量筛选与排序语义
  - “不可撤销自己当前会话”的稳定错误语义
- 当前状态：
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md) 已冻结第一阶段目标契约方向，后续实现应围绕该契约推进，而不是回到“仅靠手输 userId 调查”的旧页面语义

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结在线用户总览与用户会话列表的页面边界、BFF 契约需求与后置项归位 | `docs/plans/features/**`, `docs/contracts/api-gateway/**`, 必要时 `docs/plans/backlog.md` | 现有 admin session 契约、当前前端页面与本 feature 目标 | 冻结后的 feature packet 与后置记录 | completed |
| implementation owner | 基于冻结契约推进 BFF / 前端实现，保持下游 auth-service 边界清晰 | `src/services/api-gateway/**`, 必要时 `src/services/system/auth-service/**`, `app/web/apps/tenant-web/**` | feature packet、contracts | 可运行实现与验证结果 | completed |
| review / integration owner | 审核统一页面是否按 scope 自适应、会话动作是否保持边界、后置项是否未混入主线 | 只读全局，必要时最小修正 | design + implementation 结果 | review 结论、集成验证结果 | completed |

## 7. 当前 slice

- slice:
  - 冻结第一阶段管理员会话管理页面设计
- status:
  - contract-frozen
- scope:
  - 统一页面
  - 在线用户总览
  - 点击进入用户会话列表
  - 轻量筛选
  - 单条撤销
- ready definition:
  - 已明确页面层次与角色自适应方式
  - 已明确第一阶段不做详情抽屉、登录历史、批量操作与完整用户搜索器
  - 已明确“不可撤销自己当前会话”

## 8. 主线范围

- 本线程主线：
  - 冻结管理员会话管理第一阶段的页面结构、查询入口与操作边界
- 本线程不做：
  - 登录历史页面
  - 会话详情抽屉
  - 批量撤销
  - 用户搜索器 / 租户选择器增强
- 偏移返回条件：
  - 若需要改变 `auth-service` 的管理员会话边界模型，或需要引入新的用户目录型契约，应先升级 contracts / architecture 判断

## 9. 阻塞 / 依赖

- 现有 `auth-bff` 管理员会话能力仍以“指定 `userId` 查看目标用户会话”作为主语义，尚不支持在线用户总览入口。
- 当前前端已有 [auth-session-management.vue](/Users/acehood/Documents/GitHub/oes/app/web/apps/tenant-web/src/views/admin/auth-session-management.vue) 页面，但语义仍偏“目标用户调查页”，不是当前冻结的“在线用户总览 -> 用户会话列表”结构。
- 在线用户总览需要新增按管理员 `scope` 聚合“当前在线用户 + 在线 session 数量”的查询能力。
- 用户会话列表阶段仍可复用现有目标用户会话查询能力，但需补齐轻量筛选、排序与“不可撤销自己当前会话”的明确交互语义。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-15 | 页面是否统一为系统管理员 / 租户管理员共用 | Blocker-Now | 若拆成两套页面，后续契约与前端结构都会分叉 | 已确认统一页面，按当前管理员 `scope` 自适应 | 当前 feature packet | closed |
| 2026-04-15 | 管理页入口是否先看全量 session | Blocker-Now | 影响页面结构、BFF 契约与筛选方式 | 已确认改为“在线用户总览 -> 用户会话列表”两层结构 | 当前 feature packet | closed |
| 2026-04-15 | 会话详情抽屉 | Blocker-Later | 会增加交互与字段冻结复杂度，但不阻塞第一阶段管理闭环 | 后续如确认需要，单独冻结详情字段与交互方式，不提前混入当前主线 | `docs/plans/backlog.md` 或下一阶段 feature slice | open |
| 2026-04-15 | 登录历史页面 | Sidecar | 与当前管理页目标不同，若混入会把会话管理与审计历史边界打乱 | 已确认后置，不进入当前 feature 主线 | [backlog.md](/Users/acehood/Documents/GitHub/oes/docs/plans/backlog.md) | open |

## 11. 验收标准

- 管理员通过一个统一页面进入会话管理，而不是按角色进入两套页面。
- 系统管理员与租户管理员在同一页面模型下工作，但可见范围按当前 `scope` 正确收敛。
- 第一层能够展示当前可见范围内的在线用户与其在线 session 数量。
- 点击某个用户后，能够进入该用户的会话列表。
- 用户会话列表默认优先展示当前 / 活跃会话，其次按最近活跃时间倒序。
- 管理员能够撤销目标单个会话。
- 管理员不能撤销自己当前正在使用的会话。
- 第一阶段未纳入的详情抽屉、登录历史、批量操作与完整搜索器不会混入主线实现。

## 12. 关闭条件

- feature packet 已冻结为当前阶段执行真相。
- 登录历史页面已迁入 backlog。
- 当前实现线程所需的 BFF 契约增量已明确。
- 后续实现可基于当前 packet 直接推进，而无需再重新讨论页面主结构。
- 第一阶段代码链路已完成：在线用户总览、用户会话列表、单条撤销与“不可撤销当前会话”均已落地并完成聚焦验证。

## 13. 当前实现状态

- 第一阶段统一管理员会话管理页面已落地为“在线用户总览 -> 用户会话列表”结构。
- 当前管理员会话管理主线已具备以下黑盒能力：
  - `GET /auth/admin/online-users`
  - `GET /auth/admin/users/:userId/sessions`
  - `POST /auth/admin/sessions/:sessionId/revoke`
- `auth-service` 已补齐按管理员可见范围聚合在线用户总览的查询能力。
- `api-gateway` 已补齐在线用户总览 BFF 查询，并在撤销动作中稳定拒绝“撤销自己当前会话”。
- `tenant-web` 管理页已从“手输 userId 调查”收敛为“先看在线用户，再进入用户会话列表”的结构。

## 14. 已完成验证

- `auth-service`
  - `pnpm --dir src/services/system/auth-service exec jest src/application/queries/session/admin-list-online-users.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand`
  - `pnpm --dir src/services/system/auth-service build`
- `api-gateway`
  - `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand`
  - `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts --runInBand`
  - `pnpm --dir src/services/api-gateway build`
- `tenant-web`
  - `pnpm --dir app/web --filter @oes/tenant-web typecheck`
  - `pnpm --dir app/web --filter @oes/tenant-web build`

## 15. 残余后续项

- 会话详情抽屉后置，待第一阶段主线闭环后再决定是否立项。
- 登录历史页面后置，不与当前管理员会话管理页混做一页。
- 批量撤销、批量操作、完整用户搜索器、租户选择器增强后置。
- 当前 `GET /auth/admin/online-users` 中的 `activeAccountCount` 由 `api-gateway` 通过逐个 user 再查询会话明细后推导得到，作为当前管理员页最小闭环是可接受的，但这会让 BFF 在页面级产生额外下游调用放大；若后续在线用户规模提升，应将“按 user 聚合在线 account / session 统计”的能力下沉为 `auth-service` 原生批量聚合能力，而不是长期停留在 BFF 侧推导。

## 16. 备注

- 当前实现应优先复用现有管理员会话查询 / 撤销底座，而不是重做一套新的 session 模型。
- 若未来要扩展成“安全运营台”，应单独立 feature 或升级到新的协同设计，不应在当前 packet 中无限追加。
