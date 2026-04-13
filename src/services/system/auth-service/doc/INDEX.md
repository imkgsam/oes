# Auth Service 文档索引

更新时间：2026-03-28 23:15 +09:00

## 文档定位

`auth-service/doc/` 承载当前有效设计、最小闭环任务、历史记录与全局审核记录。

## 当前进度

- 总体进度：约 91%
- 工程基线与结构收敛：约 95%
- 人类认证主线：约 92%
- 安全增强与治理能力：约 96%

## 当前已完成分片

- `AUTH-01` 邮箱密码登录
- `AUTH-02` 邮箱 OTP 登录
- `AUTH-03` 手机密码登录
- `AUTH-04` 手机 OTP 登录
- `AUTH-05` 登录后账户选择
- `SESS-01` session 建立与 token 签发
- `SESS-02` session 结构重构收口
- `SESS-03` refresh token rotation
- `SESS-04` logout / logoutAll
- `SESS-05` session query、保留当前设备退出其他设备、管理员查询与单 session 撤销
- `MFA-04` 邮箱 OTP MFA
- `MFA-05` 手机 OTP MFA challenge
- `MFA-06` OTP MFA 绑定管理
- `MFA-07` TOTP MFA
- `MFA-08` Recovery Codes
- `RISK-01` 登录失败限流
- `RISK-02` OTP 发码频控与失败次数持久化
- `AUD-01` 认证审计事件
- `CRED-01` identifier backfill 治理已完成当前目标库收口

## 当前最值得关注的未收口点

- 邮件与短信仍是模拟通道
- 真实邮件与短信通道仍未确定

## 已记录的后续治理项

- gateway 到 `auth-service` 的设备上下文自动透传协议
说明：该事项已被明确记录，但当前不在本线程内实现；后续应以跨模块设计项推进

## 当前结构状态

- `auth-service` 仅保留 `gRPC` 对外接口
- 活跃主链已回到 `CQRS command/query handler` 主导
- 遗留 `MfaService`、`SessionService`、`SessionModule` 已退出活跃代码路径
- repository 注入已统一收敛到 `REPO.*` symbol 风格
- 当前 session 主链已可运行，并补齐用户侧与管理员侧最小 session 管理
- 管理员 session 接口已开始接入既有 `operator context`，不再依赖请求体中的 `adminId`
- 当前目标数据库已完成 auth-service schema 同步，`LoginMethod` 记录数为 `0`

## 文档导航

### 基础文档

- [overview.md](./overview.md)
- [roadmap.md](./roadmap.md)

### 设计文档

- [design/auth-center.md](./design/auth-center.md)
- [design/session-token-management.md](./design/session-token-management.md)
- [design/identifier-backfill.md](./design/identifier-backfill.md)

### 任务文档

- [tasks/auth-01-email-password-login.md](./tasks/auth-01-email-password-login.md)
- [tasks/auth-02-email-otp-login.md](./tasks/auth-02-email-otp-login.md)
- [tasks/auth-03-phone-password-login.md](./tasks/auth-03-phone-password-login.md)
- [tasks/auth-04-phone-otp-login.md](./tasks/auth-04-phone-otp-login.md)
- [tasks/auth-05-account-selection.md](./tasks/auth-05-account-selection.md)
- [tasks/sess-01-session-and-token-issuance.md](./tasks/sess-01-session-and-token-issuance.md)
- [tasks/sess-02-session-structure-refactor.md](./tasks/sess-02-session-structure-refactor.md)
- [tasks/sess-03-refresh-token-rotation.md](./tasks/sess-03-refresh-token-rotation.md)
- [tasks/sess-04-logout-management.md](./tasks/sess-04-logout-management.md)
- [tasks/sess-05-session-query-device-view.md](./tasks/sess-05-session-query-device-view.md)
- [tasks/mfa-04-email-otp-mfa.md](./tasks/mfa-04-email-otp-mfa.md)
- [tasks/mfa-05-phone-otp-mfa.md](./tasks/mfa-05-phone-otp-mfa.md)
- [tasks/mfa-06-binding-management.md](./tasks/mfa-06-binding-management.md)
- [tasks/mfa-07-totp-mfa.md](./tasks/mfa-07-totp-mfa.md)
- [tasks/mfa-08-recovery-codes.md](./tasks/mfa-08-recovery-codes.md)
- [tasks/risk-01-login-failure-throttle.md](./tasks/risk-01-login-failure-throttle.md)
- [tasks/risk-02-otp-rate-limit.md](./tasks/risk-02-otp-rate-limit.md)
- [tasks/aud-01-auth-audit-events.md](./tasks/aud-01-auth-audit-events.md)
- [tasks/cred-01-identifier-backfill.md](./tasks/cred-01-identifier-backfill.md)

### 历史与审核

- [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md)
- [history/session-token-structure-review.history.md](./history/session-token-structure-review.history.md)
- [history/sess-02-session-structure-refactor.history.md](./history/sess-02-session-structure-refactor.history.md)
- [history/sess-04-logout-management.history.md](./history/sess-04-logout-management.history.md)
- [history/sess-05-session-query-device-view.history.md](./history/sess-05-session-query-device-view.history.md)
- [history/sess-05-logout-other-devices.history.md](./history/sess-05-logout-other-devices.history.md)
- [history/sess-05-rename-session-device.history.md](./history/sess-05-rename-session-device.history.md)
- [history/sess-05-admin-session-management.history.md](./history/sess-05-admin-session-management.history.md)
- [history/cred-01-identifier-backfill.history.md](./history/cred-01-identifier-backfill.history.md)
- [history/mfa-06-binding-management.history.md](./history/mfa-06-binding-management.history.md)
- [history/mfa-07-totp-mfa.history.md](./history/mfa-07-totp-mfa.history.md)
- [history/mfa-08-recovery-codes.history.md](./history/mfa-08-recovery-codes.history.md)
- [history/sess-05-device-view-enrichment.history.md](./history/sess-05-device-view-enrichment.history.md)
- [history/aud-01-session-audit-context.history.md](./history/aud-01-session-audit-context.history.md)
- [history/sess-05-runtime-state-view.history.md](./history/sess-05-runtime-state-view.history.md)
- [history/sess-05-runtime-flags.history.md](./history/sess-05-runtime-flags.history.md)
