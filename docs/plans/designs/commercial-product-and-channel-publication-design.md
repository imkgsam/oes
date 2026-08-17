# Commercial Product and Channel Publication Design Workspace

## Objective

收敛 OES 内部 Item 执行主数据与外部商业 Product、ProductVariant、Brand、Touchpoint、Publication 之间的边界，并为官网、小程序、经销商 App、Amazon、京东、天猫等多品牌、多市场、多渠道场景建立一致的设计语言。

本文只保存尚未冻结的商业产品与渠道发布设计。Item Master、Site Service、Sales、Asset、CRM 等已经进入规范真相的边界只作为输入，不在本文重新定义。

结论冻结后应回写相应 architecture、contract 与 collaboration，并从本文移除。本文最终不应成为第二份稳定真相。

## Scope

本文覆盖：

- 内部 ItemModel / Item 与外部 Product / ProductVariant 分层；
- Product 的可复用商业事实；
- ProductVariant 到内部履约对象的 mapping envelope；
- BrandProfile 的轻量身份；
- Commerce Touchpoint / Channel Registry；
- Product Publication 与渠道最终展示；
- Product 素材池与 Publication media selection；
- Product locale facts 与 Publication locale override；
- 渠道、品牌和市场价格上下文；
- CRM、UGC、Sales、After-sales 与 Adapter 的路由边界；
- Site Service 与未来 Marketplace connector 对商业产品层的消费方式；
- 多品牌、多渠道、OEM、有限公开配置和动态履约场景。

本文不直接设计：

- Item、Configurable、Kit、Selectable Component 与 Item materialization 的内部规则；
- 完整 Pricing Engine；
- Marketplace credential、callback、polling、sync 与 reconciliation；
- Site Runtime、preview、webhook 和 public store 的稳定机制；
- Review / QA 的完整状态机；
- CRM、Sales、After-sales 的完整领域模型；
- 最终微服务拆分和部署拓扑。

相关设计：

- [Item Configuration / Kit / Selectable Component Design Workspace](item-configuration-kit-and-selectable-component-design.md)
- [Customer Touchpoint and Platform Integration Design Workspace](customer-touchpoint-and-platform-integration-design.md)
- [Product Review and Q&A Submission Design Workspace](product-review-qa-submission-design.md)

## Current truth baseline

继续讨论必须以以下规范真相为基线：

- [Item Master Service](../../architecture/services/item-master-service.md)
- [Item Master Contracts](../../contracts/item-master-service/README.md)
- [Site Service](../../architecture/services/site-service.md)
- [Site Service Public Views Contract](../../contracts/site-service/public-views.md)
- [Sales Service](../../architecture/services/sales-service.md)
- [Asset Service](../../architecture/services/asset-service.md)
- [CRM Service](../../architecture/services/crm-service.md)
- [Item Master / Sales / MES / WMS / SRM Collaboration](../../architecture/collaborations/item-master-sales-mes-wms-srm.md)

当前已冻结的约束包括：

1. ItemModel 是内部模型层，Item 是内部执行 SKU。
2. 所有 Item 必须关联 ItemModel。
3. 采购、销售、库存、生产、BOM 和包装执行最终引用 Item。
4. Item Master 不拥有营销展示、PIM、网站发布和客户产品目录真相。
5. SalesOrderLine 最终必须引用稳定 itemId，并保存交易快照。
6. Sales 拥有销售价格与客户承诺；完整 Pricing Engine 仍 deferred。
7. Site Service 拥有当前站点侧 SiteProductPublication、public view、locale completeness、sync 与 runtime governance。
8. Product Master 与 Site Product 之间的 identity、mapping、lifecycle、选品与合成规则尚未冻结。
9. ProductPublicView 不是 Product Master，不得反向修改产品真相。
10. Site Service 不拥有最终价格、库存、订单、询盘或第三方 Marketplace。
11. Asset Service 拥有受控资产和交付事实，但不拥有 Product 或 Publication 的媒体使用语义。
12. CRM 已拥有 Lead、Inquiry 方向的客户关系与来源事实。

