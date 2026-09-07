# OES Event Bus 与 Outbox / Inbox 架构

```text
status: FROZEN_EVENT_BUS_OUTBOX
decisionDate: 2026-07-26
provider: NATS JetStream
eventEnvelope: CloudEvents 1.0 Structured JSON
eventContractTruthSource: docs/contracts/events/README.md
transportContractTruthSource: docs/contracts/events/platform-transport.md
providerDecision: docs/adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md
envelopeAndCodeContractDecision: docs/adr/0014-cloudevents-and-service-owned-event-code-contracts.md
securityCriticalTransportProfile: FROZEN
```

## 1. 目的与边界

本文冻结 OES 公共业务事实的跨服务可靠投递平台。它负责统一 Event Bus、每服务 transactional outbox、consumer inbox、重试、DLQ、重放、可观测性与运行安全边界。

Event Bus 只传播已经由 owner service 确认成立、且已经进入 Event Catalog 的公共事实。业务事件的语义、payload、版本、owner 与订阅资格，以 [Event Catalog Contract](../../contracts/events/README.md) 和各 owner event contract 为准；本平台不得重新定义它们。

Auth-owned `auth.execution-token.revoked` 已在 owner contract 冻结并由 Event Catalog 登记接入 security-critical transport profile。该 profile 只冻结 SYSTEM / TENANT scope 的合法运输表达、独立 Stream、durable delivery、freshness gate、fail-closed recovery 与运维边界；Auth 仍独占 payload、selector、撤销状态和本地 enforcement 语义。

本文不负责：

- 业务 command、聚合状态机、下单或履约 Saga 的步骤与补偿规则。
- 将 Event Bus 作为分布式事务协调器或业务真相数据库。
- 设备遥测、PLC / MQTT 原始数据、日志、trace、heartbeat、浏览器活动采集或文件二进制的统一 ingestion。
- Event Sourcing、中央审计平台、BI / AI 数据平台或 schema registry 的本期实现。
- Notification provider task、邮件、短信、转码等后台任务的业务模型；这些任务可在后续独立评估是否复用消息基础设施。
- Auth 的 ExecutionToken 撤销对象、selector、版本字段、失效期限、重新签发或恢复规则。

### 1.1 Command、Local Event 与 Public Event

OES 不把所有消息都混入公共 Event Bus：

| 协作类型                            | 默认机制                                                      |
| ----------------------------------- | ------------------------------------------------------------- |
| 同服务状态变更请求                  | application command handler / 进程内 command bus              |
| 跨服务同步 command / query          | gRPC contract                                                 |
| 服务内部 domain / local event       | 服务内 dispatcher；需要可靠异步时使用该服务自己的 durable job |
| 跨服务已经成立的公共业务事实        | 本文定义的 Event Bus                                          |
| 邮件、短信、转码、AI 等后台执行任务 | 对应服务拥有的 job / worker                                   |
| 多服务步骤、等待、超时与补偿        | Saga / Workflow owner 组合 command 与 event                   |

跨服务异步 command lane 是合法的 event-driven collaboration 方式，但不属于 `OES_BUSINESS_EVENTS`。本期不实现该 lane；未来出现订单、库存、支付或其他 Saga 的真实需求时，应以独立 stream、subject、ACL、target owner、result / rejection 与幂等语义另行冻结，不能把 command 伪装成公共事实。

## 2. 第一批适用链路

第一批平台验收以两条链路为基准：

1. `collaboration.task.assigned / completed / cancelled` -> `notification-service`。
   - Notification 把每个公共 Task fact 作为通知规则输入。
   - 同一 `eventId` 不得重复创建通知输入或通知任务。
   - Notification 不通过 Task 事件重建 Task 当前真相。
2. Asset Site Media availability fact -> `site-service`。
   - Site 保存自身需要的最小 Asset availability projection。
   - 同一 Asset 只应用严格递增的 `availabilityVersion`，拒绝重复或过期事实。
   - Site 不修改 Asset lifecycle，不自动替换业务内容。

MES 当前本地 outbox、Terminal Device 的 Redis Pub/Sub 以及其他 deferred candidate events 不因本平台冻结而自动成为公共事件。它们只有在 owner contract 进入 `FROZEN_SUBSCRIBABLE` 后才能接入。

### 2.1 Security-Critical Transport 适用条件

只有同时满足以下条件的 Auth-owned 公共事实才能使用 security-critical transport profile：

- owner contract 已冻结为过去式事实，而非向 consumer 发出的 command；
- Event Catalog 明确登记 owner、type/version、订阅资格与 security-critical transport profile；
- payload 仅含 owner 已冻结的 opaque identifier / version / safe reference，不含 Bearer Token、API Key secret、PII、原始事故详情或可复用 credential；
- producer 是 `auth-service`，并由精确 subject ACL 独占发布权；
- 每个执行 ExecutionToken 本地验证的 consumer 已登记自己的 exact-subject durable、consumer-owned enforcement projection、Inbox 与 freshness gate；
- SYSTEM / TENANT scope、失败隔离、追平与超过 retention 后的 fail-closed 边界已通过黑盒验收。

Auth-owned contract handoff 已完成，当前唯一登记事件为 `auth.execution-token.revoked` v1；准确 Catalog registration 以 [auth-service.md](../../contracts/events/auth-service.md) 为准。本节仍不授权平台发明或复制 payload、selector 与撤销语义。

## 3. 总体拓扑

```text
Owner service local database transaction
  = business state + local audit + local outbox row
                         |
                         v
Owner-scoped relay worker
                         |
                         v
Profile-routed NATS JetStream
  |- OES_BUSINESS_EVENTS
  `- OES_SECURITY_EVENTS
                         |
             durable pull consumer
                         |
                         v
Consumer local database transaction
  = inbox/processed-event row + local side effect/projection/task acceptance
