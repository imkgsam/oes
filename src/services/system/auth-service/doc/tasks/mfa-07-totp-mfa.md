# MFA-07 TOTP MFA

更新时间：2026-03-28 11:05 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 初始化 `TOTP` binding
- 激活 `TOTP` binding
- 停用 `TOTP` binding
- 在主登录链中消费已激活的 `TOTP` binding 作为 MFA challenge

## 当前状态

- 已实现

## 最小闭环范围

- contract：新增 `TOTP` 初始化 / 激活接口，并让 MFA binding 查询可返回 `TOTP`
- domain：复用既有 `MfaBindingEntity` 的 `TOTP` 能力
- application：初始化 binding、激活 binding、停用 binding、登录后触发 `TOTP` MFA、提交 challenge 时验证 `TOTP`
- interface：gRPC controller 接入管理命令和查询映射
- audit：补充 `TOTP` binding 初始化与激活相关审计
- doc：同步任务、历史、全局审核

## 不包含范围

- Recovery Codes
- Push / Hardware Token
- 强制旧因子重验证后再修改配置

## 验收要求

- 用户可初始化 `TOTP` binding 并获取 secret / otpauth URL
- 用户可提交正确验证码激活 `TOTP` binding
- 已启用 `TOTP` MFA 时，登录流程可进入 `MFA_REQUIRED`
- 提交正确的 `challengeId + code` 后，流程恢复到账户选择
- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`

## 2026-03-28 Completion Notes

- 已新增 `InitializeTotpBinding`
- 已新增 `ActivateTotpBinding`
- `ListMfaBindings` 现可返回 `TOTP`
- 用户可初始化 `TOTP` binding 并获取 `secret / qrCodeUrl`
- 用户可通过首次验证码激活 `TOTP` binding
- 用户可停用 `TOTP` binding
- 登录主链已优先消费启用中的 `TOTP` binding 进入 `MFA_REQUIRED`
- `SubmitMfaChallenge` 已支持基于 `bindingId` 校验 `TOTP`
