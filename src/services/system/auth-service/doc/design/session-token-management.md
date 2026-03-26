# Session And Token Management 设计

更新时间：2026-03-25 11:00 +08:00

## 文档定位

本文档描述 `auth-service` 的 session 与 token 设计，以及当前实现收口状态。

## 目标

- 将 session 作为正式领域对象管理
- 保持 access token 轻量、短期有效
- 使用 refresh token rotation 符合主流最佳实践

## Session 设计

### Session 字段

- `sessionId`
- `userId`
- `accountId`
- `deviceInfo`
- `createdAt`
- `lastActiveAt`
- `expiresAt`
- `refreshExpiresAt`
- `status`
- `metadata`

### 当前阶段能力

- 建立 session
- 刷新 session
- 查询 session 列表
- 保留当前设备踢掉其他设备
- 单 session 登出
- 全部 session 登出
- 管理员控制字段保留在聚合中

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
- 可撤销

## 当前结构结论

- access token 文本已不再作为 session 持久化事实保存
- access token 校验方向已收敛为：`JWT verify + sessionId lookup + session 状态/时间窗校验`
- refresh token 当前仍是“每个 session 仅保存最新 refresh token”的阶段模型
- 活跃 `create / refresh / query / logout` 链路均由 `CQRS handler / query handler` 直接承接
- 遗留 `SessionService` / `SessionModule` 已退出代码基线

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)
- 前端认证上下文：[frontend-auth-context.md](./frontend-auth-context.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 账户选择后认证上下文固化 | 部分实现 | 2026-03-25 11:00:00 +08:00 | 账户选择提交与账户归属校验已接入 |
| 2 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | session 与 access/refresh token 签发 | 部分实现 | 2026-03-25 11:00:00 +08:00 | 账户选择成功后已建立 session 并签发 token |
| 3 | SESS-02 | [sess-02-session-structure-refactor.md](../tasks/sess-02-session-structure-refactor.md) | session 结构重构 | 部分实现 | 2026-03-25 11:00:00 +08:00 | 已移除 access token 持久化并收口到 handler |
| 4 | SESS-03 | [sess-03-refresh-token-rotation.md](../tasks/sess-03-refresh-token-rotation.md) | refresh token rotation 与 replay 检测 | 部分实现 | 2026-03-25 11:00:00 +08:00 | 当前为 latest-refresh-token 模型 |
| 5 | SESS-04 | [sess-04-logout-management.md](../tasks/sess-04-logout-management.md) | logout / logoutAll | 部分实现 | 2026-03-25 11:00:00 +08:00 | 已接入最小 gRPC + CQRS 闭环 |
| 6 | SESS-05 | [sess-05-session-query-device-view.md](../tasks/sess-05-session-query-device-view.md) | session query / device view | 部分实现 | 2026-03-25 11:00:00 +08:00 | 已接入最小 session 列表与保留当前设备踢其他设备能力 |