这些约束优先于任何尚未冻结的服务命名和迁移建议。

## Coverage assessment of current candidates

| 讨论主题 | 当前覆盖 | 本文处理 |
| --- | --- | --- |
| ItemModel / Item 是内部主数据 | 已冻结 | 只引用 |
| 外部展示不直接复用完整 Item contract | 高层边界已冻结 | 继续设计外部对象 |
| Product / ProductVariant | 未冻结 | 重点保留 |
| Product 与 Item mapping | 未冻结 | 重点保留 |
| Configurable / Kit / dynamic resolution | Item Workspace 已承接 | 本文只定义外部依赖 |
| BrandProfile | 未冻结 | 重点保留 |
| TouchpointRegistry | 未冻结 | 重点保留 |
| Publication | Site-specific 能力已存在，全局模型未冻结 | 重点保留且不覆盖 Site 真相 |
| Product asset pool | 未冻结 | 重点保留 |
| Locale facts 与 overrides | Site locale completeness 已冻结，产品层未冻结 | 重点保留 |
| Channel / Brand pricing | Pricing Engine deferred | 只记录 context 与 owner 倾向 |
| Review / QA | Active Workspace 存在 | 只记录 routing |
| Inquiry | CRM 已有 owner 基础 | 只记录来源与引用 |
| Marketplace connector | Touchpoint Workspace 已承接 | 只记录 handoff |
| 微服务拆分 | 未冻结 | 只保留候选边界 |

## Current proposed design

本节是继续讨论的候选方案，不是稳定架构。

### 1. Two product worlds

内部执行世界回答：

- 企业实际生产、采购、库存和交付什么；
- 稳定 itemId、BOM、包装、成本和 capability 是什么。

外部商业世界回答：

- 客户认为自己在浏览、比较或购买什么；
- 使用哪个品牌、商业名称、公开规格、素材与渠道表达；
- 一个公开选择最终如何解析到内部可履约对象。

候选关系：

    ItemModel
      -> Item

    Product
      -> ProductVariant
      -> FulfillmentMappingProfile
      -> Item / configuration / kit / other resolved fulfillment result

    Product
      -> Publication
      -> Site / Mini Program / Dealer App / Marketplace

外部对象只引用内部真相，不复制库存、BOM、成本和生产状态。

### 2. Product

Product 是候选的可复用客户可见产品基座。

它回答：

- 这是不是同一个商业产品；
- 客户应理解哪些稳定产品事实；
- 可以向不同品牌、市场或渠道提供哪些可复用内容；
- 有哪些公开 ProductVariant；
- 有哪些可复用素材、说明和合规资料。

候选拥有内容：

- 稳定 product identity；
- public specification base；
- ProductVariant structure；
- reusable locale facts；
- reusable asset pool references；
- compliance and document references；
- commercial classification candidates；
- fulfillment mapping envelope。

Product 不拥有：

- 最终渠道标题；
- 最终 SEO 和 slug；
- 最终主图、图片顺序和裁剪；
- 平台类目与审核 schema；
- 渠道上下架状态；
- 价格和库存真相；
- 外部 Listing API 状态；
- 订单、询盘、Review 或售后 Case。

判断一个事实是否属于 Product 的候选规则：

“离开某一个具体渠道后，这个事实是否仍然成立并值得复用？”

成立时倾向 Product；只在特定渠道成立时倾向 Publication。

### 3. ProductVariant

ProductVariant 是候选的客户可见、可选择商业规格身份。

它与内部 Item 的差异：

- ProductVariant 只表达客户可理解的公开选择；
- Item 包含企业执行所需的完整、稳定规格；
- 一个渠道可以隐藏部分内部 Attribute 或配件；
- 多个内部配置可能对外表现为较少的 ProductVariant；
- 同一个内部 Item 可以被不同商业 ProductVariant 引用。

