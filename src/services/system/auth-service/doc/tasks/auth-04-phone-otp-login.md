# AUTH-04 手机 OTP 登录任务

更新时间：2026-03-23 23:52:28 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/credential-management.md](../design/credential-management.md)

## 当前承接范围

- 手机 + OTP 主认证闭环

## 当前状态

- 部分实现

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

- 生产短信服务仍未接通，当前仅具备开发/占位通道
- 手机号规范化规则尚未统一，当前仍依赖现有标识符存储格式

## 2026-03-23 Incremental Update

- 已新增 `RequestPhoneOtpLoginChallenge` 与 `LoginWithPhoneOtp` 外部入口
- 已新增登录 OTP 发码与校验编排
- 已复用既有账户选择与邮箱 OTP MFA 补强路径
