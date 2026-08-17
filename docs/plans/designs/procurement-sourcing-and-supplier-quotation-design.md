# Procurement Sourcing and Supplier Quotation Design Workspace

## Objective

收敛“销售提出非标准寻源需求—采购组织寻源—供应商报价—销售形成客户报价/订单—采购沉淀供货与价格历史”的业务边界与对象设计。

本文只保存仍需继续讨论并冻结的设计材料，不作为当前稳定架构或实现依据。讨论结论冻结后，应回写对应规范真相，并从本文移除。

## Scope

本 Workspace 覆盖：

- Sales Sourcing Request 的发起、拆行、补充信息与关闭；
- 采购主管分配、Buyer 协同以及多 Buyer 寻源；
- 供应商、联系人、供货资料、报价与历史价格；
- 寻源结果如何支持 Sales Quote / Sales Order；
- TEMP Item、正式 Item 与寻源候选结果的关系；
- 供应商替换寻源；
- 供应商及联系人可见性所需的业务事实。

本 Workspace 不直接设计：

- 客户 Project 的完整生命周期；
- 自动分配、完整 SLA/KPI 和供应商绩效模型；
- 权限引擎本身。资源授权能力的缺口与演进见
  [Resource Authorization Evolution Design Workspace](resource-authorization-evolution-design.md)。

## Current truth baseline

继续讨论前必须以以下稳定设计为基线：

- [SRM Service](../../architecture/services/srm-service.md)
- [Procurement Service](../../architecture/services/procurement-service.md)
- [Item Master Service](../../architecture/services/item-master-service.md)
- [SRM / Procurement / Party / Item Master Collaboration](../../architecture/collaborations/srm-procurement-party-item-master.md)
- [Authorization Layering and Resource Policy](../../architecture/platforms/authorization-layering-and-resource-policy.md)

当前已冻结边界包括：

1. SRM 拥有 SupplierProfile、SupplierContactUsage 以及最小 SupplierOffering；联系人正文继续由 Party Service 拥有。
2. 当前 SupplierOffering 不保存价格、MOQ、交期和供应商料号。
3. Procurement 拥有采购交易与实际交易历史；RFQ / SupplierQuote 仍处于后续能力范围。
4. Item Master 拥有 Item 主数据，不拥有寻源流程与供应商报价。
5. 资源授权由业务服务提供资源事实，Permission Service 不直接读取业务数据库。

因此，以下候选方向不能整体视作已经冻结，也不能直接按候选对象名进入实现。

## Current proposed design

### 1. Sales Sourcing Request

Sales Sourcing Request 表达销售为客户需求发起的寻源任务，适用于标准商品无法直接满足或尚无法确认标准商品的场景。

它不是以下对象的别名：

- Purchase Requisition；
- Supplier RFQ；
- Purchase Order；
- Customer Project；
- Sales Quote 或 Sales Order。

若销售已确认存在可直接销售的 ACTIVE Item，应进入常规销售报价或订单流程，而不是新建寻源请求。

一个请求可以包含多条 Request Line。每条 Line 应保留客户原始需求，至少包括：

- 图片或附件；
- 尺寸、颜色、材质与其他规格；
- 数量；
- 目标价格；
- 期望交期；
- 用途与备注；
- 销售人员的判断、假设或参考 Item。

原始需求不能因后续匹配、报价或转单而被覆盖。

### 2. Request Line 与现有 Item

销售在发起时可以提出“可能对应某个 ACTIVE Item”的假设，但这不等于完成商品匹配。

需要继续决定：

- Request Line 是否允许直接引用 ACTIVE Item；
- 该引用是普通参考、强提示还是待 Buyer 确认的候选；
- Buyer 确认标准商品匹配后，如何关闭该 Line；
- “找到现有 Item”应作为成功结果，而不是寻源失败；
- 如何避免绕过正常 Sales Quote / Order 流程。

倾向方案是保留销售的 hypothesis/reference，由 Buyer 或明确的商品判断角色确认最终匹配。

### 3. Assignment 与协作

P1 倾向采用人工分配：

- 采购主管按 Request Line 分配 Buyer；
- 一条 Line 可由多个 Buyer 并行寻源；
- Buyer 可向销售请求补充信息；
- Buyer 可提交多个供应商、联系人和结果；
- 自动分配延后；
- 重新分配是否进入 P1 尚待确认，当前倾向暂不纳入。

多 Buyer 不是简单的共享编辑。后续需要定义：

- 各 Buyer 是否拥有独立工作区或可见范围；
- 重复接触同一供应商时如何提示；
- 谁可以合并、比较或否决结果；
- 主管如何看到全局进展；
- 协作轨迹与审计事件。

### 4. Line 的结果与关闭

Buyer 至少应能形成以下结果：

- 确认已有 ACTIVE Item；
- 形成一个或多个可供销售选择的可报价结果；
- 需要更多客户信息；
- 当前不可行并说明原因。

