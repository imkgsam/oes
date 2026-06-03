# Barcode / Trace Identity Design Workspace

> 本文是统一扫码、条码注册与追溯主体设计工作台。当前只记录已冻结或明确后置的设计结论，不替代 MES、WMS、HR、Item Master 的业务真相源；涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。

## 0. 文档控制

```text
designKey: barcode-trace-identity-design
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-05-09 14:54:56 CST
lastUpdatedBy: Codex design thread
supersedes: old ScanCode / ScanRoute draft; barcode-as-business-history discussion
conflictResolution: 当本文与更早的扫码、traceId、barcode、产品码、箱码、托盘码讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR 明确覆盖本文时，以 architecture / ADR 为准。
```

## 1. 目标

- 为 OES 中所有可扫码字符串提供统一注册、解析与绑定边界。
- 支持产品码、外箱码、托盘码、窑车码、员工码、工序输入码等不同类型。
- 避免 MES、WMS、HR、资产等服务各自定义互不兼容的码体系。
- 保持扫码平台轻量，不把业务真相集中到扫码服务。
- 支持条码补换、码失效、码重新绑定与审计。

## 2. 当前范围

本 workspace 负责：

- `Barcode`
- `BarcodeBinding`
- `TraceSubject`
- `TraceObjectLink`
- `BarcodeReplacement`
- `OperationInputCode`
- PDA / 扫码入口的第一阶段解析流程

本 workspace 不负责：

- MES 工序、报工、质检业务真相。
- WMS 库存、PackageUnit、InventoryUnit 业务真相。
- HR 员工档案与工资计算真相。
- 出货追溯快照。
- 条码打印设备与标签模板工程实现。

## 3. 核心原则

冻结结论：

- 所有可扫码字符串统一进入 `Barcode` 注册表。
- `Barcode` 不保存产品生产历史、库存历史、出货历史。
- `BarcodeBinding` 把某个码绑定到某个业务对象。
- 一个 `Barcode` 当前只能有一个有效绑定。
- 历史上一个 `Barcode` 可以发生绑定、失效、替换等变化，但必须可审计。
- 产品追溯历史挂在 `TraceSubject` 与业务事件上，不挂在 `Barcode` 上。
- 产品码绑定 `TraceSubject`。
- 外箱码、托盘码绑定 `PackageUnit`。
- 窑车码绑定 `CarrierResource`。
- 员工码绑定 `WorkerResource / Employee`。
- 属性、缺陷、结果等快捷输入码绑定 `OperationInputCode`。

## 4. Barcode

`Barcode` 表示一个被系统识别的可扫码字符串。

它回答：

```text
这个字符串是什么码？是否有效？属于哪种码？当前能不能解析？
```

建议字段：

```text
Barcode {
  id
  code
  barcodeType
  source
  status
  createdAt
  createdBy
}
```

`barcodeType` 第一阶段：

```text
PRODUCT_TRACE
PACKAGE_UNIT
CARRIER_RESOURCE
WORKER
OPERATION_INPUT
```

`source` 示例：

```text
PRE_PRINTED
INTERNAL_PRINTED
SUPPLIER_PROVIDED
MANUAL_CREATED
IMPORTED
```

`status` 示例：

```text
UNUSED
ACTIVE
INACTIVE
REPLACED
VOIDED
LOST
UNREADABLE
```

高温花纸产品码示例：

```text
Barcode:
  code = ML000000132
  barcodeType = PRODUCT_TRACE
  source = PRE_PRINTED
  status = ACTIVE
```

## 5. BarcodeBinding

`BarcodeBinding` 表示某个 `Barcode` 当前绑定到哪个业务对象。

它回答：

```text
扫到这个码后，第一跳应该找到哪个对象？
```

建议字段：

```text
BarcodeBinding {
  id
  barcodeId
  targetType
  targetId
  active
  boundAt
  boundBy
  unboundAt
  unboundBy
  reason
}
```

冻结绑定规则：

| 码类型 | 当前绑定对象 |
| --- | --- |
| 产品码 | `TraceSubject` |
| 外箱码 | `PackageUnit(type = CARTON / OUTER_CARTON / INNER_BOX)` |
| 托盘码 | `PackageUnit(type = PALLET)` |
| 窑车码 | `CarrierResource(type = KILN_CAR / PROCESS_CARRIER)` |
| 员工码 | `WorkerResource`，必要时可解析到 HR `Employee` |
| 属性/缺陷/结果码 | `OperationInputCode` |

一个码当前只能有一个有效绑定：

```text
Barcode(id=ML000000132)
  -> active BarcodeBinding
      targetType = TraceSubject
      targetId = TRACE-000132
```

