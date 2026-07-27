# OES Public Event Platform Transport Contract

```text
contractStatus: FROZEN_EVENT_PLATFORM_TRANSPORT
transportVersion: 1
provider: NATS JetStream
cloudEventsSpecVersion: 1.0
cloudEventsMode: structured-json
architectureTruthSource: docs/architecture/17-event-bus-and-outbox-architecture.md
eventCatalogTruthSource: docs/contracts/events/README.md
envelopeDecision: docs/adr/0014-cloudevents-and-service-owned-event-code-contracts.md
```

## 1. Contract Scope

本文冻结公共可订阅事件从 service-local outbox 到 NATS JetStream，再到 consumer-local inbox 的黑盒传输语义。它定义 provider mapping、publisher / consumer acknowledgement、失败分类、DLQ 与 replay 的互操作边界。

本文不定义：

- 任何业务 event type、触发条件、payload 字段或业务版本；
- producer / consumer 的 Prisma 表名、ORM API 或 domain model；
- NotificationRule、Site degraded、Saga 或其他 consumer 业务规则；
- Kafka、RabbitMQ、Redis 等替代 provider 的 wire mapping。

业务事件是否合法以及能否订阅，必须以 [catalog.md](./catalog.md) 和对应 owner event contract 为准。

## 2. Canonical CloudEvents Body

JetStream message body 使用 CloudEvents `1.0` Structured JSON，media type 固定为 `application/cloudevents+json`。以下示例只展示 transport envelope；`data` 的业务字段仍以 Event Catalog owner contract 为准：

```json
{
  "specversion": "1.0",
  "id": "01J...",
  "source": "urn:oes:service:collaboration-service",
  "type": "collaboration.task.assigned",
  "subject": "task-opaque-id",
  "time": "2026-07-26T08:00:00.000Z",
  "datacontenttype": "application/json",
  "dataschema": "urn:oes:event:collaboration.task.assigned:v1",
  "oeseventversion": 1,
  "oestenantid": "tenant-opaque-id",
  "oesorgid": null,
  "oesaggregatetype": "TASK",
  "oesaggregateid": "task-opaque-id",
  "oesactoraccountid": "account-opaque-id",
  "oestraceid": "trace-opaque-id",
  "oescorrelationid": null,
  "oescausationid": "command-or-request-id",
  "oesauditref": "owner-local-audit-ref",
  "data": {}
}
```

规则：

- `specversion` 固定为 `1.0`；`oeseventversion` 是 Event Catalog business event version，两者不得混用。
- `id` 等于 OES `eventId`；`source` 固定使用 `urn:oes:service:<owner-service>`；`type` 等于 Event Catalog event type；`time` 等于 owner 的 `occurredAt`；业务 `payload` 映射到 `data`。
- `subject` 与 `oesaggregateid` 都等于稳定 aggregate ID，`oesaggregatetype` 保存 aggregate type；adapter 必须验证重复表达一致，不能猜测或修复。
- OES extension attributes 只使用小写字母和数字，并以 `oes` 开头。common codec 对应用代码提供 `eventVersion / tenantId / traceId` 等 camelCase 语义别名，但 wire body 不接受隐式 casing 猜测。
- `dataschema` 必填，第一版使用稳定 `urn:oes:event:<eventType>:v<eventVersion>` 作为 contract identity；它不要求运行时网络获取 schema。
- optional attribute 缺失和显式 `null` 的兼容性由对应 event contract 决定；adapter 不凭空补造业务值。
- JSON object property 顺序没有语义。
- `time` 使用 UTC RFC3339 / ISO-8601；broker 接收时间不覆盖该字段。
- `oesactoraccountid` 只用于归因，不是下游授权凭证。
- body 由 common builder 在 owner transaction 写入 outbox 前完整生成；写入后不可改写，relay 原样发布，不重新组装 CloudEvent。

## 3. Subject 与 Stream Mapping

### 3.1 Production Stream

| 属性              | 冻结值                                                   |
| ----------------- | -------------------------------------------------------- |
| Stream name       | `OES_BUSINESS_EVENTS`                                    |
| Captured subjects | `oes.events.>`                                           |
| Storage           | `file`                                                   |
| Retention         | limits-based；生产 `MaxAge=30d` 默认                     |
| Replicas          | 生产 `3`；本地 `1`                                       |
| Discard behavior  | 达到容量上限时拒绝新 publish；不得静默淘汰保留窗口内事件 |

