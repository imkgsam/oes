# Packaging Master Design Workspace

## 0. 文档控制

```text
designKey: packaging-master-design
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-05-09 14:54:56 CST
lastUpdatedBy: Codex design thread
supersedes: packaging-as-attribute discussion; complex customer override proposal for first phase
conflictResolution: 当本文与更早的包装 attribute、客户包装 override、包装 BOM 讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR 明确覆盖本文时，以 architecture / ADR 为准。
```

## 1. 目标

- 冻结包装方式、包装规格、包装 BOM 与包装成品 Item 的第一阶段边界。
- 避免把包装方式、客户外箱、说明书、标签、随箱配件塞进 attribute / variant。
- 为 Sales 选择包装、WMS 包装执行、Item Master 生成 PackagedItem 提供统一语言。

## 2. 当前范围

本 workspace 负责：

- `PackagingMethod`
- `PackagingSpec`
- `PackagingBOM`
- `PackagedItem` 与 `PackagingSpec` 的关系
- 包装执行的两种库存语义：`PACK_ONLY` 与 `BUILD_PACKAGED_ITEM`

本 workspace 不负责：

- `PackageUnit` 的完整 WMS 设计。
- WMS 库存余额与库位设计。
- 客户包装偏好的完整 Sales / CRM 设计。
- 包装模板、override、复杂 requirement 体系。
- 出货追溯快照。

## 3. PackagingMethod

`PackagingMethod` 是包装方式字典。

冻结结论：

- `PackagingMethod` 是轻量可维护字典，不建议写死成 enum。
- 它只表达包装方式大类，不表达具体包材、尺寸、BOM。
- 它可用于销售选择、客户默认、报表分类。

示例：

```text
普通包装
泡沫加强包装
蜂窝板加强包装
电商包装
```

## 4. PackagingSpec

`PackagingSpec` 是某个 `ItemModel + PackagingMethod + optional Customer` 下的具体包装规格。

冻结简版：

```text
PackagingSpec =
  ItemModel
  + PackagingMethod
  + optional Customer
```

示例：

```text
MA3124 + 电商包装
  -> MA3124 标准电商包装规格

MA3124 + 电商包装 + Customer A
  -> MA3124 客户A电商包装规格
```

第一阶段 `PackagingSpec` 保持轻量，只记录：

- 包装规格说明。
- 外箱尺寸。
- 毛重。
- 体积。
- 简单作业要求，如标签位置、封箱方式、包装备注。
- 状态、版本、生效期。

不在 `PackagingSpec` 中直接塞大量物料字段。

具体纸箱、泡沫、蜂窝板、说明书、标签、配件等消耗放到 `PackagingBOM`。

冻结使用方式：

- 先有 `ItemModel`，再为该 `ItemModel` 维护可用的 `PackagingMethod`。
- 每一个长期可选择、可维护、可报价或可执行的包装方案，创建一个 `PackagingSpec`。
- 标准包装创建不带客户的 `PackagingSpec`。
- 客户长期专属包装创建带 `Customer` 的 `PackagingSpec`。
- 客户临时一次性包装可以先作为订单包装配置快照；如果会产生长期余货、长期复用或客户专属库存，再沉淀为 `PackagingSpec` 和 `PackagedItem`。

示例：

```text
ItemModel: MA3124 连体马桶

PackagingMethod:
  普通包装
  泡沫加强包装

PackagingSpec:
  MA3124 + 普通包装
  MA3124 + 泡沫加强包装
  MA3124 + 泡沫加强包装 + Customer A
```

## 5. PackagingBOM

`PackagingBOM` 是 `BOM(type = PACKAGING_BOM)`。

它表达包装执行时实际消耗哪些 `Item`。

冻结结论：

- `PackagingBOM` 的主数据仍归属 Item Master / BOM 子域。
- `PackagingSpec` 用来说明包装规格与包装作业要求。
- `PackagingBOM` 用来说明完成该包装时消耗什么库存 Item。
- 包装方式不是 Attribute；客户纸箱、说明书、标签、随箱配件也不是产品本体 Attribute。
- 安装在产品功能结构上的组件不是 `PackagingBOM`，而是 `COMPOSITION_BOM`。

示例：

```text
PackagingSpec: A300 大盆普通包装

PackagingBOM:
  A300 洗手盆白色单孔 x1
  A300 普通纸箱 x1
  三角柱 x2
  说明书 x1
```

电商包装示例：

```text
PackagingSpec: A300 电商包装

PackagingBOM:
  A300 洗手盆白色单孔 x1
  A300 全包泡沫 x1
  电商外箱 x1
  说明书 x1
```

分体立柱盆合并包装示例：

```text
PackagingSpec: P100 立柱盆合并电商包装

PackagingBOM:
  P100 洗手盆白色单孔 x1
  P100 立柱白色 x1
  合并泡沫 x1
  合并纸箱 x1
  说明书 x1
```

## 6. PackagedItem

`PackagedItem` 不是独立对象。

冻结结论：

```text
PackagedItem = Item(type = PACKAGED_FINISHED_GOOD)
```

它由：

```text
base Item + PackagingSpec
```

派生。

普通 Item：

```text
packagingSpecId = null
```

包装成品 Item：

```text
itemType = PACKAGED_FINISHED_GOOD
packagingSpecId != null
baseItemId != null
```

同一个 `ItemModel` 可以生成普通 `Item` 和 `PackagedItem`。

冻结使用方式：

