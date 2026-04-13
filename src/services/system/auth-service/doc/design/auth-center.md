# Auth Service 认证中心设计方案

更新时间：2026-03-30 23:58 +09:00

## 当前进度概览

- 总体进度：约 91%
- 工程基线与结构收敛：约 95%
- 人类认证主线：约 92%
- 安全增强与治理能力：约 96%

## 当前所在阶段

- 当前位置：`Phase 1` 后段，主认证闭环已经成形，正在做 session 收口与运行面补强
- 当前已经真的写进代码的主线：`AUTH-01/02/03/04/05`、`SESS-01/02/03/04/05`、`MFA-04/05/06/07/08`、`RISK-01/02`、`AUD-01`
- 当前还没有完全收口的重点：本地 Redis 运行基线、部分上游契约适配、跨模块设备上下文自动透传

## 已实现了什么

### 认证主线

- 已有邮箱密码登录、邮箱 OTP 登录、手机密码登录、手机 OTP 登录四条入口
- 已有 MFA_REQUIRED 与 ACCOUNT_SELECTION_REQUIRED 两类主分支
- 已有登录后账户候选查询与账户选择提交
- 已接入 `identity-service` 获取可用账户与账户归属校验

### 会话与 token

- 已能在账户选择后签发 access token / refresh token
- 已有 refresh token rotation
- 已有 logout、logoutAll、保留当前设备退出其他设备
- 已有 session 列表、管理员查看用户 session、管理员撤销单 session
- session 查询视图已可返回 `loginMethod / platform / browser`
- session 查询视图已可返回最小运行态信息 `accessRemainingSeconds / refreshRemainingSeconds`
- session 查询视图已可返回直接运行统计 `sessionAgeSeconds / idleSeconds`
- session 查询视图已可返回直接运行态标记 `isAccessExpired / isRefreshExpired / isRevoked`

### MFA、风控与审计

- 已有邮箱 OTP MFA challenge 与提交校验
- 已有手机 OTP MFA challenge 与提交校验
- 已有 TOTP binding 初始化、激活、停用、登录 challenge 与提交校验
- 已有 Recovery Codes 初始化、轮换、停用与 `TOTP` challenge 下的一次性消费
- 已有密码登录失败限流与统一锁定审计
- 已有 OTP 发码频控与 OTP 尝试次数持久化
- 已有登录、锁定、MFA、refresh、refresh replay、logout、设备管理、admin revoke 审计事件
- session 相关审计事件已统一携带会话与设备上下文

## 还没有实现完整的地方

- 邮件和短信仍是开发 / 模拟通道，不是生产发送链路
- OTP 发送链路已切到 `NotificationDispatchPort`
- 当前 `auth-service` 已内置 `local` fallback adaptor 和 `notification-service` gRPC adaptor，默认仍走 `local`
- `notification-service` 本地 PostgreSQL / gRPC / idempotency / dispatch 落库已经过运行验证
- `auth-service` 本地运行时已支持通过静态 gRPC URL 直连 `identity-service / permission-service / notification-service`
- `MfaBinding` 管理面已覆盖 `EMAIL_OTP / SMS_OTP / TOTP / BACKUP_CODE`
- `permission-service` 只有最小权限检查接入，`getAccountAuthorizationSummary` 仍未有真实上游契约
- session 目前运行时主要依赖 Redis repository，Prisma 中的 `UserSession` 模型尚未进入统一持久化主路径

## 建议下一步

1. `auth-service` 内部最小闭环任务已基本收口，下一步主要取决于是否开始处理外部依赖事项
2. 若继续后置外部依赖，则可进入整体复盘与后续阶段规划

## 已记录但后置的事项

- 设备上下文自动透传协议需要单独记录为后续治理项
- 当前 `auth-service` 只冻结了“`SelectAccountRequest` 显式字段承接设备上下文”的单服务边界
- 若未来要把设备上下文纳入 gateway 到下游服务的共享 metadata 传播，需要先开跨模块设计线程，不能在本线程里继续隐式扩展

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
- `SESS-05` session query、保留当前设备退出其他设备、管理员单 session 管理