具体 `MaxBytes` 必须由部署容量评估确定并设置，不能保持 unlimited。容量拒绝时 relay 将事件保留在 owner outbox 并告警。

### 3.2 Event Subject

公共 event type 映射为：

```text
oes.events.<eventType>
```

示例：

```text
eventType: collaboration.task.assigned
subject:   oes.events.collaboration.task.assigned
```

规则：

- subject 不包含 `eventVersion`、tenantId、orgId、consumer name、environment 或 payload 数据。
- provider、stream 与 subject 名不是业务 event type 的组成部分。
- publisher ACL 以 owner namespace 或精确 catalog subject 收敛；consumer ACL 以获批 subscription subjects 收敛。
- 未进入 `FROZEN_SUBSCRIBABLE` 的 subject 不得 provision 到生产发布权限。

### 3.3 Durable Consumer Name

稳定命名：

```text
<consumer-service>__<subscription-purpose>__v<subscription-config-version>
```

示例：

```text
notification-service__collaboration-task__v1
site-service__asset-site-media__v1
```

`subscription-config-version` 是 consumer topology / handler compatibility 标识，不是业务 `eventVersion`。同一逻辑 consumer 的多个运行实例必须共享同一个 durable consumer；不同业务消费者不得共享 durable name。

生产 topology 冻结以下 consumer 基线：

- 使用 durable pull consumer、`AckPolicy=Explicit`、`MaxDeliver=5`、`DeliverPolicy=DeliverNew`；首次历史导入只能通过显式获批的 replay 请求启动。任何 rebuild 必须先完成 consumer-owned 独立设计冻结，不能复用或改写生产 durable progress。
- `FilterSubjects` 必须是由平台 manifest 预建的精确 subject 列表（单个 subject 也使用列表形式），不得用 `oes.events.>` 接收全局事件；例如 Notification subscription 的列表为 `oes.events.collaboration.task.assigned`、`oes.events.collaboration.task.completed`、`oes.events.collaboration.task.cancelled`。
- P1 replay 由目标 consumer service package 内的一次性 job 创建 run-scoped consumer，精确过滤获批 event subjects，并从获批 stream sequence / time 开始；不得复用或修改生产 durable progress。
- 生产最低 `nats-server` 版本为 `2.10`，以保证 `FilterSubjects` 多过滤器配置语义；生产 bootstrap / IaC 必须在服务启动前创建 stream、业务 durable consumer 与 ACL。run-scoped replay consumer 只能由获批的 consumer-owned job 按受限权限创建，运行时不得任意创建其他拓扑。

## 4. NATS Headers

| Header                  | 必填 | 来源 / 规则                                                      |
| ----------------------- | ---- | ---------------------------------------------------------------- |
| `Nats-Msg-Id`           | 是   | 等于 body CloudEvents `id`；只用于 broker deduplication window。 |
| `Content-Type`          | 是   | 固定 `application/cloudevents+json`。                            |
| `Oes-Transport-Version` | 是   | 当前固定 `1`。                                                   |
| `traceparent`           | 否   | 上游存在有效 W3C Trace Context 时传播。                          |
| `tracestate`            | 否   | 与有效 `traceparent` 一起传播。                                  |

Structured CloudEvent body 是事件 metadata 与业务 `data` 的唯一 transport 真相，不要求把 event type、version、owner、tenant、aggregate 或 audit reference 重复复制到 NATS headers。平台若为观测增加派生 header，consumer 不得依赖它形成业务 contract；派生值与 body 不一致时必须 fail closed。

publisher adapter 必须验证本地配置的 service identity、Event Catalog owner、subject、required headers 与 body 一致，broker 再通过 credential ACL 限制其可发布 subjects。consumer 不假设能够从 delivery 读取原 publisher credential；它必须验证 subject、body `source/type` 与受信 common contract 的 owner/type 一致。任一校验失败都必须 fail closed，并按 non-retryable transport error 进入目标 consumer DLQ。

每个 required header 必须恰好只有一个值；重复值、空值或同一 header 的大小写变体产生冲突时必须 fail closed。`oestraceid` 是 OES 事件关联字段，`traceparent / tracestate` 是可选 W3C transport context；两者都保留，不能相互覆盖。

