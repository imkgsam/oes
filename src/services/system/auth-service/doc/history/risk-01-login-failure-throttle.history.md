# RISK-01 Login Failure Throttle History

更新时间：2026-03-23 22:25:00 +08:00

## 本次变更

- 新增登录失败状态聚合 `LoginFailureState`
- 新增登录风险仓储接口与 Redis 实现
- 新增 `LoginRiskThrottleService`
- 在邮箱密码登录 handler 中接入登录前检查、失败累加、成功清理

## 影响范围

- `src/services/system/auth-service/src/domain/aggregates/login-failure-state.aggregate.ts`
- `src/services/system/auth-service/src/domain/repositories/login-risk.repository.ts`
- `src/services/system/auth-service/src/infrastructure/repositories/redis/risk/redis-login-risk.repository.ts`
- `src/services/system/auth-service/src/application/services/login-risk-throttle.service.ts`
- `src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.ts`
- `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- `src/services/system/auth-service/src/common/constants/injection-tokens.ts`
- `src/services/system/auth-service/src/common/constants/exception-enums/auth.errors.ts`

## 验证

- `pnpm.cmd --filter auth-service build`

## 结论

- `RISK-01` 当前最小闭环已完成：邮箱密码登录已接入失败次数限制和临时锁定
- 当前未覆盖手机密码登录、OTP 登录、OTP 频控和审计链路
