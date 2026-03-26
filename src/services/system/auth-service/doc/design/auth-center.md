# Auth Service 认证中心设计方案

更新时间：2026-03-25 15:40 +08:00

## 当前进度概览

- 总体进度：约 78%
- 工程基线与结构收敛：约 95%
- 人类认证主线：约 92%
- 安全增强与治理能力：约 75%

## 当前已落地能力

### 认证主线

- `AUTH-01` 邮箱密码登录
- `AUTH-02` 邮箱 OTP 登录
- `AUTH-03` 手机密码登录
- `AUTH-04` 手机 OTP 登录
- `AUTH-05` 登录后账户选择

### 会话与 token

- `SESS-01` session 建立与 token 签发
- `SESS-02` session 结构重构
- `SESS-03` refresh token rotation
- `SESS-04` logout / logoutAll
- `SESS-05` session query、设备重命名、保留当前设备退出其他设备、管理员单 session 管理

### MFA

- `MFA-04` 邮箱 OTP MFA
- `MFA-05` 手机 OTP MFA challenge

### 风控与审计

- `RISK-01` 登录失败限流与临时锁定
- `RISK-02` OTP 发码频控与 OTP 失败次数持久化
- `AUD-01` 认证审计事件

### 标识治理

- `CRED-01` identifier backfill 治理已完成当前目标库收口
- 当前目标数据库已完成 schema push
- 当前目标数据库 `LoginMethod` 数据量为 `0`

## 当前结构状态

- `gRPC` 已就位
- 活跃链路已按 `CQRS` 推进
- 遗留 `MfaService` 已移除
- 遗留 `SessionService` / `SessionModule` 已退出代码基线
- 活跃 session 链路已经覆盖 create / refresh / query / logout / keep-current-device / admin revoke
- `SESS-05` 的 admin 接口已开始接入既有 `operator context`

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 分类 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 认证方式 | AUTH-01 | [auth-01-email-password-login.md](../tasks/auth-01-email-password-login.md) | 邮箱密码登录闭环 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已进入统一 CQRS 主链 |
| 2 | 认证方式 | AUTH-02 | [auth-02-email-otp-login.md](../tasks/auth-02-email-otp-login.md) | 邮箱 OTP 登录闭环 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入 challenge、登录与后续账户选择分支 |
| 3 | 认证方式 | AUTH-03 | [auth-03-phone-password-login.md](../tasks/auth-03-phone-password-login.md) | 手机密码登录闭环 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入统一认证编排 |
| 4 | 认证方式 | AUTH-04 | [auth-04-phone-otp-login.md](../tasks/auth-04-phone-otp-login.md) | 手机 OTP 登录闭环 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入 challenge、登录与后续账户选择分支 |
| 5 | 认证上下文 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 登录后账户选择 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已支持账户候选、账户选择提交与归属校验 |
| 6 | 会话 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | session 与 token 签发 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已支持主登录链签发 |
| 7 | 会话 | SESS-02 | [sess-02-session-structure-refactor.md](../tasks/sess-02-session-structure-refactor.md) | session 结构重构 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已移除 access token 持久化并删除遗留 session facade |
| 8 | 会话 | SESS-03 | [sess-03-refresh-token-rotation.md](../tasks/sess-03-refresh-token-rotation.md) | refresh rotation | 部分实现 | 2026-03-25 15:40:00 +08:00 | 当前为 latest-refresh-token 模型 |
| 9 | 会话 | SESS-04 | [sess-04-logout-management.md](../tasks/sess-04-logout-management.md) | logout / logoutAll | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入最小 gRPC + CQRS 闭环与审计事件 |
| 10 | 会话 | SESS-05 | [sess-05-session-query-device-view.md](../tasks/sess-05-session-query-device-view.md) | session query / device view | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已支持 session 列表、设备重命名、保留当前设备退出其他设备、管理员列表与单 session 撤销，admin 身份来自既有 operator context |
| 11 | MFA | MFA-04 | [mfa-04-email-otp-mfa.md](../tasks/mfa-04-email-otp-mfa.md) | 邮箱 OTP MFA | 部分实现 | 2026-03-25 15:40:00 +08:00 | 活跃链路已脱离遗留大 service |
| 12 | MFA | MFA-05 | [mfa-05-phone-otp-mfa.md](../tasks/mfa-05-phone-otp-mfa.md) | 手机 OTP MFA | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入 challenge 能力 |
| 13 | 风控 | RISK-01 | [risk-01-login-failure-throttle.md](../tasks/risk-01-login-failure-throttle.md) | 登录失败限流 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入主登录链 |
| 14 | 风控 | RISK-02 | [risk-02-otp-rate-limit.md](../tasks/risk-02-otp-rate-limit.md) | OTP 发码频控 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已接入 MFA / OTP 相关链路 |
| 15 | 审计 | AUD-01 | [aud-01-auth-audit-events.md](../tasks/aud-01-auth-audit-events.md) | 认证审计事件 | 部分实现 | 2026-03-25 15:40:00 +08:00 | 已覆盖登录、MFA、refresh、logout、设备管理与 admin revoke 关键事件 |
| 16 | 治理 | CRED-01 | [cred-01-identifier-backfill.md](../tasks/cred-01-identifier-backfill.md) | identifier backfill 治理 | 已完成 | 2026-03-25 15:40:00 +08:00 | 当前目标库已完成 schema 同步、扫描验证与兼容双查清理；库内无历史数据 |
