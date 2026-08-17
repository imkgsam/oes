# Item Configuration / Kit / Selectable Component Design Workspace

## Objective

集中收敛 Item 领域中尚未冻结的对象与行为概念，重点讨论 Kit、Phantom、Configurable、Configuration Result、Selectable Component，以及配置结果何时沉淀为 Item。

本文不是 Item Master 全量设计复述。已经进入稳定架构与合同的 ItemModel、Item、Attribute、Packaging 和基础 BOM 结论只作为约束引用，不在本文重新定义。

讨论结论冻结后，应回写对应规范真相，并从本文移除。本文最终不应成为第二份 Item Master 稳定真相。

## Scope

本文覆盖：

- Kit 的业务身份、销售引用与履约展开；
- Kit composition 与现有 BOM 类型的关系；
- Phantom 的精确定义与执行位置；
- ItemModel 的 configurable / static variant 行为；
- Configuration Result 的生命周期与业务用途；
- ItemModel 上的可选配件、组件、说明书、标签和其他选择规则；
- 配置结果命中、创建或复用 Item 的规则；
- Item、订单配置快照、Kit、包装成品之间的选择标准；
- 相关销售、采购、BOM、WMS 边界与验证场景。

本文不重新设计：

- ItemModel、Item、Attribute 的已冻结基础身份；
- PackagingMethod、PackagingSpec 与 PACKAGING_BOM 的基础定义；
- InventoryUnit、InventoryBalance 和 PackageUnit 的完整模型；
- 销售定价、采购报价或制造执行流程；
- WMS 的 InventoryStatus、ReservationStatus 和 PackageUnit 生命周期。

## Current truth baseline

继续讨论必须以以下规范真相为基线：

- [Item Master Service](../../architecture/services/item-master-service.md)
- [Item Master Contracts](../../contracts/item-master-service/README.md)
- [Item Master / Sales / MES / WMS / SRM Collaboration](../../architecture/collaborations/item-master-sales-mes-wms-srm.md)
- [Commercial Product and Channel Publication Design Workspace](commercial-product-and-channel-publication-design.md)
- [Packaging Master Design Workspace](packaging-master-design.md)
- [WMS Inventory Unit / Package Unit Design Workspace](wms-inventory-package-unit-design.md)

当前已经冻结的约束包括：

1. ItemModel 是唯一模型层对象，所有 Item 都必须关联一个 ItemModel。
2. ItemModel 不参与采购、销售、库存、生产、BOM 或包装的最终执行；执行最终落到 Item。
3. Item 是稳定可执行物料身份，当前由 ItemModel、locked AttributeOption combination 与 optional PackagingSpec 唯一确定。
4. Item 不自动穷举生成，可手工、批量或由配置流程按需创建。
5. Attribute 只描述物料本体或规格识别属性。
6. 包装方式、客户包装、随箱配件、说明书和标签不作为本体 Attribute。
7. ItemCategory 只负责 tenant 内分类、浏览、搜索与统计分组，不承载 capability 模板。
8. ItemModel.capabilities 是允许范围与默认值；Item.capabilities 是执行真相。
9. 当前稳定 BOM 类型是 COMPOSITION_BOM、TRANSFORMATION_BOM 与 PACKAGING_BOM。
10. PackagingMethod、PackagingSpec 与 PACKAGING_BOM 已从 Attribute 中分离。
11. PackagedItem 不是独立聚合，而是满足包装成品约束的 Item。
12. PackageUnit 是箱、托、包裹或搬运结构，不是 InventoryBalance 主体。
13. 虚拟套装、kit 销售展开、kittable、consumable、复杂 AttributeCombinationRule 与可选 BOM 行仍属于 deferred 范围。

这些已冻结结论只作为本文设计边界。后续若要修改，必须给出新的业务证据并显式重开对应稳定设计。

## Coverage assessment of current candidates

| 讨论主题 | 当前状态 | 本文处理 |
| --- | --- | --- |
| ItemModel 是模板、Item 是执行对象 | 已冻结 | 只引用 |
| 业务模块最终引用 Item | 已冻结 | 只引用 |
| 所有 Item 是否需要 ItemModel | 已由后续设计冻结为必须关联 | 旧结论失效 |
| Category / Type / Capability 分工 | 已由后续设计重构 | 只引用当前真相 |
| Attribute 只表示本体规格 | 已冻结 | 只引用 |
| 包装不作为 Attribute | 已冻结 | 只作为配置约束 |
| 包装是否形成库存 Item | 基础规则已冻结 | 用于验证配置结果 |
| PackageUnit 表示物理装箱 | 已冻结概念 | 生命周期继续留在 WMS Workspace |
| Kit | 未冻结 | 本文重点 |
| Phantom | 未冻结 | 本文重点 |
| Configurable | 未冻结 | 本文重点 |
| Selectable Component | 未冻结 | 本文重点 |
| 配置结果与 Item 生成 | 未冻结 | 本文重点 |
| Sales / Procurement 解析 Item | 未冻结 | 本文重点 |