Sales 拥有客户侧决策：

- 选择结果并形成客户报价；
- 接受相似替代；
- 关闭请求；
- 另行发起独立 Customer Project。

Procurement 拥有供应商侧判断：

- 是否接受供应商报价；
- 是否把一次性结果沉淀为长期供货关系；
- 是否启动供应商正式化、供货资料维护或采购交易。

寻源关闭原因、关闭者、依据和关联结果必须保留，不应用自由文本替代所有结构化状态。

### 5. Sourcing 与 Customer Project

寻源与客户 Project 是相互独立的业务对象：

- 寻源用于发现可供报价或采购的商品与供应来源；
- Project 用于精确的定制、开发、开模或复杂交付管理；
- 寻源结果可以关联 Project；
- 寻源也可在判断后触发新的 Project；
- Project 的详细设计不在本文内冻结。

需要继续决定“触发 Project”是结束当前 Line、保留并行关系，还是生成转换记录。

### 6. Candidate Result、TEMP Item 与报价下单

这是本 Workspace 的核心未决问题。

当前存在独立 Candidate / Result 抽象的候选，用来承载尚未成为正式 Item 的供应商侧发现；若其唯一用途只是等待转成 TEMP Item，该抽象可能制造额外状态与人工操作。

当前业务意图是：

- 一旦销售选择寻源结果用于报价，应自动创建或复用可交易的 TEMP Item；
- 销售不应手工把 Candidate 绑定到 TEMP Item；
- 流程不应为了生成 Item 再退回 Buyer；
- TEMP Item 的目的，是让尚未正式主数据化的结果可以进入 Sales Quote，并在获客后进入 Sales Order；
- 正式 Item 的晋升仍应经过受控治理；
- 客户未接受的结果也要保留为寻源与报价历史，但未必都应产生 TEMP Item。

仍需回答：

1. 是否需要独立 SourcingResult，还是 SupplierQuoteLine 本身已经足够；
2. TEMP Item 在何时创建：结果可用、销售选择、生成报价或订单确认；
3. 如何复用已有 TEMP Item，避免同一供应商商品反复创建；
4. 去重依赖哪些稳定键：供应商、供应商料号、规格、图片或人工确认；
5. TEMP Item 能否跨客户复用；
6. TEMP Item 升级为 ACTIVE Item 的责任方、门槛与迁移语义；
7. 结果被修订时，既有 Sales Quote / Order 引用哪个不可变快照。

### 7. Supplier Offering 与供应商商品资料

当前候选方案希望维护一个供应商视角的商品资料或映射，包括：

- 供应商商品名称；
- 供应商料号或目录号；
- 供应商目录描述；
- 对应内部 Item 或临时商品；
- 有效性与来源。

这与当前冻结的最小 SupplierOffering 存在直接张力：稳定设计明确不在 SupplierOffering 保存供应商料号，价格、MOQ 和交期也不属于该对象。

后续必须明确：

- 扩展 SupplierOffering，还是新增 Procurement 所有的 supplier quotation/catalog fact；
- 供应商料号究竟是长期 SRM 事实、采购事实，还是报价快照字段；
- 内部 Item 与供应商商品是多对多映射还是报价上下文关联；
- 哪些字段可复用，哪些字段只能作为历史快照。

在该冲突冻结前，不应直接依据未冻结候选实现 SupplierItemMapping。

### 8. Supplier Quote 与价格历史

供应商报价不能覆盖旧值，应形成可审计版本或不可变历史。讨论中需要保留的维度包括：

- supplier；
- supplier contact；
- internal Item / TEMP Item / sourcing result；
- supplier item reference；
- quantity tier 与 MOQ；
- unit price；
- currency；
- tax treatment；
- lead time；
- validity；
- payment or commercial terms；
- quote source、attachment、recordedBy 与 recordedAt。

需要区分三类事实：

1. Supplier quoted price：供应商表达的报价；
2. Procurement accepted commercial option：采购认可或选用的条件；
3. Actual transaction price：由 PO、收货或供应商发票等实际交易产生。

实际交易价格不应由 Buyer 手工伪造为历史。

期望的分析视图包括：

- 同一商品按供应商与时间的价格趋势；
- 同一时间跨供应商比较；
- 价格阶梯与 MOQ 比较；
- 报价到实际采购价格的差异。

供应商响应、质量、履约和综合 KPI 应与价格历史分开建模。

### 9. Batch price adjustment

讨论中提出供应商可能对一批商品统一调价。倾向语义是：

- 一次批量调价创建一个可审计批次；
- 每个受影响商品生成新的价格版本；
- 不覆盖历史报价；
- 记录调整原因、来源文件、操作者与生效时间；
- 批次可部分失败并显示逐行结果；
- 是否需要审批取决于后续商业治理设计。

### 10. Supplier replacement sourcing

