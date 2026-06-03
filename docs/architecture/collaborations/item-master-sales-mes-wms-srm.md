# Item Master、Sales、MES、WMS 与 SRM 协同蓝图

## 1. 目标

定义 `item-master-service` 与 Sales、Procurement、MES、WMS、SRM 围绕统一物料主数据的协同边界，确保各业务域引用同一个 `ItemModel / Item / BOM / PackagingSpec / capability` 语义，而不是各自维护一套产品、SKU、包装或库存物料真相。

`item-master-service` 的唯一概念真相源是：

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)

本文只记录跨服务采用规则，不重复定义 item-master 内部模型。

## 2. 参与服务

- `item-master-service`
- `sales-service`
- future `procurement-service`
- `mes-service`
- `wms-service`
- `srm-service`

## 3. 协同分工

- `item-master-service`
  - 负责 `ItemModel`、`Item`、attribute、BOM、Packaging、`ItemCategory` 与 `SupplierItemMapping` 真相。
- `sales-service`
  - 负责报价、订单、销售配置、价格、客户承诺与销售交易 snapshot。
- future `procurement-service`
  - 负责采购申请、采购订单、收货预期、商业条款与采购执行语义。
- `mes-service`
  - 负责 `ProductionSpec`、`ProductionUnit`、Route、Operation、WorkCenter、质量结果与制造执行事实。
- `wms-service`
  - 负责 `InventoryUnit`、`InventoryBalance`、`InventoryLot`、`PackageUnit`、`InventoryGenealogy`、库位、库存状态与仓储执行事实。
- `srm-service`
  - 负责 `SupplierProfile`、联系人、供应商状态与供应商关系事实；future `SupplierOffering` / supplier purchasing info 后续由 SRM 承接。

## 4. 稳定协同规则

### 4.1 Item Master 主数据边界

- 各业务域必须统一引用 `item-master-service` 的 `ItemModel`、`Item`、capability、BOM 与包装规格口径。
- 采购、销售、库存、生产、BOM 消耗与产出的执行落点必须是 `Item`。
- 其他服务不得自行定义 `ProductModel`、`ItemComposition`、`StockItemType` 或脱离 item-master truth 的产品 / SKU 主数据。
- `structureType / natureType` 不再作为新协同口径；类型分类看 `ItemModel.modelKind / modelType`，执行准入看 `Item.active + Item.capabilities`。

### 4.2 Sales 侧采用口径

- `sales-service` 最终只下单 active + sellable `Item`。
- Sales 可以从 `ItemModel + AttributeOption + optional PackagingSpec` 解析到 sellable `Item`。
- `SalesOrderLine` 保存稳定 `itemId` 与销售交易 snapshot。
- 客户自己的 SKU、型号、标签显示名、出口显示语义不进入 `item-master-service`。
- 临时或一次性的包装要求可以保留在 sales snapshot；长期包装配置应沉淀为 `PackagingSpec` 与必要的 PackagedItem。

### 4.3 Procurement / SRM 侧采用口径

- future `procurement-service` 的标准采购最终引用 active + purchasable `Item`。
- Procurement 可以从 `ItemModel + AttributeOption` 解析到 purchasable `Item`，也可以直接选择 `Item`。
- `SupplierItemMapping` 归 `item-master-service`，只表达供应商侧编码 / 名称如何映射到执行层 `Item`。
- 第一阶段标准采购不强制校验 `SupplierOffering`；只校验供应商 ACTIVE 与内部 `Item.active + purchasable`。
- future `SupplierOffering` 归 `srm-service`，方向更接近 Odoo supplierinfo，可表达供应商针对内部 `Item` 或后续允许的 `ItemModel` 范围的默认价格、MOQ、lead time 等采购参考信息。
- RFQ、PO、实际成交价、历史采购价格、收货与履约继续归 procurement，不写入 `SupplierItemMapping`；`PaymentTerm` 主数据归 `finance-service`，采购交易只保存 payment term snapshot。

