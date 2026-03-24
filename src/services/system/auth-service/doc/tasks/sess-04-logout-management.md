# SESS-04 Logout Management

## 上游设计

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/auth-center.md](../design/auth-center.md)

## 当前承接范围

- 单 session 登出
- 用户全量 session 登出
- 对应认证审计事件

## 当前状态

- `SESS-02` 已完成 session 结构重构收口
- 当前代码基线已具备 `delete(sessionId)` 与 `deleteAllByUserId(userId)` 仓储能力

## 最小闭环范围

- contract：新增 `Logout` / `LogoutAll`
- application：新增 `LogoutCommand/Handler`、`LogoutAllCommand/Handler`
- interface：gRPC controller 接入
- audit：补 `LOGOUT_SUCCEEDED` / `LOGOUT_ALL_SUCCEEDED`
- doc：同步任务、设计、历史、全局审核记录

## 不包含范围

- 不做 device management
- 不做 session query
- 不做 access token blacklist

## 验收要求

- `Logout(sessionId)` 可成功删除指定 session
- `LogoutAll(userId)` 可成功删除该用户全部 session
- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
