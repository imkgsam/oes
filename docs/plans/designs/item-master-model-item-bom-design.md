# Item Master Model / Item / BOM Design Workspace

## 0. 文档控制

```text
designKey: item-master-model-item-bom-design
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-05-09 14:54:56 CST
lastUpdatedBy: Codex design thread
supersedes: old ProductModel / ItemModel alias discussion; old model-layer composition proposal
conflictResolution: 当本文与更早的 item/product/model/composition 讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR 明确覆盖本文时，以 architecture / ADR 为准。
```

## 1. 目标

- 冻结 OES 新一版 `ItemModel`、`Item`、Attribute 与 BOM 的基础设计。
- 保留类似 `template -> variant` 的直觉，但避免把包装、随箱配件、客户包装要求全部塞进 attribute。
- 为 Sales、Procurement、MES、WMS 使用统一 Item 主数据提供边界。

## 2. 当前范围

本 workspace 负责：

- `ItemModel` 与 `Item` 的对象边界。
- Attribute / AttributeOption 的第一阶段简版设计。
- `ItemModel -> Item` 的 variant / SKU 生成原则。
- `Item.capabilities` 的执行规则。
- `BOM` 的第一阶段类型与使用边界。
- `PackagedItem` 作为 `Item` 类型的定义。

本 workspace 不负责：

- WMS 库存数量、库位、箱托对象。
- MES 现场在制品与生产资源对象。
- Sales 报价和订单执行流程。
- Procurement / SRM 供应商报价与采购执行。
- 包装规格字段的完整工程化。
- 条码与追溯对象的完整设计。

## 3. ItemModel

`ItemModel` 是可配置物料模型 / 款式模型 / SPU / Template。

它不是单纯销售对象，而是全局主数据入口。凡是需要长期维护一个“规格族 / 款式族 / 可配置族”的对象，都可以是 `ItemModel`。

冻结结论：

- `ItemModel` 是唯一模型层对象，不再保留其他别名对象。
- `ItemModel` 可以表示成品、半成品、配件、零件、包材、组件、原材料、虚拟套装或服务。
- 是否有 attribute 选项，不决定它是否必须是 `ItemModel`。
- 不需要选型、没有规格族管理的一次性物料可以直接建 `Item`。
- `ItemModel` 不参与库存、采购、销售、生产执行的最终落地；执行最终落到 `Item`。

建议关键字段语义：

```text
ItemModel {
  id
  modelCode
  modelName
  modelKind
  modelType
  capabilities
  active
}
```

`modelKind` 表达本质类型：

```text
PHYSICAL
VIRTUAL
SERVICE
DIGITAL
```

`modelType` 表达业务分类：

```text
FINISHED_PRODUCT
SEMI_FINISHED_PRODUCT
ACCESSORY
PART
PACKAGING_MATERIAL
SUB_ASSEMBLY
RAW_MATERIAL
VIRTUAL_KIT
SERVICE
```

`ItemModel.capabilities` 表达模型级允许范围和默认规则。它不是执行真相，只用于控制该模型下允许生成什么样的 `Item`，以及创建 `Item` 时的默认值。

## 4. Item

`Item` 是固定属性后的具体 SKU / 可执行物料身份 / Variant。

冻结结论：

- `Item = ItemModel + 已锁定 AttributeOption 组合`，但 `Item` 也允许没有上层 `ItemModel`。
- `Item` 是采购、销售、库存、生产投产、生产交仓、BOM 消耗与产出、成本核算的执行层对象。
- `Item.capabilities` 表达具体 SKU 的实际执行能力。
- 所有采购、销售、库存、生产执行最终以 `Item.active` 和 `Item.capabilities` 为准。
- `Item` 本身不 nested，组成关系通过 BOM 表达。
- `Item` 不自动穷举生成。系统可按需手动创建、批量创建或由配置流程创建。
- 同一个 `ItemModel + lockedAttributes + optional packagingSpecId` 必须唯一。

示例：

```text
ItemModel: A300 台上盆

Item:
  A300 亮白 单孔
  A300 亮白 centerset
  A300 亮白 widespread
```

无孔库存示例：

```text
Item: A300 亮白 无孔
capabilities:
  stockable = true
  manufacturable = true
  sellable = false
```

销售只允许选择 `active = true` 且 `sellable = true` 的 `Item`。生产工单要生产无孔库存时，直接选择无孔 `Item`。

## 5. PackagedItem

`PackagedItem` 不是独立对象。

冻结结论：

```text
PackagedItem = Item(type = PACKAGED_FINISHED_GOOD)
```