候选职责：

- 稳定 public variant identity；
- 公开 option labels 与选择结构；
- 默认选择与显示顺序的可复用基线；
- fulfillment mapping envelope；
- 可复用 variant asset candidates；
- 商业编码候选。

尚未确认 ProductVariant 是否必须始终独立持久化。若它最终只是 Product 与 Item 的轻量 binding，需证明独立生命周期是否有价值。

### 4. FulfillmentMappingProfile

当前 Human-confirmed direction 要求存在从公开 ProductVariant 到内部履约对象的映射，但 mapping 类型仍开放。

候选 mapping kind：

- DIRECT_ITEM：直接解析到一个稳定 Item；
- CONFIGURABLE：通过受控配置规则得到 Item 或配置结果；
- KIT / BUNDLE：解析到一个 Kit 或多组件履约结构；
- FULFILLMENT_TIME_RESOLUTION：根据明确策略在交易过程中解析。

P1 倾向只实现 DIRECT_ITEM，但模型应为后续类型保留可验证的 envelope，而不是用任意 JSON 或自由表达式提前实现所有能力。

必须满足的稳定约束候选：

1. ProductVariant 必须存在可解释的 fulfillment mapping。
2. Publication 默认不修改 ProductVariant 的 mapping。
3. 渠道特殊 mapping 若被允许，必须显式、受审、可审计。
4. Sales order line 形成最终业务承诺时，必须解析到稳定 Item，并保存 Product、ProductVariant、mapping decision 与 Item snapshot。
5. mapping 版本变化不重写历史订单。
6. mapping 失败时不得默认为任意 Item。

动态解析最晚发生在哪个销售阶段仍需冻结：

- 浏览；
- 加入询价或购物车；
- 报价；
- checkout；
- order acceptance。

不论选择哪个阶段，正式 SalesOrderLine 必须满足当前稳定 itemId 约束。

### 5. BrandProfile

Human 已否定当前阶段建立独立 Brand Service。

Brand 候选为 tenant 内轻量商业身份对象：

- stable brandId；
- display name；
- logo asset reference；
- default locale；
- basic profile；
- active status。

BrandProfile 可以被 Product、Publication、Touchpoint、Pricing context 和客户体验引用，但不拥有：

- Product 本体；
- Channel；
- Site；
- 订单；
- 价格；
- 平台账号。

BrandProfile 的候选归属仍开放：

- tenant commercial profile；
- commercial product capability；
- touchpoint registry owner。

不可只使用品牌显示名称作为跨服务关联键。

### 6. Product reuse across brands

同一 Item 可以支持多个品牌，但不强制所有品牌复用同一个 Product。

候选策略：

#### Shared Product

适用于不同品牌共享大量公开规格、素材和产品结构，只在 Publication 中覆盖品牌表达。

#### Separate Products, shared Item

适用于不同品牌的产品身份、型号体系、定位、素材、卖点和生命周期显著不同：

    Brand A Product
      -> Item X

    Brand B Product
      -> Item X

内部 Item 复用仍然成立，外部 Product 身份分离。

需要继续决定 Product 是 brand-neutral、brand-scoped，还是支持明确的两种模式。

### 7. TouchpointRegistry

此处 Channel 指 commerce / customer touchpoint，不等同于 ERP Sales distribution channel。

候选 touchpoint 类型：

- owned brand site；
- company site；
- owned mini program；
- owned mobile app；
- dealer portal or dealer app；
- Amazon store；
- JD store；
- Tmall store；
- other marketplace account。

Registry 候选回答：

- 客户从哪个入口接触企业；
- 该入口是 owned 还是 third-party；
- 绑定哪个 BrandProfile、market 或 region；
- 支持展示、询盘、报价、下单、UGC 或售后中的哪些 capability；
- 由哪个 runtime 或 adapter 处理；
- 使用哪个稳定 source reference。