```text
普通 Item:
  ItemModel + 本体属性
  packagingSpecId = null

PackagedItem:
  ItemModel + 本体属性 + PackagingSpec
  packagingSpecId != null
  baseItemId = 普通 Item
```

普通 Item 与 PackagedItem 的区别不是对象类型完全不同，而是同一 `Item` 表中的不同业务语义。

示例：

```text
ItemModel: MA3124 连体马桶
本体属性: 300坑距 + 白色 + 顶按

普通 Item:
  MA3124 300坑距 白色 顶按 半成品/基础成品

PackagedItem:
  MA3124 300坑距 白色 顶按 普通包装成品
  MA3124 300坑距 白色 顶按 Customer A 泡沫加强包装成品
```

## 7. 包装执行语义

包装执行有两种库存语义。

### 7.1 PACK_ONLY

仅装箱/打托，不生成新 `Item`。

冻结结论：

- 输入 `InventoryUnit` 仍然存在。
- 系统创建 `PackageUnit`。
- `PackageUnit` 表示这些库存被装在哪个箱/托里。
- 不发生“输入扣减、输出 PackagedItem 增加”。

适用：

- 临时订单包装。
- 短期专属包装。
- 仓库内部临时打托。
- 不需要按包装后 SKU 长期管理库存的场景。

### 7.2 BUILD_PACKAGED_ITEM

构建包装成品。

冻结结论：

- 按 `PackagingBOM` 扣减输入 `Item` 库存。
- 增加输出 `PackagedItem` 库存。
- 同时创建 `PackageUnit` 承载该 `PackagedItem` 对应的 `InventoryUnit`。

适用：

- 长期包装余货。
- 客户专属备货。
- 需要按包装成品 SKU 查看库存。
- 需要报价、预留、复用或重新分配的包装成品。

执行结果：

```text
输入库存:
  base Item InventoryUnit
  packaging material InventoryUnit / InventoryLot
  in-box accessory InventoryUnit / InventoryLot

输出库存:
  PackagedItem InventoryUnit

包装结构:
  PackageUnit contains PackagedItem InventoryUnit
```

## 8. 包装余货规则

包装好的余货必须在 WMS 可见。

冻结结论：

- 长期余货 / 可复用客户包装库存，应创建 `PackagedItem` 并进入 `InventoryBalance`。
- 短期订单专属余货，可以不建 `PackagedItem`，但必须通过 `PackageUnit + config snapshot` 在 WMS 可查询。
- 只要包装好的余货会长期留库、未来复用、重新分配、报价、预留或作为客户专属库存管理，就应该创建 `PackagedItem`。

## 9. COMPOSITION_BOM 与 PACKAGING_BOM 边界

功能装配用 `COMPOSITION_BOM`。

出货包装用 `PACKAGING_BOM`。

示例：

```text
空瓷 + 水件
  -> COMPOSITION_BOM
  -> 安装水件半成品

安装水件半成品 + 纸箱 + 配件
  -> PACKAGING_BOM
  -> PackageUnit 或 PackagedItem
```

分体立柱盆合并包装属于包装语义：

```text
洗手盆 + 立柱 + 合并纸箱 + 合并泡沫
  -> PACKAGING_BOM
```

因为它们是放进同一个包装箱，不是功能上装配成一个不可分产品。

马桶水件边界示例：

```text
水件安装到马桶水箱内，并改变产品功能状态
  -> COMPOSITION_BOM

法兰圈、螺丝、说明书放入外箱随货交付
  -> PACKAGING_BOM
```

因此，“配件”不是一个统一语义。它必须按使用位置区分：

- 安装到产品上：功能组成，走 `COMPOSITION_BOM`。
- 放入包装内：随箱内容，走 `PACKAGING_BOM`。
- 临时搭售但不装箱成一体：后续再考虑虚拟套装，不进入第一阶段核心。

## 10. 决策日志

| 日期 | 决定 | 状态 |
| --- | --- | --- |
| 2026-05-08 | 包装从 Attribute 中抽离，使用 `PackagingMethod / PackagingSpec / PackagingBOM / PackageUnit` 表达。 | 已冻结 |
| 2026-05-08 | `PackagingMethod` 是轻量包装方式字典。 | 已冻结 |
| 2026-05-08 | 第一阶段 `PackagingSpec = ItemModel + PackagingMethod + optional Customer`。 | 已冻结 |
| 2026-05-08 | `PackagingSpec` 只记录尺寸、毛重、体积和简单作业要求；具体物料消耗放 `PackagingBOM`。 | 已冻结 |
| 2026-05-08 | `PackagedItem = Item(type = PACKAGED_FINISHED_GOOD)`，由 base Item + PackagingSpec 派生。 | 已冻结 |
| 2026-05-08 | 包装执行分为 `PACK_ONLY` 与 `BUILD_PACKAGED_ITEM`。 | 已冻结 |
| 2026-05-09 | 安装到产品功能结构上的组件走 `COMPOSITION_BOM`，随箱内容走 `PACKAGING_BOM`。 | 已冻结 |
| 2026-05-09 | 客户长期专属包装使用客户级 `PackagingSpec`；一次性临时包装可先用订单配置快照。 | 已冻结 |

## 11. 待继续细化

- 客户级包装规格如何版本化。
- 标签、粘贴、拍照、封箱等作业要求是否需要独立 requirement 对象。
- `CustomerPackagingPreference` 归属 Sales / CRM 还是 Packaging master。
- `PackagingConfigSnapshot` 在 Sales 与 WMS 中的保存方式。
- 出货追溯快照后置，不在本轮冻结。
