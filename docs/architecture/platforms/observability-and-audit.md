# OES 可观测性与审计架构设计

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](../services/permission-service.md) 为准；本文只描述可观测性与审计架构。

## 1. 文档目的

本文档用于冻结 OES 在指标、日志、追踪、审计四类信号上的职责边界、推荐选型、治理规则与分阶段落地路径。

本文档回答的问题包括：

- `metrics / logging / tracing / audit` 四者分别解决什么问题
- `OpenTelemetry`、`Grafana`、`Tempo`、`Loki`、`Prometheus / Mimir`、`OpenSearch / Elastic` 各自承担什么职责
- 为什么日志、追踪、审计不能混用
- OES 当前阶段应如何落地，后续如何平台化演进

## 1.1 当前落地状态

截至当前，OES 在 audit 方向上已经有第一批真实实现：

- `identity-service`
  - 已落地服务内 `audit event`
  - 已落地统一 `audit envelope`
  - 已覆盖 `SUCCEEDED / REJECTED / FAILED`
  - 已将审计真相写入本服务 `PostgreSQL`
- `auth-service`
  - 已落地统一 `audit envelope`
  - 已落地 `AuditService -> local event -> listener -> PostgreSQL`
  - 已保留结构化 audit log 输出
  - 已开始在运行态使用 `REJECTED` 审计结果语义记录登录拒绝事件
  - 已补齐 `ListAuditEvents`，当前完整度已对齐 `identity-service` 管理审计基线
- `permission-service`
  - 已落地第二个 `audit query` 样板
  - 当前样板先只覆盖管理审计事件 `AuditEvent`
  - 已通过统一 envelope 读模型暴露 `ListAuditEvents`
  - 管理审计已对齐到 `local event + listener + envelope-first truth source`
  - `DecisionEvent` 明确后置，不作为当前阶段实现重点

排除已明确后置的 `DecisionEvent` 后，当前已开发系统服务的管理审计基线已经完成对齐：

- `identity-service`
- `auth-service`
- `permission-service`
- `common`
  - 已提供共享 `audit envelope` 类型
  - 已提供共享 envelope 构建器
  - 已提供共享持久化展平 helper
- `tracing`
  - 本地 `OTel Collector + Tempo + Grafana` 已跑通
  - smoke trace 已确认可被 `Tempo` 查询 API 读回
  - gRPC 内部调用已补 `traceparent / tracestate` 标准 metadata 传播基线
- `logging`
  - `common/logging` 已落最小字段 taxonomy
  - 已落统一敏感字段脱敏 / 禁止落盘基线
  - 已落 gRPC access log interceptor 样板
  - `api-gateway` 已落 HTTP access log 样板
  - 系统服务已显式配置 service-scoped logging identity
  - 本地 `OTel Collector + Loki + Grafana` 已跑通
  - smoke log 已确认可被 `Loki` 查询 API 读回
- `本地事件 trace`
  - `auth-service` 审计事件已携带 `traceId / spanId`
  - `identity-service` 审计事件已统一复用共享 trace helper

当前仍未完成的平台化部分：

- 统一 `audit-service`
- 审计事件汇聚总线 / outbox
- 平台级 audit query
- `OpenSearch / Elastic` 审计副本检索
- metrics 基线实现
- access log / gRPC access log 向更多服务推广
- 事件总线级 trace propagation
- `permission-service` 的第二个 audit query 样板

说明：

- OES 当前仍处于项目框架搭建阶段
- 当前 logging 目标是“生产可演进的最小可用基线”
- 当前不以“完整生产级 logging 治理”作为本阶段交付目标
- `metrics` 当前仍处于设计冻结阶段
- 当前项目明确暂不实现 `metrics`
- 后续若实现，应优先采用统一拦截器与事件监听模式，而不是把指标埋点散落在各个 controller 中

### 1.2 当前阶段进度总结

截至当前，observability / audit 方向的进度可概括为：

- 已完成到“本地可运行、可查询”的基线：
  - `SLICE-02 tracing`
  - `SLICE-03 logging`