```

约束如下：

- 每个服务只拥有自己的数据库、outbox 与 inbox；禁止共享 outbox / inbox 数据库。
- 每个 relay 只能访问所属服务数据库；禁止建立连接所有服务数据库的中央扫描器。
- broker 是共享运输基础设施，不拥有业务 payload 真相。
- 普通公共事实进入 `OES_BUSINESS_EVENTS`；security-critical 事实进入同一 NATS 集群内独立的 `OES_SECURITY_EVENTS`，并使用独立容量、ACL、consumer profile 与安全告警。它不是第二个微服务或第二套 Event Bus。
- `src/common` 可以承载显式跨服务 contract 与 owner-neutral 基础设施，但不得承载领域判断。公共事件代码 contract 按 owner 放在现有 `src/common/src/contracts/<service_snake_case>/events.ts`；通用 CloudEvents type、codec、relay/inbox port、指标与 broker adapter 由 common platform 提供。
- owner service 负责把领域事实映射到已冻结公共事件；consumer service 负责自己的本地反应。

### 3.1 CloudEvents 与代码契约

公共事件 canonical body 使用 CloudEvents `1.0` Structured JSON，准确字段和 NATS mapping 以 [platform-transport.md](../../contracts/events/platform-transport.md) 为准。Event Catalog 继续拥有业务 event type、version、payload、owner 与触发语义；CloudEvents 只统一事件外层。

现有 tenant-only business event contract 继续要求 `oestenantid`，不增加隐式 scope。只有登记使用 security-critical profile 的 contract 才要求 CloudEvents extension `oesexecutionscope`：

- `TENANT`：`oestenantid` 必填且必须是真实 tenant identity；
- `SYSTEM`：`oestenantid` 必须缺失，不得使用 `SYSTEM`、全零 ID 或其他 sentinel 伪造 tenant；
- 缺失、未知或 scope / tenant 组合非法时 publisher 与 consumer 均 fail closed。

`oesexecutionscope` 是 transport isolation metadata，不授权平台解析 Auth payload 或改变 owner semantics。现有 Collaboration、Asset 等冻结 contract 保持 wire-compatible。

开发期 contract 遵守仓库现有的按服务目录归属：

```text
src/common/src/contracts/collaboration_service/events.ts
src/common/src/contracts/asset_service/events.ts
src/common/src/contracts/auth_service/events.ts
```

每个 `events.ts` 只定义该服务已冻结公共事件的 type/version/owner 常量、`data` payload TypeScript 类型、与通用 `OesCloudEvent<TData>` 的组合类型和运行时验证 descriptor，并由同目录 `index.ts` 导出。producer 与 consumer 必须引用同一份 common contract；不得各自复制字符串、payload interface 或对方内部 domain type。

推荐的开发接口语义是：

```text
producer:
  eventOutbox.append(localTransaction, contract, aggregateIdentity?, data)

consumer:
  eventConsumer.subscribe(contract, consumerName, handler)
