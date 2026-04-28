# Item Master Service Foundation

## 1. 目标

- 将 `item-master-service` 第一阶段冻结结论回写为可执行 feature packet，作为后续 `IM-CONTRACT` 的唯一主线入口。
- 建立 `item-master-service` 第一阶段最小闭环：
  - `Item`
  - `ItemCapability`
  - `ItemComposition`
  - `SupplierItemMapping`
  - optional `ItemCategory`
- 明确 `item-master-service` 只承接独立基础主数据真相，不吞掉销售、采购、制造、仓储与供应商关系运行事实。

## 2. 不做什么

- 不在本 packet 中进入代码实现、proto 字段设计或数据库结构设计。
- 不在本 packet 中把报价、订单、价格、采购商业条款并入 `item-master-service`。
- 不在本 packet 中把 `ManufacturingSpec`、route、WIP 或 `StockItemType`、库存对象并入 `item-master-service`。
- 不在本 packet 中承诺 `PIM / PLM / PackagingOption / PackageSpec / PackagingBOM`。
- 不在本 packet 中承诺 nested bundle、多层包装、客户专属配置或营销展示对象。

## 3. 上游依赖

- services:
  - [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
  - [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
  - [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
  - [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- collaborations:
  - [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
  - [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)
- plans:
  - [product-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/product-master-data-design.md)
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
  - [mes-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/mes-service-design.md)
  - [wms-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/wms-service-design.md)

## 4. 当前结论

- `item-master-service` 是独立基础服务，不并入 `MES`、`WMS`、`SRM` 或 `sales-service`。
- 第一阶段 owns：
  - `Item`
  - `ItemCapability`
  - `ItemComposition`
  - `SupplierItemMapping`
  - optional `ItemCategory`
- 第一阶段 does-not-own：
  - 销售 quote / order / config / price
  - 采购 `PO / receiving / commercial terms`
  - `MES ManufacturingSpec / route / WIP / process`
  - `WMS StockItemType / InventoryItem / StockLot / PackageUnit / FulfillmentSet`
  - `SRM Supplier / SupplierContact`
  - `CRM opportunity / inquiry / customer product interest`
  - `PIM / PLM / PackagingOption / PackageSpec / PackagingBOM`
- `Item` 分类冻结为：
  - `structureType: SINGLE | BUNDLE`
  - `natureType: PHYSICAL | VIRTUAL | SERVICE`
- 第一阶段基础能力冻结为：
  - `sellable`
  - `purchasable`
  - `stockable`
  - `manufacturable`
- 约束冻结为：
  - `stockable` 仅允许 `PHYSICAL`
  - `manufacturable` 仅允许 `PHYSICAL`
  - `ItemComposition.parent` 必须是 `BUNDLE`
  - nested bundle deferred
  - `SupplierItemMapping` 不承载价格、MOQ、账期、供应表现

## 5. 契约真相位置

- 稳定服务职责：
  - [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- 稳定协同蓝图：
  - [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
- 下一步 contract 入口：
  - future `docs/contracts/item-master-service/**`
  - 如需补充跨服务采用口径，可在 `docs/contracts/mes-service/**`、`docs/contracts/wms-service/**`、future `sales-service/**`、future `procurement-service/**` 中引用

## 6. 当前 slice

- slice:
  - `item-master-service` foundation
- status:
  - ready-for-im-contract
- scope:
  - `Item`
  - `ItemCapability`
  - `ItemComposition`
  - `SupplierItemMapping`
  - optional `ItemCategory`
  - MES / WMS / SRM / sales / procurement 引用边界
- ready definition:
  - 服务职责已回写
  - 协同蓝图已冻结 minimum 口径
  - `IM-CONTRACT` 可以在不重新讨论 owner 边界的前提下继续推进

## 7. 最小模型

### 7.1 Item

- 表达可被多个业务域稳定引用的基础 Item 身份。
- 第一阶段至少承载：
  - 稳定 `itemId`
  - tenant-scoped item identity / code / name
  - `structureType`
  - `natureType`
  - lifecycle / enabled state

### 7.2 ItemCapability

- 表达 Item 是否可销售、可采购、可库存、可制造。
- 第一阶段只冻结 capability 语义与约束，不扩张到价格、供应策略、履约策略或制造模板。

### 7.3 ItemComposition

- 表达套装 Item 与组件 Item 的静态组成关系。
- 第一阶段只支持单层关系，`parent` 必须为 `BUNDLE`。
- 组件可以继续是 `SINGLE` Item；nested bundle deferred。

### 7.4 SupplierItemMapping

- 表达供应商侧型号、编码或别名如何映射到 OES 的 `Item`。
- 第一阶段只承载映射与基础可用状态，不扩张到价格、MOQ、账期、到货表现或评分。

### 7.5 optional ItemCategory

- 用于支持 Item 的基础分类树或分类引用。
- 第一阶段保持 optional，不阻塞 `Item` / capability / composition / supplier mapping 主链落地。

## 8. 采用规则

### 8.1 Sales / CRM

- `sales-service` 只消费 `sellable Item`。
- 销售报价、订单行、配置与价格必须留在销售域，不得反向写入 `Item` 真相。
- 客户机会、询盘、客户兴趣继续归 `crm-service` 或 `sales-service`。

### 8.2 Procurement / SRM

- future `procurement-service` 只消费 `purchasable Item` 与 `SupplierItemMapping`。
- `srm-service` 继续拥有 `Supplier`、`SupplierContact` 真相。
- `SupplierItemMapping` 不能被采购字段膨胀成“供应商商品主档”。

### 8.3 MES

- `ManufacturingSpec` 必须引用 `manufacturable` 且 `PHYSICAL` 的 `Item`。
- `WipUnit` 引用 `ManufacturingSpec`，不直接拿 `Item` 替代制造执行对象。
- route / process / WIP 真相继续归 `mes-service`。

### 8.4 WMS

- `StockItemType` 继续归 `wms-service`，只引用 `Item`。
- 虚拟套装不直接成为库存。
- `PackageUnit` / `FulfillmentSet` 继续归 `wms-service`，不提前回收至 `item-master-service`。

## 9. 真实案例基线

分体立柱盆案例采用以下统一建模口径：

- 套装 Item：
  - `BUNDLE + VIRTUAL + sellable`
- 洗手盆 Item：
  - `SINGLE + PHYSICAL`
- 立柱 Item：
  - `SINGLE + PHYSICAL`
- 套装与组件通过 `ItemComposition` 关联

这意味着：

- 销售可以卖虚拟套装
- WMS 不必直接把该虚拟套装当库存对象
- MES 若需要制造组件，引用组件级 `PHYSICAL Item`

## 10. Deferred 清单

- nested bundle / 多层套装
- 销售配置、客户专属组合、报价价格
- 采购价格、MOQ、账期、供应表现
- `ManufacturingSpec`、route、工序、WIP
- `StockItemType`、`InventoryItem`、`StockLot`
- `PackageUnit`、`FulfillmentSet`
- `PackagingOption`、`PackageSpec`、`PackagingBOM`
- `PIM / PLM` 与营销展示对象
- `Supplier` / `SupplierContact` 主档治理
- 客户产品兴趣、机会、询盘真相
- `ItemCategory` 的完整治理策略与层级规范

## 11. 下一步 contract / proto 设计输入

- `IM-CONTRACT` 第一优先应冻结 command / query 边界，而不是先画数据库或 proto 字段细节。
- 必须先回答的 contract 输入：
  - `Item` 的新增、修改、启停、查询最小操作面
  - capability 的读写边界与约束校验返回语义
  - `ItemComposition` 的维护与读取语义
  - `SupplierItemMapping` 的维护、去重与查询语义
  - optional `ItemCategory` 是否在第一批 contract 中出现，还是延后
  - `MES` 如何校验“某 Item 是否可被 `ManufacturingSpec` 引用”
  - `WMS` 如何校验“某 Item 是否允许成为 `StockItemType` 引用基础”
  - future `sales / procurement` 如何按 capability 过滤可选 Item
- 第一阶段不要求先冻结事件全集：
  - 如下游只需在线校验，可先以同步查询契约为主
  - 若后续需要缓存、搜索、BI 或读模型增量更新，再单独冻结事件集

## 12. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| architecture writeback owner | 回写 `item-master-service` 稳定真相源 | `docs/architecture/services/item-master-service.md`, `docs/architecture/collaborations/item-master-sales-mes-wms-srm.md`, `docs/plans/features/item-master-service-foundation.md` | design workspace 与本轮冻结结论 | 服务职责、协同蓝图、feature packet | completed |
| contract owner | 冻结 `item-master-service` 黑盒契约 | future `docs/contracts/item-master-service/**` | 本 feature packet、服务职责、协同蓝图 | management / query / validation contracts | pending |
| implementation owner | 在已冻结边界内实现独立基础服务 | future `src/services/**/item-master-service/**` | feature packet、contracts | 可运行服务与验证结果 | pending |

## 13. 是否进入 IM-CONTRACT

- 建议进入 `IM-CONTRACT`。
- 原因：
  - owner 边界、phase 1 范围、跨服务采用规则与 deferred 清单已经足够稳定
  - 继续停留在 design workspace 的收益已经明显低于进入黑盒契约收敛
  - 当前仍未冻结的是接口面与校验语义，而不是服务归属本身
