# SESS-02 Session Structure Refactor 历史

更新时间：2026-03-24 12:55:00 +08:00

## 本次范围

- 启动 `SESS-02`
- 移除 access token 文本作为当前 session 核心持久化状态
- 收敛 access token 校验方向

## 修改文件

- `src/domain/aggregates/usersession.aggregate.ts`
- `src/domain/repositories/user-session.repository.ts`
- `src/application/services/session.service.ts`
- `src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- `doc/tasks/sess-02-session-structure-refactor.md`
- `doc/design/session-token-management.md`
- `doc/design/auth-center.md`
- `doc/history/minimum-closure-global-review.history.md`

## 行为影响

- `Session` 聚合当前只持有 refresh token 续期事实，不再持有 access token 文本
- access token 校验方向改为：`JWT verify + sessionId lookup + session 状态/时间窗校验`
- refresh token rotation 现有行为不回退

## 风险与后续

- `SessionService` 仍是遗留 service，尚未完成最终退出
- `logout`、`logoutAll`、`session query`、`device management`、`validateAccessToken` 深化能力仍应以后续 `SESS-02` 子步骤继续推进

## 2026-03-24 13:08:00 +08:00 增量收敛

- 已删除过渡性的 session 小 service
- 活跃 `create / refresh` 链路已直接回到 CQRS handler
- 当前不再保留 `handler -> session small service` 的中间层

## 2026-03-24 13:22:00 +08:00 增量收敛

- 已删除遗留 `SessionService`
- 已删除遗留 `SessionModule`
- 当前活跃 session 主链已不再保留任何旧 facade / 旧 module 入口
