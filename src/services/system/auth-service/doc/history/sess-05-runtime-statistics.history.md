# SESS-05 Runtime Statistics History

更新时间：2026-03-28 23:15 +09:00

## 本次范围

- 将 `SESS-05` 从“可用”继续收口到 `auth-service` 边界内完成态

## 本次结果

- `ListSessions` 与 `AdminListUserSessions` 现在正式返回 `sessionAgeSeconds`
- `ListSessions` 与 `AdminListUserSessions` 现在正式返回 `idleSeconds`
- 运行统计直接来自 session 聚合，不需要调用方自行根据时间戳换算
- 当前 `SESS-05` 已具备完整的最小设备视图、运行态视图、运行统计与管理动作闭环

## 验证

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
