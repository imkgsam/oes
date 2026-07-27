# OES AI 增强架构

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述 AI 场景如何消费授权与 policy 能力。

## 1. AI 在 OES 中的定位

OES 中的 AI 不是一个孤立系统，也不是一个只负责调用大模型接口的技术附属模块。

AI 的定位应当是：

- 平台级增强能力
- 面向多个业务域复用的能力层
- 与企业知识、业务工具、权限边界、审计要求深度结合的能力体系

这样定位的原因是：

- 企业场景下，模型本身不是核心竞争力
- 真正有价值的是模型、知识、工具、权限与流程的组合
- 如果把 AI 做成孤立聊天模块，无法有效提升企业实际运营效率

## 2. AI 能力分层

OES 的 AI 架构建议分为五层。

### 2.1 模型接入层

职责：

- 多模型供应商接入
- 模型路由
- 回退策略
- 限流与成本控制
- 提示模板治理

作用：

- 统一模型接入，避免业务服务各自直接调用外部模型

### 2.2 知识层

职责：

- 企业文档接入
- SOP、制度、FAQ、工艺文档沉淀
- 结构化检索与向量检索
- 权限感知的知识过滤
- 知识来源与版本追踪

作用：

- 让 AI 基于企业知识做出可解释输出

### 2.3 工具层

职责：

- 将业务域能力暴露为受控工具
- 工具调用映射到应用服务或受控接口
- 在工具层做权限校验与审计记录

作用：

- AI 不直接碰业务数据库
- AI 只能通过业务域公开的能力入口行动

### 2.4 代理层

职责：

- 多步推理
- 多工具编排
- 上下文组装
- 需要时插入人工确认节点

作用：

- 支撑复杂任务型智能协作

### 2.5 业务场景层

职责：

- 把 AI 能力映射到具体业务场景
- 明确业务收益、角色边界与验收标准

作用：

- 避免 AI 建设停留在技术演示层

## 3. 最适合优先 AI 化的业务场景

当前阶段优先级最高的 AI 场景应包括：

- 智能问答
- 智能录单 / 录入
- 智能邮件与消息处理
- 智能预警解释
- 智能排产建议
- 智能采购建议
- 智能仓储与补货建议

优先这些场景的原因是：

- 输入与输出边界相对清晰
- 可以先作为辅助决策和辅助录入存在
- 对业务主状态的直接破坏风险较低
- ROI 相对更容易体现

## 4. AI 与各业务模块的结合方式

### 4.1 ERP

适合做：

- 财务或经营数据解释
- 单据辅助录入
- 异常摘要

### 4.2 MES

适合做：

- 工单助手
- 工艺知识问答
- 生产异常辅助分析

### 4.3 WMS

适合做：

- 库位建议
- 补货建议
- 拣货与调拨辅助
- 库存异常解释

### 4.4 APS

适合做：

- 约束建模辅助
- 排产建议
- 排产结果解释

### 4.5 CRM / SRM

适合做：

- 沟通摘要
- 跟进建议
- 风险提示
- 邮件与消息自动处理

## 5. 关键 AI 场景总体方案

### 5.1 智能问答

基于知识层 + 权限过滤检索 + 模型总结生成。

关键要求：

- 必须基于已授权知识
- 必须记录来源
- 必须限制跨租户知识泄漏

### 5.2 智能录单

基于文档理解、字段抽取、业务校验、人工确认闭环。

关键要求：

- AI 只做识别、建议、预填
- 最终提交仍由业务工具或应用服务完成

### 5.3 智能排产

基于 APS 约束、产能、库存、订单信息提供建议解，而不是直接强写计划真值。

关键要求：

- 给出建议与解释
- 保留人工调整能力
- 关键计划变更需要审批或确认

### 5.4 智能预警

基于事件流、指标、日志或业务数据生成异常解释与建议动作。

### 5.5 智能节能

结合设备、排程、产能与能源数据给出优化建议。

### 5.6 智能邮件 / 消息处理

