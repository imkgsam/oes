# MFA Management 设计

更新时间：2026-03-23 23:09:24 +09:00

## 文档定位

本文档说明 `auth-service` 的 MFA 能力边界、阶段目标和当前实现状态。

## 目标

- 以最小复杂度提供可用的 MFA 能力
- 避免重复同因子验证
- 为后续 TOTP 和恢复码预留扩展位

## 当前阶段能力

### Phase 1

- 邮箱 OTP 作为 MFA
- 手机 OTP 作为 MFA

### 后续增强

- TOTP
- Recovery Codes

## 核心规则

- MFA 的目标是提升认证强度，不是重复同一种认证动作
- 如果主认证已经满足当前目标认证等级，不再追加重复同因子 challenge

### 当前示例规则

- 密码登录 + 开启 MFA：需要 MFA
- 邮箱 OTP 登录 + 邮箱 OTP MFA：默认不重复挑战
- 手机 OTP 登录 + 手机 OTP MFA：默认不重复挑战

## 推荐数据模型

- `MfaBinding`
- `MfaChallenge`
- 后续 `RecoveryCode`

### `MfaBinding` 当前落地字段

- `id`
- `userId`
- `type`
- `secret`
- `enabled`
- `metadata`
- `deviceInfo`
- `createdAt`
- `updatedAt`

### `MfaBinding` 当前落地规则

- 当前阶段仅正式承接 `EMAIL_OTP` 与后续 `SMS_OTP` 的绑定持久化
- `userId + type` 必须唯一，避免同一用户同因子重复绑定
- `metadata` 与 `deviceInfo` 当前先按序列化字段持久化，待后续正式管理能力扩展后再评估是否拆分
- `secret` 对 `EMAIL_OTP` / `SMS_OTP` 可为空字符串占位；对 `TOTP` / `BACKUP_CODE` 才承载真实密钥或哈希集合
- 当前 schema 恢复只为支撑已有/近期 MFA 链路，不代表 TOTP、Recovery Codes 已进入闭环实现

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | MFA-04 | [mfa-04-email-otp-mfa.md](../tasks/mfa-04-email-otp-mfa.md) | 邮箱 OTP 二次验证闭环 | 部分实现 | 2026-03-23 22:05:00 +08:00 | challenge 触发与 challenge 提交已接入，后续 MFA 管理能力未闭环 |
| 2 | MFA-05 | [mfa-05-phone-otp-mfa.md](../tasks/mfa-05-phone-otp-mfa.md) | 手机 OTP 二次验证闭环 | 部分实现 | 2026-03-23 23:35:50 +09:00 | 已接入邮箱密码登录后的手机 OTP MFA challenge |
## 2026-03-23 Structure Note

- The active MFA-04 login path no longer depends on the legacy `MfaService`.
- Challenge creation is handled by `EmailOtpMfaChallengeService`.
- Challenge verification is handled by `MfaChallengeVerificationService`.
- New MFA work should continue through focused application services and handlers instead of restoring a catch-all MFA facade.
