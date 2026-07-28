# Auth Service Security Event Catalog Registration

```text
registrationStatus: FROZEN_SUBSCRIBABLE
ownerService: auth-service
semanticTruthSource: docs/contracts/auth-service/execution-token.md#emergency-revocation-fact
serviceTruthSource: docs/architecture/services/auth-service.md#711-emergency-executiontoken-revocation
transportProfile: SECURITY_CRITICAL
transportTruthSource: docs/contracts/events/platform-transport.md
notificationConsumable: false
```

本文只登记 Auth-owned 紧急 ExecutionToken 撤销事实如何接入 OES Event Catalog 与 security-critical transport profile。业务 payload、selector、撤销版本、有效期、触发授权和 consumer deny semantics 均以 [ExecutionToken contract](../auth-service/execution-token.md#emergency-revocation-fact) 与 [auth-service truth](../../architecture/services/auth-service.md#711-emergency-executiontoken-revocation) 为唯一真相；本文不复制或重新定义这些语义。

## 1. `auth.execution-token.revoked`

| Catalog / transport identity | Frozen value                                       |
| ---------------------------- | -------------------------------------------------- |
| `eventType`                  | `auth.execution-token.revoked`                     |
| `eventVersion`               | `1`                                                |
| `ownerService`               | `auth-service`                                     |
| CloudEvents `source`         | `urn:oes:service:auth-service`                     |
| CloudEvents `type`           | `auth.execution-token.revoked`                     |
| CloudEvents `dataschema`     | `urn:oes:event:auth.execution-token.revoked:v1`    |
| transport profile            | `SECURITY_CRITICAL`                                |
| NATS subject                 | `oes.security.events.auth.execution-token.revoked` |
| JetStream                    | `OES_SECURITY_EVENTS`                              |
| notification consumable      | `false`                                            |

### 1.1 Envelope applicability

- canonical body 使用 CloudEvents `1.0` Structured JSON，`oeseventversion=1`；准确 codec、header、publisher、durable、DLQ、replay 与 ACL 规则以 [platform-transport.md](./platform-transport.md) 为准。
- `oesexecutionscope` 必填且只能是 `SYSTEM` 或 `TENANT`。`TENANT` 必须携带真实 `oestenantid`；`SYSTEM` 必须缺失 `oestenantid`，不得使用 sentinel tenant。
- Auth semantic contract 没有声明公共 aggregate，也禁止平台从 selector 推导其他 envelope 语义。因此该注册不携带 CloudEvents `subject`、`oesaggregatetype` 或 `oesaggregateid`；平台不得把 selector reference 复制到这些属性。
- transport 以 CloudEvents `id` 和 consumer Inbox 提供 delivery idempotency；撤销事实的新旧、覆盖与清理仍只服从 Auth semantic contract 中的 owner version 规则。
- NATS subject 不包含 event version、execution scope、tenant、selector 或 payload 数据，并且只能由 `auth-service` 的精确 publisher credential 发布。

### 1.2 Semantic ownership

Event Catalog 只确认这是一个已经成立、允许跨服务订阅的 Auth fact。以下内容不得从本文推断，也不得在 Event 平台另建副本：

- selector kind、selector reference 与匹配规则；
- payload 字段、reason category、effective / cleanup 时间；
- monotonic revocation version、旧 Token 恢复限制与 deny-state 生命周期；
- 哪些 Auth workflow、security administrator 或 detector 可以触发事实；
- resource service 如何匹配 Token 并形成自己的 deny decision。

上述语义全部直接引用 Auth-owned 真相源。未来编译期 contract 由 owner 在 `src/common/src/contracts/auth_service/events.ts` 映射冻结语义；producer、consumer 与 Event adapter 不得分别手写不一致的 payload interface。

### 1.3 Subscription and implementation status

- Catalog 状态为 `FROZEN_SUBSCRIBABLE`，表示跨服务契约与 transport applicability 已冻结；不表示 producer、common contract、JetStream topology 或任一 consumer 已实现。
- `notificationConsumable=false`；NotificationRule 不得把紧急撤销事实作为普通通知触发器。
- 只有执行 ExecutionToken 本地验证、且已完成 exact-subject durable、Inbox/enforcement transaction、freshness gate、fail-closed 与恢复验收的服务才能启用订阅。
- 其他服务不能发布、重写、补发一个新的 Auth revocation fact，也不能通过 replay 伪装成 Auth owner。

### 1.4 Compatibility

- CloudEvents `specversion=1.0` 与 OES `eventVersion=1` 相互独立；NATS subject 不包含业务版本。
- Auth business payload 的同版本兼容与不兼容变更以 Auth-owned semantic contract 为准；Event Catalog 只登记结果，不反向改写 payload。
- `SECURITY_CRITICAL` 是 transport version `1` 的 contract-gated profile。它不会改变 Collaboration、Asset 等既有 tenant-only event wire contract。
- 将本事件改入普通 business stream、移除 execution scope、允许非 Auth publisher 或改变 SYSTEM/TENANT 组合都不是运行时配置切换，必须重新冻结 Event transport/catalog compatibility 与迁移边界。