对 Email / IM 做分类、摘要、指派、拟回复建议与任务触发。

### 5.7 智能知识检索

面向制度、SOP、客户资料、供应商资料、生产知识、仓储规则建立统一检索入口。

## 6. 权限、审计、数据边界与安全控制

AI 能力必须服从 OES 的平台级权限与审计规则。

### 6.1 权限控制

每次 AI 调用都必须明确：

- 谁发起
- 属于哪个租户
- 可访问哪些知识
- 可调用哪些工具

### 6.2 审计

必须记录：

- 调用人
- 调用时间
- 输入摘要
- 使用的模型
- 调用的工具
- 结果摘要
- 是否经过人工确认

### 6.3 数据边界

必须控制：

- 租户边界
- 组织边界
- 角色边界
- 敏感字段边界

### 6.4 成本控制

必须具备：

- 模型选择策略
- Token 与调用成本统计
- 高成本任务限额
- 可回退到低成本模式的能力

## 7. 如何避免 AI 侵入业务核心导致架构失控

必须坚持以下原则：

- AI 不拥有业务主模型
- AI 不绕过权限系统
- AI 不直接写业务核心表
- AI 不把核心业务规则藏在 prompt 中
- AI 只通过受控工具访问业务能力

这是最重要的控制原则，因为一旦 AI 直接进入业务核心：

- 规则会不可见
- 审计会失真
- 维护成本会迅速升高
- 业务安全边界会被破坏

## 8. 当前阶段的 AI 架构结论

OES 当前阶段不应先做“大而全 AI 中台”，而应先做：

- AI 架构边界定义
- 模型接入与知识层基础
- 工具层治理规则
- 首批高价值低风险场景接入

这样可以在控制风险的同时逐步建立企业级 AI 平台能力。
## 9. Extension-First AI Platform Update (2026-03-25)

### 9.1 Core decision

OES AI architecture must not depend on a fixed list of AI scenario types.

The platform must remain stable even when new AI ideas appear in the future, such as:

- knowledge assistant
- analytics assistant
- workflow assistant
- risk and governance assistant
- quality and inspection assistant
- optimization assistant
- future AI forms that are not yet known

Therefore, the architecture should be driven by stable extension points instead of hard-coded scenario branches.

### 9.2 Stable extension points

Future AI scenarios should be connected through the following stable platform objects:

1. `AgentPrincipal`
- the machine principal that runs the AI capability
- must be stable, few in number, and governed

2. `AgentProfile`
- the scenario-specific profile
- defines role, operating style, model policy, knowledge scope, allowed tools, and write mode

3. `KnowledgeScope`
- defines what the AI can read
- must support tenant, org, source, visibility, and lifecycle filtering

4. `ToolContract`
- defines what the AI can call
- input/output must be explicit
- tools are the only allowed path to business actions

5. `Policy`
- defines risk gates, approval rules, delegation rules, and execution mode

6. `ExecutionContext`
- defines who initiated the action, for which tenant, in which session, under which trace

7. `ModelRouting`
- defines how local and remote models are selected
- this is infrastructure policy, not identity policy

### 9.3 Consequence for future AI onboarding

When a new AI scenario is proposed, the default implementation path should be:

- reuse an existing governed `AgentPrincipal` when possible
- add or update an `AgentProfile`
- bind the right `KnowledgeScope`
- register or reuse the required `ToolContract`
- configure `Policy`
- execute under a per-request `ExecutionContext`

This means most new AI scenarios should be introduced by configuration, bounded tool exposure, and profile extension, not by redesigning the base architecture.

### 9.4 Service responsibilities in the future AI platform

`identity-service`
- owns machine identity truth such as governed AI service principals

`auth-service`
- authenticates machine principals
- owns DelegationGrant / ActionGrant credential lifecycle and issues trusted delegation or execution context for AI-assisted operations

`permission-service`
- evaluates the upper bound of machine permissions
- combines machine scope with human delegation scope when applicable

future knowledge layer
- owns document ingestion, metadata, retrieval, and citation filtering

