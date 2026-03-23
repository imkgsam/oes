# AUTH-04 手机 OTP 登录任务

更新时间：2026-03-22 16:40:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 当前承接范围

- 手机 + OTP 主认证闭环

## 当前状态

- 未开始

## 最小闭环范围

- contract：定义手机 OTP 发码与登录结果状态
- schema：确认 OTP `usage=LOGIN`
- domain：手机 OTP 校验规则
- application：发码与校验编排
- interface：发码与登录接口
- tests：覆盖成功、错误 OTP、失效 OTP、超限 OTP
- doc：同步状态与验收结果

## 不包含范围

- 手机 OTP MFA
- account 选择
- session 与 token 签发

## 验收要求

- 用户可通过手机 OTP 完成主认证
- 手机 OTP 登录可独立于 MFA OTP 闭环运行

## 关联设计文档

- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 阻塞项

- 短信服务与 OTP 频控未形成稳定闭环
