# WMS Inventory Unit / Package Unit Design Workspace

## 0. 文档控制

```text
designKey: wms-inventory-package-unit-design
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-05-10 00:11:19 CST
lastUpdatedBy: Codex design thread
supersedes: ambiguous packaged-unit / inventory-unit discussion
conflictResolution: 当本文与更早的 InventoryUnit、PackagedUnit、PackageUnit、InventoryBalance 讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR 明确覆盖本文时，以 architecture / ADR 为准。
```

## 1. 目标

- 冻结 WMS 中 `InventoryUnit`、`InventoryLot`、`InventoryBalance`、`PackageUnit` 的第一阶段语义。
- 明确库存内容与箱/托/搬运单元的区别。
- 支持陶瓷单件、螺丝批次、包装成品、客户包装余货、打托等场景。

## 2. 当前范围

本 workspace 负责：

- `InventoryUnit`
- `InventoryLot / StockLot`
- `InventoryBalance`
- `PackageUnit`
- `PackageUnitContent`
- `PackageUnit` nested
- `PackagedItem` 与 WMS 库存余额的关系
- WMS 包装执行后的库存语义
- `InventoryUnit` 与 `PackageUnit` 的扫码展开边界

本 workspace 不负责：

- WMS 仓库库位完整设计。
- WMS reservation / allocation 规则。
- 出库波次、拣货路径、装柜等高级履约能力。
- MES 交仓契约字段。
- 出货追溯快照。
- 条码注册表与扫码路由。

## 3. InventoryUnit

`InventoryUnit` 是 WMS 的库存内容对象。

它回答：

```text
仓库里这一份库存是什么 Item、多少数量、什么状态、在哪里、归谁、来自哪里。
```

冻结结论：

- `InventoryUnit` 关联任意 stockable `Item`。
- 它可以关联普通 Item、PackagedItem、原材料、配件、半成品、包材。
- 它不是只服务陶瓷单件。
- 它是库存数量与库存状态的明细对象。
- 如果库存是可唯一追踪单件，通常 `quantity = 1`。
- 如果库存是箱级、批次级或容器级追踪，可以 `quantity > 1`。

示例，陶瓷单件：

```text
InventoryUnit:
  itemId = MA3124 300坑距亮白半成品
  quantity = 1
  uom = PCS
  trackingMode = SERIALIZED
  locationId = 半成品仓 A01
  status = AVAILABLE
```

示例，包装成品：

```text
InventoryUnit:
  itemId = MA3124 300坑距亮白客户A包装成品
  quantity = 1
  uom = PCS
  trackingMode = SERIALIZED
```

## 4. InventoryLot / StockLot

`InventoryLot` 表示非单件追踪物料的批次。

适用：

- 螺丝。
- 包材。
- 配件。
- 原材料。
- 泥浆、釉料等批次物料。

采购 10 箱螺丝、每箱 5000 颗，推荐箱级追踪方案：

```text
InventoryLot:
  lotId = LOT-001
  itemId = M12 螺丝

InventoryUnit x10:
  INV-001 qty = 5000 PCS lotId = LOT-001
  INV-002 qty = 5000 PCS lotId = LOT-001
  ...

PackageUnit x10:
  BOX-001 contains INV-001
  BOX-002 contains INV-002
  ...
```

冻结结论：

- 箱级追踪时，创建多个箱级 `InventoryUnit`。
- 同一批次下的多个 `InventoryUnit` 共享同一个 `lotId`。
- `InventoryBalance` 汇总为总数量。
- 没有单件条码的物料，追溯到 `InventoryLot` 即可，不强行给每颗螺丝建单件对象。

## 5. InventoryBalance

`InventoryBalance` 是 WMS 的库存汇总视图。

冻结结论：

- `InventoryBalance` 按 `Item` 汇总库存数量。
- `InventoryBalance` 可以按 location、lot、status、owner 等维度进一步汇总。
- 它可以自然统计 `PackagedItem`。
- `PackageUnit` 不直接作为 balance 主体。
- `PackageUnit` 可以作为库存查询维度，但不是数量真相。

示例：

```text
InventoryBalance:
  itemId = MA3124 300坑距亮白客户A包装成品
  location = 成品仓 A
  qty = 20
```

来源：

```text
InventoryUnit / StockLedger
```

## 6. PackageUnit

`PackageUnit` 是 WMS 中箱、托、包裹、搬运单元对象。

它回答：

```text
这一箱、这一托、这个周转容器里面装了什么，怎么包装，是否嵌套。
```

冻结结论：

- 建议命名为 `PackageUnit`，不要叫 `PackagedUnit`。
- `PackageUnit` 不只服务 PackagedItem。
- `PackageUnit` 可以包含普通 Item 对应的 `InventoryUnit`，也可以包含 PackagedItem 对应的 `InventoryUnit`。
- `PackageUnit` 支持 nested。
- `PackageUnit` 是包装/搬运结构对象，不是库存数量对象。
- 外箱、内盒、托盘、周转箱都可以是 `PackageUnit`。

