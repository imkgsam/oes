# Auth Service 认证中心设计方案

更新时间：2026-03-23 23:45:00 +08:00

## 文档定位

本文档是 `auth-service` 当前有效的总设计文档，描述服务定位、边界、主流程、当前落地状态与后续扩展方向。

## 当前进度概览

- 总体进度：约 45%
- 工程基线与结构收敛：约 75%
- 人类认证主线：约 55%
- 安全增强能力：约 30%

## 当前已落地能力

### 认证主线

- `AUTH-01` 邮箱密码登录
- `AUTH-05` 登录后账户选择

### 会话与 token

- `SESS-01` session 建立与 token 签发
- `SESS-03` refresh token rotation

### MFA

- `MFA-04` 邮箱 OTP MFA challenge 与 challenge 提交
- 活跃 `MFA-04` 链路已开始从遗留 `MfaService` 中拆出

### 风控与审计

- `RISK-01` 登录失败限流与临时锁定
- `RISK-02` OTP 发码频控与 OTP 失败次数持久化
- `AUD-01` 认证审计事件

## 当前结构状态

- `gRPC` 已就位
- 活跃链路已按 `CQRS` 推进
- `MfaService` 进入收缩阶段
- `SessionService` 暂不继续扩展，等待 session 结构重构

## 服务目标

`auth-service` 当前目标不是单纯提供登录接口，而是建立 `oes` 的认证中心与会话安全中心。

当前阶段以面向人类用户的认证中心为主，要求满足：

- 统一认证入口
- 多登录方式接入
- 登录后账户选择
- session 与 token 正式建模
- 基础 MFA
- 基础风控
- 认证审计

长期预留：

- 开放 API
- 机器身份
- AI 代理

## 设计范围

### 当前落地范围

- Human Auth Domain
- Auth Context Domain

### 当前预留但不落地范围

- Machine Auth Domain
- External API Client
- AI Delegation

## 边界设计

### `auth-service`

负责：

- 登录方式与凭据
- OTP
- 认证编排
- MFA
- session
- access token / refresh token
- 登录风控
- 认证审计

不负责：

- `user / account / tenant` 主数据
- 完整角色与权限事实源

### `identity-service`

负责：

- `user`
- `account`
- `tenant`
- 用户与账户关系
- 账户启停状态

### `permission-service`

负责：

- 角色
- 权限
- 鉴权决策
- 前端权限展示所需摘要数据来源

## 核心身份模型

- `User`：自然人身份
- `Account`：用户在业务中的实际操作身份
- `Tenant`：组织边界

规则：

- 一个 `user` 可绑定多个 `account`
- 一个 `account` 必须属于某个 `tenant`
- 用户进入系统前必须先确定一个有效 `account`

## 标准登录流程

1. 发起登录
2. 校验主凭据
3. 执行基础风控
4. 判断是否需要补 MFA
5. 查询可用账户
6. 用户选择账户或系统自动选择
7. 建立 session
8. 签发 token

标准状态：

- `SUCCESS`
- `MFA_REQUIRED`
- `ACCOUNT_SELECTION_REQUIRED`
- `DENIED`

## 当前后续重点

1. 继续消化遗留大 service
2. 扩展其余 P0 登录方式
3. 继续 MFA 扩展
4. 在继续 session 族能力前先做 session 结构重构

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 分类 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 认证方式 | AUTH-01 | [auth-01-email-password-login.md](../tasks/auth-01-email-password-login.md) | 邮箱密码登录闭环 | 部分实现 | 2026-03-23 23:35:00 +08:00 | 已进入 CQRS 主链 |
| 2 | 认证方式 | AUTH-02 | [auth-02-email-otp-login.md](../tasks/auth-02-email-otp-login.md) | 邮箱 OTP 登录闭环 | 未开始 | 2026-03-23 23:35:00 +08:00 | 待实现 |
| 3 | 认证方式 | AUTH-03 | [auth-03-phone-password-login.md](../tasks/auth-03-phone-password-login.md) | 手机密码登录闭环 | 未开始 | 2026-03-23 23:35:00 +08:00 | 待实现 |
| 4 | 认证方式 | AUTH-04 | [auth-04-phone-otp-login.md](../tasks/auth-04-phone-otp-login.md) | 手机 OTP 登录闭环 | 未开始 | 2026-03-23 23:35:00 +08:00 | 待实现 |
| 5 | 认证上下文 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 登录后账户选择 | 部分实现 | 2026-03-23 23:35:00 +08:00 | 已支持账户候选与账户选择提交 |
| 6 | 会话 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | session 与 token 签发 | 部分实现 | 2026-03-23 23:35:00 +08:00 | 已支持主登录链签发 |
| 7 | 会话 | SESS-03 | [sess-03-refresh-token-rotation.md](../tasks/sess-03-refresh-token-rotation.md) | refresh rotation | 部分实现 | 2026-03-23 23:35:00 +08:00 | 当前为 latest-refresh-token 模型 |
| 8 | MFA | MFA-04 | [mfa-04-email-otp-mfa.md](../tasks/mfa-04-email-otp-mfa.md) | 邮箱 OTP MFA | 部分实现 | 2026-03-23 23:35:00 +08:00 | 活跃链路已开始脱离遗留 `MfaService` |
| 9 | MFA | MFA-05 | [mfa-05-phone-otp-mfa.md](../tasks/mfa-05-phone-otp-mfa.md) | 手机 OTP MFA | 未开始 | 2026-03-23 23:35:00 +08:00 | 待实现 |
| 10 | 风控 | RISK-01 | [risk-01-login-failure-throttle.md](../tasks/risk-01-login-failure-throttle.md) | 登录失败限流 | 部分实现 | 2026-03-23 23:35:00 +08:00 | 已接入邮箱密码登录链 |
| 11 | 风控 | RISK-02 | [risk-02-otp-rate-limit.md](../tasks/risk-02-otp-rate-limit.md) | OTP 发码频控 | 部分实现 | 2026-03-23 23:35:00 +08:00 | 已接入 MFA OTP 链 |
| 12 | 审计 | AUD-01 | [aud-01-auth-audit-events.md](../tasks/aud-01-auth-audit-events.md) | 认证审计事件 | 部分实现 | 2026-03-23 23:35:00 +08:00 | 已接入关键主链事件 |