- 已完成到“服务内样板 + 可查询”的基线：
  - `SLICE-04 audit sample`
  - `SLICE-05 audit envelope`
  - `SLICE-06 audit persistence sample`
  - `SLICE-07 audit query sample`
- 已新增第二个样板：
  - `permission-service` 的 `AuditEvent` query 样板已完成
- 已新增第三个样板：
  - `auth-service` 的 `AuditEvent` query 样板已完成
- 已明确后置：
  - `SLICE-01 metrics`
  - 平台级 `audit-service`
  - 生产级 logging retention / dashboard / alerting
  - `OpenSearch / Elastic` 审计副本检索
  - 共享 `audit query` model 抽取
- 已形成三个单服务样板：
  - `identity-service`
  - `permission-service`
  - `auth-service`
  - 当前都只覆盖管理审计事件 `AuditEvent`

当前阶段的判断是：

- tracing：方向与本地查询链已收稳
- tracing：gRPC 标准 trace metadata 基线已落地
- logging：方向与本地查询链已收稳
- audit：`identity-service` 已形成第一套完整样板
- audit：`permission-service` 已形成第二个 query 样板
- metrics：只冻结设计，不进入实现

当前阶段的执行优先级也已经明确：

- observability / audit 以“框架期最小可用基线”收口为目标
- `DecisionEvent` 查询后置
- 事件总线级 trace propagation 后置
- 平台接下来应优先转向业务服务开发，例如 `ERP / MES / WMS`

## 2. 设计结论

OES 不应把“指标”“日志”“追踪”“审计”混成一套系统能力，而应按四层设计：

- `Metrics`
  - 使用 `OpenTelemetry Metrics + OTel Collector + Prometheus / Mimir + Grafana`
- `Tracing`
  - 使用 `OpenTelemetry Traces + OTel Collector + Tempo + Grafana`
- `Logging`
  - 使用结构化 JSON 日志 + `OTel Collector / Alloy + Loki + Grafana`
- `Audit`
  - 各服务自己定义本域 audit event
  - 平台统一 audit envelope
  - 审计真相源落 `PostgreSQL`

OES 当前推荐以 `Grafana Stack` 作为 observability 主栈：

- `Grafana`
- `Tempo`
- `Loki`
- `Prometheus / Mimir`
- `OpenTelemetry + OTel Collector`

同时明确：

- `OpenTelemetry` 负责采集、传播与标准化，不承担审计真相存储职责
- `OpenSearch / Elastic` 主要适合日志与检索增强
- `OpenSearch / Elastic` 可以承接审计副本检索与后续安全分析
- `OpenSearch / Elastic` 不应作为 OES 唯一的审计真相源

## 3. 四类信号的职责边界

### 3.1 Metrics

指标回答的问题是：

- 服务当前是否健康
- 错误率、延迟、吞吐是否异常
- 是否触发 SLO / SLA / 告警阈值
- 容量趋势如何

指标关注：

- rate
- error ratio
- latency histogram
- saturation
- 业务量趋势

指标最适合承载：

- 健康状态
- 告警规则
- 趋势分析
- 容量规划

指标不负责：

- 还原单次请求详细过程
- 替代日志和审计事实

### 3.2 Tracing

追踪回答的问题是：

- 一次请求经过了哪些服务
- 哪一步最慢
- 哪一步失败
- 整条调用链的 `traceId` 是什么

追踪关注：

- span
- duration
- 调用链关系
- 跨服务传播

追踪不负责：

- 长期业务审计归档
- 业务动作责任归属真相

### 3.3 Logging

日志回答的问题是：

- 运行时发生了什么
- 某个 handler / adaptor / repository 做了什么
- 报错时的上下文和异常是什么

日志关注：

- 运行细节
- 异常上下文
- 调试与排障
- 结构化运维检索

日志不负责：

- 提供稳定的业务审计真相
- 替代跨服务链路追踪

### 3.4 Audit

审计回答的问题是：

- 谁
- 在什么时候
- 对什么对象
- 做了什么动作
- 结果如何

审计关注：

- 业务动作
- 安全与合规
- 责任归属
- 可追责、可回放、可归档

审计不应退化为：

- 一条普通 `info` 日志
- 一段 trace span 注释
- 从日志里临时拼出来的“近似事实”

