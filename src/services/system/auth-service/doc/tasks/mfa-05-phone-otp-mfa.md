# MFA-05 手机 OTP MFA 任务

更新时间：2026-03-23 23:35:50 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 手机 OTP 作为二次验证方式

## 当前状态

- 部分实现

## 最小闭环范围

- contract：定义手机 OTP MFA challenge 与验证接口
- schema：确认 `MFA_VERIFY` usage
- domain：手机 OTP MFA 规则
- application：生成 challenge、发码、验证
- interface：挑战与验证接口
- tests：覆盖密码登录后触发 MFA、同因子 OTP 登录不重复挑战
- doc：同步状态与验收结果

## 不包含范围

- TOTP
- Recovery Codes
- 邮箱 OTP MFA

## 验收要求

- 密码登录 + 启用手机 MFA 时可进入 challenge
- 手机 OTP 登录默认不重复触发手机 OTP MFA

## 关联设计文档

- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 阻塞项

- 当前仅接入“邮箱密码登录后触发手机 OTP MFA challenge”，尚未覆盖手机密码登录主认证链
- 短信通道当前仍为开发/占位实现，生产短信能力未接通

## 2026-03-23 Incremental Update

- 已新增 `PhoneOtpMfaChallengeService`
- `LoginWithEmailPassword` 现可在存在 `SMS_OTP` 绑定时返回 `MFA_REQUIRED`
- `SubmitMfaChallenge` 复用了既有 challenge 提交流程，无需新增外部接口
