# AUTH-02 邮箱 OTP 登录任务

更新时间：2026-03-22 16:40:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 当前承接范围

- 邮箱 + OTP 主认证闭环

## 当前状态

- 未开始

## 最小闭环范围

- contract：定义发码、校验、登录结果状态
- schema：确认 OTP `usage=LOGIN` 的存储模型
- domain：邮箱 OTP 校验规则
- application：发码与校验编排
- interface：发码接口与登录接口
- tests：覆盖发码、有效 OTP、失效 OTP、超限 OTP
- doc：同步状态与验收结果

## 不包含范围

- 邮箱 OTP MFA
- account 选择
- session 与 token 签发

## 验收要求

- 用户可通过邮箱 OTP 完成主认证
- OTP 登录与 MFA OTP 在 `usage` 上可区分
- OTP 过期、错误、超限时返回标准失败结果

## 关联设计文档

- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 阻塞项

- OTP 基础设施与限流规则尚未完整收敛
