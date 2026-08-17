# notification-service Contract

```text
status: FROZEN_NOTIFICATION_EVENT_CONSUMER_AND_AUTH_DISPATCH
lastUpdated: 2026-08-11
serviceTruthSource: docs/architecture/services/notification-service.md
```

本目录保存 `notification-service` 的黑盒契约；服务边界、对象命名与拥有关系以 [notification-service.md](../../architecture/services/notification-service.md) 为准。

## 当前冻结契约

| Contract | 状态 | 说明 |
| --- | --- | --- |
| [Collaboration Task event consumer](./collaboration-task-event-consumer.md) | `FROZEN` | 三个 Collaboration Task 公共事实到 Notification 本地系统内通知的输入、结果、幂等、租户与 replay 语义。 |
| [Auth Email/SMS dispatch](./auth-dispatch.md) | `IMPLEMENTED_VERIFIED` | Auth-only SYSTEM MACHINE INTERNAL dispatch 的两 RPC、wire tombstone、模板、幂等、事务、审计和 provider outbox 语义。 |

## 不在本目录当前冻结范围

- NotificationInboxService 的读取/已读/归档 API、NotificationRule 管理、模板管理与偏好管理。
- Auth contract 之外的 Email/SMS/Push provider dispatch、回执与外部副作用。

新增契约不得复制 Event Catalog payload，也不得用本服务契约修改 `collaboration-service` 的 Task 事实语义。