## Current proposed design

本节保存仍需继续核验的候选方向，不构成冻结结论。

### 1. Item materialization principle

不是所有 Attribute、配件、包装和客户要求的组合都应自动生成 Item。

一个配置结果在需要成为长期、稳定、可审计的执行身份时，倾向沉淀为 Item。判断信号包括：

- 仓库需要分别管理、盘点、占用或发货；
- 销售需要长期反复选择；
- 采购需要作为稳定采购对象；
- 生产需要作为正式目标；
- 需要稳定 BOM；
- 需要单独成本核算；
- 需要独立条码或追溯；
- 需要跨订单复用；
- 包装结果需要进入正式库存。

若组合只服务单个订单，且无需长期复用，倾向保存在交易配置快照或包装要求快照中。

仍需冻结：

- 哪些信号是强制创建 Item，哪些只是建议；
- 谁可以触发创建；
- 是否需要审批；
- Item 创建前业务流程如何继续；
- 配置变更后已有交易引用哪个不可变快照。

### 2. Configuration Result

Configuration Result 是讨论中的候选中间概念，用于保存一次已校验的配置选择，例如：

- 本体 AttributeOption；
- 可选配件或组件；
- 包装方案；
- 客户临时要求；
- 说明书或标签要求；
- 命中的 Item 或待创建 Item；
- 对 BOM、成本、交期和履约的影响摘要。

它可能导向：

1. 命中并复用已有 Item；
2. 创建或申请创建新 Item；
3. 只生成 Sales / Procurement transaction snapshot；
4. 形成 Kit 展开；
5. 选择 PackagingSpec 或临时包装要求。

尚未证明 Configuration Result 必须成为长期独立聚合。需要先回答它是否拥有交易快照、配置命令和 Item resolution result 都无法承载的独立业务真相。

若保留，应避免成为永久的万能配置容器。

### 3. Static variants and configurable models

Configurable 更接近 ItemModel 的配置或解析方式，而不是 Item 的本质类型。

候选区分：

- Static variants：常用 Item 预先创建，用户从现有 Item 中选择；
- Configurable model：用户按规则选择 Attribute、组件或包装，系统再解析已有 Item、生成快照或触发新 Item。

需要继续决定：

- 是否需要显式 configurationMode；
- 模式是 ItemModel 的字段、独立规则对象还是纯工作流能力；
- 普通 ItemModel 是否也能按需生成少量 Item；
- 可配置模式如何验证互斥、依赖和禁用组合；
- 规则变化是否影响已有 Item；
- 如何保证同一组合只解析到一个 Item；
- 何时使用 AttributeCombinationRule。

### 4. Selectable Component

配件选配回答的是：

“某个 ItemModel 在销售、采购、装配或包装上下文中，可以搭配哪些其他 Item？”

候选内容包括：

- 普通盖板与智能盖板；
- 水件；
- 安装附件；
- 说明书；
- 标签；
- 随箱配件；
- 可选服务。

它们不应统一塞入 Attribute，因为它们通常是独立 Item，具有自己的库存、采购、成本和生命周期。

候选规则需要表达：

- 可选项集合；
- required / optional；
- single-select / multi-select；
- 默认选择；
- 数量；
- 兼容条件；
- 互斥与依赖；
- 适用市场、客户或渠道；
- 选择后影响的对象。

影响类型至少需要区分：

1. 功能装配：可能进入 COMPOSITION_BOM；
2. 随箱内容：可能进入 PACKAGING_BOM；
3. 销售组合：可能进入 Kit composition；
4. 一次性交易要求：只进入 transaction snapshot；
5. 长期形成不同库存身份：应解析或创建不同 Item。

当前不预设必须存在名为 ItemModelSelectableOption 或 ItemModelSelectableComponent 的新聚合；名称和所有权应在语义冻结后决定。

### 5. Kit

当前较稳定的业务直觉是：

- Kit 可以作为销售报价或销售订单行；
- Kit 对客户和销售表现为一个整体；
- 履约时通常展开为多个 component Item；
- Kit 自身通常不进入库存余额；
- 库存可用量与缺货判断通常来自组件；
- sellable=true 与 stockable=false 只能表达准入，尚未表达组件展开语义。

