# OES Bounded Context 设计

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](../services/permission-service.md) 为准；本文只描述项目级 bounded context 划分。

## 1. 划分原则

bounded context 的划分依据应当是：

- 业务语义边界
- 规则与约束边界
- 生命周期边界
- 数据所有权边界
- 团队协作边界

而不应当依据：

- 页面菜单结构
- 单个数据库表
- 临时实现方便程度
- “未来可能会变大”的猜测

这样划分的原因是，DDD 的目标是控制复杂性，而不是制造更多目录或服务。

## 2. 领域分组

### 2.1 核心业务域

直接承载企业经营与制造主流程的领域：

- CRM
- SRM
- Sales Order
- Procurement
- Product & BOM
- Inventory / WMS
- Manufacturing / MES
- Planning / APS
- Finance / ERP

### 2.2 支撑域

为核心业务域提供稳定平台能力的领域：

- Identity & Access
- Tenant & Organization
- Party Master
- Collaboration / Task
- Workflow
- Notification
- Integration Hub
- Audit & Compliance
- Knowledge & AI

### 2.3 通用平台能力

横向基础能力，不作为业务域承载业务语义：

- Gateway
- Contracts
- Config
- Discovery
- Logging
- Tracing
- Metrics
- Scheduling
- File / Search

## 3. 推荐 bounded contexts 列表

### 3.1 Identity & Access

职责：

- 认证
- 身份映射
- 授权判定
- 角色、scope、policy 管理

边界说明：

- 它负责“谁能做什么”
- 不负责客户、供应商、员工等业务角色定义；员工与任职语义以 [hr-service.md](../services/hr-service.md) 为准

### 3.2 Tenant & Organization

职责：

- 租户边界
- 组织结构
- 部门与组织结构；正式员工任职归属以 [hr-service.md](../services/hr-service.md) 为准

边界说明：

- 它负责“组织与隔离”
- 不负责认证与权限具体判定

### 3.3 Party Master

职责：

- 交易与法律主体主数据边界；具体服务职责、核心对象与 owner 规则以 [party-service.md](../services/party-service.md) 为准

边界说明：

- 它不关心这个主体是客户、员工、供应商还是合作伙伴；员工与任职语义以 [hr-service.md](../services/hr-service.md) 为准
- 业务域第一阶段应引用 `tenantPartyId`，而不是复制主体主数据；详细规则以 [party-service.md](../services/party-service.md) 为准
- 业务角色由其他上下文定义

### 3.4 CRM

职责：

- 客户线索
- 商机
- 客户关系信息
- 客户交互过程

### 3.5 SRM

职责：

- 供应商主档
- 供应商协作与评估
- 采购协同接口

### 3.6 Product & BOM

职责：

- 产品定义
- 物料结构
- 工程主数据引用

### 3.7 Sales Order

职责：

- 报价
- 订单
- 需求承诺
- 销售侧流程控制

### 3.8 Procurement

职责：

- 采购申请
- 采购订单
- 采购履约协同

### 3.9 Inventory / WMS

职责：

- 库存
- 库位
- 出入库
- 分配
- 仓储执行

### 3.10 Manufacturing / MES

职责：

- 工单
- 生产执行
- 报工
- 工艺执行关联

### 3.11 Planning / APS

职责：

- 计划建模
- 约束管理
- 排产建议与优化

### 3.12 Finance / ERP

职责：

- 财务映射
- 结算与账务集成
- 财务侧经营数据支撑

### 3.13 Collaboration / Task

职责：

- 手动工作待办
- 自己给自己的 work todo
- 指派给他人的协作任务
- 对象备注、评论、mention 等 future 协作能力的边界讨论入口

边界说明：

- Task P1 以 [collaboration-service.md](../services/collaboration-service.md) 为准
- 它负责“谁需要处理一条工作事项”
- 不负责业务对象真相、审批流程、通知投递、对象时间线或审计合规真相

### 3.14 Workflow

职责：

- 审批流
- 长事务编排
- 人工确认与流程节点运行

边界说明：

- Workflow 可以在后续通过协同契约创建或驱动 task
- Workflow 不等于 task；审批节点、流程实例、审批意见与流程结果不归 Task P1 拥有

### 3.15 Notification

职责：

- IM
- Email
- SMS
- Push
- Webhook
- 模板
- 消息发送与回执
- 投递状态、重试、成本与审计
- 消息接收处理入口

边界说明：

- 它负责“把通知送出去，以及如何治理投递”
- 不负责 OTP 真相、审批真相、订单真相等业务语义
- 不拥有邮箱、手机号等联系资产主数据真相

### 3.16 Integration Hub

职责：

- 外部系统连接器
- 数据映射
- 数据同步
- 对外出入站集成

### 3.17 Audit & Compliance

职责：

- 审计事件
- 合规记录
- 关键操作留痕

### 3.18 Knowledge & AI

职责：

- 知识接入
- 检索
- AI 工具编排
- 智能助手
- Agent 受控执行

## 4. 上下文之间的关系

核心关系如下：

- CRM 产生潜在需求，推动 Sales Order。
- Sales Order 向 Planning、Procurement、Inventory、Manufacturing 传递执行需求。
- Product & BOM 被 Planning、Procurement、Inventory、Manufacturing 共同引用。
- SRM 与 Procurement 强关联，但不应混为一个上下文。
- Identity & Access、Tenant & Organization 是平台依赖，而不是业务上下文附属模块。
- Knowledge & AI 增强所有业务域，但不拥有业务真相。

## 5. 哪些适合独立服务，哪些更适合作为平台能力

### 5.1 适合优先独立服务的模块

- auth-service
- identity-service
- permission-service
- party-service
- tenant / org service
- notification-service
- workflow-service
- ai / knowledge platform service
- integration hub service

原因：

- 它们天然承担跨域平台职责
- 被多个业务域共同依赖
- 适合在系统早期建立稳定平台边界

### 5.2 更适合先作为平台能力沉淀的模块

- config
- registry
- logging
- tracing
- metrics
- scheduling
- file / search

原因：

- 它们是横向基础能力
- 不应在每个业务服务内重复实现

### 5.3 业务域的拆分策略

以下业务域应先保持粗粒度：

- CRM
- SRM
- Sales Order
- Procurement
- WMS
- MES
- APS
- ERP

原因：

- 这些业务域内部耦合较强
- 过早细拆会导致大量同步调用、事务协调与联调成本
- 在业务规则尚未稳定前，粗粒度服务更便于落地

## 6. 当前阶段结论

对 OES 当前阶段来说，最重要的不是继续快速增加业务服务数量，而是：

- 先冻结上下文边界
- 先完善系统平台上下文
- 再逐步让业务域接入

只有先控制住 bounded context，后续多个线程并行开发时才不会互相污染模型与职责。