### 4.4 MES 侧采用口径

- `ProductionSpec.targetItemId` 必须引用 active + manufacturable `Item`。
- `ProductionUnit.currentItemId` 表达生产实物当前事实状态对应的 `Item`。
- `mes-service` 不复制 Item 主数据真相，不拥有 `ItemModel`、`Item`、BOM 或 Packaging truth。
- 工序、人员、WorkCenter、质量结果、资源使用与生产历史由 MES 执行对象记录。
- 新设计主名使用 `ProductionSpec / ProductionUnit`；旧 `ManufacturingSpec / WipUnit` 不作为新协同真相。

### 4.5 WMS 侧采用口径

- `wms-service` 为 active + stockable `Item` 创建 `InventoryUnit`。
- `InventoryBalance` 按 `Item + location + lot / quality / status` 等维度汇总库存。
- PackagedItem 仍然是 `Item`，所以包装成品库存进入通用库存余额。
- `PackageUnit` 是箱、托、包裹、搬运层级对象，不进入 `InventoryBalance`。
- 包装作业如果产出 PackagedItem，应按 `PACKAGING_BOM` 扣减输入 Item / 耗材库存，增加 PackagedItem 库存，并创建 `PackageUnit` 承载包装层级。
- `InventoryGenealogy` 由 WMS 记录库存转换、包装、装配、拆解与追溯关系。
- 新设计不使用 `StockItemType`。

### 4.6 BOM 与执行边界

- BOM 主数据归 `item-master-service` / BOM 子域。
- BOM 只定义输入、输出、组成、转换与消耗关系。
- BOM 不等于工序；具体如何执行由 MES 或 WMS 的任务执行对象负责。
- 第一阶段 BOM 类型为：
  - `COMPOSITION_BOM`
  - `TRANSFORMATION_BOM`
  - `PACKAGING_BOM`

## 5. 同步 / 异步边界

- 第一阶段优先同步：
  - `sales-service / procurement-service / mes-service / wms-service / srm-service -> item-master-service` 的 Item 引用查询、解析与 capability 校验。
  - `item-master-service -> srm-service` 的供应商引用校验。
- 第一阶段暂不冻结必须事件集：
  - 如后续需要为搜索、缓存、BI、AI 或下游读模型发布事件，应在 `CONTRACT-V2` 阶段单独冻结。

## 6. 真相归属

- `ItemModel`、`Item`、attribute、BOM、Packaging、`ItemCategory`、`SupplierItemMapping`：`item-master-service`
- 报价、订单、价格、客户配置、交易 snapshot：`sales-service`
- 采购申请、采购订单、收货预期、采购商业条款：future `procurement-service`
- `ProductionSpec`、`ProductionUnit`、路线、工序、质量结果、制造资源使用：`mes-service`
- `InventoryUnit`、`InventoryBalance`、`InventoryLot`、`PackageUnit`、`InventoryGenealogy`、仓储执行：`wms-service`
- `SupplierProfile`、联系人、供应商关系、future `SupplierOffering` / supplier purchasing info：`srm-service`
- 商机、询盘、客户产品兴趣：`crm-service`

## 7. 明确禁止

- 不让销售、采购、MES、WMS、SRM 各自维护脱离 `item-master-service` 的 Item 主数据真相。
- 不让 `item-master-service` 接管销售、采购、制造、仓储或供应商关系执行事实。
- 不把 `SupplierItemMapping` 扩成价格、MOQ、payment term snapshot、lead time 或供应表现。
- 不把 `SupplierOffering` 作为 phase 1 标准采购强制准入校验。
- 不把客户自己的 SKU / 型号 / 标签显示名写回 item-master。
- 不在 WMS 重新建立 `StockItemType` 作为 Item 的替代真相。
- 不把 BOM 写成 MES Route / Operation。

## 8. 关联文档

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
- [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
- [procurement-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/procurement-service.md)
