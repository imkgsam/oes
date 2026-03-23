# Auth Service 文档索引

更新时间：2026-03-24 00:28:22 +09:00

## 文档定位

`auth-service/doc/` 负责承载当前有效设计、最小闭环任务、历史记录与全局审核记录。

## 当前进度

- 总体进度：约 68%
- 工程基线与结构收敛：约 88%
- 人类认证主线：约 82%
- 安全增强能力：约 52%

## 已完成分片

- `AUTH-01` 邮箱密码登录
- `AUTH-02` 邮箱 OTP 登录
- `AUTH-03` 手机密码登录
- `AUTH-04` 手机 OTP 登录
- `AUTH-05` 登录后账户选择
- `SESS-01` 会话建立与 token 签发
- `SESS-03` refresh token rotation
- `MFA-04` 邮箱 OTP MFA challenge 与 challenge 提交
- `MFA-05` 手机 OTP MFA challenge
- `RISK-01` 登录失败限流与临时锁定
- `RISK-02` OTP 发码频控与 OTP 失败次数持久化
- `AUD-01` 认证审计事件

## 当前结构状态

- `auth-service` 已切回 `gRPC`
- 活跃认证链路已按 `CQRS` 推进
- 遗留 `MfaService` 已移除，活跃 `MFA-04` 链路已收敛到聚焦服务
- `MfaBinding` 已正式落到 Prisma schema 与数据库
- 四个 P0 人类认证方式已全部接入统一主链
- 邮箱/手机号标识符规范化规则已开始统一
- session 族能力已达到当前结构边界，后续继续扩展前需先做 session 结构重构

## 推荐阅读顺序

1. [overview.md](./overview.md)
2. [requirements.md](./requirements.md)
3. [roadmap.md](./roadmap.md)
4. [design/auth-center.md](./design/auth-center.md)
5. 各专题 `design/*.md`
6. 对应最小分片 `tasks/*.md`
7. [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md)

## 基础文档入口

- [overview.md](./overview.md)
- [requirements.md](./requirements.md)
- [roadmap.md](./roadmap.md)

## 设计文档入口

- [design/auth-center.md](./design/auth-center.md)
- [design/auth-flow.md](./design/auth-flow.md)
- [design/credential-management.md](./design/credential-management.md)
- [design/session-token-management.md](./design/session-token-management.md)
- [design/mfa-management.md](./design/mfa-management.md)
- [design/login-risk-control.md](./design/login-risk-control.md)
- [design/frontend-auth-context.md](./design/frontend-auth-context.md)

## 任务文档入口

### 认证方式

- [tasks/auth-01-email-password-login.md](./tasks/auth-01-email-password-login.md)
- [tasks/auth-02-email-otp-login.md](./tasks/auth-02-email-otp-login.md)
- [tasks/auth-03-phone-password-login.md](./tasks/auth-03-phone-password-login.md)
- [tasks/auth-04-phone-otp-login.md](./tasks/auth-04-phone-otp-login.md)

### 认证上下文与会话

- [tasks/auth-05-account-selection.md](./tasks/auth-05-account-selection.md)
- [tasks/sess-01-session-and-token-issuance.md](./tasks/sess-01-session-and-token-issuance.md)
- [tasks/sess-03-refresh-token-rotation.md](./tasks/sess-03-refresh-token-rotation.md)

### MFA、风控与审计

- [tasks/mfa-04-email-otp-mfa.md](./tasks/mfa-04-email-otp-mfa.md)
- [tasks/mfa-05-phone-otp-mfa.md](./tasks/mfa-05-phone-otp-mfa.md)
- [tasks/risk-01-login-failure-throttle.md](./tasks/risk-01-login-failure-throttle.md)
- [tasks/risk-02-otp-rate-limit.md](./tasks/risk-02-otp-rate-limit.md)
- [tasks/aud-01-auth-audit-events.md](./tasks/aud-01-auth-audit-events.md)

## 历史与审核

- [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md)
- [history/session-token-structure-review.history.md](./history/session-token-structure-review.history.md)
- [history/mfa-service-decomposition.history.md](./history/mfa-service-decomposition.history.md)
- [history/mfa-05-phone-otp-challenge.history.md](./history/mfa-05-phone-otp-challenge.history.md)
- [history/auth-02-email-otp-login.history.md](./history/auth-02-email-otp-login.history.md)
- [history/auth-03-phone-password-login.history.md](./history/auth-03-phone-password-login.history.md)
- [history/auth-04-phone-otp-login.history.md](./history/auth-04-phone-otp-login.history.md)
- [history/auth-identifier-normalization.history.md](./history/auth-identifier-normalization.history.md)
- [history/otp-persistence-hardening.history.md](./history/otp-persistence-hardening.history.md)
- [history/loginmethod-mapper-alignment.history.md](./history/loginmethod-mapper-alignment.history.md)
- [history/mfabinding-mapper-alignment.history.md](./history/mfabinding-mapper-alignment.history.md)

## 关联规范

- [doc-architecture-requirements.md](../../../../../doc/standards/doc-architecture-requirements.md)
- [requirements.md](../../../../../doc/standards/requirements.md)
- [microservice-architecture-reuse-guide.md](../../../../../doc/standards/microservice-architecture-reuse-guide.md)