常见类型：

```text
CARTON
INNER_BOX
OUTER_CARTON
PALLET
CRATE
BAG
TOTE
```

常见 purpose：

```text
STORAGE
PICKING
PACKING
SHIPMENT
CUSTOMER_PACKAGING
```

## 7. PackageUnitContent

`PackageUnitContent` 表达一个 `PackageUnit` 包含哪些 `InventoryUnit`。

冻结关系：

```text
Item
  -> InventoryUnit
      -> PackageUnitContent
          -> PackageUnit
              -> parent PackageUnit
```

箱装连体马桶：

```text
InventoryUnit:
  itemId = MA3124 300坑距亮白客户A包装成品
  quantity = 1

PackageUnit:
  type = CARTON
  packagingSpecId = MA3124 客户A包装

PackageUnitContent:
  CARTON contains INV-001 qty 1
```

打托：

```text
PackageUnit: PALLET-001
  children:
    CARTON-001
    CARTON-002
```

冻结结论：

- 不在 `PackageUnit` 上用 array 字段直接保存 contents。
- `PackageUnitContent` 是 `PackageUnit -> InventoryUnit` 的关系表。
- `PackageUnitRelation` 是 `parent PackageUnit -> child PackageUnit` 的关系表。
- `InventoryUnit` 是否在某个箱/托内，以关系表和库存事件为准；必要时可以在 `InventoryUnit` 上缓存 `currentPackageUnitId` 用于查询优化，但缓存不是事实来源。

建议关系：

```text
PackageUnitContent {
  packageUnitId
  inventoryUnitId
  quantity
  uom
  status
}

PackageUnitRelation {
  parentPackageUnitId
  childPackageUnitId
  relationType
  effectiveFrom
  effectiveTo
}
```

## 8. PackageUnit 与 InventoryBalance

`PackageUnit` 不直接计入 `InventoryBalance`。

冻结结论：

- `InventoryBalance` 统计库存内容。
- `PackageUnit` 管包装/搬运结构。
- 管理员可以通过 PackageUnit 视图查看已装箱、已打托、客户专属包装余货。
- 长期包装余货应通过 `PackagedItem` 进入 `InventoryBalance`。

## 9. 包装执行与 WMS 对象

包装执行有两种模式。

### 9.1 PACK_ONLY

仅装箱/打托。

```text
输入 InventoryUnit 仍然存在
系统创建 PackageUnit
PackageUnitContent 绑定库存内容
不增加新 Item
```

数量语义：

- 不扣减原 `InventoryUnit`。
- 不新增 `PackagedItem`。
- 库存仍按原 `Item` 统计。
- WMS 只是知道这些库存当前被装入某个箱、托或容器中。

### 9.2 BUILD_PACKAGED_ITEM

构建包装成品。

```text
扣减输入库存
增加 PackagedItem 的 InventoryUnit
创建 PackageUnit 承载该 InventoryUnit
InventoryBalance 按 PackagedItem 汇总
```

数量语义：

- 输入 `InventoryUnit / InventoryLot` 被消耗或扣减。
- 输出新的 `PackagedItem InventoryUnit`。
- 新输出的 `InventoryUnit` 被放入外箱 `PackageUnit`。
- `InventoryBalance` 中减少输入 Item，增加 PackagedItem。

示例：

```text
包装前:
  MA3124 空瓷半成品 InventoryUnit x1
  水件 Lot A qty -1
  纸箱 Lot C qty -1
  说明书 Lot M qty -1

包装后:
  MA3124 普通包装成品 InventoryUnit x1
  CARTON-001 contains MA3124 普通包装成品 InventoryUnit
```

## 10. PackageUnit 创建方式

`PackageUnit` 不由用户作为技术对象手动创建，而由业务动作自动创建。

冻结结论：

- 采购收货时录入包装形式、每箱数量，系统创建箱级 `PackageUnit` 和 `InventoryUnit`。
- WMS 包装作业完成时，系统创建箱级 `PackageUnit`。
- 打托时选择多个箱，系统创建托盘级 `PackageUnit`。
- 已装箱交仓时，系统根据业务信息创建 `PackageUnit`。

界面使用业务语言：

```text
是否按箱收货
每箱数量
包装形式
PackagingSpec
是否打托
```

不暴露技术语言：

```text
是否创建 PackageUnit
```

## 11. 扫码展开边界

`PackageUnit` 可以被条码绑定，但条码注册与解析不属于 WMS。

WMS 负责在扫码服务解析到 `PackageUnit` 后，回答：

- 这个箱/托当前状态是什么。
- 当前在哪里。
- 当前包含哪些 `InventoryUnit`。
- 子箱/父托关系是什么。
- 每个 `InventoryUnit` 对应什么 `Item`、`InventoryLot`、数量和状态。

扫码服务负责：

```text
barcode -> BarcodeBinding -> PackageUnit
```

WMS 负责：

```text
PackageUnit -> PackageUnitRelation / PackageUnitContent -> InventoryUnit / InventoryLot
```