TouchpointRegistry 只拥有入口身份与 routing metadata，不拥有 Product、订单、UGC 或客户关系结果。

是否建立独立服务尚未确认。第一阶段可由未来 commercial publication / commerce integration boundary 维护唯一 registry。

### 8. Publication

Publication 是候选的 Product 在特定 brand、touchpoint、locale 和 market 下的最终发布配置。

候选拥有：

- product / product variant selection；
- brand and touchpoint context；
- locale and market；
- final title and description overrides；
- media selection and ordering；
- channel taxonomy and platform attributes；
- SEO / slug where applicable；
- publish lifecycle；
- completeness and validation result；
- external listing reference；
- sync status and normalized publication errors；
- publication audit。

Publication 不拥有：

- Product truth；
- Item truth；
- final price or inventory truth；
- external platform credential；
- imported order；
- Review / QA；
- inquiry；
- complaint or after-sales Case。

Publication 应只管理 outbound listing / published catalog lifecycle。

### 9. Relationship with Site Service

当前稳定 Site Service 已拥有 SiteProductPublication 和 Site public view 的 P1 边界。因此本文不直接要求迁移或删除 SiteProductPublication。

需要继续冻结的是：

- Product 与 SiteProductPublication 的 identity mapping；
- public-safe Product facts；
- Product locale facts 与 Site locale version 的合成；
- Product asset pool 与 Site media selection；
- Product lifecycle 对 Site publication 的影响；
- Site-specific category 与 Product commercial classification 的关系。

长期可能存在统一 Publication owner，也可能保留 Site-specific publication adapter。服务迁移必须在新模型证明收益、兼容路径和真相唯一性后再决定。

ProductPublicView 的现有 shape 只表示 runtime 输出，不证明 Product 或 mapping 已经存在。

### 10. Product asset pool and Publication media selection

Product 候选只保存可复用素材引用：

- source images；
- gallery candidates；
- technical drawing；
- dimension image；
- certification image；
- video；
- manual；
- installation guide。

Publication 决定渠道最终使用：

- main image；
- gallery ordering；
- crop or aspect requirement；
- background requirement；
- alt copy；
- disabled assets；
- platform-specific media set。

Asset Service 继续拥有文件、受控存储、交付、归档和下架事实。Product 和 Publication 只拥有业务引用与使用语义。

一个 Asset 被下架时，Product 和所有 Publication 必须按 Asset availability fact 处理，不能自行替换成不受控 URL。

### 11. Locale model

候选分层：

- Product localized facts：跨渠道可复用的产品名、基础描述、公开规格名和值、通用卖点与 asset alt candidate；
- Publication locale override：渠道标题、SEO、slug、平台 bullet points、市场文案和渠道类目属性。

编辑阶段可展示 Product fallback 帮助运营，但正式发布应遵守 channel completeness。

当前 Site 稳定规则优先：

- 每个 locale version 必须自身完整；
- 缺少当前 locale 的产品资源不在该语言公开；
- 不因一个 locale 不完整阻塞其他 locale。

因此，Publication 的必填字段不得通过静默 fallback 伪装为已完整。

### 12. Pricing boundary

Human 已认同第一阶段价格放在 Sales 的 pricing 子域，未来再评估独立 Pricing。

候选 owner：

- Sales / Pricing：价格表、规则、客户协议价、渠道价、品牌价、区域价、币种、阶梯价、促销与有效期；
- Publication：是否展示价格、询价模式、同步策略、price list reference 和最后同步状态；
- Adapter：将已计算价格转换为平台 payload；
- Product：不拥有最终价格真相。

Brand 与 Touchpoint 只是 pricing context，不是价格 owner。

候选价格上下文：