同一个 `ItemModel` 可以生成普通 `Item` 和 `PackagedItem`：

```text
ItemModel + 本体属性
  -> 普通 Item

ItemModel + 本体属性 + PackagingSpec
  -> PackagedItem
```

普通 Item：

```text
packagingSpecId = null
```

PackagedItem：

```text
itemType = PACKAGED_FINISHED_GOOD
packagingSpecId != null
baseItemId = 被包装的基础 Item
```

例如：

```text
ItemModel: MA3124 连体马桶

普通 Item:
  MA3124 300坑距 白色 顶按 空瓷/半成品

PackagedItem:
  MA3124 300坑距 白色 顶按 普通包装成品
  MA3124 300坑距 白色 顶按 客户A加强包装成品
```

## 6. Attribute

第一阶段只冻结简单版本。

| 对象 | 定义 |
| --- | --- |
| `AttributeDefinition` | 属性定义，例如颜色、孔位、坑距、密度、长度。 |
| `AttributeOption` | 枚举属性值，例如无孔、单孔、centerset、widespread。 |
| `ItemModelAttributeRule` | 某个 `ItemModel` 允许哪些 Attribute / AttributeOption。 |

冻结结论：

- Attribute 用于表达物料本体或规格识别属性。
- 包装方式、客户包装、随箱配件、客户说明书、客户标签等不塞进 attribute。
- 包装泡沫密度如果是包装规格的一部分，属于 `PackagingSpec / PackagingBOM` 语义；如果是泡沫材料自身规格，属于泡沫这个 `ItemModel / Item` 的 attribute。
- 不在第一阶段引入复杂 `AttributeCombinationRule`。

示例：

```text
ItemModel: A300 台上盆
Attribute: faucetHolePattern
Options:
  NO_HOLE
  SINGLE_HOLE
  CENTERSET
  WIDESPREAD
```

`Item` 通过锁定选项形成：

```text
A300 亮白 无孔
A300 亮白 单孔
A300 亮白 centerset
A300 亮白 widespread
```

## 7. Item Capabilities

`capabilities` 同时存在于 `ItemModel` 和 `Item`，但语义不同：

- `ItemModel.capabilities`：模型级允许范围和默认值。
- `Item.capabilities`：执行真相。

第一阶段冻结 `Item.capabilities`：

| Capability | 执行规则 |
| --- | --- |
| `sellable` | 可在报价、销售订单、销售配置结果中作为销售执行 Item。 |
| `purchasable` | 可在采购申请、采购订单中作为采购执行 Item。 |
| `stockable` | 可被 WMS 创建 `InventoryUnit`，可进入 `InventoryBalance`。 |
| `manufacturable` | 可作为 MES `ProductionSpec / WorkOrder` 的目标 Item。 |
| `assemblable` | 可作为 `COMPOSITION_BOM` 的输出 Item。 |
| `transformable` | 可作为 `TRANSFORMATION_BOM` 的输出 Item。 |
| `packable` | 可作为 `PACKAGING_BOM` 的基础输入 Item。 |
| `packaged` | 表示该 Item 是包装成品，即 `Item(type = PACKAGED_FINISHED_GOOD)`。 |

暂不冻结：

- `traceable`：等待条码与追溯设计完成后再决定。
- `kittable`：卫浴行业第一阶段不作为核心能力。
- `consumable`：第一阶段不需要。BOM line 默认允许引用 active Item。

## 8. Active / Archived

第一阶段使用简单 active 规则。

冻结结论：

- `ItemModel.active = false` 表示该模型归档，不再用于新建业务。
- `Item.active = false` 表示该 SKU 归档，不再用于新建业务。
- 归档不删除历史，不影响已有订单、库存历史、生产历史、采购历史。
- 停用 `ItemModel` 不自动停用其下所有 `Item`，是否停用由业务操作显式决定。

所有执行入口至少校验：

```text
Item.active = true
+ 对应 capability = true
```

## 9. BOM

`BOM` 统一表达 `Item` 与 `Item` 之间的执行关系。

冻结结论：

- 当前阶段不采用模型层 composition 对象。
- 所有实际组成、半成品、配件包、包装、后加工转换、拆解关系优先通过 BOM 或 BOM 相关规则表达。
- BOM 主数据归属 `item-master-service` / BOM 子域。
- BOM 类型必须表达执行语义，不只是 UI 标签。

第一阶段 BOM 类型冻结为：

