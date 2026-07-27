# ADR 0013: NATS JetStream Event Bus 与可靠投递语义

```text
status: ACCEPTED
decisionDate: 2026-07-26
architectureTruthSource: docs/architecture/17-event-bus-and-outbox-architecture.md
```

## Context

OES 已冻结 Event Catalog，并出现两类真实跨服务事实传播需求：Collaboration Task 事件供 Notification 消费，Asset Site Media availability fact 供 Site 更新自身 degraded projection。仓库现状只有进程内 `EventEmitter`、Terminal Device 的 Redis Pub/Sub、本地 Collaboration event envelope 和 MES outbox 草案，没有可靠跨服务 Event Bus、relay、consumer inbox、DLQ 或 replay 闭环。

OES 需要在不共享数据库、不建立中央 outbox 扫描器、不让平台接管业务 payload 的前提下，提供：

- per-service transactional outbox；
- at-least-once delivery 与 idempotent consumer；
- 多 consumer 独立进度、有限保留与受控 replay；
- retry、DLQ、trace、服务身份与 tenant-aware 运维；
- 单节点本地开发与高可用生产拓扑。

当前没有已冻结的高频 PLC / IoT、实时数仓、复杂流计算或长期海量事件要求，也没有把后台 task queue 作为公共业务事实总线主要负载的证据。

## Decision

OES 第一版公共业务事实 Event Bus 采用 NATS JetStream：

- 生产使用三节点、file-backed JetStream，业务 stream replication factor 为 `3`。
- 本地开发使用单节点、file-backed JetStream。
- 业务事件采用 limits-based retention、30 天默认保留与容量上限；容量耗尽时拒绝新 publish，让事件保留在 owner outbox 并告警，不静默淘汰保留窗口内事实。
- 每个逻辑 subscription 使用 durable pull consumer；服务实例共享同一 durable consumer 扩展处理。
- Event Catalog 的业务 event type 映射到稳定 NATS subject；版本只在 CloudEvents envelope，不进入 subject。
- 使用 explicit acknowledgement、有限 redelivery、consumer-specific DLQ 与受控 replay。
- `Nats-Msg-Id = CloudEvents id` 仅作为 broker 短窗 deduplication；consumer inbox 仍是最终幂等边界。

Provider 选择不改变以下 broker-independent 约束：

- owner 业务状态、audit 与 outbox 同一服务本地事务；
- relay 只访问 owner 自己的数据库；
- consumer inbox 与数据库内本地副作用同一事务；
- 事件 payload 与 owner/version 由 Event Catalog 决定；
- 全局不承诺 total ordering，owner version 优先保证同一 aggregate 新鲜度；
- replay 必须限定 consumer、tenant、范围与审计。

## Why NATS JetStream

NATS JetStream 对当前需求提供一套直接模型：Stream 持久保存公共事实，Durable Consumer 保存每个消费者的独立进度，ACK/redelivery 支撑至少一次投递，保留窗口支持故障补收与重放。它可以使用同一 server 产品覆盖本地单节点和生产三节点，避免在第一版同时治理 RabbitMQ Queue / Stream 两套语义，也避免在没有数据平台需求证据时承担 Kafka partition、consumer ecosystem 与集群运维复杂度。

这是“当前适配度”决策，不是宣称 JetStream 在所有未来负载下优于 Kafka 或 RabbitMQ。

## Alternatives Considered

### Kafka / Redpanda

优势：

- partitioned append-only log、多 consumer group、长期 replay 与数据生态成熟；
- 高吞吐、Kafka Connect、流计算、实时 BI / 数据湖场景更强。

本期不选原因：

- 当前没有高频遥测、实时数仓或复杂流计算的冻结需求；
- 第一批事件量低到中等，Kafka 的核心优势不是当前约束的瓶颈；
- 本地与生产的 topology、partition、容量、升级与生态治理成本高于当前收益。

触发条件出现时必须重新评估，而不是强行让 JetStream 承担 Kafka 级数据平台职责。

### RabbitMQ Quorum Queues + Streams

优势：

- Quorum Queue 的工作任务、routing、retry 与 DLQ 能力成熟；
- RabbitMQ Streams 可以提供持久、非破坏性读取与 replay。

本期不选原因：

- 当前核心是公共业务事实流，不是大量工作任务；
- 同时满足业务事实与后台任务会要求团队明确治理 Queue 与 Stream 两套不同语义；
- RabbitMQ 最突出的任务分发优势在当前平台范围内不是主要决策因素。

未来 Notification provider dispatch 等任务负载成熟后，可独立评估 RabbitMQ，不要求与公共事实总线使用同一产品。

### Redis Pub/Sub / Redis Streams

拒绝作为公共业务 Event Bus：

- 当前 Redis 主要承担 session / cache，关键业务事实不应耦合到缓存生命周期和运维边界；
- 现有 Pub/Sub 在 consumer 离线时不提供持久补收；
- 使用 Redis Streams 虽能补充部分能力，但会把共享缓存扩大成核心事件平台，且不能消除 outbox、inbox、DLQ、replay 与独立 credential 治理工作。

### 进程内 EventEmitter

拒绝。它只适合进程内 local event，不能提供跨服务持久投递、consumer 独立进度、故障补收或 replay。

## Consequences

正向结果：

- 第一批跨服务事实获得清晰、较轻且可重放的可靠运输平台。
- 业务服务通过统一 common 基础能力接入，但继续拥有本地 transaction、outbox/inbox 与业务 handler。
- Event Catalog 控制面与 broker 数据面保持分离，CloudEvents canonical body 以 ADR 0014 为准，未来 provider 迁移不要求改写业务 event type。

成本与风险：

- JetStream DLQ 需要 OES 平台明确实现可靠失败转移，不能假设 broker 自动完成全部治理。
- 三节点、持久磁盘、TLS、credential、备份、容量与 upgrade 仍需要正式运维能力。
- Kafka 数据生态与 RabbitMQ 任务生态不是本期能力；未来新增这些需求可能需要桥接或第二种基础设施。
- provider adapter 降低业务耦合，但不能让未来迁移变成零成本。

## Re-evaluation Triggers

满足任一条件时必须新增 ADR 重新评估：

- 公共平台被要求承载高频 PLC / IoT、clickstream 或其他海量原始流；
- 需要 Kafka Connect、复杂窗口/聚合、长期数据湖或实时流计算；
- 事件保留和吞吐持续超出 JetStream 已验证运行边界；
- 后台任务、priority、复杂 routing 或 provider dispatch 成为主要平台负载；
- 生产托管服务、监管隔离或跨地域要求改变运维约束。

## Related Documents

- [17-event-bus-and-outbox-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/17-event-bus-and-outbox-architecture.md)
- [platform-transport.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/platform-transport.md)
- [Event Catalog Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/README.md)
- [ADR 0014](/Users/acehood/Documents/GitHub/oes/docs/adr/0014-cloudevents-and-service-owned-event-code-contracts.md)
- [service-collaboration-rules.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/service-collaboration-rules.md)