- tenant；
- brand；
- touchpoint；
- customer or segment；
- market / region；
- currency；
- Product / ProductVariant；
- resolved Item or fulfillment reference；
- quantity；
- effective date。

当前 Sales 稳定设计仍把完整 Pricing Engine 作为 deferred，因此本节只保存方向，不授权实现价格对象。

### 13. UGC, CRM, Sales and After-sales routing

Touchpoint 或 Adapter 只提供来源、外部引用与传输状态。

候选业务归属：

| External interaction | Business owner candidate | Touchpoint / Adapter role |
| --- | --- | --- |
| Product review / rating | UGC capability | capture and source mapping |
| Product question / answer | UGC capability | capture and publish transport |
| Website inquiry | CRM | source identity and Product reference |
| Quote request | CRM intake, then Sales | source identity and handoff |
| Marketplace customer message | CRM / Support / Communication | message synchronization |
| Complaint / dispute / return | After-sales / Support | platform case synchronization |
| Quality complaint | After-sales / Quality | source and external reference |
| Order | Sales / Order owner | import transport and mapping |

当 Review 同时包含退款或质量诉求时：

- UGC 保留原始内容；
- After-sales 拥有 Case；
- CRM 保留客户 timeline 或 follow-up；
- 各方使用引用和事件，不搬移原始内容所有权。

Product Review / QA 的详细对象和状态继续由对应 Workspace 收敛。

### 14. Adapter and deployment boundary

Human 已认同不因概念重要就提前建立 Brand Service、Channel Service 或 Marketplace Service。

候选逻辑边界：

- commercial product capability；
- publication capability；
- touchpoint registry；
- owned site / mini-app runtime adapter；
- Amazon / JD / Tmall adapter modules；
- UGC、CRM、Sales 与 After-sales owner。

Adapter module 满足以下复杂度信号后再评估独立部署：

- 独立 token lifecycle；
- 高频 webhook；
- 平台限流与重试队列；
- 大量异步任务；
- 复杂错误归一；
- 独立审计或故障隔离要求。

服务拆分晚于概念与真相边界冻结。

## Scenario validation matrix

### Scenario 1: One Item, multiple brands

同一个 Item X：

- Brand A 使用 Product A100；
- Brand B 使用 Product B-Classic；
- OEM Customer 使用自己的型号。

内部库存、BOM 和成本仍落到 Item X。外部 Product 可以共享，也可以按品牌分开。

### Scenario 2: One Product, multiple touchpoints

一个 Product 发布到：

- Official Site；
- Mini Program；
- Amazon；
- Tmall。

Product 复用公开规格与素材池；每个 Publication 决定最终标题、媒体、locale、taxonomy 和发布状态。

### Scenario 3: Public variant hides internal options

ERP 内部允许：

- 多种盖板；
- 多种水件；
- 多种包装；
- 多种内部配置。

网站只展示黑色、300 坑距、顶按，并映射到一个标准 Item。未展示的内部选项不进入 ProductVariant。

### Scenario 4: Configurable public product

ProductVariant 只保存公开选择，mapping 指向受控配置规则。最终 Item resolution 必须在 Sales order commitment 前完成，并保存 snapshot。

### Scenario 5: Channel-specific mapping

Amazon 因包装或合规要求需要不同内部 PackagedItem。该差异不应通过普通 Publication override 静默修改 mapping，而应使用显式、可审计的特殊 mapping，并参与价格、库存与售后验证。

### Scenario 6: Multi-locale publication

Product 有通用英文事实；Official Site 有英语与德语 Publication；Amazon US 有英语专用标题和 bullets。缺少 Amazon 必填内容时发布保持不完整，不用 Product fallback 伪装成功。

### Scenario 7: Negative review triggers multiple workflows

Amazon Review 表示产品漏水并要求退款：

- Adapter 同步原始 Review；
- UGC 保存内容；
- After-sales 创建 Case；
- CRM 记录客户 follow-up；
- Product 与 Publication 只作为引用目标。

