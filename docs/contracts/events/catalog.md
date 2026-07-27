# OES Event Catalog

更新时间：2026-07-26

本文是 OES 公共可订阅事件索引。事件详细契约以对应 owner service 文档为准。

## 1. 当前冻结事件

| Event Type                              | Version | Owner Service           | Status                | Notification Consumable | Contract                                                                            |
| --------------------------------------- | ------- | ----------------------- | --------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `collaboration.task.assigned`           | `1`     | `collaboration-service` | `FROZEN_SUBSCRIBABLE` | 是                      | [collaboration-service.md](./collaboration-service.md#1-collaborationtaskassigned)  |
| `collaboration.task.completed`          | `1`     | `collaboration-service` | `FROZEN_SUBSCRIBABLE` | 是                      | [collaboration-service.md](./collaboration-service.md#2-collaborationtaskcompleted) |
| `collaboration.task.cancelled`          | `1`     | `collaboration-service` | `FROZEN_SUBSCRIBABLE` | 是                      | [collaboration-service.md](./collaboration-service.md#3-collaborationtaskcancelled) |
| `asset.site-media.availability.changed` | `1`     | `asset-service`         | `FROZEN_SUBSCRIBABLE` | 否                      | [asset-service.md](./asset-service.md#1-assetsitemediaavailabilitychanged)          |

## 2. 明确不在本次冻结范围

以下内容本轮不作为可订阅事件契约：

- `collaboration.task.created`
- `collaboration.task.updated`
- `collaboration.task.started`
- `collaboration.task.reopened`
- `collaboration.task.archived`
- `collaboration.task.unarchived`
- `TaskDueSoon`
- `TaskOverdue`
- `TaskReminderRequested`
- `TaskLinkedToBusinessObject`
- `TaskSourceCompleted`
- `terminal-device.unavailable`
- MES outbox 中的 `Mold*` / `ProductionSpec*` 事件
- Sales / Procurement / Finance / WMS 文档中的 deferred candidate events
- auth / identity / permission / business service 的本地 audit events

如后续需要订阅上述事件，必须由对应 owner service 线程确认并补充本目录下的事件契约。

## 3. 使用规则

- consumer 只能订阅 `Status = FROZEN_SUBSCRIBABLE` 的事件。
- NotificationRule 只能引用 `Notification Consumable = 是` 的事件。
- 事件 owner service 负责维护契约、版本、兼容性与废弃状态。
- 实现期 producer 与 consumer 必须引用 owner 在 `src/common/src/contracts/<service_snake_case>/events.ts` 中维护的同一 code contract；该文件不得先于本索引和 owner contract 定义新事件。
- 本索引只导航事件契约，不重新定义服务 owner 边界；服务边界以 `docs/architecture/services/*.md` 为准。
