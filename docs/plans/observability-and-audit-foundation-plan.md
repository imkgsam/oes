# OES 可观测性与审计基础实施计划

## 1. 目标

将 [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md) 中确认的方案拆成可执行实施路径。

本计划覆盖：

- metrics
- tracing
- logging
- audit

当前执行前提：

- OES 当前仍处于框架搭建期
- observability 当前优先建设“正确方向的最小可用基线”
- production-grade logging / tracing / audit 运营治理能力统一后置

## 1.1 当前进度总览

- 已完成本地闭环：
  - `SLICE-02 Trace 基线统一`
  - `SLICE-03 结构化日志统一`
- 已完成服务内样板：
  - `SLICE-04 服务内审计样板`
  - `SLICE-05 统一 audit envelope`
  - `SLICE-06 审计真相源落库` 的 `identity-service` 样板
  - `SLICE-07 平台级 audit query` 的 `identity-service` 单服务样板
- 已完成第二个 audit query 样板：
  - `permission-service` 的 `AuditEvent` 查询样板
- 已明确后置：
  - `SLICE-01 Metrics 基线统一`
  - 平台级 `audit-service`
  - 生产级 logging retention / dashboard / alerting
  - 共享 `audit query` model 抽取
- 已完成的样板决策：
  - 第二个 `audit query` 样板服务已选择并落地在 `permission-service`
  - 当前只覆盖 `AuditEvent`
  - 通过 management 权限码 `permission.audit.list` 控制访问
- 已明确阶段取舍：
  - `DecisionEvent` 查询后置
  - 当前 observability / audit 以框架期基线收口为目标
  - 后续优先转向业务服务开发，例如 `ERP / MES / WMS`
  - 事件总线级 trace propagation 后置，当前先落本地事件 trace context 基线
  - 系统服务 audit 将优先对齐到统一最低完成标准，再考虑平台化迁移

## 2. 当前推荐选型

### 2.1 Metrics

- `OpenTelemetry Metrics`
- `OTel Collector`
- `Prometheus` 或 `Mimir`
- `Grafana`

### 2.2 Tracing

- `OpenTelemetry Traces`
- `OTel Collector`
- `Tempo`
- `Grafana`

### 2.3 Logging

- Structured JSON Logs
- `OTel Collector` 或 `Grafana Alloy`
- `Loki`
- `Grafana`

### 2.4 Audit

- 各服务本域 `audit event`
- 平台统一 `audit envelope`
- `PostgreSQL` 作为审计真相源
- 后续可选：
  - `OpenSearch / Elastic`
  - `Elastic Security / Wazuh`

## 3. 实施分片

### SLICE-01 Metrics 基线统一

- 在 `common` 中补齐 metrics 初始化与导出基线
- 冻结服务级指标命名与 labels 规范
- 接入 `OTel Collector`
- 完成 `Prometheus / Mimir + Grafana` 查询与告警链
- 推荐实现方式：
  - transport metrics 走统一 interceptor
  - business metrics 走 event listener / application service
- 不建议在 controller 中分散埋点

状态：

- 已完成设计冻结
- 当前明确后置，不进入本阶段代码实现

### SLICE-02 Trace 基线统一

- 统一 `common/tracing`
- 明确 `traceId` 传播要求
- 冻结 span 命名规范
- 冻结采样策略
- 接入 `OTel Collector`
- 完成 `Tempo + Grafana` 查询链

状态：

- 已前置执行
- 已完成：
  - `common/tracing` 共享基座收敛
  - 采样策略基线
  - trace attribute 白名单 helper
  - `identity-service` L1 回归测试
  - `OTel Collector` 接入验证
  - `Tempo + Grafana` 查询链
  - gRPC `traceparent / tracestate` 标准 metadata 传播基线
- 仍未完成：
  - 事件总线级 trace propagation
  - HTTP / gRPC / 事件总线统一传播规范的最终联调
  - 更多服务入口上的运行时 smoke 验证

补充进度：