## 4. 推荐技术选型

### 4.1 Metrics 选型

推荐组合：

- `OpenTelemetry Metrics`
- `OTel Collector`
- `Prometheus` 或 `Mimir`
- `Grafana`

职责：

- 服务输出统一 metrics
- `OTel Collector` 统一汇聚与转发
- `Prometheus / Mimir` 负责指标存储与查询
- `Grafana` 提供面板、告警与 SLO 可视化

原因：

- 指标是 observability 的一等信号，不能继续缺位
- 最适合承载可用性、性能和容量告警
- 与 `Tempo / Loki / Grafana` 组合天然统一

当前实现策略：

- 当前先冻结设计，不落代码
- 后续实现时：
  - transport 层 metrics 优先放在统一 interceptor
  - business metrics 优先放在 application event / listener
  - 不建议把 metrics 调用散落在 controller / handler 主流程中

### 4.2 Tracing 选型

推荐组合：

- `OpenTelemetry SDK`
- `OTel Collector`
- `Tempo`
- `Grafana`

职责：

- 各服务使用 `OpenTelemetry` 统一采集 traces
- 通过 `OTel Collector` 汇聚与转发
- 使用 `Tempo` 作为 tracing backend
- 使用 `Grafana` 进行 trace 查询和关联分析

原因：

- 与当前 `src/common/tracing` 已有方向一致
- 适合多服务内部调用链观测
- 比一开始就上更重的 APM 体系更适合当前阶段

### 4.3 Logging 选型

推荐组合：

- 服务输出结构化 JSON 日志
- `OTel Collector` 或 `Grafana Alloy`
- `Loki`
- `Grafana`

职责：

- 各服务输出统一结构化日志
- 采集层负责汇聚与转发
- `Loki` 负责日志存储和检索
- `Grafana` 负责统一查询、面板和关联查看

原因：

- 成本和复杂度更适合平台基础阶段
- 与 trace 查看入口可统一到 `Grafana`
- 便于和 `Tempo` 联动

当前阶段策略：

- 当前阶段只要求：
  - 正确的结构化日志模型
  - 正确的脱敏与禁止落盘规则
  - 正确的 HTTP / gRPC access log 基线
  - 正确的本地写入与查询链
- 当前阶段不要求一次性落完：
  - retention
  - dashboard 体系
  - alerting
  - 多环境日志治理

换句话说，当前阶段目标是“方向正确且可演进”，不是“生产运营能力一次到位”。

### 4.4 Audit 选型

推荐组合：

- 各服务内部定义本域 `audit event`
- 统一 audit envelope
- `PostgreSQL` 作为审计真相源
- 后续可选：
  - `OpenSearch / Elastic` 作为检索副本
  - `Elastic Security` 或 `Wazuh` 作为安全分析层

原因：

- 审计必须有稳定 schema
- 审计需要正式记录和长期归档
- 关系库更适合作为 system of record
- 搜索平台适合检索和运营，不适合作为唯一真相源

## 5. 统一治理要求

### 5.1 统一关联键

四类信号应尽可能共享如下关联键：

- `traceId`
- `requestId`
- `service`
- `module`
- `tenantId`
- `orgId`
- `operatorId`
- `resourceType`
- `resourceId`

这组关联键用于实现：

- 从指标跳到 trace
- 从 trace 找到日志
- 从审计记录追到链路和运行日志

### 5.2 Logging 字段规范

推荐冻结如下最小字段 taxonomy：

- 基础字段
  - `timestamp`
  - `level`
  - `service`
  - `module`
  - `operation`
  - `message`
- 关联字段
  - `traceId`
  - `spanId`
  - `requestId`
- 业务字段
  - `tenantId`
  - `orgId`
  - `operatorId`
  - `resourceType`
  - `resourceId`
- 错误字段
  - `error.kind`
  - `error.code`
  - `error.message`
  - `error.stack`

当前已落代码基线：

- `LogMeta` 已显式支持：
  - `requestId`
  - `traceId`
  - `spanId`
  - `tenantId`
  - `orgId`
  - `operatorId`
  - `resourceType`
  - `resourceId`
