# ADR 0014: CloudEvents 与按服务归属的公共事件代码契约

```text
status: ACCEPTED
decisionDate: 2026-07-26
architectureTruthSource: docs/architecture/17-event-bus-and-outbox-architecture.md
transportContract: docs/contracts/events/platform-transport.md
```

## Context

ADR 0013 已决定以 NATS JetStream 承载 OES 第一版公共业务事实，但原平台契约仍使用 OES 自定义 JSON envelope。讨论进一步确认了两个要求：

- 公共事件需要使用 provider-neutral 的标准外层，避免将业务 contract 与 NATS header 或某个 broker 绑定；
- producer 与 consumer 在开发时需要从 `@oes/common` 引用同一份可编译公共事件 contract，并继续遵守仓库现有的 `src/common/src/contracts/<service_snake_case>/` 服务目录归属。

OES 当前是 TypeScript monorepo，第一批只有 Collaboration Task 与 Asset Site Media 两类公共事实。现阶段没有证据要求立即建设独立 Schema Registry、跨语言代码生成或手工维护 AsyncAPI / JSON Schema 的第二套契约体系。

## Decision

### 1. CloudEvents envelope

OES 公共可订阅事件采用 CloudEvents `1.0` Structured JSON：

- JetStream message body 是完整 CloudEvent，media type 为 `application/cloudevents+json`；
- CloudEvents `id`、`source`、`type`、`subject`、`time`、`datacontenttype`、`dataschema` 与 `data` 承载标准属性；
- OES 业务版本、tenant、aggregate、actor、trace、correlation、causation 与 audit reference 使用名称以 `oes` 开头的 CloudEvents extension attributes；
- CloudEvents extension attribute 遵守小写字母和数字命名；应用代码可通过 common codec 使用 camelCase 语义别名；
- `specversion=1.0` 是 CloudEvents 标准版本，`oeseventversion` 是 OES 业务事件版本，两者不得混用；
- Event Catalog 继续拥有 event type、payload、owner、触发条件和兼容性语义，CloudEvents 只提供外层格式。

Structured mode 使 Outbox、JetStream、DLQ 与 Replay 保存同一份不可变 canonical body。NATS headers 只保留 broker deduplication、transport version 与 W3C trace context 所需内容，不复制全部业务 metadata 形成第二份真相。

### 2. 按服务归属的 common code contract

公共事件的开发期 code contract 进入 owner 已有目录：

```text
src/common/src/contracts/<service_snake_case>/events.ts
```

例如：

```text
src/common/src/contracts/collaboration_service/events.ts
src/common/src/contracts/asset_service/events.ts
```

每个 `events.ts` 只允许定义该 owner 的：

- 公共 event type 与 business event version 常量；
- owner service identity；
- 公共 `data` payload 类型；
- `OesCloudEvent<TData>` 组合类型；
- contract descriptor 与通用 validator 所需的结构声明。

对应目录的 `index.ts` 对外导出这些 contract，并汇总到现有 `@oes/common/contracts` 公共入口，使 producer 与 consumer 引用相同定义。若未来增加 service-specific package subpath，必须另做 common API review。common contract 不得包含领域状态机、触发条件实现、handler、Prisma model、NotificationRule 或 consumer 业务逻辑。

通用 CloudEvents type、codec、Outbox/Inbox port 与 NATS adapter 属于 owner-neutral 的 common platform 能力；业务服务只提交 `contract + aggregate identity + data`，平台负责补充标准 envelope、验证 owner / tenant / trace 并编码 canonical body。

### 3. 比例适当的第一版

第一版不引入独立 Schema Registry、手工维护的 JSON Schema 平行目录、AsyncAPI codegen 或新的 `@oes/event-contracts` package。若未来出现跨语言 consumer、外部事件接口、跨仓库分发或显著 schema drift 风险，再通过后续 ADR 从同一冻结 contract 生成 JSON Schema / AsyncAPI，并保持单一业务语义真相。

### 4. Command 与 Event 分层

- 同服务 command 使用 application command handler 或进程内 command bus；
- 跨服务同步 command / query 继续使用 gRPC；
- 服务内 domain/local event 不自动进入公共 Event Bus；
- 公共 Event Bus 只承载已经成立的跨服务事实；
- 跨服务异步 command lane 本期不实现。未来出现订单、库存、支付或 Saga 的真实异步 command 需求时，可评估复用 NATS JetStream，但必须使用独立 stream、subject、ACL、contract 与 delivery semantics，不得混入 `OES_BUSINESS_EVENTS`。

## Alternatives Considered

### 保留 OES 自定义 envelope

拒绝。它可以满足当前 NATS 内部投递，但会让 broker adapter、Webhook、未来 provider 迁移和通用工具都依赖 OES 私有字段映射。

### CloudEvents binary mode

拒绝作为第一版 canonical format。将 CloudEvents attributes 分散到 NATS headers、业务 data 放在 body，会增加 Outbox、DLQ、Replay 与跨协议转发时的重新组装和 header/body 冲突风险。

### 新建 `src/common/src/contracts/events/<service>/`

拒绝。仓库的公共 contract 已按 service owner 目录组织；另建平行 service tree 会削弱归属并增加重复导航。

### 立即引入 Schema Registry、JSON Schema 与 AsyncAPI 全量生成

暂缓。方向合理，但第一批事件数量、语言种类和外部消费者不足以证明其新增工具链与治理成本。第一版保留未来生成能力，但不把它作为 Event Bus 上线前置条件。

## Consequences

正向结果：

- 公共事件拥有标准、provider-neutral、可原样重放的 canonical envelope；
- producer 与 consumer 在 monorepo 中共享同一份编译期 contract，避免分别手写 event type、版本和 payload；
- 业务事件继续按 owner service 归属，不把领域语义移交给 common platform；
- 第一版不承担尚无需求证据的 schema infrastructure 复杂度。

成本与风险：

- 现有文档化自定义 envelope 需要在实现前映射到 CloudEvents；
- `src/common` 的公共事件 contract 变更属于受保护跨服务 API，必须先冻结 owner contract 和兼容性，再更新代码；
- TypeScript shared contract 适合当前 monorepo，但不能成为要求服务锁步部署的理由；不兼容变更仍必须新增业务版本并保留迁移窗口；
- 当出现跨语言或外部消费者时，需要补充机器可读 schema 生成与 compatibility CI。

## Related Documents

- [Event Bus 与 Outbox / Inbox 架构](/Users/acehood/Documents/GitHub/oes/docs/architecture/17-event-bus-and-outbox-architecture.md)
- [Platform Transport Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/platform-transport.md)
- [Event Catalog Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/README.md)
- [ADR 0013](/Users/acehood/Documents/GitHub/oes/docs/adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md)

## External References

- [CloudEvents Specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)
- [CloudEvents JSON Event Format](https://github.com/cloudevents/spec/blob/main/cloudevents/formats/json-format.md)
