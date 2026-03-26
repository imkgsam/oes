# Machine Identity 设计

更新时间：2026-03-23 15:20:00 +08:00

## 文档定位

本文档描述 `ServiceAccount` 与 `APIKey` 的主数据设计方向，为外部 API、内部服务、AI、自动化能力提供身份基础。

## 1. 目标

在 `identity-service` 中预留机器身份主数据，供后续 `auth-service` 做机器认证与 delegation。

## 2. 核心设计判断

- `ServiceAccount` 是机器身份主体
- `APIKey` 是凭据，不是主体
- 一个 `ServiceAccount` 可拥有多个 `APIKey`

多 key 的主要场景：

- 凭据轮换
- 不同环境隔离
- 不同调用方实例隔离
- 单 key 泄漏后的局部吊销

## 3. 建议模型

### `ServiceAccount`

- `id`
- `tenantId`
- `scopeLevel`
- `type`
- `name`
- `description`
- `status`

### `APIKey`

- `id`
- `serviceAccountId`
- `keyCode`
- `hashedValue`
- `status`
- `expiresAt`
- `lastUsedAt`
- `createdBy`
- `revokedBy`
- `revokedAt`

## 4. 与 AI / 外部 API 的关系

- 外部系统调用 OES API：使用 `ServiceAccount`
- 内部自动化任务：使用 `ServiceAccount`
- AI 服务本体：使用 `ServiceAccount`
- AI 代表用户执行：后续由 `auth-service` 基于该主体签发 delegation token

## 5. 当前阶段取舍

- 第一阶段不实现
- 设计先定
- Phase 3 再落地

## 6. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档                                                                                 | 描述                 | 当前状态 | 最后一次全局审核时间 | 备注    |
| ---- | -------- | ---------------------------------------------------------------------------------------- | -------------------- | -------- | -------------------- | ------- |
| 1    | 6.1      | [idn-machine-01-service-account-model.md](../tasks/idn-machine-01-service-account-model.md) | 建立机器身份主体模型 | 未开始   | 2026-03-23           | Phase 3 |
| 2    | 6.2      | [idn-machine-02-api-key-model.md](../tasks/idn-machine-02-api-key-model.md)                 | 建立机器凭据模型     | 未开始   | 2026-03-23           | Phase 3 |
## Status Update 2026-03-25

### Design refinement

The current machine-identity design should be read as a machine principal foundation, not as a narrow credential design.

The key clarification is:

- `ServiceAccount` is the first concrete machine-principal model in `identity-service`
- `APIKey` remains a later credential model
- future AI scenarios should not require redesigning machine identity each time

### Stable design intent

`ServiceAccount` must be able to act as a governed principal for:

- internal services
- external integrations
- automation bots
- AI agent principals

This does not mean every AI scenario creates a new principal.

Instead:

- principals should remain few and governed
- scenario differences should later be handled through profile, policy, knowledge scope, tool contract, and execution context

### Cross-service role of machine identity

`identity-service`
- owns machine principal truth

`auth-service`
- authenticates machine principals
- later issues delegated execution context when needed

`permission-service`
- evaluates machine upper-bound permissions
- later combines them with delegated human scope when applicable

### Implementation interpretation for 6.1

For the first implementation step:

- persist the principal
- express scope and type semantics
- expose minimal query and management interfaces
- do not implement machine authentication yet
- do not implement API keys yet

This keeps `6.1` reusable for later AI platform evolution instead of making it a one-off local service feature.

### Minimum implementation shape for the first code step

The first code step should stop at:

- principal identity persistence
- explicit scope-level semantics
- explicit type semantics
- explicit active/disabled lifecycle
- minimal query and management interfaces

Tenant binding rule for the first code step:

- system-level principal does not belong to any tenant and therefore keeps `tenantId = null`
- tenant-level principal must bind to a real tenant and therefore requires `tenantId`

It should not yet include:

- API key lifecycle
- hashed secret verification
- machine login
- delegated execution issuance
- permission policy binding

### Note on current repository draft

The repository already contains a historical draft for `ServiceAccount` and `APIKey` in Prisma.

That draft is useful as history, but it must be reviewed against the current design before implementation begins, because the current design treats `6.1` as machine-principal foundation first, credential model later.
