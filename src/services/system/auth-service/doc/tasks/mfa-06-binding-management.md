# MFA-06 OTP MFA 绑定管理

更新时间：2026-03-27 15:05 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/mfa-management.md](../design/mfa-management.md)

## 当前承接范围

- 查询用户当前 `EMAIL_OTP / SMS_OTP` MFA 绑定状态
- 启用邮箱 OTP MFA
- 停用邮箱 OTP MFA
- 启用手机 OTP MFA
- 停用手机 OTP MFA

## 当前状态

- 已实现

## 最小闭环范围

- contract：新增 OTP MFA 绑定查询 / 启用 / 停用接口
- domain：约束仅管理 `EMAIL_OTP / SMS_OTP`
- application：校验对应登录方式可用后启用 binding，支持停用 binding，支持查询当前状态
- interface：gRPC controller 接入管理命令与查询
- audit：补充 MFA binding 启用 / 停用审计事件
- doc：同步设计、任务、历史、全局审核

## 不包含范围

- TOTP 初始化与激活
- Recovery Codes
- Push / Hardware Token
- 强制旧因子重验证后再修改配置
- 真实邮件 / 短信通道接入

## 验收要求

- 用户可查询当前邮箱 / 手机 OTP MFA 绑定状态
- 已存在对应登录方式时，用户可启用邮箱 / 手机 OTP MFA
- 停用后，后续登录不再触发对应因子 challenge
- 不存在对应登录方式时，启用请求返回明确错误
- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`

## 2026-03-27 Completion Notes

- 已新增 `ListMfaBindings`
- 已新增 `EnableMfaBinding`
- 已新增 `DisableMfaBinding`
- 当前阶段仅正式支持：
  - `EMAIL_OTP`
  - `SMS_OTP`
- 启用时会校验对应登录方式存在、已启用且已验证
- 审计事件已补充 `MFA_BINDING_ENABLED` / `MFA_BINDING_DISABLED`
