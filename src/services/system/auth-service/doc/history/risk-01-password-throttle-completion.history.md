# RISK-01 Password Throttle Completion History

更新时间：2026-03-28 23:00 +09:00

## 本次范围

- 将密码登录失败限流与临时锁定收口到 `auth-service` 边界内完成态

## 本次结果

- 邮箱密码登录与手机密码登录统一复用 `LoginRiskThrottleService`
- 风险状态已按规范化后的 identifier 读写和清理
- 锁定命中时会输出 `LOGIN_BLOCKED` 审计事件
- 设备 / IP 维度增强继续后置，不混入本轮最小完成态

## 验证

- `pnpm --filter auth-service build`