因此，Kit 需要 capability 之外的结构定义。

仍需决定：

- Kit 是 ItemModel.modelType=VIRTUAL_KIT、Item 结构标记、独立 KitDefinition，还是其他受控概念；
- Kit 是否必须有一个稳定 Item 作为销售父项；
- Kit composition 是否复用 BOM 聚合；
- 若复用，新增 KIT_BOM 还是使用独立 execution behavior；
- Kit 价格在父项、组件或两者的优先级；
- 订单、拣货、发货、发票、退货和售后分别展示父项还是组件；
- 组件替换、数量变化和版本如何处理；
- Kit 可用量如何计算；
- Kit 能否包含服务、包装成品或另一个 Kit；
- Kit 是否允许预先组套但仍按组件库存。

“可销售但不库存”本身不足以识别 Kit，因为服务等对象也可能具备相同 capability 组合。

### 6. Stockable assembled or packaged item versus Kit

需要明确区分：

#### Kit

- 对外卖一个组合；
- 库存仍由组件 Item 表达；
- 履约时展开组件；
- 临时装箱可由 PackageUnit 表达；
- 通常不产生新的库存余额主体。

#### Stockable assembled or packaged Item

- 组合或包装结果本身成为正式 Item；
- 可提前生产、组装或包装并入库；
- 可被未来订单直接占用；
- 需要独立盘点、成本、条码或追溯；
- 输入和输出关系由 COMPOSITION_BOM 或 PACKAGING_BOM 表达。

二者可能属于同一个业务产品族，但不能因展示名称相近而混用库存语义。

### 7. Phantom

Phantom 的候选定义是 BOM 或 MRP 中的逻辑结构层：

- 用于模块化、复用和维护 BOM；
- 自身通常不库存；
- 自身通常不生成独立生产或入库步骤；
- 计划或执行展开时跳过该层，直接使用底层组件。

它与 Kit 的区别：

- Kit 主要服务销售与履约展开；
- Phantom 主要服务工程结构、计划和制造展开。

它与普通半成品的区别：

- 普通半成品可以被制造、入库、占用和追溯；
- Phantom 层通常不形成这些执行事实。

仍需决定：

- Phantom 是 BOM header type、BOM line behavior 还是 component expansion policy；
- Item Master 只定义结构，还是 MES/MRP 拥有展开策略；
- 成本滚算、替代料、版本和有效期如何穿透；
- 循环检测如何覆盖 Phantom 展开；
- 是否允许 Phantom 指向一个真实可库存 Item；
- 是否需要任何 phantom Item，还是只需要结构节点。

### 8. Packaging interaction

包装设计已冻结的部分继续约束配置：

- PackagingMethod 是方式分类；
- PackagingSpec 是具体长期包装规格；
- PACKAGING_BOM 表达实际包装消耗；
- 一次性客户包装要求可保存在 transaction snapshot；
- 需要作为库存管理的包装结果形成 PackagedItem；
- 纯物理装箱关系由 PackageUnit 表达。

本文只继续研究：

- 配置流程何时选择 PackagingSpec；
- PackagingSpec 如何参与 Item resolution；
- 可选配件进入功能结构、随箱内容或销售 Kit 时如何分流；
- 配置结果如何避免同时重复创建普通 Item、PackagedItem 与 Kit；
- 长期客户包装与临时订单包装之间的升级路径。

### 9. Inventory and fulfillment boundary

如果同一马桶搭配不同盖板：

- 若搭配后作为不同成品库存管理，应形成不同 Item，并使用 COMPOSITION_BOM 表达输入；
- 若马桶和盖板分别库存，只在销售或履约时组合，可由 Kit 或 transaction configuration 表达；
- 若订单触发装配后立即发货但不长期入库，需要交易快照与执行任务承接；
- 若装配结果进入库存，则必须形成稳定 Item。

如果 Kit 组件已经装箱但尚未发货：

- 组件仍是库存内容；
- PackageUnit 表达它们已经被物理包装在一起；
- picked、packed、staged、reserved 等状态属于 WMS 库存与履约状态设计；
- PackageUnit lifecycle、InventoryStatus 与 ReservationStatus 继续在 WMS Workspace 冻结，不由本 Item Workspace 定义。

### 10. Cross-service ownership

候选责任边界：

