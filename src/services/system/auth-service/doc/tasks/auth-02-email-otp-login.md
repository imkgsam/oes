# AUTH-02 邮箱 OTP 登录任务

更新时间：2026-03-24 00:15:04 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 当前承接范围

- 邮箱 + OTP 主认证闭环

## 当前状态

- 部分实现

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

- 当前邮件发送仍为开发模式模拟通道，未接入真实邮件服务
- 邮箱规范化规则尚未独立收敛，当前仍依赖现有标识符存储格式

## 2026-03-24 Incremental Update

- 已新增 `RequestEmailOtpLoginChallenge` 与 `LoginWithEmailOtp` 外部入口
- 已新增邮箱登录 OTP 发码与校验编排
- 已复用既有账户选择与手机 OTP MFA 补强路径