- 已完成：
  - gRPC `traceparent / tracestate` 标准 metadata 传播基线
  - `auth-service -> identity-service` 真实跨服务 trace smoke 验证
  - 本地事件 trace context 基线
    - `auth-service` 审计事件已携带 `traceId / spanId`
    - `identity-service` 审计事件已统一改用共享 trace helper

### SLICE-03 结构化日志统一

- 冻结 JSON 日志字段 taxonomy
- 接入 `Loki`
- 在 `Grafana` 中建立服务级日志视图
- 落地敏感字段脱敏与禁止落盘规则
- 增加 access log / gRPC access log 基线

状态：

- 已完成本地闭环验证
- 已完成：
  - `common/logging` 最小字段 taxonomy 落地
  - 敏感字段脱敏与禁止落盘基线落地
  - gRPC access log interceptor 落地
  - `api-gateway` HTTP access log 样板落地
  - `common build` / `api-gateway build` / 相关单测验证通过
  - 本地 `OTel Collector + Loki + Grafana` 基础设施
  - smoke log 写入与 `Loki` 查询验证
- 仍未完成：
  - HTTP access log 样板向更多 HTTP 入口推广

补充进度：

- 已完成：
  - 系统服务显式 `serviceName` logging 配置推广
  - gRPC access log 不再依赖 `unknown-service` 的隐式服务名

说明：

- 当前 `SLICE-03` 已满足框架阶段目标：
  - 结构化
  - 可脱敏
  - 可查询
  - 可继续推广
- 当前不要求一并完成生产级 logging 治理

生产级 logging 后置清单：

1. retention
   - access log / error log / security log 保留策略
   - 冷热分层与清理策略
2. dashboard
   - 标准 Grafana dashboard
   - dashboard 配置版本化
3. alerting
   - 高价值错误与安全告警
4. 多入口推广
   - 将 access log 基线推广到更多 HTTP / gRPC 入口

### SLICE-04 服务内审计样板

- 先在系统服务中落最小样板
- 推荐起点：
  - `auth-service`
  - `identity-service`
- 最小模式：
  - `AuditEvent`
  - `AuditService`
  - `AuditListener`
  - 结构化审计日志

状态：

- `auth-service`
  - 已有旧样板
  - 已对齐到统一最低完成标准
  - 已补齐统一 envelope、listener 与 PostgreSQL 持久化
  - 已对齐三态结果语义的实际使用，登录拒绝类事件开始记录为 `REJECTED`
- `identity-service`
  - 已完成样板并扩展到持久化
- `permission-service`
  - 已具备本地持久化与 query 样板
  - 管理审计已对齐到统一 envelope + local event + listener + envelope-first 真相源
  - `DecisionEvent` 持久化仍保留旧实现

当前结论：

- 排除已明确后置的 `DecisionEvent` 后
- `identity-service / auth-service / permission-service` 的管理审计已完成统一标准对齐

### SLICE-05 统一 audit envelope

- 冻结统一 envelope 字段
- 冻结审计结果语义
- 冻结审计查询的最小索引维度

当前冻结结论：

- 外层字段统一为：
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
- `result` 当前统一三值：
  - `SUCCEEDED`
  - `REJECTED`
  - `FAILED`
- `details` 可按服务扩展
- 外层 envelope 禁止各服务自行改名

状态：

- 已完成设计冻结
- 已在 `identity-service` 代码中按统一 envelope 落地
- 已在 `common` 中抽出共享 envelope 类型与 helper

### SLICE-06 审计真相源落库

- 建立 `audit-service` 或统一审计持久化模块
- 写入 `PostgreSQL`
- 明确保留策略、归档策略、查询边界

推荐表结构方向：

- 一张统一 `audit_event` 表承接 envelope 公共字段
- `details` 可先采用 `JSONB`
- 高频筛选字段单独列出：
  - `service`
  - `module`
  - `event_type`
  - `result`
  - `operator_id`
  - `tenant_id`
  - `org_id`
  - `resource_type`
  - `resource_id`
  - `trace_id`
  - `occurred_at`

