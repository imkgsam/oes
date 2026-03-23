# Credential Management 设计

更新时间：2026-03-22 18:35:00 +08:00

## 文档定位

本文档描述 `auth-service` 的登录方式与凭据设计。

## 目标

- 解耦登录标识与认证凭据
- 支持邮箱、手机号、微信、Google 等多来源身份接入
- 为密码、OTP、后续联邦认证保留统一模型

## 核心模型

### LoginMethod

表示登录标识，当前建议类型：

- `EMAIL`
- `PHONE`
- `WECHAT`
- `GOOGLE`

字段建议：

- `id`
- `userId`
- `type`
- `identifier`
- `verified`
- `enabled`

### Credential

表示认证材料，当前建议类型：

- `PASSWORD`
- `EMAIL_OTP`
- `PHONE_OTP`

后续预留：

- `OAUTH_IDENTITY`

字段建议：

- `id`
- `loginMethodId`
- `credentialType`
- `hashedValue`
- `provider`
- `enabled`

## 规则

- 邮箱和手机号进入系统前应先做规范化
- 登录标识唯一性按“类型 + identifier”约束
- 密码只存哈希，不存明文
- OTP 不作为长期凭据保存
- 第三方登录身份应绑定到 `user`，而不是直接绑定 `account`

### 当前规范化规则

- email：`trim + lowercase`
- phone：去除非数字字符；若原值以 `+` 开头，则保留单个前导 `+`
- repository 查询当前兼容“原始值 / 规范化值”双查，以避免存量数据立即失效

## 当前阶段范围

### P0

- 邮箱 + 密码
- 邮箱 + OTP
- 手机 + 密码
- 手机 + OTP

### P1

- 微信个人身份绑定

### P2

- Google 身份绑定

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH-01 | [auth-01-email-password-login.md](../tasks/auth-01-email-password-login.md) | 邮箱密码凭据与登录方式闭环 | 部分实现 | 2026-03-23 | 邮箱密码认证策略已收敛到统一异常语义，并已具备最小状态响应 |
| 2 | AUTH-02 | [auth-02-email-otp-login.md](../tasks/auth-02-email-otp-login.md) | 邮箱 OTP 凭据与登录方式闭环 | 部分实现 | 2026-03-24 00:15:04 +09:00 | 已接入发码、校验与统一认证编排 |
| 3 | AUTH-03 | [auth-03-phone-password-login.md](../tasks/auth-03-phone-password-login.md) | 手机密码凭据与登录方式闭环 | 部分实现 | 2026-03-23 23:44:40 +09:00 | 已接入统一认证编排与 gRPC 入口 |
| 4 | AUTH-04 | [auth-04-phone-otp-login.md](../tasks/auth-04-phone-otp-login.md) | 手机 OTP 凭据与登录方式闭环 | 部分实现 | 2026-03-23 23:52:28 +09:00 | 已接入发码、校验与统一认证编排 |