future tool layer / agent orchestration
- owns controlled tool invocation, planning, user-facing confirmation gates, ToolContract identity / version and execution logs; it cannot issue credentials or redefine the business service's risk class

### 9.5 AI scenario taxonomy is advisory, not architectural

Scenario categories are useful for planning and communication, but they must not become rigid architectural partitions.

They should be treated as profile groupings, not as separate identity or permission systems.

### 9.6 High-risk actions

For all future AI scenarios:

- read and explanation scenarios may run directly under governed retrieval and query policies
- draft generation scenarios may create proposals
- submit and mutate scenarios must go through controlled tools
- each tool operation is preclassified by its business owner as delegation-allowed, ActionGrant-required or AI-forbidden
- high-risk actions require an exact, one-time ActionGrant after human confirmation; the stable collaboration rule is [delegated-execution-and-action-grant.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/delegated-execution-and-action-grant.md)

This is required to satisfy OES audit, tenant isolation, and AI governance goals.

## 10. AI Decision Context Reference (Draft)

This section records a useful reference direction for future AI-assisted decision design.

It is not yet a frozen object model. Names such as `DecisionType`, `ContextBuilder`, and `ContextPackage` are candidate terms only. Before implementation, the project must decide whether to adopt these exact concepts, rename them, merge them into `AgentProfile / KnowledgeScope / ToolContract`, or split them into a separate architecture / ADR.

### 10.1 Reference principle

OES should remain the source of truth and the execution boundary.

AI should help with sense-making, judgment, simulation, and recommendations, but it should not decide by itself which raw business data it can access.

For decision-oriented AI scenarios, the preferred direction is:

- OES defines the decision scenario.
- OES defines the allowed context.
- OES builds a business-semantic context package.
- AI consumes that context and returns a structured suggestion.
- Any state-changing action goes back through OES approval, workflow, and controlled tools.

### 10.2 Candidate flow

The old design draft proposed the following flow as a reference:

```text
DecisionType
  -> ContextDefinition
  -> ContextBuilder
  -> ContextPackage
  -> AI
  -> Suggestion / Plan
  -> Action / Workflow
```

The valuable idea is not the naming itself, but the direction:

- AI should not query arbitrary source data.
- Context should be business-semantic material, not raw tables or unrestricted dumps.
- Each context package should be versioned, traceable, auditable, and replayable.
- AI output should contain judgment, reasons, suggested actions, and risk points.
- Human confirmation or policy-controlled workflow is required before high-risk execution.

### 10.3 Reference scenarios

These scenarios are useful as future AI onboarding examples, but they do not define immediate implementation scope.

`SalesRiskDecision`
- Example question: which orders or opportunities may be lost?
- Possible context: customer interaction history, quotation changes, sales cycle age, overdue follow-ups, recent order trend.
- Expected output: risk level, reasons, suggested follow-up actions.

`ProductionAdjustDecision`
- Example question: should the production plan be adjusted?
- Possible context: current work orders, process capacity, equipment status, material availability, delivery pressure.
- Expected output: adjustment suggestion, affected orders, bottleneck reason, risk warning.

`InventoryClearDecision`
- Example question: which SKUs should be cleared, promoted, paused, or reprioritized?
- Possible context: inventory age, sales in the last 90 days, production plan, gross margin, replacement products.
- Expected output: SKU risk list, suggested action, business reason, financial risk.

`SupplierRiskDecision`
- Example question: which suppliers may affect delivery or quality stability?
- Possible context: delivery delay history, quality inspection results, price fluctuation, open purchase orders, complaint records.
- Expected output: supplier risk level, reason, recommended mitigation.

Reference skill examples:

- `InventoryDiagnosisSkill`
- `ProductionBottleneckSkill`
- `SalesFunnelAnalysisSkill`
- `CostAnomalyDetectionSkill`

These skills should never hide core business rules in prompts. Business rules remain inside their owning business domains. Skills may only orchestrate AI prompts, context consumption, output structure, and validation around governed tools and approved data scopes.