## 6. TraceSubject

`TraceSubject` 是产品追溯主体。

它不是条码本身，而是系统内部稳定的追溯身份。条码可以损坏、替换、停用，但 `TraceSubject` 不应该因为换码而改变。

它回答：

```text
这个可追溯产品/关键实物，从生产、入库、后加工、包装到出货的生命周期是谁？
```

建议字段：

```text
TraceSubject {
  id
  traceType
  status
  primaryBarcodeId
  createdAt
  createdBy
}
```

第一阶段 `traceType`：

```text
PRODUCT_UNIT
PRODUCT_SET
KEY_COMPONENT
```

连体马桶示例：

```text
TraceSubject:
  id = TRACE-MA3124-000132
  traceType = PRODUCT_SET
  primaryBarcode = ML000000132
```

这里 `PRODUCT_SET` 可以表示主体和盖子作为一套生产组合流转，哪怕只有主体贴码。

## 7. TraceObjectLink

`TraceObjectLink` 表示一个 `TraceSubject` 在不同业务阶段关联到了哪些业务对象。

它回答：

```text
这个追溯主体当前或历史上对应过哪些 ProductionUnit、InventoryUnit、PackageUnit、Shipment 等对象？
```

建议字段：

```text
TraceObjectLink {
  id
  traceSubjectId
  objectType
  objectId
  linkType
  active
  effectiveFrom
  effectiveTo
}
```

常见链接：

```text
TRACE-MA3124-000132
  -> ProductionUnit PU-000132
  -> InventoryUnit INV-000132
  -> PackageUnit CARTON-000132
```

冻结结论：

- `TraceSubject` 与业务对象的关系通过链接表表达。
- 不要求在 `ProductionUnit`、`InventoryUnit` 上把 `traceId` 作为唯一事实来源。
- 后续为性能可在高频对象上缓存 `traceSubjectId`，但缓存不是关系真相。

## 8. BarcodeReplacement

条码补换时，不迁移业务历史。

冻结结论：

- 旧 `Barcode` 标记为 `REPLACED / LOST / UNREADABLE`。
- 旧 `BarcodeBinding` 关闭。
- 新 `Barcode` 绑定到同一个 `TraceSubject`。
- 生产、库存、质检、出货历史仍然通过同一个 `TraceSubject` 查询。
- 补换动作必须记录原因、操作人、审批人和证据备注。

建议字段：

```text
BarcodeReplacement {
  id
  oldBarcodeId
  newBarcodeId
  targetTraceSubjectId
  reason
  evidenceNote
  requestedBy
  approvedBy
  replacedAt
}
```

示例：

```text
旧码 ML000000132 不可识别
-> 创建新码 ML009900132
-> 新码绑定 TRACE-MA3124-000132
-> 旧码状态 REPLACED
```

扫码旧码时，系统可以提示：

```text
该码已替换，新码为 ML009900132。
```

## 9. OperationInputCode

`OperationInputCode` 表示扫码输入值或操作快捷码。

它不是追溯对象。

适用：

- 员工扫码选择颜色。
- 质检扫码选择缺陷类型。
- 工序扫码记录 PASS / FAIL。
- 工序扫码选择返修原因。

建议字段：

```text
OperationInputCode {
  id
  codeType
  inputKey
  inputValue
  displayName
  allowedOperationTypes
  active
}
```

冻结结论：

- 员工码、产品码、箱码、托盘码、属性码、缺陷码都可以使用同一个 `Barcode` 注册表。
- 但它们绑定的目标对象不同。
- 属性/缺陷/结果码不进入 `TraceSubject`，只作为当前操作表单的输入值。

## 10. 扫码解析流程

### 10.1 统一入口

```text
PDA 扫码
-> scan identity 查询 Barcode
-> 查询 active BarcodeBinding
-> 根据 targetType 路由到对应业务服务
-> 业务服务返回当前状态、可执行动作和详情视图
```

### 10.2 扫产品码

```text
ML000000132
-> Barcode(type = PRODUCT_TRACE)
-> BarcodeBinding(target = TraceSubject TRACE-MA3124-000132)
-> TraceObjectLink 找当前对象
-> 如果仍在 MES：打开 ProductionUnit 视图
-> 如果已入库：打开 InventoryUnit / WMS 视图
-> 如果已装箱：可继续展开 PackageUnit
```

应能查看：

- 成型时间、成型工人、ProductionMold、WorkCenter。
- 工序历史。
- 质检结果、缺陷位置、缺陷数量。
- 试水时间、试水状态、操作人。
- 入库时间、入库操作人、库存停留时长。
- 后道工序、装配、打孔、打 logo、包装历史。