状态：

- `identity-service`
  - 已完成最小落库样板
  - 已落 `AuditEvent` 表
  - 已完成 Prisma 仓储与 L2 验证
- 平台级统一 `audit-service`
  - 未开始

### SLICE-07 平台级 audit query

- 冻结 audit query 最小过滤维度
- 冻结最小返回模型
- 冻结查询权限模型
- 设计单服务查询与未来平台汇聚查询的兼容路径
- 推荐分阶段：
  - `Phase 1`
    - 项目级设计冻结
  - `Phase 2`
    - 在 `identity-service` 落单服务样板查询
  - `Phase 3`
    - 在 `permission-service` 完成第二个样板后，再抽公共 query model
  - `Phase 4`
    - 平台级 `audit-service` / 中央 query

当前冻结结论：

- 最小过滤维度：
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
- 最小返回结构：
  - `items`
  - `nextCursor`
  - item 结构保持 audit envelope
- 权限模型：
  - 资源级
  - 租户级
  - 平台级
- 第一版推荐统一入口：
  - `ListAuditEvents`

状态：

- 已完成项目级设计冻结
- `identity-service`
  - 已完成单服务样板查询
  - 已完成 `ListAuditEvents`
  - 已完成 L1 / L2 验证
- `permission-service`
  - 已完成第二个样板查询
  - 已完成 `ListAuditEvents`
  - 当前只覆盖管理审计事件 `AuditEvent`
  - 管理审计存储已对齐到 envelope-first 真相源
  - 已完成 build / L2 / L3 验证
- `auth-service`
  - 已完成第三个单服务审计查询样板
  - 已完成 `ListAuditEvents`
  - 使用权限码 `auth.audit.list`
  - 已完成 build / targeted L1 验证
  - 已补齐到与 `identity-service` 一致的管理审计查询完整度
- 公共 query model
  - 暂不立即抽取
  - 下一步可开始基于三个样板提炼共享模型
- `DecisionEvent` 查询
  - 仍后置
  - 当前不进入实现
  - 等平台基础设施稳定且业务服务推进后，再根据真实场景决定是否进入下一阶段

### SLICE-08 搜索与安全增强

- 将关键 audit event 同步到 `OpenSearch / Elastic`
- 再根据需要接：
  - `Elastic Security`
  - `Wazuh`

状态：

- 未开始

## 4. identity-service 当前样板范围

当前 `identity-service` 已实际覆盖：

- 联系方式资产管理成功 / 拒绝 / 失败事件
- 组织归属管理成功 / 拒绝 / 失败事件
- `ServiceAccount` 管理成功 / 拒绝 / 失败事件
- `APIKey` 创建 / 撤销 / 轮换成功 / 拒绝 / 失败事件
- `AuthenticateApiKey` 成功 / 拒绝 / 失败事件
- `ListAuditEvents` 单服务审计查询样板
  - 支持最小过滤维度
  - 支持 cursor 分页
  - 返回 envelope 兼容读模型

说明：

- 当前已完成三态审计
- 当前已写入 `PostgreSQL`
- 仍未接入外部审计平台

## 5. 当前建议顺序

1. `SLICE-01`
   - metrics 设计冻结，暂不实现
2. `SLICE-02`
   - 继续完成 `OTel Collector` 与查询链落地
3. `SLICE-03`
   - 结构化日志基线统一
4. `SLICE-07`
   - 选择第二个服务落 audit query 样板
   - 在第二个样板完成后，再抽共享 query model
5. `SLICE-06`
   - 平台级 `audit persistence module` 或 `audit-service`
6. `SLICE-08`
   - 搜索与安全增强

## 6. 风险提示

- 不要把日志平台直接当审计真相源
- 不要把 tracing span 当作正式审计记录
- 不要在业务审计模型未稳定时过早引入重型 SIEM
- 不要缺少 metrics 仍试图只靠日志与 trace 做可用性治理
- 不要在没有脱敏治理前扩大日志采集范围
