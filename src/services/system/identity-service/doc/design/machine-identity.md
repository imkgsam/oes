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