### Scenario 8: Brand and channel pricing

同一 Product：

- Official Site 使用 MSRP；
- Amazon US 使用渠道价；
- Dealer App 对 Distributor X 使用协议价；
- Tmall 在活动期使用促销价。

Sales / Pricing 按 brand、touchpoint、customer、market、currency、quantity 和 date 计算；Publication 只控制展示与同步策略。

## Failure modes to guard against

### Product too thin

若 Product 只剩名称与 mapping，各 Publication 会重复维护规格、证书、说明和素材，失去商业产品层价值。

### Product too thick

若 Product 保存最终标题、SEO、平台类目、审核字段和所有图片编排，它会变成渠道污染的 PIM 巨型对象。

### Publication becomes a new global center

Publication 若吸收价格、库存、订单、UGC、投诉和平台 credential，会破坏业务 owner 边界。

### Mapping remains undefined

若早期只保存任意 mapping payload，Sales、库存和售后将缺少确定的履约身份。

### Channel-specific mapping is silent

若不同 Publication 可以随意改变 Item mapping，同一 ProductVariant 在不同渠道可能代表不同质量、包装和售后对象。

### Brand is only a string

不同服务会产生不一致的品牌名称、语言、Logo 和状态，且难以审计关联。

### Touchpoint identity fragments

CRM、Sales、UGC、Publication 分别使用 amazon、AMZ_US、AmazonStore001 等不同值，导致来源聚合和权限治理失效。

### Locale fallback publishes incomplete content

后台 fallback 若直接进入正式发布，会让平台必填内容缺失或使用错误市场文案。

### Price truth leaks into Product or Publication

渠道价、客户协议价和活动价若分别存入 Product/Publication，会与订单价格承诺产生冲突。

### Adapter makes business decisions

Adapter 若自行决定客户、Item、价格、库存、订单接受或售后结果，会形成第二套业务真相。

## Human-confirmed items pending UD review

- 内部 ItemModel / Item 与外部 Product / ProductVariant 分层。
- 外部层必须通过受控 mapping 关联内部履约对象。
- Mapping 具体类型暂未冻结。
- Brand 当前不拆独立服务，先作为具有稳定 ID 的轻量商业资料对象。
- Product 保持薄而稳定，Publication 承担厚而多变的渠道展示。
- Product 跨 Brand 复用是能力，不是强制；不同 Brand 可以用不同 Product 映射同一 Item。
- Product 保存可复用素材池，Publication 决定最终媒体方案。
- Product 与 Publication 都涉及 locale，但 Publication 必须满足渠道发布完整性。
- 询盘归 CRM / Sales，Review / QA 倾向 UGC，投诉和退货归 After-sales / Support。
- 价格第一阶段放 Sales pricing 子域，未来再评估独立 Pricing。
- Brand、Channel、Marketplace 当前不因概念存在而直接拆成独立服务。
- Adapter 负责外部协议，不拥有业务决策。
- 建立本 Workspace 保存未冻结对象概念与讨论要点。

## Open questions

