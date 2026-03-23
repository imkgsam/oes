# AUTH-03 手机密码登录任务

更新时间：2026-03-22 16:40:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 当前承接范围

- 手机 + 密码主认证闭环

## 当前状态

- 未开始

## 最小闭环范围

- contract：定义手机密码登录请求与结果状态
- schema：确认手机号登录方式与密码凭据支持
- domain：手机号规范化与密码认证策略
- application：完成手机号密码认证编排
- interface：暴露手机号密码登录接口
- tests：覆盖成功、密码错误、手机号不存在
- doc：同步状态与验收结果

## 不包含范围

- 手机 OTP 登录
- account 选择
- session 与 token 签发

## 验收要求

- 用户可通过手机 + 密码进入统一认证编排
- 手机号规范化规则在认证链路中一致执行

## 关联设计文档

- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 阻塞项

- 手机号规范化规则尚未统一
