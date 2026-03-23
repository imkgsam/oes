# AUTH-01 邮箱密码登录任务

更新时间：2026-03-23 11:00:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 当前承接范围

- 邮箱 + 密码主认证闭环

## 当前状态

- 部分实现

## 最小闭环范围

- contract：定义邮箱密码登录请求与结果状态
- schema：确认邮箱登录方式与密码凭据字段可支持闭环
- domain：统一邮箱密码认证策略
- application：完成认证编排入口到策略调用
- interface：暴露登录接口
- tests：覆盖成功、密码错误、登录方式不存在三类场景
- doc：同步状态与验收结果

## 不包含范围

- account 选择
- session 与 token 签发
- MFA
- OTP 发送与校验

## 验收要求

- 用户可通过邮箱 + 密码进入统一认证编排
- 结果可正确区分成功与失败
- 错误语义清晰，便于后续风控接入

## 关联设计文档

- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 阻塞项

- 当前 `auth.proto` 已支持主认证阶段状态，但还未承载账户候选列表
- 当前 controller 只能返回 `ACCOUNT_SELECTION_REQUIRED` 的最小结果，尚未连到 `AUTH-05`
- 当前尚未补测试
