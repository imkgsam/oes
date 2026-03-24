# Auth Service 文档索引

更新时间：2026-03-24 14:20 +08:00

## 文档定位

`auth-service/doc/` 承载当前有效设计、最小闭环任务、历史记录与全局审核记录。

## 当前进度

- 总体进度：约 72%
- 工程基线与结构收敛：约 92%
- 人类认证主线：约 88%
- 安全增强能力：约 60%

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
- `MFA-04` 邮箱 OTP MFA
- `MFA-05` 手机 OTP MFA challenge
- `RISK-01` 登录失败限流
- `RISK-02` OTP 发码频控与失败次数持久化
- `AUD-01` 认证审计事件

## 当前结构状态

- `auth-service` 仅保留 `gRPC` 对外接口
- 活跃主链已回到 `CQRS handler` 主导
- 遗留 `MfaService`、`SessionService`、`SessionModule` 已退出活跃代码路径
- repository 注入已收敛到 `REPO.*` symbol 风格
- `MfaBinding` 已进入 Prisma schema 与持久化实现
- 当前 session 主链已完成结构收口，可以继续在正确方向上扩展 session 族能力

## 推荐阅读顺序

1. [overview.md](./overview.md)
2. [requirements.md](./requirements.md)
3. [roadmap.md](./roadmap.md)
4. [design/auth-center.md](./design/auth-center.md)
5. [design/session-token-management.md](./design/session-token-management.md)
6. 对应最小分片 `tasks/*.md`
7. [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md)

## 基础文档

- [overview.md](./overview.md)
- [requirements.md](./requirements.md)
- [roadmap.md](./roadmap.md)

## 设计文档

- [design/auth-center.md](./design/auth-center.md)
- [design/auth-flow.md](./design/auth-flow.md)
- [design/credential-management.md](./design/credential-management.md)
- [design/session-token-management.md](./design/session-token-management.md)
- [design/mfa-management.md](./design/mfa-management.md)
- [design/login-risk-control.md](./design/login-risk-control.md)
- [design/frontend-auth-context.md](./design/frontend-auth-context.md)

## 任务文档

### 认证方式

- [tasks/auth-01-email-password-login.md](./tasks/auth-01-email-password-login.md)
- [tasks/auth-02-email-otp-login.md](./tasks/auth-02-email-otp-login.md)
- [tasks/auth-03-phone-password-login.md](./tasks/auth-03-phone-password-login.md)
- [tasks/auth-04-phone-otp-login.md](./tasks/auth-04-phone-otp-login.md)

### 认证上下文与会话

- [tasks/auth-05-account-selection.md](./tasks/auth-05-account-selection.md)
- [tasks/sess-01-session-and-token-issuance.md](./tasks/sess-01-session-and-token-issuance.md)
- [tasks/sess-02-session-structure-refactor.md](./tasks/sess-02-session-structure-refactor.md)
- [tasks/sess-03-refresh-token-rotation.md](./tasks/sess-03-refresh-token-rotation.md)
- [tasks/sess-04-logout-management.md](./tasks/sess-04-logout-management.md)

### MFA、风控与审计

- [tasks/mfa-04-email-otp-mfa.md](./tasks/mfa-04-email-otp-mfa.md)
- [tasks/mfa-05-phone-otp-mfa.md](./tasks/mfa-05-phone-otp-mfa.md)
- [tasks/risk-01-login-failure-throttle.md](./tasks/risk-01-login-failure-throttle.md)
- [tasks/risk-02-otp-rate-limit.md](./tasks/risk-02-otp-rate-limit.md)
- [tasks/aud-01-auth-audit-events.md](./tasks/aud-01-auth-audit-events.md)

## 历史与审核

- [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md)
- [history/session-token-structure-review.history.md](./history/session-token-structure-review.history.md)
- [history/sess-02-session-structure-refactor.history.md](./history/sess-02-session-structure-refactor.history.md)
- [history/sess-04-logout-management.history.md](./history/sess-04-logout-management.history.md)
- [history/repo-symbol-alignment.history.md](./history/repo-symbol-alignment.history.md)

## 关联规范

- [doc-architecture-requirements.md](../../../../../doc/standards/doc-architecture-requirements.md)
- [requirements.md](../../../../../doc/standards/requirements.md)
- [microservice-architecture-reuse-guide.md](../../../../../doc/standards/microservice-architecture-reuse-guide.md)