- redaction 规则：
  - 直接禁止落盘：
    - `password`
    - `token`
    - `secret`
    - `api key`
    - `cookie / session`
  - 默认脱敏：
    - `email`
    - `phone`
- transport logging 基线：
  - gRPC 统一走 `GrpcAccessLogInterceptor`
  - HTTP 统一走 request logger middleware

### 5.2.1 Logging 当前阶段与生产阶段分层

OES 当前处于框架搭建期，logging 应分两层推进：

- 当前阶段必须完成：
  - 统一字段 taxonomy
  - 统一 redaction / 禁止落盘规则
  - 统一入口 access log 基线
  - 本地 `Collector -> Loki -> Grafana` 查询链
- 生产阶段后置：
  - retention 策略
  - dashboard 标准化与版本化
  - alerting
  - 多环境日志运营治理

这意味着当前 logging 的完成标准是“最小可用且方向正确”，而不是“生产治理完整”。

### 5.2.2 Logging 生产级治理清单

当项目进入稳定运行阶段后，推荐按以下顺序升级到生产级 logging：

1. retention
   - 明确 access log、application error log、security log 的保留时长
   - 明确冷热分层、归档和清理策略
2. dashboard
   - 为 `api-gateway`、system services、error logs、安全日志建立标准 Grafana dashboard
   - 将 dashboard 配置纳入仓库而不是只保留在页面点击结果里
3. alerting
   - 建立高价值告警：
     - 5xx 激增
     - error log 激增
     - gRPC failed / rejected 异常上升
     - 安全相关失败事件异常上升
4. 统一推广
   - 将 access log / gRPC access log 基线推广到更多入口服务
   - 保持字段 taxonomy 和查询方式一致

### 5.3 Tracing 规范

应统一以下规则：

- 传播规则
  - HTTP
  - gRPC
  - 异步任务
  - 事件总线
- span 命名规范
  - 例如 `grpc.identity.query.getUserById`
  - 例如 `grpc.identity.management.rotateApiKey`
  - 例如 `repository.userAccount.findById`
- 采样策略
  - `dev` 全采样
  - `staging` 高采样
  - `prod` 比例采样，并对错误与慢请求强制保留
- trace attribute 白名单
  - 允许：`tenant.id`、`org.id`、`resource.type`、`resource.id`
  - 禁止：token、secret、password、API Key 明文、敏感 PII 明文

### 5.4 Metrics 落地原则

后续实现 metrics 时，推荐遵守以下分层：

- transport metrics
  - 例如请求数、耗时、状态码 / 结果态
  - 应优先由统一 interceptor 采集
- business metrics
  - 例如 `APIKey` 创建次数、机器认证失败次数、组织变更次数
  - 应优先由 application service 或 event listener 采集

不建议：

- 在每个 controller / handler 中手工包一层 metrics 记录
- 让埋点代码打断主业务代码阅读路径

### 5.5 Logging 数据治理

日志必须建立明确红线：

- 禁止落盘：
  - password
  - token
  - secret
  - API Key 明文
  - cookie / session 明文
- 必须脱敏：
  - phone
  - email
  - 身份证号等敏感标识
- 大对象日志：
  - 必须走白名单序列化
  - 不允许直接 dump 整个 request / response / entity

### 5.6 Audit 数据治理

审计应单独定义：

- 查询权限模型
  - 资源级
  - 租户级
  - 平台级
- 生命周期策略
  - 在线保留时长
  - 归档时长
  - 删除与导出规则
- 不可变性要求
  - audit 真相记录不应被业务更新覆盖

## 6. ELK / OpenSearch 在 OES 中的位置

`ELK / OpenSearch` 在 OES 中的推荐定位是：

- 主责：
  - 日志检索与聚合
- 可选承接：
  - 审计副本检索
  - 运维与安全查询

不建议：

- 直接把 `ELK` 当成完整审计系统
- 不建立审计模型，只依赖日志查询来追责

结论：

- `OpenSearch / Elastic` 可以很好地“看”审计数据
- 但不应该单独承担“定义和保存审计真相”的职责

## 7. 审计模型原则

### 7.1 审计语义由各服务自己负责