1. Product 是 tenant-global、brand-neutral、brand-scoped，还是显式支持多种模式？
2. 什么业务条件要求不同 Brand 建立不同 Product？
3. ProductVariant 是否必须持久化为独立对象？
4. 一个 ProductVariant 是否允许对应多个 Item？
5. FulfillmentMappingProfile 的最小稳定 contract 是什么？
6. P1 是否只允许 DIRECT_ITEM？
7. CONFIGURABLE mapping 何时解析并如何调用 Item resolution？
8. KIT / BUNDLE mapping 与 Item Workspace 的 Kit 定义如何对齐？
9. FULFILLMENT_TIME_RESOLUTION 的最晚允许时点是什么？
10. Publication 是否允许覆盖 mapping；若允许，需要哪些审批与审计？
11. Product 与 SiteProductPublication 的 mapping 基数是什么？
12. SiteProductPublication 长期保留为 Site owner，还是成为统一 Publication 的 adapter projection？
13. Product public-safe fields 的最小集合是什么？
14. Product asset pool 与 Publication media set 的 owner contract 是什么？
15. Product locale facts 与 Publication override 如何版本化？
16. BrandProfile 由哪个现有 owner 承载？
17. TouchpointRegistry 由哪个 owner 承载？
18. 同一个 Marketplace store 与 Brand、market、tenant org 如何绑定？
19. channel taxonomy 与 Product commercial classification 如何映射？
20. Product lifecycle 与 Publication lifecycle 如何联动？
21. Pricing context 以 ProductVariant、Item 还是两者作为规则目标？
22. 价格、库存与 publication publish lifecycle 如何保持业务一致性？
23. Review / QA 是独立 UGC owner，还是先在现有边界内实现？
24. 哪些 adapter complexity signals 触发独立部署？
25. 第一阶段应从 owned Site direct-item publication，还是 Marketplace listing 开始验证？

## Known conflicts

- 将 Site Service 降级或把 SiteProductPublication 上移的候选方向，与当前稳定的 P1 Site publication 和 runtime governance 冲突；任何迁移都需重新设计。
- Brand Service、Channel Service 和 Marketplace Connector Service 只是候选边界；当前 Human-confirmed direction 反对过早拆服务。
- 当前 SiteProductPublication 存在，但 Product Master identity、mapping、lifecycle 和 public-safe fields 尚未冻结。
- ProductPublicView 已有 contract shape，但该 shape 不构成 Product 聚合已冻结的证据。
- Item Master 要求 SalesOrderLine 最终引用稳定 itemId；开放式 fulfillment-time mapping 必须在该边界前完成解析。
- Sales 当前把完整 Pricing Engine 和客户产品目录列为 deferred，本 Workspace 的 Pricing 只是方向。
- Asset Service 当前 Site Media 边界不等于全域 Product asset pool contract。
- Product Review / QA 仍在 Active Workspace，UGC owner 尚未进入稳定 architecture。
- Product、ProductVariant、Publication、BrandProfile、TouchpointRegistry 与 FulfillmentMappingProfile 均尚未成为规范对象。

## Intended truth-source changes

设计冻结后，预计分别更新：

- Product 或商业产品 owner 的唯一 service truth source；
- [Item Master Service](../../architecture/services/item-master-service.md) 的外部 mapping 引用边界；
- [Site Service](../../architecture/services/site-service.md) 的 Product Master collaboration；
- [Site Public Views Contract](../../contracts/site-service/public-views.md)；
- [Sales Service](../../architecture/services/sales-service.md) 的 ProductVariant resolution、Item snapshot 与 pricing context；
- [Asset Service](../../architecture/services/asset-service.md) 的 Product consumer 边界；
- CRM、UGC、After-sales 的 source routing；
- Product–Item–Site–Sales collaboration；
- 必要的 Product、ProductVariant、Publication 与 mapping contracts；
- 如存在长期高影响取舍，再新增或更新 ADR。

不得在多个服务文件中分别定义 Product 或 Touchpoint identity。

## Next discussion point

先冻结 Product identity 与 ProductVariant 的最小语义，再讨论服务：

1. Product 是否默认 brand-neutral；
2. 何时不同 Brand 必须建立不同 Product；
3. ProductVariant 是否必须具有稳定 identity；
4. P1 是否只支持 DIRECT_ITEM mapping；
5. Publication 默认是否禁止覆盖 fulfillment mapping。

使用以下场景验收：

    Same internal Item X
      -> Brand A Product A100
      -> Brand B Product B-Classic
      -> Official Site Publication
      -> Amazon Publication

只有 Product、ProductVariant、mapping 与 Publication 的身份在该场景中清晰，才进入字段、服务归属和实现讨论。