供应商替换寻源与 Sales Sourcing Request 是不同触发源。

可能的触发原因：

- 原供应商不响应；
- 价格上涨；
- 缺货或交期不满足；
- 质量问题；
- 采购主动进行替代供应商开发。

发起者可以是 Buyer 或采购主管。它通常围绕已知 Item 或已知供应关系，不应强制伪装成客户原始需求。

需要决定是否共享 SourcingCase / SourcingLine 内核，还是保留不同聚合并复用报价与结果对象。

### 11. Supplier、Contact 与 Buyer 关系

讨论中形成但尚未冻结的业务意图：

- 同一 tenant 内 Supplier 应保持唯一业务身份；
- Supplier 创建者默认建立管理关系；
- 采购主管可增加或调整负责 Buyer；
- 多个 Buyer 可以接触同一 Supplier 的不同 Contact；
- 允许在 Supplier 正式审批前先创建 Contact，以支持真实开发过程；
- Supplier 与 Contact 的可见性不应只靠静态 RBAC；
- 需要区分发现、基础资料、详情、联系人、供货资料、价格与历史等访问层次；
- public / private / restricted contact 的精确定义仍未收敛。

这些是业务资源事实与授权需求，不在本文定义 Permission 引擎。本文需要冻结的是 SRM/Procurement 应拥有哪些事实，例如 owner、manager、team、contact relation、sensitivity 与临时协作关系。

## Human-confirmed items pending UD review

以下是当前已获 Human 认同、但尚未进入稳定规范真相的内容：

- 本 Workspace 只保留当前仍有效的开放问题、候选方向和验证场景；
- Sales Sourcing Request 与 PR、RFQ、PO、Project 分离；
- 一请求多 Line，并保留客户原始需求；
- P1 由采购主管人工按 Line 分配，可多 Buyer 并行；
- Sales 决定客户侧选择，Procurement 决定供应商侧正式化；
- 找到现有 ACTIVE Item 是有效成功结果；
- 报价与价格历史不覆盖；
- 实际交易价格来源于采购交易；
- 寻源与 Project 独立但可关联或触发；
- 销售选用结果时，应尽量自动创建或复用 TEMP Item，不引入无价值的人工回路；
- 供应商/联系人访问问题仍未闭合，需与授权 Workspace 联合收敛。

## Open questions

1. Sales Sourcing Request、Sourcing Line、Supplier RFQ、Supplier Quote 与 Sourcing Result 的最小对象集合是什么？
2. 是否保留独立 Candidate/Result；若保留，它承担什么不可替代的业务真相？
3. TEMP Item 的创建、复用、去重、晋升与失效规则是什么？
4. ACTIVE Item 参考与 Buyer 确认匹配的精确状态机是什么？
5. 多 Buyer 协作、重复供应商接触与主管裁决如何表达？
6. 重新分配是否属于 P1？
7. SupplierOffering 是否需要扩展；供应商料号由哪个服务拥有？
8. Supplier Quote 的版本、有效期和商业条件如何冻结为契约？
9. 批量调价是否属于报价能力还是独立维护能力？
10. Supplier replacement sourcing 与 Sales sourcing 共享哪些对象？
11. Supplier/Contact 应向 Permission 提供哪些类型化授权事实？
12. Supplier 未审批前创建 Contact 的状态、可见性与后续归并规则是什么？
13. 哪些功能进入 P1，哪些明确延期？

## Known conflicts

- SupplierItemMapping / Offering 的候选字段范围，与当前最小 SupplierOffering 稳定设计冲突。
- Candidate 与 TEMP Item 的分层仍有多个候选方案，尚无可直接实现的冻结结论。
- 细粒度 supplier/contact 可见性依赖尚未冻结的授权事实与查询范围能力。
- Procurement 文档仍把 RFQ / SupplierQuote 放在后续范围，因此完整寻源流程当前仍属于设计工作。
- Project 的转换语义依赖尚未开展的 Project 稳定设计。

## Intended truth-source changes

设计冻结后，预计按唯一真相原则分别更新：

- Sales Sourcing Request 的服务归属文件；
- [Procurement Service](../../architecture/services/procurement-service.md)；
- [SRM Service](../../architecture/services/srm-service.md)；
- [Item Master Service](../../architecture/services/item-master-service.md)；
- 必要的跨服务 collaboration 文档；
- Supplier Quote、Sourcing Request 和 TEMP Item 的黑盒业务契约；
- 若存在高影响且仍有解释价值的取舍，再新增或更新 ADR。

不得把本文整体长期保留为第二份稳定真相。

## Next discussion point

先冻结最小对象模型与转换路径：

Sales Sourcing Request Line → supplier-side response/quote → Sales 选择 → 自动创建或复用 TEMP Item → Sales Quote / Order。

讨论时优先回答：独立 SourcingResult 是否拥有 SupplierQuoteLine 无法承担的业务真相。
