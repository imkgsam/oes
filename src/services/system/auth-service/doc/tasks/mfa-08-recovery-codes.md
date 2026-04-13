# MFA-08 Recovery Codes

更新时间：2026-03-28 12:00 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/mfa-management.md](../design/mfa-management.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 初始化 `Recovery Codes` binding
- 轮换 `Recovery Codes`
- 停用 `Recovery Codes`
- 在 `TOTP` challenge 下消费 `Recovery Codes` 作为恢复因子

## 当前状态

- 已实现

## 最小闭环范围

- contract：新增 `Recovery Codes` 初始化 / 轮换接口，并让 MFA binding 查询可返回 `BACKUP_CODE`
- domain：复用既有 `MfaBindingEntity` 的 `BACKUP_CODE` 能力，并支持一次性消费
- application：初始化 binding、轮换 binding、停用 binding、`TOTP` challenge 下回退验证恢复码
- interface：gRPC controller 接入管理命令与查询映射
- audit：补充恢复码初始化与轮换相关审计
- doc：同步任务、历史、全局审核

## 不包含范围

- Push / Hardware Token
- 跨服务聚合设置页
- 强制旧因子重验证后再修改配置

## 验收要求

- 仅在存在启用中的 `TOTP` binding 时，用户才可初始化或轮换 `Recovery Codes`
- 用户可获得一组一次性恢复码
- 正确恢复码被消费后不可再次使用
- `TOTP` challenge 下可使用恢复码恢复到账户选择
- `ListMfaBindings` 可返回 `BACKUP_CODE`
- `DisableMfaBinding` 可停用 `BACKUP_CODE`
- `pnpm proto:gen`
- `cd src/common && pnpm exec tsc -b --force`
- `pnpm --filter auth-service build`

## 2026-03-28 Completion Notes

- 已新增 `InitializeRecoveryCodes`
- 已新增 `RegenerateRecoveryCodes`
- `ListMfaBindings` 现可返回 `BACKUP_CODE`
- 恢复码初始化与轮换都要求当前用户已启用 `TOTP`
- `SubmitMfaChallenge` 在 `TOTP` challenge 下已支持消费恢复码
- 恢复码消费后会从 binding 中移除；耗尽后自动失活
