# Session And Token Management 设计

更新时间：2026-03-28 23:15 +09:00

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

当前阶段 `metadata` 至少承载以下最小展示与审计上下文：

- `tenantId`
- `loginMethod`

### Session 建立时的设备上下文

当前 `auth-service` 在 `SelectAccount` 成功后正式建立 session，因此设备上下文以该入口为准进入会话主链。

`SelectAccountRequest` 当前阶段应显式允许传入以下可选字段：

- `deviceId`
- `deviceName`
- `userAgent`
- `ipAddress`

若调用方暂时未提供，则服务端仍会使用兼容默认值兜底，但这只应视为过渡状态，不应继续作为长期稳定模型。

当前 `auth-service` 已在服务内执行如下最小规范化：

- `userAgent` 缺失时统一收敛为 `unknown`
- 尝试从 `userAgent` 推导 `platform / browser`
- `deviceName` 缺失时生成最小可读默认名，而不是继续固定成 `unknown/grpc`
- 读回历史 session 时，缺失字段会被标准化为稳定默认值，避免继续扩散脏形状

当前阶段 session 查询面会正式返回以下最小设备展示信息：

- `deviceId`
- `deviceName`
- `userAgent`
- `ipAddress`
- `platform`
- `browser`

当前阶段 session 查询面还会正式返回以下最小运行态信息：

- `accessRemainingSeconds`
- `refreshRemainingSeconds`
- `sessionAgeSeconds`
- `idleSeconds`
- `isAccessExpired`
- `isRefreshExpired`
- `isRevoked`

### 设备上下文进入边界

当前阶段的正式边界约束如下：

- `auth-service` 仅负责在 `SelectAccount` 时消费设备上下文字段并写入 session
- 设备上下文当前不通过 `src/common/src/authorization/**` 的共享 authenticated gRPC context 传播
- 现有网关下游 gRPC metadata 工厂当前只承载：
  - internal service metadata
  - operator context
  - request / trace metadata
- 因此本阶段应优先采用 `SelectAccountRequest` 的显式字段承接设备上下文，而不是在 `auth-service` 线程内扩展 `common` 的 metadata 语义

这意味着：

- `auth-service` 线程可以继续完善 `SelectAccount` 与 session 展示
- 若未来要统一“网关自动采集 user-agent / client-ip / device-id 并通过共享上下文下发”，该事项应被视为跨模块或架构级变更，先更新项目级设计，再进入实现

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
- refresh token 当前采用“每个 session 仅保存最新 refresh token”的正式阶段模型
- Redis session repository 已将 refresh token 索引替换与设备/IP 索引更新收敛到同一事务中
- refresh handler 现在会同时核对 `JWT sid` 与 refresh token 索引命中的 session 是否一致
- 一旦 refresh token 索引缺失、索引错配或当前 session 不再持有该 token，会视为 replay 并撤销当前 session
- 活跃 `create / refresh / query / logout` 链路均由 `CQRS handler / query handler` 直接承接
- 遗留 `SessionService` / `SessionModule` 已退出代码基线
- `SelectAccount` 已被定义为设备上下文进入 session 主链的正式入口
- session 现已将 `loginMethod` 作为最小会话元数据的一部分保存，供查询与审计展示使用
- 当前设备上下文传播策略已冻结为“显式 request 字段优先”，不在本线程内扩展共享 operator-context / gRPC metadata 结构

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)
- 前端认证上下文：[frontend-auth-context.md](./frontend-auth-context.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 账户选择后认证上下文固化 | 部分实现 | 2026-03-25 11:00:00 +08:00 | 账户选择提交与账户归属校验已接入 |
| 2 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | session 与 access/refresh token 签发 | 部分实现 | 2026-03-27 13:20:00 +09:00 | 账户选择成功后已建立 session 并签发 token，当前会写入最小登录方式元数据 |
| 3 | SESS-02 | [sess-02-session-structure-refactor.md](../tasks/sess-02-session-structure-refactor.md) | session 结构重构 | 已实现 | 2026-03-28 12:25:00 +09:00 | `auth-service` 边界内已完成设备上下文规范化与 Redis 索引一致性收口 |
| 4 | SESS-03 | [sess-03-refresh-token-rotation.md](../tasks/sess-03-refresh-token-rotation.md) | refresh token rotation 与 replay 检测 | 已实现 | 2026-03-28 23:00:00 +09:00 | 当前完成态以 latest-refresh-token 模型为边界，token family 不在本阶段范围 |
| 5 | SESS-04 | [sess-04-logout-management.md](../tasks/sess-04-logout-management.md) | logout / logoutAll | 部分实现 | 2026-03-25 11:00:00 +08:00 | 已接入最小 gRPC + CQRS 闭环 |
| 6 | SESS-05 | [sess-05-session-query-device-view.md](../tasks/sess-05-session-query-device-view.md) | session query / device view | 已实现 | 2026-03-28 23:15:00 +09:00 | 已接入用户/管理员 session 查询、设备管理、可读设备视图、直接运行态与运行统计字段 |