| 类型 | 语义 | 例子 |
| --- | --- | --- |
| `COMPOSITION_BOM` | 功能组成 / 装配 / 实体 Item 构建。 | 空瓷 + 水件 -> 安装水件半成品；加热组件 + 外壳 -> 智能马桶盖半成品。 |
| `TRANSFORMATION_BOM` | 经过工序把输入转成输出。 | 无孔洗手盆 -> 单孔洗手盆；无 logo 产品 -> 有 logo 产品；返修；泥浆/釉料配制。 |
| `PACKAGING_BOM` | 包装执行消耗。 | 产品 + 纸箱 + 泡沫 + 说明书 + 随箱配件。 |

后置：

- 虚拟套装 / kit 销售展开。
- 复杂替代料。
- 可选 BOM 行。

## 10. BOM 基础结构

建议第一阶段结构：

```text
BOM {
  id
  bomCode
  bomType
  outputItemId
  outputQuantity
  outputUom
  active
  revision
  effectiveFrom
  effectiveTo
}

BOMLine {
  id
  bomId
  componentItemId
  quantity
  uom
  required
  sequence
  scrapRate
  notes
}
```

基础校验冻结：

- `outputItemId` 必须指向 `active = true` 的 `Item`。
- `componentItemId` 必须指向 `active = true` 的 `Item`。
- 必须禁止 BOM 循环，包括直接循环和多层循环。
- 第一阶段不使用 `consumable` capability 限制 BOM line。

## 11. BOM 执行边界

`BOM` 只定义输入、输出、组成和消耗关系。具体怎么做由对应执行对象负责：

- MES `Operation / WorkOrder`
- WMS packaging task
- WMS assembly / transformation task

无孔打孔示例：

```text
TRANSFORMATION_BOM:
  input: A300 亮白 无孔 x1
  output: A300 亮白 单孔 x1

MES Operation:
  DRILL_SINGLE_HOLE
```

这里 BOM 不等于工序。工序、人员、WorkCenter、质量结果由 MES 或 WMS 的任务执行对象记录。

## 12. 使用方式示例

销售入口：

```text
选择 ItemModel
-> 选择本体 AttributeOption
-> 选择 PackagingSpec / 配件配置（如适用）
-> 解析为 active + sellable Item
```

采购入口：

```text
选择 ItemModel 或 Item
-> 锁定规格
-> 解析为 active + purchasable Item
```

生产入口：

```text
选择 active + manufacturable Item
-> 关联 ProductionSpec / BOM / Routing
-> 下达 WorkOrder
```

库存入口：

```text
只接收 active + stockable Item
-> 创建 InventoryUnit
-> 进入 InventoryBalance
```

## 13. 决策日志

| 日期 | 决定 | 状态 |
| --- | --- | --- |
| 2026-05-08 | `ItemModel` 是唯一模型层对象，不再保留其他别名对象。 | 已冻结 |
| 2026-05-08 | `Item` 是固定属性后的执行 SKU，也允许没有上层 `ItemModel`。 | 已冻结 |
| 2026-05-08 | `capabilities` 同时存在于 `ItemModel` 和 `Item`，执行以 `Item.capabilities` 为准。 | 已冻结 |
| 2026-05-08 | `PackagedItem` 不是独立对象，而是 `Item(type = PACKAGED_FINISHED_GOOD)`。 | 已冻结 |
| 2026-05-08 | 第一阶段 Attribute 只冻结 `AttributeDefinition`、`AttributeOption`、`ItemModelAttributeRule`。 | 已冻结 |
| 2026-05-08 | 当前阶段不采用模型层 composition 对象，实际组成关系统一通过 BOM 表达。 | 已冻结 |
| 2026-05-08 | BOM 主数据归属 `item-master-service` / BOM 子域。 | 已冻结 |
| 2026-05-08 | 第一阶段 BOM 类型为 `COMPOSITION_BOM`、`TRANSFORMATION_BOM`、`PACKAGING_BOM`。 | 已冻结 |
| 2026-05-09 | `ItemModel` 与 `Item` 使用 active/archive 简化状态；执行入口校验 active + capability。 | 已冻结 |
| 2026-05-09 | 第一阶段不冻结 `traceable`、`kittable`、`consumable` capability。 | 已冻结 |
| 2026-05-09 | BOM 必须禁止循环，不能后置。 | 已冻结 |

## 14. 待继续细化

- BOM line 与 MES Operation material requirement 的引用方式。
- 受控替代料审批模型。
- Sales / Procurement 如何从 `ItemModel + 配置` 解析到 `Item` 的接口契约。
- `ProductionSpec` 与 manufacturable Item 的完整结构。
- 条码追溯完成后是否增加 `traceable` capability。