### MFA

- `MFA-04` 邮箱 OTP MFA
- `MFA-05` 手机 OTP MFA challenge
- `MFA-06` OTP MFA 绑定管理
- `MFA-07` TOTP MFA
- `MFA-08` Recovery Codes

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

| 序号 | 分类 | 任务编号 | 任务文档 | 当前状态 | 代码已落地 | 当前缺口 | 建议下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 认证方式 | AUTH-01 | [auth-01-email-password-login.md](../tasks/auth-01-email-password-login.md) | 部分实现 | 已有邮箱密码登录、失败限流、MFA 分支、账户选择分支 | 缺真实运行通道级联调与更完整上下文输入 | 保持现状，优先推进 session 收口 |
| 2 | 认证方式 | AUTH-02 | [auth-02-email-otp-login.md](../tasks/auth-02-email-otp-login.md) | 已实现 | 已有发码、OTP 校验、登录主链、后续账户选择，且 `AUTH_NOTIFICATION_TRANSPORT=grpc` 下的本地端到端验证已完成 | 真实邮件通道仍后置，不计入当前任务缺口 | 维持现状 |
| 3 | 认证方式 | AUTH-03 | [auth-03-phone-password-login.md](../tasks/auth-03-phone-password-login.md) | 部分实现 | 已有手机密码登录与统一认证编排 | 手机号规范化虽已接入，但真实存量与运行面未充分验证 | 保持现状，等待 session 与通道收口 |
| 4 | 认证方式 | AUTH-04 | [auth-04-phone-otp-login.md](../tasks/auth-04-phone-otp-login.md) | 部分实现 | 已有手机 OTP 发码、校验、登录主链，且通知 gRPC 链已完成单服务运行验证 | 本地 Redis 未启动前，OTP 发码端到端验证仍会先卡在风控 / 节流层 | 启动 Redis 后做 `AUTH_NOTIFICATION_TRANSPORT=grpc` 端到端验证 |
| 5 | 认证上下文 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 已实现 | 已支持账户候选、账户选择提交、归属校验、签发 token，且本地邮箱 OTP 登录链已验证成功进入 `SelectAccount -> LOGIN_STATUS_SUCCESS` | 账户授权摘要仍未由 permission-service 完整提供，但不阻塞当前任务闭环 | 后续再评估是否补授权摘要契约 |
| 6 | 会话 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | 已实现 | 已支持主登录链签发 session、access token、refresh token，且本地邮箱 OTP 登录主链已验证成功返回 session/token | 上游自动透传设备上下文仍未统一，但不计入当前任务缺口 | 后续仅随跨模块治理增强 |
| 7 | 会话 | SESS-02 | [sess-02-session-structure-refactor.md](../tasks/sess-02-session-structure-refactor.md) | 已实现 | 已移除 access token 持久化、收口设备上下文入口，并完成 Redis 索引一致性与 deviceInfo 规范化 | gateway 自动透传设备上下文仍是跨模块后续项，不计入本任务缺口 | 维持现状 |
| 8 | 会话 | SESS-03 | [sess-03-refresh-token-rotation.md](../tasks/sess-03-refresh-token-rotation.md) | 已实现 | 已有 latest-refresh-token 模型、索引一致性事务、refresh replay 检测与 session 撤销 | token family 建模后置，不计入当前任务缺口 | 维持现状 |
| 9 | 会话 | SESS-04 | [sess-04-logout-management.md](../tasks/sess-04-logout-management.md) | 部分实现 | 已接入 logout、logoutAll 与审计事件 | 仍运行在当前 Redis session 模型上，后续可继续增强审计与策略联动 | 维持现状 |
| 10 | 会话 | SESS-05 | [sess-05-session-query-device-view.md](../tasks/sess-05-session-query-device-view.md) | 已实现 | 已支持 session 列表、保留当前设备退出其他设备、管理员列表与单 session 撤销，且查询结果已返回 `loginMethod / platform / browser / accessRemainingSeconds / refreshRemainingSeconds / sessionAgeSeconds / idleSeconds / isAccessExpired / isRefreshExpired / isRevoked`；session 审计已带统一上下文 | 更深设备画像后续如需继续增强，可作为单独优化项 | 维持现状 |
| 11 | MFA | MFA-04 | [mfa-04-email-otp-mfa.md](../tasks/mfa-04-email-otp-mfa.md) | 已实现 | 已有邮箱 OTP MFA challenge、提交校验与绑定管理依赖，且 challenge 发码已具备真实通知 gRPC 切换位 | 真实邮件通道仍后置 | 维持现状 |
| 12 | MFA | MFA-05 | [mfa-05-phone-otp-mfa.md](../tasks/mfa-05-phone-otp-mfa.md) | 已实现 | 已有手机 OTP MFA challenge、提交校验与绑定管理依赖，且 challenge 发码已具备真实通知 gRPC 切换位并已完成单服务运行验证 | 本地 Redis 未启动前，OTP 发码端到端验证仍会先卡在风控 / 节流层 | 启动 Redis 后做 `AUTH_NOTIFICATION_TRANSPORT=grpc` 端到端验证 |
| 13 | MFA | MFA-06 | [mfa-06-binding-management.md](../tasks/mfa-06-binding-management.md) | 已实现 | 已支持查询 / 启用 / 停用 `EMAIL_OTP / SMS_OTP` 管理入口 | 更高阶因子已移至独立任务闭环 | 维持现状 |
| 14 | MFA | MFA-07 | [mfa-07-totp-mfa.md](../tasks/mfa-07-totp-mfa.md) | 已实现 | 已支持初始化 / 激活 / 停用 / 登录链 challenge 消费 / challenge 提交验证 | 已依赖 `MFA-08` 作为恢复因子补强 | 维持现状 |
| 15 | MFA | MFA-08 | [mfa-08-recovery-codes.md](../tasks/mfa-08-recovery-codes.md) | 已实现 | 已支持初始化 / 轮换 / 停用 / `TOTP` challenge 下一次性消费 | 真实运行质量仍依赖 MFA 使用场景联调 | 下一步回到运行通道或 session 收口 |
| 15 | 风控 | RISK-01 | [risk-01-login-failure-throttle.md](../tasks/risk-01-login-failure-throttle.md) | 已实现 | 邮箱密码与手机密码登录都已接入规范化标识的失败限流与临时锁定，并补充锁定审计 | 设备/IP 维度增强后置，不计入当前任务缺口 | 维持现状 |
| 16 | 风控 | RISK-02 | [risk-02-otp-rate-limit.md](../tasks/risk-02-otp-rate-limit.md) | 部分实现 | 已接入 MFA / OTP 登录链路的发码频控与失败持久化，且本地 Redis 已支撑邮箱 OTP 主链端到端验证 | 仍依赖模拟发送通道 | 等真实通道接入时再联动验证 |
| 17 | 审计 | AUD-01 | [aud-01-auth-audit-events.md](../tasks/aud-01-auth-audit-events.md) | 已实现 | 已覆盖登录失败、锁定、MFA、refresh、refresh replay、logout、设备管理与 admin revoke 关键事件，且 session 审计已补统一上下文 | 外部审计平台对接后置，不计入当前任务缺口 | 维持现状 |
| 18 | 治理 | CRED-01 | [cred-01-identifier-backfill.md](../tasks/cred-01-identifier-backfill.md) | 已完成 | 当前目标库已完成 schema 同步、扫描验证与兼容双查清理，且库内无历史数据 | 真实历史数据尚未进入本库 | 暂不继续，等真实数据再重启 |
