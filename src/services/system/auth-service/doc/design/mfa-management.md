# MFA Management 设计

更新时间：2026-03-28 12:00 +09:00

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
- 邮箱 / 手机 OTP MFA 绑定管理
- TOTP MFA
- Recovery Codes

### 后续增强

- Push / Hardware Token

## Phase 2 优先级判断

- 当前阶段已优先完成 `TOTP` 与 `Recovery Codes`
- 下一条是否继续推进更高阶因子，取决于真实运行需求

原因：

- 领域层已存在 `TOTP` binding 的基础能力
- `TOTP` 可以在不依赖外部发送通道的前提下形成完整 MFA 闭环
- `Recovery Codes` 已按 `TOTP` 的恢复与兜底能力落地

## 核心规则

- MFA 的目标是提升认证强度，不是重复同一种认证动作
- 如果主认证已经满足当前目标认证等级，不再追加重复同因子 challenge

### 当前示例规则

- 密码登录 + 开启 MFA：需要 MFA
- 邮箱 OTP 登录 + 邮箱 OTP MFA：默认不重复挑战
- 手机 OTP 登录 + 手机 OTP MFA：默认不重复挑战

### 当前管理规则

- 当前阶段正式管理 `EMAIL_OTP`、`SMS_OTP` 与 `TOTP`
- 启用某个 OTP MFA 因子前，必须先存在对应的可用登录方式
- 管理面优先采用“启用 / 停用 binding”模型，不引入独立设置向导状态机
- 停用 MFA binding 不删除对应登录方式
- `TOTP` 先采用“初始化 binding -> 用户提交首个验证码激活 -> 后续登录触发 challenge”的最小模型
- `Recovery Codes` 以 `TOTP` 的恢复因子形式落地
- 当前管理面仍不引入 Push 或 Hardware Token

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

- 当前阶段正式承接 `EMAIL_OTP`、`SMS_OTP` 与 `TOTP` 的绑定持久化
- `userId + type` 必须唯一，避免同一用户同因子重复绑定
- `metadata` 与 `deviceInfo` 当前先按序列化字段持久化，待后续正式管理能力扩展后再评估是否拆分
- `secret` 对 `EMAIL_OTP` / `SMS_OTP` 可为空字符串占位；对 `TOTP` / `BACKUP_CODE` 才承载真实密钥或哈希集合
- 当前 schema 已支撑 `TOTP / Recovery Codes` 闭环实现

## Phase 1 管理面契约边界

当前阶段 `auth-service` 内部正式承接以下管理动作：

- 查询用户当前 `EMAIL_OTP / SMS_OTP / TOTP` MFA 绑定状态
- 启用邮箱 OTP MFA
- 停用邮箱 OTP MFA
- 启用手机 OTP MFA
- 停用手机 OTP MFA
- 初始化 `TOTP` binding
- 激活 `TOTP` binding
- 停用 `TOTP` binding
- 在主登录链中消费已激活的 `TOTP` binding 作为 MFA challenge
- 初始化 `Recovery Codes`
- 轮换 `Recovery Codes`
- 停用 `Recovery Codes`
- 在 `TOTP` challenge 下消费 `Recovery Codes`

当前阶段不承接：

- Recovery Codes 管理
- 强制重验证旧因子后再改配置
- 跨服务的设置聚合界面

## 后续管理面契约边界

下一阶段在 `auth-service` 内部可继续评估：

- Push 因子
- Hardware Token
- 更严格的旧因子重验证策略

下一阶段仍不承接：

- 跨服务聚合设置页

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | MFA-04 | [mfa-04-email-otp-mfa.md](../tasks/mfa-04-email-otp-mfa.md) | 邮箱 OTP 二次验证闭环 | 已实现 | 2026-03-27 15:05:00 +09:00 | challenge 触发、challenge 提交与管理面依赖均已闭环 |
| 2 | MFA-05 | [mfa-05-phone-otp-mfa.md](../tasks/mfa-05-phone-otp-mfa.md) | 手机 OTP 二次验证闭环 | 已实现 | 2026-03-27 15:05:00 +09:00 | challenge 主链与管理面依赖均已闭环 |
| 3 | MFA-06 | [mfa-06-binding-management.md](../tasks/mfa-06-binding-management.md) | OTP MFA 绑定管理 | 已实现 | 2026-03-27 15:05:00 +09:00 | 已支持查询、启用、停用 `EMAIL_OTP / SMS_OTP` binding |
| 4 | MFA-07 | [mfa-07-totp-mfa.md](../tasks/mfa-07-totp-mfa.md) | TOTP MFA 闭环 | 已实现 | 2026-03-28 11:05:00 +09:00 | 已支持初始化、激活、停用、登录 challenge 与 challenge 提交验证 |
| 5 | MFA-08 | [mfa-08-recovery-codes.md](../tasks/mfa-08-recovery-codes.md) | Recovery Codes 闭环 | 已实现 | 2026-03-28 12:00:00 +09:00 | 已支持初始化、轮换、停用与在 `TOTP` challenge 下的一次性消费 |
## 2026-03-23 Structure Note

- The active MFA-04 login path no longer depends on the legacy `MfaService`.
- Challenge creation is handled by `EmailOtpMfaChallengeService`.
- Challenge verification is handled by `MfaChallengeVerificationService`.
- New MFA work should continue through focused application services and handlers instead of restoring a catch-all MFA facade.