各服务最清楚本域动作语义，因此应由各服务自己定义本域 audit event。

例如：

- `auth-service`
  - `LOGIN_FAILED`
  - `ADMIN_SESSION_REVOKED`
- `identity-service`
  - `ACCOUNT_PRIMARY_ORG_CHANGED`
  - `API_KEY_ROTATED`
- `permission-service`
  - `ROLE_PERMISSION_ASSIGNED`

不建议：

- 建一个中心服务去猜每个业务动作的含义

### 7.2 平台统一的是 audit envelope

平台应统一外层结构，而不是统一所有业务事件名称。

推荐最小字段：

- `eventId`
- `service`
- `module`
- `eventType`
- `occurredAt`
- `operatorId`
- `tenantId`
- `orgId`
- `traceId`
- `resourceType`
- `resourceId`
- `result`
- `details`

### 7.3 推荐 envelope 结构

推荐统一为如下逻辑结构：

```json
{
  "eventId": "uuid",
  "service": "identity-service",
  "module": "org",
  "eventType": "ACCOUNT_PRIMARY_ORG_CHANGED",
  "occurredAt": "2026-03-31T00:00:00.000Z",
  "result": "SUCCEEDED",
  "operator": {
    "operatorId": "uuid",
    "operatorType": "HUMAN"
  },
  "scope": {
    "tenantId": "tenant-id",
    "orgId": "org-id"
  },
  "trace": {
    "traceId": "trace-id"
  },
  "resource": {
    "resourceType": "account_contact_asset",
    "resourceId": "contact-asset-id"
  },
  "details": {
    "accountId": "account-id",
    "assetType": "WORK_EMAIL"
  }
}
```

说明：

- `eventId`
  - 审计事件唯一标识
- `service / module / eventType`
  - 审计语义入口
- `result`
  - 当前统一使用：
    - `SUCCEEDED`
    - `REJECTED`
    - `FAILED`
- `operator`
  - 记录责任主体
- `scope`
  - 记录租户 / 组织上下文
- `trace`
  - 记录链路上下文
- `resource`
  - 记录核心被操作对象
- `details`
  - 记录本域动作细节

### 7.4 envelope 约束

统一要求：

- `details` 允许按服务扩展
- 外层 envelope 字段必须稳定
- `details` 中不得复制完整大对象快照
- 审计记录应优先保存“责任和事实”，而不是冗余调试数据
- 错误堆栈应属于日志，不应直接进入标准 audit envelope

### 7.5 各服务的最小落地模式

推荐采用如下最小模式：

- 应用层定义 `AuditEvent`
- 应用服务负责发出内部 audit event
- listener 统一记录结构化审计日志
- listener 或审计仓储负责写入 `PostgreSQL`

### 7.5.1 服务内 Audit 最低完成标准

对于已经进入正式建设的系统服务，服务内 audit 至少应满足：

1. 本域事件
   - 服务内必须定义本域 audit event
   - 不应在 controller / handler 中长期散落拼接审计事实
2. 统一 envelope
   - 服务内 audit event 必须兼容统一 `audit envelope`
   - 至少具备：
     - `eventId`
     - `service`
     - `module`
     - `eventType`
     - `occurredAt`
     - `result`
     - `operator`
     - `scope`
     - `trace`
     - `resource`
     - `details`
3. Trace 关联
   - 服务内 audit event 必须保留 `traceId`
   - 本地事件建议同时保留 `spanId`
4. 统一发出链路
   - 服务内应采用 `AuditService -> local event -> listener`
   - 不应长期停留在“业务服务直接写 repository”的临时实现
5. 结构化日志
   - listener 必须输出结构化 audit log
6. 持久化
   - 已进入正式建设的系统服务，audit 应落本服务 `PostgreSQL` 真相源
7. 查询能力
   - query 不属于最低完成标准
   - query 可按阶段逐步补齐

当前对齐判断：

- `identity-service`
  - 已达到并超过最低完成标准
- `auth-service`
  - 已完成对齐
- `permission-service`
  - 管理审计已完成对齐
  - `DecisionEvent` 持久化仍保留旧实现
  - `DecisionEvent` 查询继续后置

