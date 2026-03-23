# RISK-02 OTP Rate Limit History

更新时间：2026-03-23 23:05:00 +08:00

## 本次变更

- 修正 OTP 聚合：错误输入不会在第一次失败后直接使邮箱/手机 OTP 失效
- 新增 OTP 发码频控状态聚合与 Redis 仓储
- 新增 `OtpRiskThrottleService`
- 在 MFA 发码、重新发码链路中接入发码频控
- 在 MFA 验证链路中持久化错误尝试次数

## 影响范围

- `src/services/system/auth-service/src/domain/aggregates/otp.aggregate.ts`
- `src/services/system/auth-service/src/domain/aggregates/otp-send-throttle-state.aggregate.ts`
- `src/services/system/auth-service/src/domain/repositories/otp-send-throttle.repository.ts`
- `src/services/system/auth-service/src/infrastructure/repositories/redis/risk/redis-otp-send-throttle.repository.ts`
- `src/services/system/auth-service/src/application/services/otp-risk-throttle.service.ts`
- `src/services/system/auth-service/src/application/services/mfa.service.ts`
- `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- `src/services/system/auth-service/src/common/constants/injection-tokens.ts`
- `src/services/system/auth-service/src/common/constants/exception-enums/auth.errors.ts`

## 验证

- `pnpm.cmd --filter auth-service build`

## 结论

- `RISK-02` 当前最小闭环已完成：MFA OTP 发码频控与校验失败次数限制已形成闭环
- 当前未覆盖 OTP 登录主链和更复杂风险控制
