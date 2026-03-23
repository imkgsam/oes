# MFA-04 Email OTP MFA

更新时间：2026-03-23 22:05:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 邮箱 OTP 作为登录后的二次验证方式
- 覆盖 challenge 触发与 challenge 提交两段链路

## 当前状态

- 部分实现

## 最小闭环范围

- contract：`LoginWithEmailPassword` 可返回 `MFA_REQUIRED`，新增 `SubmitMfaChallenge`
- domain：存在有效邮箱 OTP MFA 绑定时触发 challenge
- application：邮箱密码登录后触发 challenge；提交 challenge 后恢复到账户选择
- interface：gRPC controller 接入 challenge 提交命令
- doc：同步任务、历史、全局审核

## 不包含范围

- 手机 OTP MFA
- TOTP
- Recovery Codes
- MFA 设置管理界面
- MFA 通过后的 session 签发

## 验收要求

- 启用了邮箱 OTP MFA 的用户，邮箱密码登录返回 `LOGIN_STATUS_MFA_REQUIRED`
- 响应中返回可继续验证的 `challengeId`
- 提交正确的 `challengeId + code` 后，流程恢复到 `ACCOUNT_SELECTION_REQUIRED`
- 提交错误验证码时返回 `AUTH_OTP_INVALID`
- 未启用邮箱 OTP MFA 时，邮箱密码登录仍直接进入账户选择

## 关联设计文档

- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 阻塞项

- 当前仍复用 `MfaService.verifyMfaCode()` 完成验证码校验
- `MfaService` 结构偏大，后续完成当前主线后应拆为更细的 CQRS 用例能力
## 2026-03-23 Decomposition Update

- The active MFA-04 login-path flow no longer depends directly on `MfaService`.
- `LoginWithEmailPasswordHandler` now uses `EmailOtpMfaChallengeService`.
- `SubmitMfaChallengeHandler` now uses `MfaChallengeVerificationService`.
- `MfaService` remains only as a legacy holder for non-migrated MFA methods and is now marked `OUTDATED`.