Header 名比较不区分大小写；实现不得依赖 provider 返回的 header casing。

## 5. Publisher Contract

### 5.1 Before Local Commit

producer 在同一个本地数据库事务内创建业务状态、required local audit 和 outbox row。写入 outbox 前必须验证：

- producer 引用 `src/common/src/contracts/<service_snake_case>/events.ts` 中当前 owner 的 `FROZEN_SUBSCRIBABLE` code contract；
- CloudEvents `type / oeseventversion` 与 common contract 一致；
- required CloudEvents attributes 与业务 `data` 字段存在；
- `source` 映射的 owner service 等于当前服务；
- `oestenantid` 来源于 verified local context；
- body UTF-8 JSON encoded size 不超过默认 `256 KiB` hard limit；常规目标小于 `64 KiB`；
- CloudEvents `id` 在本服务 outbox 中唯一。

任一验证失败必须使当前事务失败，不能产生半合法业务事实或等待 relay 兜底修复。

实现不得在运行时解析 Markdown 判断订阅资格。第一阶段由 Event Catalog owner 审核、owner service 维护的 common `events.ts` contract 与 common codec 提供 allowlist、类型和字段验证；CI 检查它与 Markdown 业务语义真相一致。未来 JSON Schema / AsyncAPI 生成物可以替代机械校验层，但不能成为第二份业务语义真相。

### 5.2 Publish Result

Relay 调用 provider adapter 后只允许以下黑盒结果：

| Result                | 语义                                                                              | Outbox 行为                                  |
| --------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| `ACKNOWLEDGED`        | JetStream 已持久接受消息；可能是正常写入或相同 `Nats-Msg-Id` 的 broker 去重确认。 | 标记已发布并记录 `publishedAt`。             |
| `RETRYABLE_FAILURE`   | timeout、连接、leader、capacity、temporary cluster unavailability 等可恢复失败。  | 保持待发布，增加 attempt 并按 backoff 重试。 |
| `QUARANTINED_FAILURE` | 未冻结 contract、identity mismatch、invalid envelope、oversize、确定性编码错误。  | 停止自动发布，隔离并告警。                   |

HTTP/gRPC 等 transport error code 不属于本契约；provider adapter 必须先归一成上述结果。

## 6. Consumer Contract

### 6.1 Delivery Mode

- 生产 consumer 使用 durable pull consumer、explicit ack 和 platform-managed backoff。
- consumer worker 必须在处理前完成 transport / envelope / supported-version 校验。
- 默认最大 delivery attempt 为 `5`；建议 backoff 基线为 `1s, 5s, 30s, 2m, 10m`。critical subscription 可以在平台审查后提高，但不能使用无限 delivery。
- JetStream 普通 `NAK` 会立即重投，不得把普通 `NAK` 当作 backoff。需要延迟时使用 delayed NAK；或者不发送 ACK，让 consumer 的 `BackOff` / `AckWait` 到期触发重投。adapter 必须记录实际 attempt、delay 与 outcome。
- consumer handler 应接收由 common contract 验证和解码的 typed `OesCloudEvent<TData>` 与只读 delivery context；不得直接依赖 NATS client 类型形成业务层耦合。
- Common 提供统一的 `MaxDeliver` advisory parser、DLQ construction 和真实-delivery publish-before-TERM primitive；Deployment / SRE 将相关 advisory 纳入持久监控与告警；每个目标 consumer 在自身进程内 operations module 或同 package 的一次性 recovery/replay job 处理自己的 subscription advisory。`MaxDeliver` advisory 有 stream/consumer sequence，但没有实际 delivery 的 `$JS.ACK...` reply subject；retained `MSG.GET` 也不能重建它。因此 advisory-only 路径不得读取后自动发布 DLQ 并 `TERM`，不得伪造 ACK/TERM 或 resolved DLQ transfer。正常 handler 或获批 replay job 持有真实 delivery 时，DLQ publish acknowledgement 后才能 `TERM` 那个 delivery。
- advisory-only recovery 必须在目标 consumer 自己的 operations 数据中幂等持久化 `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED`，至少含 advisory 原文或持久引用/digest、stream/consumer sequence、deliveries、subscriptionConfigVersion、observedAt、deployment reference、alert/escalation reference 与操作审计。`eventId`、tenantId、payload、DLQ record ID 或 source termination 不能从 advisory 推断，均不得编造。创建时告警；临近业务 stream `MaxAge` 时升级 consumer owner 与 Deployment / SRE。到期不是成功结果，必须保留 audit reference 并记为 `EXPIRED_UNRESOLVED`。
- 后续补救只能是独立授权的 `SAFE_REDELIVERY`：平台操作员可用单独受控读取权限核实 retained 原消息和 tenant 范围，随后 target consumer owner 按既有双重批准和范围约束创建 run-scoped consumer。由该 run 取得的真实 delivery 若需 DLQ，仍是 publish-before-TERM；它不授予也不替代原 stable consumer delivery 的 TERM。只有审计明确 `originalSourceTermination=NOT_PERFORMED`，recovery record 才可因 replay 的业务处理结果标记为 `SAFE_REDELIVERY_COMPLETED`。

