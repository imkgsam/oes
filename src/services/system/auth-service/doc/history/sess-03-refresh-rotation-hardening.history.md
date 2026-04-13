# SESS-03 Refresh Rotation Hardening History

更新时间：2026-03-28 23:00 +09:00

## 本次范围

- 将 `SESS-03` 从最小闭环推进到 `auth-service` 边界内完成态

## 本次结果

- refresh handler 现在会同时核对 `JWT sid` 与 refresh token 索引命中的 session
- 当索引缺失、索引错配或当前 session 已不再持有该 token 时，会视为 replay
- replay 检测命中后会撤销当前 session，并输出 `REFRESH_TOKEN_REPLAY_DETECTED` 审计事件
- 维持当前 `latest-refresh-token` 阶段模型，不在本轮引入 token family 新设计

## 验证

- `pnpm --filter auth-service build`