- Item Master：ItemModel、Item、Attribute rules、稳定结构定义以及 Item resolution 所需的主数据规则；
- Sales：客户选择、报价/订单配置、价格与交易快照；
- Procurement：采购配置、供应商报价和采购交易快照；
- MES：生产、装配与 Phantom 执行展开；
- WMS：库存、拣货、装箱、PackageUnit 与履约状态；
- Pricing owner：Kit 父项与组件价格计算；
- SRM：供应商可供应关系，不拥有 Item 配置真相。

跨服务接口必须返回稳定 Item 或明确的配置快照，不应让各服务复制 Item 生成规则。

## Human-confirmed items pending UD review

- 建立一个 Item 相关 Workspace，集中保存尚未冻结且与 Item 高度相关的对象概念。
- Workspace 应聚焦未冻结内容，而不是再次复述完整 Item Master 设计。
- Kit、Phantom、Configurable、Selectable Component 和 Item materialization 均应保留并继续讨论。
- 包装、Attribute、ItemModel 与 Item 的已冻结基础结论作为约束引用。
- 不同盖板、分体马桶独立/合并包装、临时配置和已装箱待发货等场景继续作为设计验证输入。

## Open questions

1. Kit 的最小稳定对象组合是什么？
2. Kit 是否必须拥有一个可销售 Item 父项？
3. Kit composition 使用现有 BOM、新的 KIT_BOM，还是独立 KitDefinition？
4. Kit 在报价、订单、发票、拣货、发货、退货与售后中的父子行语义是什么？
5. VIRTUAL_KIT modelType 在 Kit 仍 deferred 时承担什么稳定含义？
6. Phantom 属于 BOM header、BOM line 还是 MES/MRP expansion policy？
7. 是否需要显式 ItemModel configurationMode？
8. Configuration Result 是否拥有独立且长期存在的业务真相？
9. 配置结果何时自动复用 Item、创建 Item、申请创建或只保留 snapshot？
10. Item 去重与并发创建如何满足唯一性？
11. Selectable Component 的规则由 Item Master 还是消费上下文拥有？
12. 同一个可选 Item 如何区分功能组件、随箱内容、Kit component 与临时交易要求？
13. 可选组件变化如何影响 BOM、成本、交期和已有 Item？
14. 长期客户专属配置如何从 transaction snapshot 晋升为稳定主数据？
15. WMS 在 Kit 已装箱待发货时需要哪些 PackageUnit 与库存状态契约？

## Known conflicts

- 既有 Item Workspace 曾允许 Item 没有 ItemModel；当前稳定设计要求所有 Item 必须关联 ItemModel。
- Category 提供 capability 模板的候选方向，与当前 ItemCategory 只负责分类的稳定边界冲突。
- 暂缓 packable / packaged 的候选方向，已被当前稳定 capability 设计取代。
- 当前稳定 modelType 列出 VIRTUAL_KIT，同时又明确 Kit 第一阶段 deferred，具体可执行含义尚未闭合。
- ItemType、ItemBehavior、isKit 与 capability 仍存在多种候选表达，尚无经 Human 确认的最终方案。
- Configuration Result 与 Selectable Component 均是候选概念，尚未证明必须成为独立持久化聚合。
- 当前 Item uniqueness 包含 optional PackagingSpec，但 Kit 与其他可选组件尚未纳入稳定 resolution contract。
- 既有 Item Workspace 包含已经回写稳定真相且部分被取代的结论，后续需要按文档治理收口。

## Intended truth-source changes

设计冻结后，预计分别更新：

- [Item Master Service](../../architecture/services/item-master-service.md)
- [Item Master Contracts](../../contracts/item-master-service/README.md)
- 必要的 Item / ItemModel / BOM contract
- [Item Master / Sales / MES / WMS / SRM Collaboration](../../architecture/collaborations/item-master-sales-mes-wms-srm.md)
- Sales、MES、WMS 等资源 owner 的服务规范
- 如存在长期架构取舍，再新增或更新 ADR

若某一主题需要独立长期设计，例如完整 Kit 销售履约或 Phantom MRP 展开，应从本文拆成单一主题 Workspace；本文只保留 Item 侧尚未冻结的边界。

## Next discussion point

先冻结 Kit 的最小语义，不先讨论字段：

1. Kit 是否必须是一个稳定、可销售的 Item；
2. Kit 与 stockable assembled/packaged Item 的边界；
3. Kit composition 是否属于 BOM；
4. 销售父项与履约组件的引用关系；
5. 是否仍需要 VIRTUAL_KIT modelType。

完成 Kit 语义后，再用“同一马桶搭配不同盖板”场景收敛 Selectable Component 与 Item materialization。