### 6.2 Handler Outcome

| Outcome                 | 条件                                                                              | Broker action                                                 |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `APPLIED`               | Inbox 与本地副作用事务成功。                                                      | ACK。                                                         |
| `DUPLICATE`             | `(consumerName, eventId)` 已存在且 identity tuple 与 canonical body digest 等价。 | ACK，不重复副作用。                                           |
| `STALE_IGNORED`         | contract 允许以 owner version 判定为过期。                                        | ACK，并记录 stale metric。                                    |
| `RETRYABLE_FAILURE`     | 暂时数据库 / 网络 / lock 等可恢复失败。                                           | delayed NAK 或 ACK timeout redelivery，遵循 durable backoff。 |
| `NON_RETRYABLE_FAILURE` | 不支持版本、tenant / owner mismatch、确定性 handler 拒绝。                        | 可靠写入 consumer DLQ 后 TERM 原 delivery。                   |
| `EVENT_ID_CONFLICT`     | 相同 `(consumerName, eventId)` 已存在，但 identity tuple 或 body digest 不一致。  | 可靠写入 consumer DLQ 后 TERM 原 delivery。                   |

若 DLQ 写入失败，持有真实 delivery 的 consumer 不得确认或 TERM 该 delivery；需要继续重试 DLQ transfer，避免异常事件消失。达到 `MaxDeliver` 后，advisory recovery 只能持久化/告警 unresolved state，不能取得或补偿原 delivery 的 TERM authority。它不能只依赖最后一次 handler 调用，但也不得宣称 advisory transfer 已成功。

### 6.3 Inbox

Inbox 最小语义：

| 字段                       | 要求                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `consumerName`             | 稳定逻辑订阅名。                                                                                            |
| `eventId`                  | 原始 CloudEvents `id`；与 consumerName 组合唯一。                                                           |
| `tenantId`                 | 原始 `oestenantid`；用于隔离、查询、保留与 replay 审计。                                                    |
| `identityTuple`            | 不可变 identity，至少含 `id/source/type/time/oeseventversion/oestenantid/oesaggregatetype/oesaggregateid`。 |
| `canonicalBodyDigest`      | canonical Structured CloudEvent body 摘要，用于等价重复与 eventId 冲突判定。                                |
| `eventType / eventVersion` | 原始 `type / oeseventversion` 的业务语义别名。                                                              |
| `processedAt`              | 本地事务成功时间。                                                                                          |
| `result`                   | 至少区分 applied / duplicate-equivalent / stale-ignored。                                                   |
| `ownerVersion?`            | 事件 `data` 提供 aggregate/availability version 时记录。                                                    |
| `traceId`                  | 原始 `oestraceid`，用于链路关联。                                                                           |

Inbox 与数据库内副作用必须同一事务。若 `(consumerName,eventId)` 已存在，只有 identity tuple 与 body digest 等价时才返回 `DUPLICATE`；不等价必须 `EVENT_ID_CONFLICT` 并进入 DLQ，不能覆盖既有记录。Inbox 默认保留至少 `45` 天，且永远不得短于 Event Bus replay window。

## 7. DLQ Contract

每个逻辑 consumer 有独立 DLQ subject：

```text
oes.dlq.<consumer-service>.<subscription-purpose>.v<subscription-config-version>
```

