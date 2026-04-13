# AUD-01 Replay And Lock Audit History

更新时间：2026-03-28 23:00 +09:00

## 本次范围

- 将认证审计事件补齐到当前 `auth-service` 主链完成态

## 本次结果

- 新增 `LOGIN_BLOCKED` 审计事件
- 新增 `REFRESH_TOKEN_REPLAY_DETECTED` 审计事件
- refresh replay 与登录锁定命中现已进入统一认证审计链路
- 统一事件模型与本地日志监听器保持不变，继续作为当前阶段正式输出边界

## 验证

- `pnpm --filter auth-service build`
