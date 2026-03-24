# Session And Token Management 设计

更新时间：2026-03-23 20:30:00 +08:00

## 文档定位

本文档描述 `auth-service` 的 session 与 token 设计。

## 目标

- 将 session 作为正式领域对象管理
- 保持 access token 轻量、短期有效
- 使用 refresh token rotation 符合主流最佳实践

## Session 设计

### Session 字段建议

- `sessionId`
- `userId`
- `accountId`
- `tenantId`
- `deviceId`
- `deviceName`
- `userAgent`
- `ip`
- `createdAt`
- `lastActiveAt`
- `expiresAt`
- `refreshExpiresAt`
- `status`
- `acr`
- `amr`

### 当前阶段能力

- 建立 session
- 查看 session
- 单设备登出
- 全设备登出
- 管理员强制下线

## Token 设计

### Access Token

用途：

- API 短期访问凭证

建议字段：

- `sub`
- `sid`
- `aid`
- `tid`
- `amr`
- `acr`
- `jti`
- `type`

### Refresh Token

用途：

- 会话续期

规则：

- 每次刷新都轮换
- 必须检测重放
- 应可撤销

## 关键规则

- token 不携带完整角色和权限快照
- session 才是服务端会话事实源
- 账户上下文必须在 session 层固化
- 当前阶段不限制最大登录设备数

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)
- 前端认证上下文：[frontend-auth-context.md](./frontend-auth-context.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 账户选择后认证上下文固化 | 部分实现 | 2026-03-23 | 账户选择提交与账户归属校验已接入，challenge 扩展链路后续再做 |
| 2 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | Session 与 access/refresh token 签发闭环 | 部分实现 | 2026-03-23 | 账户选择成功后已建立 session 并签发 token |
| 3 | SESS-02 | [sess-02-session-structure-refactor.md](../tasks/sess-02-session-structure-refactor.md) | Session 结构重构与 SessionService 收敛 | 部分实现 | 2026-03-24 | 已移除 access token 持久化并改为基于 JWT + sessionId 的 access token 校验 |
| 4 | SESS-03 | [sess-03-refresh-token-rotation.md](../tasks/sess-03-refresh-token-rotation.md) | Refresh token rotation 与 replay 检测 | 部分实现 | 2026-03-23 | 已实现 rotation、旧 token 拒绝与旧索引清理，token family 独立建模后续再做 |
| 5 | SESS-04 | [sess-04-logout-management.md](../tasks/sess-04-logout-management.md) | Logout / LogoutAll 管理闭环 | 部分实现 | 2026-03-24 | 已接入 gRPC、CQRS 与审计事件 |

## 2026-03-24 Implementation Alignment

- 当前 `Session` 聚合已不再把 access token 文本作为会话核心持久化事实
- 当前 access token 校验方向已收敛为：`JWT verify + sessionId lookup + session 状态/时间窗校验`
- 当前 refresh token 仍以“每个 session 仅保存最新 refresh token”为阶段性边界
- 活跃 `create / refresh` 链路已直接回到 CQRS handler，不再经过过渡 session 小 service
- 遗留 `SessionService` / `SessionModule` 已退出当前代码基线
- 当前 `Logout` / `LogoutAll` 已接入最小闭环，device 级管理与 session query 后续继续拆分