DLQ 不进入 `OES_BUSINESS_EVENTS`，使用独立 `OES_EVENT_DLQ` stream，captured subjects 为 `oes.dlq.>`，生产使用 file storage、replicas `3`、默认 `90d` retention 和容量上限；容量耗尽时拒绝新 DLQ publish 并保留原 delivery，禁止静默淘汰仍在处理窗口内的异常记录。DLQ record 的原始 Structured CloudEvent body 必须保持原样；失败 metadata 使用外层 transport record 或 headers 附加，不得修改原 `data`。subject 必须包含 `subscription-config-version`，避免同一逻辑 consumer 的 v1/v2 拓扑共用不可区分的 DLQ。

DLQ idempotency key 固定为 `(consumerName, subscriptionConfigVersion, eventId)`，并生成确定性 `dlqRecordId`；所有持有真实 delivery 的 handler 或 approved replay transfer 使用相同键，避免同一 consumer 的同一事件产生多条 active DLQ record。advisory-only recovery 没有可验证 `eventId`、tenant 或原始 immutable body，必须保存为独立 unresolved recovery record，不能预先创建/占用 DLQ record。recovery module/job 不执行 consumer 业务逻辑。

DLQ record 至少包含：

- `dlqRecordId` 与原始 `eventId`；
- `consumerName`、tenantId、eventType/version、traceId；
- `subscriptionConfigVersion` 与原始 stream / consumer sequence；
- error class、stable error code、sanitized error summary；
- delivery attempts、firstFailedAt、lastFailedAt；
- handler / deployment reference（可用时）；
- immutable original subject、headers 与 body；
- 目标 consumer 本地 operations record reference（如已创建）。

错误摘要不得包含 credential、原始敏感正文或不受控 stack trace。不可变原始 body 与失败快照由 DLQ stream 保存；mutable resolution、replay reference 与操作审计由目标 consumer 保存在自身数据库。不存在共享 DLQ / replay control database。`90d` 是默认窗口；未解决记录必须在到期前由目标 consumer owner 与 Deployment / SRE 告警、升级并写入长期归档 reference，不得静默删除。DLQ 不允许普通业务 consumer 订阅，只允许平台运维和目标 consumer owner 受控访问。

## 8. Replay Contract

Replay request 至少包含：

```text
replayRunId
requestedBy
approvedByConsumerOwner
approvedByPlatformOperator
platformApprovalRef
consumerName
tenantScope
eventFilter
mode
reason
allowExternalSideEffects
```

`eventFilter` 必须限定 event type、eventId、时间窗口或 stream sequence 范围之一；禁止空 tenant scope 与无目标 consumer 的全局 replay。

P1 只支持 `SAFE_REDELIVERY`：进入目标 consumer 的普通 typed handler，已有 Inbox 时返回 `DUPLICATE`。`CONTROLLED_REBUILD` 不属于 P1；只有出现真实投影重建需求后，目标 consumer owner 才能另行冻结 rebuild handler、checkpoint、数据迁移和外部副作用语义。

Replay 不依赖中央 service 或长期 worker。目标 consumer service package 提供一次性 replay job，复用 common replay runner，在 `OES_BUSINESS_EVENTS` 上创建本次 run 专属 consumer，并以精确 event subjects、`DeliverByStartSequence` 或 `DeliverByStartTime` 限定读取范围。需要暂停/恢复时使用 run-scoped durable consumer；一次性检查可使用受限 ephemeral consumer。JetStream consumer state 保存 delivery progress，目标 consumer 自己保存 replay request、tenant/event filter、批准引用、结果与操作审计。对 P1 Notification Collaboration subscription，一个 approved run **恰好**创建三个 single-subject durable：`notification-service__replay__<runId>__assigned`、`notification-service__replay__<runId>__completed` 与 `notification-service__replay__<runId>__cancelled`；它们分别只过滤对应的三个 frozen Collaboration subject。不得使用一个多过滤器/general-create consumer，也不得增设第四个 run durable。