在此基础上再逐步演进：

- 接 outbox
- 接事件总线
- 接统一 audit-service

### 7.6 当前已实现的最小共用模式

当前仓库内已经落地的共用模式包括：

- `common/audit`
  - `AuditEnvelope`
  - `buildAuditEnvelope(...)`
  - `flattenAuditEnvelope(...)`
- 服务内样板
  - `IdentityAuditEvent`
  - `IdentityAuditService`
  - `IdentityAuditListener`
  - Prisma 持久化仓储

这意味着当前 OES 的 audit 已经从“只有设计建议”推进成“共享类型 + 服务内样板 + 持久化样板”三层结构。

## 8. Audit Query 设计

### 8.1 目标

`audit query` 的目标不是让每个服务随意查各自的审计表，而是先冻结统一查询模型，再逐步演进到平台级查询能力。

当前推进状态：

- 项目级 `audit query` 设计已冻结
- `identity-service` 已完成单服务样板查询
- 公共 query model 明确暂不立即抽取
- 等第二个服务也完成 audit query 样板后，再根据两个样板提炼共享模型

目标形态分三层：

1. 服务内审计写入
   - 各服务继续负责本域 audit event 语义
   - 各服务继续写入统一 envelope
   - 各服务可暂时保有本地 `PostgreSQL` 审计真相
2. 平台级查询模型
   - 统一 filter
   - 统一 response
   - 统一权限模型
3. 平台级审计汇聚与查询
   - 通过 outbox / event bus 汇聚
   - 中央 audit store
   - 统一 audit query API

### 8.2 最小查询维度

项目级最小过滤维度建议统一为：

- `service`
- `module`
- `eventType`
- `result`
- `operatorId`
- `tenantId`
- `orgId`
- `resourceType`
- `resourceId`
- `occurredAtFrom`
- `occurredAtTo`

第二阶段可选扩展：

- `traceId`
- `keyword`
- 有限的 `details` 内部字段查询

### 8.3 统一返回模型

`audit query` 返回结构应与统一 envelope 保持兼容，不建议各服务再定义自己的读模型。

推荐最小返回结构：

- `items`
- `nextCursor`

每个 `item` 应保持 envelope 结构：

- `eventId`
- `service`
- `module`
- `eventType`
- `occurredAt`
- `result`
- `operator`
- `scope`
- `trace`
- `resource`
- `details`

说明：

- 优先使用 cursor pagination
- 避免在平台级查询中默认返回 `total`
- `details` 继续按服务扩展，但 envelope 外层结构不变

### 8.4 查询权限模型

`audit query` 本身属于敏感能力，必须单独设计授权模型。

推荐最小三层：

1. 资源级
   - 只能查看与自身资源直接相关的审计记录
2. 租户级
   - 租户管理员可查看本租户审计
3. 平台级
   - 平台安全 / 审计角色可查看跨租户审计

后续可扩展：

- 只读安全审计员
- 平台运营支持角色

对于系统服务内部已经存在的 management 授权体系，推荐继续复用同一条授权链，而不是为 audit query 平行创建第二套 guard。

当前已冻结的样板策略：

- `identity-service`
  - 继续沿用自身 query scope / management permission 语义
- `auth-service`
  - 已完成 `ListAuditEvents` 单服务查询样板
  - 使用专用管理权限码 `auth.audit.list`
- `permission-service`
  - 第二个 `audit query` 样板复用 `ManagementAuthorizationGuard`
  - 新增专用权限码 `permission.audit.list`
  - 第一阶段仅开放管理审计事件 `AuditEvent`
  - 管理审计真相源已对齐到 envelope-first 模式
  - `DecisionEvent` 查询后置，避免在第二个样板里一次性混入授权判定审计语义

后续阶段再进入 `DecisionEvent` 的前提是：

- 平台基础设施基线已稳定
- 核心业务服务已开始推进
- 团队对授权判定审计的实际使用场景已经形成证据

### 8.5 单服务查询与平台查询的关系

推荐明确如下原则：

- 单服务本地查询是过渡能力
- 平台级全局查询是目标能力
- 两者必须共享相同的 filter 语义和 envelope 返回模型