## 12. WMS 转换追溯

WMS 执行 `BUILD_PACKAGED_ITEM` 或其他库存转换时，必须保留输入输出关系。

冻结概念：

- BOM 转换不能只改库存数量。
- 必须记录输入 `InventoryUnit / InventoryLot` 与输出 `InventoryUnit` 的关系。
- 这类关系用于未来查询某个批次或某个可追踪库存最终进入了哪个成品、哪个箱、哪个客户。

对象名称冻结为概念名 `InventoryGenealogy`，字段结构后置。

```text
InventoryGenealogy
```

第一阶段至少要能表达：

```text
executionId
bomId
bomType
inputInventoryUnitId / inputLotId
outputInventoryUnitId
quantity
uom
occurredAt
operatorId
```

冻结边界：

- `InventoryGenealogy` 表示 WMS 库存对象之间的输入/输出追溯关系。
- 它用于已进入 WMS 的 `InventoryUnit / InventoryLot`。
- 未交仓的 MES `ProductionUnit` 工序结果不直接写入 WMS `InventoryGenealogy`；应由 MES 执行记录承载，后续再讨论跨 MES/WMS 的衔接。
- 具体字段、聚合边界、与 BOM / PackageUnit / Shipment 的关系后续继续设计。

## 13. 质量等级库存维度

内部质量等级不是 Item Attribute，也不进入 Item variant。

冻结结论：

- 同一个 `Item` 可以有不同内部质量等级的库存。
- WMS 应支持按 `internalQualityGrade` 与 `repairDisposition` 查询和汇总库存。
- MES 交仓时应把当前质量等级与返修状态同步给 WMS `InventoryUnit`。
- WMS 可以根据等级和返修状态执行默认库位/分区策略。

示例：

```text
InventoryBalance:
  itemId = A300 白色 单孔
  internalQualityGrade = PREMIUM
  repairDisposition = NONE_REQUIRED
  qty = 80

InventoryBalance:
  itemId = A300 白色 单孔
  internalQualityGrade = STANDARD
  repairDisposition = REPAIR_RECOMMENDED
  qty = 30
```

常见分区：

```text
PREMIUM -> 优等品区
STANDARD -> 合格品区
ECONOMY / LOW_GRADE -> 低等级品区
REPAIR_REQUIRED_* -> 待返修区
NOT_REPAIRABLE / SCRAP_GRADE -> 待报废确认区
```

“总货”不是质量等级，而是销售/分配策略。WMS 只提供按等级查询、预留和拣选能力，具体客户接受哪些等级由 Sales / Quality 策略后续决定。

## 14. 决策日志

| 日期 | 决定 | 状态 |
| --- | --- | --- |
| 2026-05-08 | `InventoryUnit` 是库存内容对象，关联任意 stockable Item。 | 已冻结 |
| 2026-05-08 | `PackageUnit` 是箱/托/搬运单元，可包含 `InventoryUnit`，并支持 nested。 | 已冻结 |
| 2026-05-08 | `PackageUnit` 不直接作为 `InventoryBalance` 主体。 | 已冻结 |
| 2026-05-08 | `PackagedItem` 是 `Item(type = PACKAGED_FINISHED_GOOD)`，可被 `InventoryBalance` 按 Item 汇总。 | 已冻结 |
| 2026-05-08 | 采购 10 箱螺丝场景采用 10 个 PackageUnit + 10 个箱级 InventoryUnit + 同一个 lotId。 | 已冻结 |
| 2026-05-08 | `PackageUnit` 由收货、包装、打托等业务动作自动创建。 | 已冻结 |
| 2026-05-09 | `PackageUnitContent` 与 `PackageUnitRelation` 是包装内容和嵌套关系事实来源，不使用 contains array。 | 已冻结 |
| 2026-05-09 | `PACK_ONLY` 不扣减原 Item、不新增 PackagedItem；`BUILD_PACKAGED_ITEM` 扣减输入并新增 PackagedItem InventoryUnit。 | 已冻结 |
| 2026-05-09 | WMS 库存转换必须保留输入输出追溯关系；具体对象结构后续冻结。 | 已冻结概念 |
| 2026-05-09 | 内部质量等级不是 Item Attribute；WMS 库存应支持按 `internalQualityGrade` 与 `repairDisposition` 维度汇总和分区。 | 已冻结 |
| 2026-05-10 | `InventoryGenealogy` 概念冻结为 WMS 库存输入/输出追溯关系；字段结构后置。 | 已冻结概念 |

## 15. 待继续细化

- WMS 库位与库存状态模型。
- Reservation / allocation 规则。
- `InventoryGenealogy` 具体对象结构。
- PackageUnit 生命周期状态。
- 出货追溯快照后置，不在本轮冻结。

- `InventoryStatus` 与 `ReservationStatus`。
- `WarehouseLocation` 层级与库位容量。
- `PackageUnit` 拆箱、换箱、合托、拆托事件。
- 客户专属库存与订单预留规则。