Replay job 解码原始消息后先执行 tenant / event filter，再调用同一 typed handler；不得创建新的 CloudEvents `id`、修改 `time`、伪装成 owner 新事实或重新发布到 `oes.events.>`。P1 不 provision `OES_EVENT_REPLAY` stream 或私有 replay ingress。`SAFE_REDELIVERY` 继续使用目标 consumer 原 Inbox，且默认 `allowExternalSideEffects=false`。Replay 的开始、暂停、完成、失败、范围与操作人都必须写目标 consumer 本地操作审计；未同时提供 `approvedByConsumerOwner`、`approvedByPlatformOperator` 和 `platformApprovalRef` 的请求必须拒绝。

## 9. Security Boundary

- 每个服务使用独立 NATS credential，按环境隔离；禁止匿名生产访问和共享超级账号。
- credential 必须通过部署 secret 注入，禁止写入 Git、日志、event body、DLQ 或 Nacos 明文配置。
- publisher permission 默认只覆盖 Event Catalog 已批准的精确 subjects；只有平台生成的 allowlist 能证明整个 context namespace 均已冻结时，才允许使用 `oes.events.<context>.>`。
- consumer permission 只覆盖获批 subjects、对应生产 durable consumer、自身 DLQ 管理面，以及经批准创建/读取的 run-scoped replay consumer；不得管理其他 consumer 的进度或 DLQ。
- `oestenantid` 是 required 业务隔离字段，但不是 broker credential；服务必须在本地 handler、Inbox、DLQ 与 replay 再次 fail-closed 校验。
- `oesactoraccountid` 不授予下游权限；完整 signed operator context 不作为 event delegation token 传播。

## 10. Compatibility

- Transport contract `Oes-Transport-Version=1` 内允许新增 optional header，不允许删除或改变 required header 语义。
- CloudEvents `specversion` 当前固定为 `1.0`；业务 `oeseventversion` 的兼容规则完全以 Event Catalog 为准。
- 同一业务 event type 的版本不改变 subject；consumer 通过 `type / oeseventversion` 与 common code contract 声明并验证支持版本。
- provider adapter 可替换，但必须继续产生本文 canonical body 和 broker-independent publisher / consumer outcomes。
- 不兼容 transport 变更必须新增 transport version、迁移窗口和双读/双写方案，并新增 ADR。
- 当前仓库尚未实现公共 Event Bus 或生产发布任何旧 envelope，因此 CloudEvents Structured JSON 直接成为初始 `transportVersion=1`，不需要兼容自定义 envelope 双读/双写。

## 11. Black-box Acceptance

1. publisher credential 有权发布目标 subject，且 subject、required headers、Structured CloudEvent body 与 common contract / Event Catalog owner 完全一致时 publish 成功；任一不一致 fail closed。
2. 相同 CloudEvents `id` 重发可能被 broker 去重或再次 delivery，但同一 consumer 只产生一次本地副作用。
3. consumer 停机恢复后从 durable progress 继续，不要求 producer 创建新的 CloudEvents `id`。
4. retryable handler failure 按 backoff 重投；达到上限可靠进入目标 DLQ。
5. DLQ publish 失败时原 delivery 不消失。
6. handler 在最后一次 delivery 中崩溃时，目标 consumer 的 advisory recovery module/job 能根据持久 advisory 幂等创建 `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED`、告警并记录 expiry escalation；它不能据此创建 resolved DLQ record、TERM 原 stable delivery 或伪造 source authority。独立授权的 SAFE_REDELIVERY 只使用 run-scoped consumer 的真实 delivery，且审计保留 `originalSourceTermination=NOT_PERFORMED`。
7. Asset 类 owner version 事件支持 `STALE_IGNORED`，不会用旧事实覆盖新 projection。
8. 跨 tenant replay、越权 subject publish / subscribe、匿名管理操作全部拒绝并记录。
9. P1 SAFE_REDELIVERY 使用 run-scoped consumer 和目标 consumer 原 Inbox，不会默认重复外部邮件、短信或 provider side effect；CONTROLLED_REBUILD 未经独立冻结不得启动。
10. 超过 `256 KiB` 的 body 在 producer transaction 前被拒绝。
11. CloudEvents `id`、`oestenantid`、`oestraceid` 与 `consumerName` 可以关联 outbox、JetStream、Inbox、DLQ 与 replay run。
12. producer 与 consumer 从 owner 的同一 `src/common/src/contracts/<service_snake_case>/events.ts` 导入 type/version/data contract；服务各自手写的不一致副本不能通过 contract test。