这样后续从 `identity-service` 本地查询迁移到平台级 query 时，不需要重写调用方的心智模型。

### 8.6 推荐查询入口

初始阶段不建议拆出很多专用查询接口，建议先统一为一个最小入口：

- `ListAuditEvents`

最小请求应支持：

- `service`
- `module`
- `eventType`
- `result`
- `tenantId`
- `resourceType`
- `resourceId`
- `occurredAtFrom`
- `occurredAtTo`
- `pageSize`
- `cursor`

### 8.7 索引建议

如果 `audit_event` 作为统一读写模型，推荐最少建立：

- `(occurred_at desc)`
- `(tenant_id, occurred_at desc)`
- `(resource_type, resource_id, occurred_at desc)`
- `(operator_id, occurred_at desc)`
- `(service, module, event_type, occurred_at desc)`
- `(result, occurred_at desc)`

原则：

- 高频筛选字段单列
- 低频扩展字段留在 `details JSONB`

### 8.8 实施策略

推荐顺序：

1. 先冻结项目级 `audit query` 设计
2. 再在 `identity-service` 做单服务样板查询
3. 再选择第二个服务落地 audit query 样板
4. 基于两个样板再抽公共 query model
5. 最后再平台化成中央 `audit-service`

## 9. 审计真相源设计

### 9.1 当前阶段

当前阶段允许先在服务内落最小样板：

- 服务自己定义审计语义
- 服务内写入本地 `PostgreSQL`
- 服务内输出结构化审计日志

当前不要求：

- 立刻建设统一 `audit-service`
- 立刻接入重型 SIEM

### 9.2 中长期目标

中长期应演进到：

- 服务内发本域 audit event
- 通过 outbox / event bus 汇聚
- 写入平台级 audit store
- 将关键 audit event 同步到检索 / 安全分析系统
- 对外提供统一 audit query 能力

## 10. 目标平台拓扑

推荐目标拓扑如下：

1. `Metrics`
   - Service -> `OTel SDK` -> `OTel Collector` -> `Prometheus / Mimir` -> `Grafana`
2. `Tracing`
   - Service -> `OTel SDK` -> `OTel Collector` -> `Tempo` -> `Grafana`
3. `Logging`
   - Service stdout JSON -> `OTel Collector / Alloy` -> `Loki` -> `Grafana`
4. `Audit`
   - Service domain audit event -> local persistence / outbox -> `PostgreSQL`
   - 后续可选 -> `OpenSearch / Elastic`

本地与 CI 的 topology breadth 由
[Local Development And Test Runtime](./local-development-and-test-runtime.md) 编排：`DEV` 运行共享完整
OTel/Tempo/Loki/Grafana，Unit/Component 使用 in-memory sink，普通 Integration 不启动完整栈，
trace-specific test 使用 temporary Collector，`FULL` 验证完整 observability stack。该运行配方不
改变本文件对 signal、trace、logging 与 audit truth 的定义。

## 11. 实施建议

### 11.1 当前阶段优先级

1. 先让服务内 audit 样板真正落地
2. 建立统一 envelope
3. 将 `Metrics` 保持在设计冻结状态，暂不进入代码实现
4. 前置推进 tracing 基线统一
5. 明确 logging 规范与治理红线
6. 冻结项目级 `audit query` 模型
7. 再考虑平台级汇聚

### 11.2 不建议的做法

- 把日志平台当成唯一审计真相源
- 把 tracing span 当成正式业务审计记录
- 在业务审计模型尚未冻结前就直接建设重型 SIEM
- 把所有审计语义都抽走到中心服务定义
- 在没有脱敏与字段规范前随意扩大日志采集范围
- 缺少 metrics 仍试图只靠日志与 trace 做 SLO / 告警
- 在各服务中各自发明不同的 audit query filter / response 结构
- 在只有一个服务样板时过早下沉共享 query model

原因：

- 单一服务样板中的“共性”常常混有服务特定偏好
- 过早抽象容易把局部实现误冻结成平台标准
- 至少有两个服务样板之后，再抽共享模型，更符合大型项目中“先有两个样板，再归纳共性”的稳健做法
