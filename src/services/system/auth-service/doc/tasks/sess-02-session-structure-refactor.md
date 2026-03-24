# SESS-02 Session 结构重构

## 上游设计

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)
- [../history/session-token-structure-review.history.md](../history/session-token-structure-review.history.md)

## 当前承接范围

- 重构 `session` 领域模型与 Redis 持久化边界
- 收敛 `SessionService` 当前过大的职责范围
- 为后续 `logout`、`logoutAll`、`device management`、`session query`、`validateAccessToken` 提供正确地基

## 当前状态

- `SESS-01` 与 `SESS-03` 已形成主登录链最小闭环
- 当前模型仍以“一个 session 仅保存最新 refresh token”为边界
- 当前 `Session` 聚合仍保存完整 `accessToken` / `refreshToken` 文本，不适合继续扩展
- 当前 `SessionService` 不应继续承接更多 session 族行为

## 最小闭环范围

- domain：重新定义 `Session` 聚合应持有的正式会话事实
- domain：将 access token 文本从会话核心状态中移出
- domain：明确 refresh token 状态的正式边界
- infrastructure：重构 Redis session repository 的键模型与索引模型
- application：收缩 `SessionService`，移除不应继续累积的大 service 职责
- doc：同步设计、任务、历史、全局审核记录

## 不包含范围

- 不新增 `logout`
- 不新增 `logoutAll`
- 不新增 `session query`
- 不新增 `device management`
- 不新增 `validateAccessToken`
- 不在本任务中引入完整 token family 独立实体，除非重构过程中证明它已成为当前最小正确模型的一部分

## 验收要求

- `Session` 聚合不再把 access token 文本作为核心持久化事实
- refresh token rotation 现有行为不回退
- Redis session repository 不再依赖补丁式旧 token 索引清理维持核心一致性
- `SessionService` 的职责边界清晰收缩
- `pnpm --filter auth-service prisma:generate`
- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`

## 阻塞项

- 当前 `SESS-01` / `SESS-03` 生产行为不能回退
- 若重构需要新增或调整跨服务 contract，必须先更新设计再编码

## 关联设计文档

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)

## 2026-03-24 Current Alignment

- `Session` 聚合已移除 access token 文本持久化
- `SessionService.validateAccessToken()` 已改为 `JWT verify + sessionId lookup + session status/window` 校验
- Redis session repository 已移除 access token 索引，当前只保留 refresh token 作为会话续期事实边界
- `SelectAccountHandler` 与 `RefreshSessionHandler` 已直接承接活跃 create / refresh 编排，不再经过过渡 session 小 service
- 遗留 `SessionService` 与 `SessionModule` 已退出代码基线
- `logout`、`logoutAll`、`session query`、`device management` 继续后置
