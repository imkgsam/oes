# MFA-05 手机 OTP MFA 任务

更新时间：2026-03-22 16:40:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 手机 OTP 作为二次验证方式

## 当前状态

- 未开始

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

- 短信通道与限流尚未形成闭环
