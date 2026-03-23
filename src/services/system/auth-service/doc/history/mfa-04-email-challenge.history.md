# MFA-04 Email OTP MFA History

更新时间：2026-03-23 22:05:00 +08:00

## 本次变更

- `LoginWithEmailPassword` 在命中邮箱 OTP MFA 绑定时返回 `MFA_REQUIRED`
- 新增 `SubmitMfaChallenge` gRPC 接口
- 新增 `SubmitMfaChallengeCommand/Handler`
- 提交正确验证码后恢复到账户选择链路

## 影响范围

- `src/common/src/contracts/auth_service/auth.proto`
- `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.command.ts`
- `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/index.ts`
- `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`

## 验证

- `pnpm.cmd proto:gen`
- `pnpm.cmd --filter @oes/common build`
- `pnpm.cmd --filter auth-service build`

## 结论

- `MFA-04` 当前最小闭环已完成：challenge 触发、challenge 提交、恢复到账户选择
- 当前仍未进入手机 OTP、TOTP、Recovery Codes 与 MFA 管理能力