### 10.3 扫外箱码

```text
CTN-000132
-> Barcode(type = PACKAGE_UNIT)
-> BarcodeBinding(target = PackageUnit CARTON-000132)
-> WMS 查询 PackageUnitContent
-> 展开 InventoryUnit
-> 对可追溯产品继续找到 TraceSubject
-> 对不可追踪配件显示 InventoryLot
```

应能查看：

- 箱内有什么产品。
- 箱内产品的生产与质检历史。
- 随箱配件的批次、供应商、采购和入库信息。
- 包装规格、PackagingSpec、包装作业记录。

### 10.4 扫托盘码

```text
PLT-0009
-> Barcode(type = PACKAGE_UNIT)
-> BarcodeBinding(target = PackageUnit PALLET-0009)
-> WMS 查询 PackageUnitRelation
-> 展开子箱
-> 展开每个箱内 InventoryUnit / TraceSubject / Lot
```

应能查看：

- 托盘上有哪些外箱。
- 每个外箱装了什么。
- 每个产品或批次的追溯详情。

### 10.5 扫窑车码

```text
KILN-CAR-01
-> Barcode(type = CARRIER_RESOURCE)
-> BarcodeBinding(target = CarrierResource)
-> MES 查询当前载具状态、位置、装载、窑次或历史
```

### 10.6 扫员工码

```text
EMP-0AF-0001
-> Barcode(type = WORKER)
-> BarcodeBinding(target = WorkerResource)
-> MES / HR 根据场景执行身份确认、报工归属或权限校验
```

## 11. 客户投诉查询

客户可能提供：

- 产品码。
- 外箱码。
- 托盘码。

当前冻结口径：

- 查询入口统一从 `Barcode` 开始。
- 不要求所有码都先找到 `TraceSubject`。
- 产品码直接找到 `TraceSubject`。
- 外箱码、托盘码先找到 `PackageUnit`，再通过 WMS 内容关系展开到 `InventoryUnit / TraceSubject / InventoryLot`。

查询链路：

```text
barcode
-> BarcodeBinding
-> target object
-> 根据对象类型展开业务关系
-> 聚合 Item、InventoryUnit、InventoryLot、ProductionUnit、PackageUnit、BOM 转换、供应商、采购、仓储、质量、出货信息
```

出货那一刻的冻结快照很重要，但本轮先不冻结相关对象。

后置对象：

```text
ShipmentTraceSnapshot
ShipmentTracePackageSnapshot
ShipmentTraceInventorySnapshot
ShipmentTraceGenealogySnapshot
```

## 12. 服务边界

扫码平台负责：

- 码注册。
- 码状态。
- 码绑定。
- 码替换。
- 码解析。
- 根据绑定对象返回目标服务与对象引用。

扫码平台不负责：

- MES 的生产历史真相。
- WMS 的库存数量真相。
- HR 的员工档案真相。
- Item Master 的物料主数据真相。
- Sales / Shipment 的出货事实真相。

业务查询由目标服务负责。扫码平台只负责把“字符串”解析成“应该找哪个对象”。

## 13. 决策日志

| 日期 | 决定 | 状态 |
| --- | --- | --- |
| 2026-05-09 | 所有可扫码字符串统一进入 `Barcode` 注册表。 | 已冻结 |
| 2026-05-09 | `BarcodeBinding` 负责把码绑定到不同业务对象，一个码当前只能有一个有效绑定。 | 已冻结 |
| 2026-05-09 | 产品码绑定 `TraceSubject`，产品追溯历史挂在 `TraceSubject` 与业务事件上，不挂在 `Barcode` 上。 | 已冻结 |
| 2026-05-09 | 外箱码、托盘码绑定 `PackageUnit`；窑车码绑定 `CarrierResource`；员工码绑定 `WorkerResource / Employee`；属性/缺陷/结果码绑定 `OperationInputCode`。 | 已冻结 |
| 2026-05-09 | 条码补换时停用旧码，新码绑定同一个 `TraceSubject`，业务历史不迁移。 | 已冻结 |
| 2026-05-09 | `TraceSubject` 与 `ProductionUnit / InventoryUnit / PackageUnit` 等对象通过 `TraceObjectLink` 关联；字段级细节后续可继续优化。 | 已冻结方向 |
| 2026-05-09 | 出货追溯快照相关对象后置，不在本轮冻结。 | 后置 |

## 14. 待继续细化

- `TraceSubject` 与 `TraceObjectLink` 的字段级结构。
- PDA 扫码返回模型。
- 条码补换审批流程。
- 条码打印、预生成、批量导入流程。
- 出货追溯快照。
- 追溯查询聚合 API 的服务契约。