```

这些是黑盒能力形态，不冻结具体 TypeScript symbol。producer 不直接调用 NATS 或手工拼 CloudEvents；common builder 根据已验证 command context 补充 `id`、`source`、条件适用的 execution scope / tenant / aggregate、trace、time 与 schema identity。owner contract 没有公共 aggregate 时不得从 payload 推导或补造。consumer handler 接收已验证、已解码的 typed CloudEvent，不依赖 NATS client 类型。

第一版不要求独立 Schema Registry、平行 JSON Schema 目录、AsyncAPI codegen 或新的 event-contract package。未来出现跨语言、外部事件接口或明显 schema drift 风险时再通过 ADR 引入生成链路，不得形成第二份业务语义真相。

## 4. Provider 决定

OES 第一版公共业务事实总线采用 NATS JetStream，详细取舍以 [ADR 0013](../../adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md) 为准。

决定依据：

- 当前已确认的是低到中频业务事实、多消费者独立进度、至少一次投递、有限保留与受控重放。
- 当前没有冻结高频 PLC / IoT 数据、实时数仓或复杂流计算要求，不以未确认的 Kafka 级数据平台需求驱动第一版。
- 当前核心不是大量工作任务或复杂 routing，不以 RabbitMQ Queue 的优势主导公共业务事实总线。
- JetStream 以一套 Stream + Durable Consumer 模型覆盖当前需求，并适合单节点本地开发与三节点生产集群。

重新评估 provider 的触发条件：

- 明确需要承载高频工业遥测、长期海量事件、Kafka Connect / Streams 生态或实时数据湖时，重新评估 Kafka / Redpanda。
- 大量后台任务、复杂 routing、priority queue 或 provider dispatch 成为主要负载时，独立评估 RabbitMQ；不得因此把公共业务事实改成 command queue。
- 任何 provider 迁移都必须保持 Event Catalog 与 platform transport contract 稳定，且接受 adapter、offset、replay 与运维迁移并非零成本。

## 5. Transactional Outbox

### 5.1 原子性

owner service 必须在同一个本地数据库事务中完成：

- 业务状态变更；
- 该业务动作要求的本地 audit；
- 对应公共事实的 outbox 记录。

不得在业务事务提交后再调用独立 repository 写 outbox；否则进程在两步之间失败时会形成“业务成功、事件永久缺失”。不得先发 broker 再提交业务事务。

### 5.2 稳定语义

每个服务可以使用自己的表名和 ORM，但 outbox 至少保持以下语义：

| 字段语义                                   | 要求                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `eventId` / CloudEvents `id`               | 全局唯一，生成后不可改变；outbox 唯一约束。                                                                                      |
| `eventType / eventVersion`                 | 映射到 `type / oeseventversion`，且必须对应 Event Catalog 已冻结版本。                                                           |
| `ownerService`                             | 映射到稳定 CloudEvents `source`，必须等于当前发布服务身份。                                                                      |
| `tenantId / orgId? / executionScope?`      | tenant-only 事实继续要求真实 tenant；security-critical fact 按 SYSTEM / TENANT profile 条件映射，不能使用 sentinel。             |
| `aggregateType? / aggregateId?`            | owner contract 声明公共 aggregate 时映射到 `subject` 与 OES extensions；security profile 未声明时必须缺失且不得从 payload 猜测。 |
| `occurredAt`                               | 映射到 CloudEvents `time`，是 owner 本地事实成立时间，不是 broker 接收时间。                                                     |
| `cloudEventBody / data`                    | 已冻结 Structured CloudEvent 与业务 payload 快照；写入后不可原地改写。                                                           |
| `status`                                   | 至少区分待发布、已发布与隔离失败。                                                                                               |
| `attemptCount / nextAttemptAt / lastError` | 支撑 relay 重试与排障。                                                                                                          |
| `publishedAt`                              | broker 持久化确认后写入。                                                                                                        |

Relay 使用短租约或数据库等价并发声明机制领取记录，避免同一实例并发重复发送；这只是降低重复，不能替代 consumer inbox。

### 5.3 Relay 投递

- Relay 默认与 owner service 代码和凭证边界一起部署，可以是同一进程的后台 worker，也可以是只访问该服务数据库的独立 worker deployment。
- Relay 原样发布 Outbox 中的 canonical CloudEvent body，设置 broker deduplication id 为 CloudEvents `id`，并等待 JetStream publish acknowledgement。
- 收到 broker acknowledgement 后才可标记 `PUBLISHED`。
- 若 publish 已成功但 relay 在更新 outbox 前崩溃，恢复后允许重发同一 `eventId`；系统依靠 broker 短窗去重与 consumer inbox 获得最终幂等。
- broker 不可用、网络失败或超时时，outbox 保持待发布并按退避策略重试；未发布事实不得因超过时间自动删除。
- 契约校验失败、未冻结事件、owner identity 不一致或超大消息必须进入 `QUARANTINED` 等价状态并告警，不得无限重试。

## 6. Consumer Inbox 与本地反应

### 6.1 幂等边界

每个逻辑 consumer 使用稳定 `consumerName`，并在自己的数据库中以 `(consumerName, eventId)` 建立唯一处理记录，其中 `eventId` 等于 CloudEvents `id`。Inbox 同时保存不可变的 envelope identity tuple（至少包括 `id`、`source`、`type`、`time`、`oeseventversion`、条件适用的 `oesexecutionscope / oestenantid / subject / oesaggregatetype / oesaggregateid`）以及 canonical body digest。tenant-only / TENANT 事实必须保存 tenant 并参与查询、审计与运维过滤；SYSTEM security fact 必须保存 execution scope 且不得补造 tenant；未声明公共 aggregate 的 security fact 不得补造 aggregate identity。

对于数据库内副作用，consumer 必须在一个本地事务中完成：

- 建立 inbox / processed-event 记录；
- 写入自己的 projection、通知受理记录或其他本地结果。

若唯一记录已存在，只有 identity tuple 与 canonical body digest 完全一致时才返回 `DUPLICATE`，不重复执行副作用。插入、唯一键冲突读取与 digest 比较必须在 consumer 本地事务边界内收敛。相同 `eventId` 但任一身份字段或 body digest 不一致时返回 `EVENT_ID_CONFLICT`，隔离到该 consumer 的 DLQ，不执行任何业务副作用。

### 6.2 外部副作用

不得在持有长数据库事务时直接调用邮件、短信、CDN、AI 或其他第三方 provider。consumer 应先在 inbox 事务中创建自身拥有的本地任务，再由该服务自己的 delivery worker 执行外部调用和 provider retry。

### 6.3 顺序与新鲜度

- 平台不承诺全局总顺序。
- 不同 tenant、不同 aggregate 的事件允许并行。
- 同一 aggregate 的消费者必须容忍重复、延迟和 redelivery。
- 事件契约提供 `aggregateVersion`、`availabilityVersion` 等 owner version 时，消费者保存最高已应用版本并拒绝旧事实。
- 对提供 owner version 的 projection（例如 Site Media availability），最高版本判断、条件更新 projection 与 Inbox result 必须在同一本地事务内完成；使用 CAS 条件更新（如 `currentVersion < incomingVersion`）或等价的 aggregate lock，确保并发 `vN` / `vN+1` 到达时旧版本不能覆盖新版本。
- 没有 owner version 的事件不得被消费者用来重建 owner 当前真相；需要当前状态时通过 owner query contract 读取。
- Saga / workflow 的跨服务步骤、等待、超时和补偿由相应业务流程 owner 管理，不能依赖 broker 全局顺序。

### 6.4 Security-Critical Consumer 与 Freshness Gate

security-critical subscription 使用独立 `OES_SECURITY_EVENTS` Stream 上的 exact-subject durable pull consumer。为了让低频安全事实能够证明没有越过未处理缺口，冻结以下 profile：

- 第一次 provision 使用 `DeliverAll` 读取 retention window 内的全部匹配事实；durable 必须在 Auth publisher 生产权限和目标服务 ExecutionToken enforcement 开放前创建。
- 使用 `AckPolicy=Explicit`、有限 `MaxDeliver` / backoff、单条未确认窗口（目标 `MaxAckPending=1`）与单 consumer handler concurrency；安全性仍由 owner version / idempotency 保证，不把 broker delivery order 当业务真相。
- consumer 在同一本地事务内提交 Inbox identity/digest、consumer-owned security enforcement projection，以及连续已应用 Stream sequence / unresolved gap 语义；只有成功提交后才 ACK。
- 服务启动、durable 重建或本地数据库恢复后，必须先追平一个已观察到的 security stream high-water mark 且不存在 unresolved gap，才能把 ExecutionToken-protected readiness 标记为 ready。
- 已知 `TENANT` fact 无法应用时，至少该 tenant 的 ExecutionToken path 立即 fail closed；已知 `SYSTEM` fact、非法 scope / tenant 组合或无法确定可能遗漏 scope 时，全部 ExecutionToken path fail closed。
- security freshness 的运营阈值可配置，默认建议 `30s`，必须严格短于 Auth-owned ExecutionToken 最大 TTL；启动追平没有该宽限。超过阈值、consumer lag 不可观测或 channel 状态未知时告警并 fail closed，追平后才重新开放。

consumer freshness 只能证明已连续应用 Broker 中的事实，不能证明 Auth outbox 没有尚未发布的记录。端到端 security SLO 必须同时观察 Auth outbox pending age / quarantine / relay failure 和 consumer lag；Auth 在 publisher 失效时如何限制签发属于 Auth owner，不由 Event 平台猜测。

## 7. Retry、DLQ 与 Replay

### 7.1 Retry 分类

- `RETRYABLE`：网络、broker、数据库暂时不可用、锁冲突、明确可恢复的 downstream 故障；使用指数退避与 jitter。
- `NON_RETRYABLE`：不支持的事件版本、结构校验失败、scope / tenant / owner mismatch、确定性业务处理错误；直接进入 DLQ。
- 未分类异常默认按有限次数重试，达到上限后进入 DLQ，禁止无限自动循环。

消费者的具体重试次数和 backoff 可以按 subscription 配置，但必须存在平台默认值和上限。JetStream 普通 `NAK` 会立即重投，不能冒充 backoff；需要延迟时必须使用 delayed NAK，或不确认并让配置好的 `BackOff` / `AckWait` 到期触发重投。DLQ 转移本身必须可靠：只有 DLQ 记录被确认持久化后，才终止原 consumer 的继续投递。

JetStream 达到 `MaxDeliver` 时会产生 advisory，且原消息继续保留在对应 source stream。OES 不为此建立独立 Event Operations Service 或中央 control store：common 提供统一 advisory 解析、DLQ record、幂等键和 publish-before-term 能力；Deployment / SRE 负责将相关 advisory 纳入持久监控、告警与运行手册；每个目标 consumer 在自身进程内 operations module 或同 package 的一次性恢复 job 中处理自己的 subscription advisory。

若 handler 在持有真实 delivery 时捕获最终确定性失败，必须先把原始不可变消息可靠发布到该 consumer 专属 DLQ subject，收到 JetStream publish acknowledgement 后再对**该 delivery** `TERM`。这是唯一允许自动创建 resolved DLQ transfer 的路径；DLQ publish 失败时不得 ACK 或 TERM 原 delivery。

#### MaxDeliver advisory recovery erratum

`MaxDeliver` advisory 只提供 stream、consumer、stream sequence、consumer sequence 与 deliveries 等定位事实；它不包含该次实际投递的 `$JS.ACK...` reply subject。JetStream 的 `TERM` 必须使用真实 delivery 持有的 reply subject。即使另有权限通过 retained `MSG.GET` 读取原消息，读取结果也不能重建该 token。因此，advisory-only 的自动“retained lookup -> publish DLQ -> TERM”不是可证明的 broker 行为，禁止实现或声称已经完成。依据：[NATS Consumer details](https://docs.nats.io/using-nats/developer/develop_jetstream/consumers) 规定 MaxDeliver advisory 提供 `stream_seq`，而 [NATS JetStream API reference](https://docs.nats.io/reference/reference-protocols/nats_api_reference) 规定 ACK reply subject 属于实际 delivery。

当最后一次 handler 在取得可用 transfer 结果前崩溃，consumer-owned operations module/job 必须创建或幂等更新本地 recovery record，状态为 `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED`，并且：

- 保存 advisory 原文或其持久引用/digest、stream/consumer、stream/consumer sequence、deliveries、subscriptionConfigVersion、observedAt、consumer deployment reference、alert/escalation reference 与操作审计；advisory 未提供的 `eventId`、execution scope、tenantId、payload 或 DLQ record ID 不得猜测或补造。
- 不发布一个暗示已解析的 DLQ record，不发送或伪造 ACK/TERM，也不把原 stable consumer 的 source termination 标记为完成。
- 由目标 consumer owner 负责该本地记录、值班响应和最终处理说明；Deployment / SRE 负责 advisory 持久化、告警投递和对应 source stream `MaxAge` 临近的升级。common 只提供 parser、不可变 DLQ construction 和真实-delivery publish-before-TERM primitive，不拥有跨 consumer recovery state。
- 告警必须在记录创建时触发，并在原业务消息仍可保留的窗口结束前再次升级给 consumer owner 与 Deployment / SRE。到期不是 resolution：保留 recovery/audit reference，记录 `EXPIRED_UNRESOLVED`，并按事故流程升级；不得伪称原消息已归档、DLQ 化或 TERM。

唯一可授权的后续处理是独立的、双重批准且按 contract 限定 execution scope / tenant / event range 的 `SAFE_REDELIVERY`。平台操作员可在其独立的受控读取权限下核实 retained 原消息与条件适用的 scope / tenant 范围，然后由目标 consumer owner 的 run-scoped job 用真实 replay delivery 调用同一 typed handler 和 Inbox。若该 replay delivery 走 DLQ，仍须先 publish acknowledgement 后再 TERM **该 replay delivery**；这不能追溯为原 stable consumer delivery 已 TERM。recovery record 只有在审计中明确 `originalSourceTermination=NOT_PERFORMED` 时，才能以 `SAFE_REDELIVERY_COMPLETED` 结束业务处理；保留期已过或无法完成授权重投时保持/结束为 `EXPIRED_UNRESOLVED`。scope/tenant/operator approvals、Inbox idempotency、contract-specific exact single-subject replay durable 和默认禁止外部副作用均不因 advisory 而放宽；P1 Notification 仍使用其三个已冻结 single-subject run durable。

### 7.2 DLQ

DLQ 记录至少包含：

- 原始不可变 envelope 与 payload；
- `consumerName`、失败阶段、错误分类、尝试次数和最后失败时间；
- 条件适用的 `executionScope / tenantId`、`eventId`、`traceId`；
- `subscriptionConfigVersion` 与确定性 `dlqRecordId`（由 `consumerName`、该版本和 `eventId` 组成）；
- 可选 handler version / deployment reference；
- 目标 consumer 本地 operations record 中的状态、处理人、处理说明与 replay reference（不写入不可变 DLQ body）。

同一 `(consumerName, subscriptionConfigVersion, eventId)` 最多存在一条 active DLQ record；所有由真实 delivery 执行的 handler transfer 或 approved replay transfer 必须收敛到同一幂等键。advisory-only unresolved record 没有可验证的 `eventId` 或不可变 body，不能伪装为该 DLQ record 或参与其幂等键。普通事件的不可变原始 body 与失败快照进入共享 `OES_EVENT_DLQ` stream 中的 consumer 专属 subject；mutable DLQ resolution、advisory recovery state、操作审计与 replay reference 进入目标 consumer 自己的数据库。不存在全局共享 DLQ control database。`90d` 是默认保留窗口而非静默删除许可，未解决记录必须在窗口到期前由目标 consumer owner 与 Deployment / SRE 升级并归档。

DLQ 是面向某个 consumer 的异常保管区，不是全局业务事件，也不得被其他 consumer 自动订阅。

security-critical delivery 使用独立 `OES_SECURITY_EVENT_DLQ` 与 `oes.security.dlq.>` namespace，避免原始安全事实和失败上下文进入普通业务 DLQ 运维面。只有 security platform operator 与目标 consumer owner 获得受控访问。DLQ transfer 成功只证明异常消息被保管，不证明撤销事实已经应用；对应 tenant / SYSTEM freshness gap 必须保持 fail closed，直到获批 redelivery 真正提交 consumer 本地状态。

### 7.3 Replay

重放必须由平台操作员和目标 consumer owner 共同授权，并明确：

- 目标 `consumerName`；
- `approvedByPlatformOperator` 与 `platformApprovalRef`；
- 条件适用的 execution scope 与 tenant 范围；
- event type、eventId、时间窗口或 stream sequence 范围；
- 重放模式与原因；
- 是否允许重新执行外部副作用。

P1 与 security-critical profile 都只实现 `SAFE_REDELIVERY`：重新交给目标 consumer 的普通 typed handler，既有 Inbox 记录会跳过，适合补投未成功事件。`CONTROLLED_REBUILD` 不因 security profile 自动开放；只有在 Site、BI、Search 等出现真实投影重建需求后才另行冻结 handler、checkpoint、外部副作用和数据迁移语义，不预建中央 rebuild 平台。

既有普通 tenant-only replay 保持 tenant 范围必填且不要求 execution scope；security-critical replay 必须显式声明 execution scope，其中 TENANT 同时要求真实 tenant，SYSTEM 禁止伪造 tenant 并使用 security operator approval。所有 replay 都禁止无目标 consumer 或无事件范围的全量广播。原始事件不得在重放时被修改；必要的数据迁移应由 consumer 的版本化 handler 或独立 migration 完成。

Replay 不依赖长期运行的中央 worker。目标 consumer owner 提供同一 service package 内的一次性 replay job，复用 common replay runner，并在 contract 对应的 `OES_BUSINESS_EVENTS` 或 `OES_SECURITY_EVENTS` 上创建本次 run 专属、精确 subject 过滤且从指定 stream sequence / time 开始的 consumer。JetStream consumer state 提供 delivery progress；目标 consumer 自己保存 replay request、execution scope / tenant / event filter、双重批准引用、结果与审计。job 解码后先执行 scope / tenant / event filter，再调用相同 typed handler；`SAFE_REDELIVERY` 继续使用目标 consumer 原 Inbox，且默认禁止重复外部副作用。

P1 与 security-critical profile 都不需要 `OES_EVENT_REPLAY` stream、私有 replay subject 或中央 replay control store，也绝不重新发布到正常 business / security event subject。run 完成并保存审计后清理专属 replay consumer；需要暂停/恢复时使用本次 run 的 durable consumer，而不是额外复制业务消息。

## 8. Event Catalog 与 Schema / Version 集成

- 只有 `FROZEN_SUBSCRIBABLE` 事件可以创建生产发布路由和 durable consumer。
- event type 是业务标识，不包含 broker topic、stream、queue 或 provider 名。
- `eventVersion` 映射到 CloudEvents extension `oeseventversion`；CloudEvents `specversion` 固定为 `1.0`，两者不得混用。同一事件的兼容版本使用稳定 broker subject。
- publisher 必须在写入 outbox 前验证 common code contract、event type、版本、required CloudEvents attributes、payload size 与本地 owner identity。
- consumer 必须声明支持的 event version；未知 major version fail closed 并进入 DLQ，不得猜测字段。
- 平台 envelope 与 NATS headers 的准确映射以 [platform-transport.md](../../contracts/events/platform-transport.md) 为准。
- 第一阶段 Event Catalog Markdown 是业务语义真相，`src/common/src/contracts/<service_snake_case>/events.ts` 是其编译期实现映射。后续可从冻结 contract 生成 JSON Schema / AsyncAPI 和 CI compatibility check，但生成物不能反向改写 owner 语义。

### 8.1 Asset 接入状态

Asset contract owner 已完成此前的机械契约对齐。当前 [Asset event contract](../../contracts/events/asset-service.md) 与 [Event Catalog](../../contracts/events/catalog.md) 已冻结 `asset.site-media.availability.changed`、业务版本 `1`、CloudEvents Structured JSON mapping，并将其登记为 `FROZEN_SUBSCRIBABLE` 且 `notificationConsumable=false`。旧的带内嵌版本号 event type 与 `schema_version` 不再是合法契约。

Asset 事件的业务 payload、生命周期语义与递增版本规则仍完全归 Asset owner；本文不重新定义 payload。Asset owner 后续仍需在实现期创建并导出：

```text
src/common/src/contracts/asset_service/events.ts
```

该事件不属于本 P1 的 Collaboration -> Notification 首条垂直切片。Asset producer、Site consumer、对应数据库迁移与平台 topology 必须在 common code contract、Asset/Site 实现门禁和独立黑盒验收通过后另行推进。契约对齐已不再阻塞 Event Bus 平台设计，但仍是 Asset 业务链路实现的前置门禁。

### 8.2 Auth Security Event 接入状态

Auth contract owner 已在 [ExecutionToken contract](../../contracts/auth-service/execution-token.md#emergency-revocation-fact) 与 [auth-service truth](../services/auth-service.md#711-emergency-executiontoken-revocation) 冻结紧急撤销事实。Event-owned [Auth security event registration](../../contracts/events/auth-service.md) 与 [Event Catalog](../../contracts/events/catalog.md) 现登记：

| Registration item  | Frozen mapping                                     |
| ------------------ | -------------------------------------------------- |
| event type/version | `auth.execution-token.revoked` / `1`               |
| owner/source       | `auth-service` / `urn:oes:service:auth-service`    |
| transport profile  | `SECURITY_CRITICAL`                                |
| NATS subject       | `oes.security.events.auth.execution-token.revoked` |
| Stream             | `OES_SECURITY_EVENTS`                              |
| notification       | `notificationConsumable=false`                     |

该 registration 不复制 Auth payload。selector、payload、monotonic revocation version、trigger authorization、deny / cleanup 与 consumer token-matching semantics 继续只由上述 Auth-owned 真相源定义。

Auth semantic contract 没有声明公共 aggregate，且平台不得从 selector 推导 envelope。因此该事件的 CloudEvents `subject / oesaggregatetype / oesaggregateid` 缺失；delivery identity 使用 CloudEvents `id`，owner 新旧判断继续使用 Auth contract 的 monotonic version。SYSTEM/TENANT isolation、exact Auth publisher ACL、durable、DLQ、replay 与 freshness 仍以 platform transport contract 为准。

Catalog `FROZEN_SUBSCRIBABLE` 只表示设计契约可以被获批 consumer 依赖，不表示 common code contract、Auth outbox/relay、JetStream topology 或 consumer enforcement 已经实现。其实现与验收不属于本次文档收口。

## 9. Message 与数据边界

- 常规事件目标大小小于 `64 KiB`，平台硬限制默认 `256 KiB`；具体限制为平台配置，不是业务字段。
- 禁止在事件中放入文件、图片、视频、完整数据库实体、大段正文、storage key、provider credential 或未必要的 operator PII。
- security-critical fact 额外禁止 Bearer Token、API Key secret、credential verifier、可复用认证材料、PII 与原始 incident detail；DLQ、日志和 replay request 继续遵守同一限制。
- 大对象继续由 owner 管理；事件只携带稳定 ID、必要小快照和受控引用。
- envelope 与 payload 不得依赖 broker 特有编码；第一版 canonical body 使用 CloudEvents `1.0` Structured JSON，media type 为 `application/cloudevents+json`，业务 payload 位于 `data`。
- Event Bus 不是审计档案、文件存储、数据湖或业务数据库。

## 10. Tenant、服务身份、Operator 与 Trace

- 每个发布/消费服务使用独立 broker credential；禁止共享超级账号。
- ACL 按服务允许的 subject 范围配置：owner 只能发布自己的公共事件 namespace，consumer 只能读取获批事件。
- 默认按环境建立 NATS account / cluster 边界，不为每个 tenant 动态创建 stream 或 subject；普通事实与 TENANT security fact 通过真实 `tenantId`、服务内校验、Inbox/DLQ/Replay 过滤与审计实现。SYSTEM security fact 使用 required `oesexecutionscope=SYSTEM` 且禁止伪造 tenant。
- `actorAccountId` 只表达谁触发了事实，不是 delegation token；consumer 不得用它冒充 actor 或继承其权限。
- Event Bus 不传播完整 signed `operator_context` 作为下游授权凭证。consumer 依据自身系统身份与本地契约处理事实。
- `traceId` 必须保留；`traceparent / tracestate` 作为 transport metadata 传播。consumer 创建异步消费 span，并与 producer span 建立父子或 link 关系。
- required header 必须恰好出现一个值；`traceId` 是 OES 业务关联字段，`traceparent / tracestate` 是 W3C transport context，两者都保留但不得互相覆盖。
- `auditRef` 只指向 owner 本地 audit；publish、consume、DLQ、replay 等平台操作另外产生平台运行审计，不复制业务审计正文。

## 11. 部署、配置与凭证

### 11.1 本地开发

- 本地 provider scope、endpoint/credential injection、lease 与 cleanup 以
  [Local Development And Test Runtime](./local-development-and-test-runtime.md) 为准：`DEV` 复用
  long-lived single-node file-backed JetStream，local Integration 仅在 selected test 需要时创建
  one-per-run ephemeral JetStream，CI 使用 job-private provider。
- 本地默认事件保留 `3-7` 天；持久 DEV data 只由准确 owner 操作显式清理，ephemeral run data
  由 runtime 按 manifest 回收。
- 每个 profile 都使用服务级 credential 和 subject ACL；shared provider 不产生匿名、共享超级
  账号或跨 run/service data authority。

### 11.2 生产

- 使用三节点 JetStream 集群和 file storage，业务事件 stream replication factor 为 `3`。
- `OES_SECURITY_EVENTS` 与 `OES_SECURITY_EVENT_DLQ` 使用同一集群但独立 file-backed Stream、replication factor `3`、容量上限、credential / subject ACL、备份恢复与安全告警；普通业务 consumer 和 operator 不获得其读取权限。
- 使用 TLS；服务 credential 通过部署 secret 注入，不硬编码、不写入 Git、不把长期 secret 明文存入 Nacos。
- Stream 同时设置 `MaxAge` 与容量上限；达到容量上限时拒绝新 publish 并让 outbox 保持待发布，禁止静默淘汰尚在保留窗口内的事件。
- 节点使用持久磁盘并配置容量、备份/恢复、时钟同步和滚动升级运行手册。
- 开发、测试、预发、生产使用独立 account / cluster / credential，不跨环境重用 durable consumer progress。

Provider 端的 stream、consumer、ACL 与 retention 由平台 IaC / bootstrap 管理，业务服务不得在运行时任意创建生产拓扑。

## 12. Retention 与 SLO 默认值

这些数值是可配置运营基线，不是业务事件契约：

| 数据 / 指标                         | 默认基线                                                             |
| ----------------------------------- | -------------------------------------------------------------------- |
| 生产 Event Bus 正常事件             | 保留 `30` 天                                                         |
| Consumer Inbox                      | 保留至少 `45` 天                                                     |
| 已发布 Outbox                       | 保留 `7` 天后清理或归档                                              |
| 未发布 Outbox                       | 不自动过期                                                           |
| DLQ                                 | 默认保留 `90` 天；未解决记录须在到期前升级并归档，清理必须告警与审计 |
| 正常 broker publish acknowledgement | P95 `<= 1s`                                                          |
| 正常端到端消费完成                  | P95 `<= 30s`                                                         |
| consumer lag                        | 超过 `5m` 告警                                                       |
| 关键 subscription lag               | 超过 `30m` 升级人工处理                                              |
| security-critical 端到端消费        | P95 `<= 5s`；具体 SLO 由生产验证校准                                 |
| security-critical freshness age     | 默认 `30s`；必须短于 Auth-owned Token 最大 TTL；超过即 fail closed   |
| security-critical unresolved gap    | 立即告警；相关 TENANT / SYSTEM scope 不得 ready                      |

上线后根据真实事件量、磁盘使用、问题发现周期、重放窗口与数据分类调整。Inbox 保留期不得短于 Event Bus 可重放窗口。

## 13. Observability 与恢复

平台至少提供：

- outbox pending 数量、最老 pending age、publish attempt / failure / quarantine；
- stream publish rate、bytes、storage、replica health、capacity rejection；
- consumer lag、ack pending、redelivery、handler latency / result；
- security stream / consumer 的 latest observed high-water、连续已应用 sequence、unresolved gap、freshness age、fail-closed scope 与 readiness；
- Auth outbox pending age / quarantine / relay failure 与 security consumer lag 的端到端关联；consumer 侧不得把 broker catch-up 冒充 producer outbox freshness；
- DLQ count、oldest age、error class；
- replay run 状态、范围、操作人、目标 consumer 与结果；
- `eventId / executionScope? / tenantId? / traceId / ownerService / consumerName` 关联查询。

告警必须面向可行动问题，不把正常的 at-least-once 重复投递本身视为事故。恢复顺序是先恢复 broker / database 可用性，再观察 relay 与 consumer 自动追赶；不得手工修改 event payload 或直接跳过未确认事实。

## 14. Owner Lanes

| Lane                           | 责任                                                                                                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation Platform / common   | 通用 CloudEvents type、transport contract、ports / codec / relay / inbox、retry、DLQ、advisory 与 replay runner 基础能力、NATS adapter、指标、错误分类；不拥有业务 payload。                                                             |
| Deployment / SRE               | JetStream 集群、TLS、credential、ACL、storage、backup、topology bootstrap、advisory 持久监控、普通/安全 Stream 容量隔离、security freshness 告警与运行手册；不执行 consumer 业务 handler。                                               |
| Event Catalog / contract owner | Catalog 状态、event type/version、compatibility；不实现 relay。                                                                                                                                                                          |
| Producer service owner         | 业务事务、owner audit、outbox migration、事实映射、本服务 `src/common/src/contracts/<service_snake_case>/events.ts`、payload 校验与 producer tests。                                                                                     |
| Consumer service owner         | subscription 声明、inbox migration、幂等 handler、projection/本地任务、error classification，以及本 subscription 的 DLQ resolution、advisory-only unresolved record、授权 replay job、本地操作审计与 security freshness gate（适用时）。 |
| Event Operations (`EV-OPS`)    | 不是独立 service/worker；由 common 通用能力、Deployment/SRE topology/monitoring 与 consumer-owned operations module/job 组合完成。                                                                                                       |
| Integration & Verification     | broker-level black-box、故障注入、跨服务 smoke、恢复与 tenant isolation 验收。                                                                                                                                                           |

实现必须按 lane 分派。本设计不授权当前线程派发或执行代码、基础设施或依赖变更。

## 15. 黑盒验收

1. 业务事务回滚时不留下 outbox；业务事务提交时相应 outbox 必然存在。
2. owner service 在 broker 不可用期间继续保留 pending outbox；broker 恢复后自动补发。
3. relay 在 publish acknowledgement 后、标记 outbox 前崩溃造成的重复投递，不产生重复 consumer 副作用。
4. consumer 停机后恢复，可以从 durable progress 继续消费保留窗口内的事件。
5. Notification 重复收到同一 Task `eventId` 时只建立一次本地受理结果。
6. Site 收到相同或更低 `availabilityVersion` 时不回退 Asset projection。
7. poison event 在 handler 持有真实 delivery 时经有限重试进入指定 consumer DLQ，不阻塞其他可处理事件，并证明 DLQ publish acknowledgement 先于该 delivery 的 TERM。若最后一次 delivery 在 transfer 前崩溃，目标 consumer 恢复后必须从持久 advisory 建立 `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED`、告警并在 stream `MaxAge` 前升级；不得根据 advisory/retained lookup 声称已创建 DLQ 或 TERM。经独立双重授权的 `SAFE_REDELIVERY` 只能用新 run delivery 补救，且审计明确原 source termination 未执行。
8. 目标 consumer 的一次性 replay job 创建 run-scoped JetStream consumer；`SAFE_REDELIVERY` 对已处理且 identity/digest 等价的 `eventId` 被 Inbox 跳过，冲突 eventId 进入 DLQ，不经过中央 replay service 或正常业务 subject。
9. replay 必须限定 consumer 与事件范围；普通/TENANT replay 必须限定 tenant，security-critical replay 必须显式限定 execution scope，SYSTEM 禁止伪造 tenant；跨 tenant、越权 publisher / subscriber 和匿名管理操作均 fail closed。
10. 从入口 trace 到 outbox publish、consumer handle 与本地副作用可以通过 `traceId / eventId` 关联。
11. 达到 stream 容量上限时 publish 失败、outbox 保留并告警，不静默删除仍在保留窗口内的事实。
12. 单节点本地环境可以完整验证 publish、redelivery、consumer restart、DLQ 与 replay；生产拓扑以三节点 failure drill 验证单节点故障恢复。
13. 并发投递 `availabilityVersion=vN` 与 `vN+1` 时，projection 与 Inbox 事务最终只保留最高版本，旧版本不能覆盖新版本。
14. producer 与 consumer 从 owner 的同一 common `events.ts` contract 引用 type/version/data，Structured CloudEvent body、NATS subject 与 owner identity 不一致时发布或消费 fail closed。
15. tenant-only 现有事件继续保持原 wire contract；security-critical `TENANT` fact 缺少真实 tenant、`SYSTEM` fact 携带 tenant、缺失/未知 `oesexecutionscope` 均在 publish 或 consume 前 fail closed。
16. `auth-service` 是获准 security subject 的唯一 publisher；其他 service credential 发布到 `oes.security.events.>` 必须被 broker ACL 拒绝并审计。
17. 新建或恢复的 security consumer 在 `DeliverAll` catch-up、连续 checkpoint 和 unresolved-gap 检查通过前不进入 ExecutionToken-protected readiness；已知 tenant gap 只允许隔离该 tenant，SYSTEM 或未知 scope gap 必须隔离全部。
18. security-critical terminal failure 即使可靠进入 `OES_SECURITY_EVENT_DLQ` 也不能清除 freshness gap；只有获批 run-scoped `SAFE_REDELIVERY` 真正提交 Inbox + local enforcement state 后才允许恢复对应 scope。
19. security Stream / DLQ 的权限、容量、告警和 replay 与普通业务 Stream 分离；业务流容量压力不能静默淘汰或授权读取安全事实。
20. `auth.execution-token.revoked` 的 type/version/source/security subject 与 Catalog registration 一致；CloudEvents aggregate attributes 保持缺失，平台不得从 Auth selector 补造 envelope aggregate。

## 16. 已知实现差距

- `collaboration-service` 当前 Task、audit 与 local event envelope 是顺序独立写入，不满足同一数据库事务的 transactional outbox 目标；实现前必须重构 transaction boundary，不能只在现有 local publisher 后追加 broker publish。
- MES 已有本地 `PENDING` outbox 记录但没有 relay / inbox / public contract；只能作为迁移样本，不能自动发布内部 `Mold* / ProductionSpec*` 名称。
- Terminal Device -> Auth 当前 Redis Pub/Sub 没有持久化、重试、replay 或 inbox；在其 event contract 冻结前不纳入第一批迁移。
- Asset availability 业务契约已经完成第 8.1 节对齐，但 common code contract、producer、Site consumer 与对应 migration 尚未实现。
- `src/common/src/contracts` 当前按 service 目录保存 gRPC Proto，但尚无任何 `<service>/events.ts` 公共事件代码契约；实现时必须由对应 owner 添加，不能由平台线程猜测 payload。
- 当前仓库由统一 runtime 按 `DEV`/`LOCAL_INTEGRATION`/`CI` profile、manifest 和 lease 编排
  JetStream provider、credential/ACL bootstrap 与运行手册；业务事件契约与 consumer 完成度仍
  由本真相源其余状态项分别约束。
- 当前仓库没有 common DLQ/advisory/replay runner，也没有任何 consumer-owned operations module/job；实现按 `EV-OPS` 组合 lane 推进，不创建中央 Event Operations runtime。
- Auth security event 的 owner semantic contract 与 Event Catalog registration 已完成对齐；当前仓库仍没有 `src/common/src/contracts/auth_service/events.ts`、Auth outbox/relay、`OES_SECURITY_EVENTS` / `OES_SECURITY_EVENT_DLQ` topology、security-critical common profile、consumer freshness gate 或任何 consumer enforcement 实现。

## 17. 真相源与后续写入目标

本主题稳定真相源：

- 本文：平台架构与运行语义。
- [ADR 0013](../../adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md)：provider 与关键取舍。
- [ADR 0014](../../adr/0014-cloudevents-and-service-owned-event-code-contracts.md)：CloudEvents 与按服务归属的 common code contract。
- [platform-transport.md](../../contracts/events/platform-transport.md)：broker-independent envelope 与 NATS mapping 黑盒契约。
- [Event Catalog Contract](../../contracts/events/README.md)：业务公共事件治理。

未来实现前由相应 owner 写入：

- `src/common` 公共 API 变更：通用 CloudEvents / event descriptor / codec / Outbox-Inbox ports，以及 retry / DLQ / advisory / replay runner 先形成实现 plan 与 API review；每个 owner 在自己的 `src/common/src/contracts/<service_snake_case>/events.ts` 维护公共事件代码契约，本文不冻结具体 TypeScript symbol。
- 各 producer / consumer 的 Prisma schema：由服务 owner 在自己的数据库迁移中实现；consumer 同时在自身数据库保存其 subscription 的 DLQ resolution、replay request/result 与操作审计，不建立共享 operations database。
- Asset common code contract、producer、Site consumer 与 migration：业务 contract/catalog 对齐已完成；后续由 Asset、Site 与 common contract owner 按第 8.1 节的平台接入门槛实现。
- Auth security event common code contract、producer、consumer 与 migration：业务语义和 Catalog registration 已完成；后续实现必须分别服从 Auth-owned semantic contract 与第 8.2 节的 Event transport registration。
- Notification、Site、Collaboration 的具体 handler / transaction：由对应服务 owner 实现并按第 15 节验收。
- Runtime provider recipe、NATS advisory 持久监控、生产部署与 secret：由 Deployment / SRE lane
  实现；local/CI provider scope 必须同时服从统一 runtime truth。
- security-critical transport 的 common profile、独立 Stream / DLQ、Auth-only publisher ACL 与 freshness observability：由 Event capability 后续实现与验收；Auth payload/selector 与各 consumer deny semantics 继续以各自 owner 真相源为准。
