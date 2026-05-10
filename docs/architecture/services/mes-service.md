# MES Service Architecture Design

## 0. 文档控制

```text
designKey: mes-service-architecture
designStatus: STABLE_ARCHITECTURE_BASELINE
lastUpdatedAt: 2026-05-10 00:00:00 CST
lastUpdatedBy: Codex MES redesign thread
truthSource: 本文是 MES 当前已确认新设计的唯一架构化入口。
conflictResolution: 当本文与旧 MES design workspace、旧 feature packet、旧 contract 或旧 runtime 命名冲突时，以本文为准；后续 ADR 或更新后的 contract 可在明确标注后覆盖对应章节。
```

本文合并 MES 服务职责、资源模型、模具管理第一阶段基线、追溯边界、协同边界、旧设计替换表与未冻结 backlog。

目标不是一次性冻结所有 MES 对象，而是先形成一份干净的新设计基线，支撑后续模具管理 contract、runtime、BFF 和 UI 按新设计重写对齐。

## 1. 服务定位

`mes-service` 是 OES 在卫浴陶瓷制造场景下的制造执行与追溯真相服务，负责回答“产品在制造现场如何被生产、流转、检验、修补、烧成、报废与移交”。

MES 拥有：

| 范围 | 说明 |
| --- | --- |
| 制造执行真相 | 工单、工序执行、派工、扫码流转、放行、报工、返修、报废与交仓事实。 |
| 生产规格真相 | `ProductionSpec` 表示计划 / 目标生产规格。完整字段结构后续冻结。 |
| 生产实物真相 | `ProductionUnit` 表示 MES 责任范围内的生产实物对象。 |
| 生产资源真相 | `Site`、`Area`、`WorkCenter`、`WorkUnit`、`Equipment`、`StorageResource`、`CarrierResource`、`Tooling`、`LaborResource`。 |
| 模具现场事实 | `ProductionMold`、安装、使用、寿命累计与现场状态事实。 |
| 现场质检事实 | 检查执行、瑕疵事实、内部等级判定结果、返修处置事实与责任输入事实。 |
| 制造追溯事实 | 工序、人员、资源、模具、质量、窑车、交仓等生产历史。 |

MES 不拥有：

| 范围 | Owner |
| --- | --- |
| APS、主生产计划、全局排产优化 | planning / APS 边界 |
| Item 主数据、销售 SKU、PIM / PLM | item-master / sales / future product boundary |
| Barcode 注册表与统一扫码解析 | scan / trace identity boundary |
| 企业级质量规则、缺陷字典、客户质量接受策略 | quality-service / rule boundary |
| 正式仓储库存、库位、配货、出库和发货 | wms-service |
| 销售订单、财务、工资结算 | sales / finance / HR / payroll |
| PLC、SCADA、设备控制系统本身 | equipment / automation boundary |

## 2. 当前已冻结设计总览

| 主题 | 冻结口径 |
| --- | --- |
| 资源层级 | `Site -> Area -> Area -> WorkCenter -> WorkUnit`。`Area` 可 nested，`WorkCenter` 不 nested。 |
| 执行单元 | `WorkCenter` 表达派工、报工、排产和产能统计的执行单元。 |
| 现场位置 | 固定 / 半固定存放用 `StorageResource`；可移动承载用 `CarrierResource`。 |
| 工具资源 | 模具、检具、夹具、窑具等属于 `Tooling`。 |
| 模具对象 | `MoldDesign -> ProductionMold -> ToolingInstallation(type=MOLD) -> MoldInstallationDetail -> MoldUsageRecord -> MoldLifeCounter`。 |
| 生产实物 | `ProductionUnit` 表示 MES 责任范围内的生产实物对象，交仓后不删除。 |
| 目标规格 | 新设计统一使用 `ProductionSpec`，不再以 `ManufacturingSpec` 作为目标设计名。 |
| 追溯主体 | 产品码绑定 `TraceSubject`，再通过对象链接关联 `ProductionUnit / InventoryUnit / PackageUnit`。 |
| 质量边界 | MES 记录现场质检和瑕疵事实；质量规则和治理归 `quality-service / rule`。 |
| Planning 边界 | 第一阶段不实现 APS；Planning 下达需求，MES 创建 / 调整 `WorkOrder` 并反馈执行事实。 |

## 3. 资源模型

MES 资源模型从 `ProductionResource` 统一抽象出发，但稳定设计必须区分空间组织、执行能力、存放能力、承载能力、工具、人员和生产实物。

| 对象 | 稳定定义 | 典型例子 |
| --- | --- | --- |
| `Site` | 工厂、厂区或生产基地级边界。 | 潮州一厂、潮州二厂 |
| `Area` | 车间、楼层、区域、功能区，支持 nested。 | 成型车间、一楼、一楼窑炉区 |
| `WorkCenter` | 派工、报工、排产、产能统计的执行单元。 | 高压成型 1 线、地摊成型 A 区、隧道窑烧成 1 线 |
| `WorkUnit` | `WorkCenter` 内部更细的工位、模位、执行点或采集点。 | 上模位、注浆位、脱模位、初检位 |
| `Equipment` | 真实设备或生产设施，可维护、可停机、可记录状态。 | 高压注浆机、喷釉线、窑炉、除尘系统 |
| `StorageResource` | 固定或半固定生产现场存放空间，核心是位置与容量。 | 烘干房、缓冲区、交仓区、模具仓 |
| `CarrierResource` | 可承载对象并参与移动或工艺过程的载具。 | 窑车、周转车、平板车、托盘 |
| `Tooling` | 生产工具资源大类。 | 模具、检具、夹具、窑具 |
| `LaborResource` | 可用于排班、派工、报工、产能计算的劳动资源。 | 单个工人、成型 A 班、喷釉 B 班 |
| `ProductionUnit` | MES 责任范围内的生产实物对象，记录制造状态、历史事实与追溯关系。 | 单个马桶主体、组合生产对象、待交仓成瓷 |

建模规则：

- 工厂、车间、楼层、普通功能区不得建成 `WorkCenter`，应使用 `Site / Area`。
- `Area` 是空间组织视角，`WorkCenter` 是执行视角，`StorageResource` 是存放空间视角；三者可以关联，但不得假设一一对应。
- WIP、模具、制造物料等实物所在位置应记录到 `StorageResource` 或 `CarrierResource`，不得只用业务状态伪造位置。
- 窑车是 `CarrierResource` 的工艺载具子类型，不是 WIP 库区，也不是普通 `Tooling`。
- 工序执行、派工、报工、资源能力与执行瓶颈分析记录到 `WorkCenter / WorkUnit / Equipment`。
- 烘干房、窑炉区、一检区等既有物理空间又承担执行能力的对象，应同时具备 `StorageResource / Area` 视角与 `WorkCenter / Equipment` 执行视角，并通过显式关系连接。

## 4. 模具管理第一阶段基线

第一阶段模具管理只冻结和实现现场最核心闭环：

```text
MoldDesign
  -> ProductionMold
  -> ToolingInstallation(type = MOLD)
  -> MoldInstallationDetail
  -> MoldUsageRecord
  -> MoldLifeCounter
```

| 对象 | 职责 |
| --- | --- |
| `MoldDesign` | 模具设计与工程版本，决定设计上应产出什么。 |
| `MasterMold` | 母模实物，用于管理母模资产和生产模复制来源。 |
| `ProductionMold` | 生产模实物，是安装、使用、计寿命和产出生产事实的主体。 |
| `ToolingInstallation` | 工具安装 / 配置 / 绑定到生产资源的通用安装主记录。 |
| `MoldInstallationDetail` | `ToolingInstallation(type=MOLD)` 的模具专属扩展。 |
| `MoldUsageRecord` | 每日或每班次的模具实际使用事实。 |
| `MoldLifeCounter` | 独立寿命累计对象，第一阶段核心寿命维度为 `CASTING_CYCLE`。 |

冻结规则：

- 安装和报工关联 `ProductionMold`，不关联 `MoldDesign`。
- 模具存放位置使用 `StorageResource`。
- 模具安装主事实是 `ToolingInstallation(type=MOLD)`，不再创建并行的 `MoldInstallation` 主对象。
- 模具专属安装字段放入 `MoldInstallationDetail`，包括 `moldPosition`、`cavityPosition`、`cavityMapping`、`setupParameters`。
- `MoldUsageRecord` 是模具寿命事实，不替代 `OperationExecution`。
- `MoldLifeCounter` 是独立对象，不是 `ProductionMold` 上的简单数字字段。
- 第一阶段不强行解决模具产出胚体与 `ProductionUnit` 的自动逐件绑定。

第一阶段暂不实现：

- 完整维修 / 保养工单闭环。
- 复杂寿命预警事件流。
- 自动从 `OperationExecution` 反推模具寿命。
- 模具质量分析、良率分析和缺陷关联分析。
- 模具部件级寿命管理。

## 5. 生产实物、交仓与追溯

`ProductionUnit` 是 MES 的生产实物对象。只要真实对象仍处于 MES 责任范围，它就是 `ProductionUnit`。

冻结规则：

- `ProductionUnit` 可以是泥胚、干胚、釉胚、烧成陶瓷、后道待检件、返修件或已放行待交仓件。
- `ProductionUnit` 不是 WMS 库存对象。
- `ProductionUnit` 交仓后不删除，应保留为制造历史与追溯对象。
- WMS 基于 MES 交仓事实创建 `InventoryUnit`，并通过来源引用或 `TraceSubject` 关联 `ProductionUnit`。
- `ProductionUnit` 可以代表单件，也可以代表实际生产中绑定流转的组合实物；组合关系通过 `ProductionUnitComponent` 或等价关系表达，不把 `ProductionUnit` 做成随意 nested 树。

交仓关系：

```text
ProductionUnit
  status = HANDED_OVER_TO_WMS

WMS InventoryUnit
  sourceProductionUnitId = ProductionUnit.id
```

进入 WMS 的前提：

```text
后道完成
+ 质量放行
+ output Item 已明确
+ 生产确认交仓
+ WMS 接收入库
```

## 6. 扫码与 Trace Identity 边界

MES 不拥有全局 `Barcode` 注册表。

冻结口径：

- 产品码不直接绑定 `ProductionUnit`，而是优先绑定全局追溯主体 `TraceSubject`。
- `TraceSubject` 通过对象链接关联 `ProductionUnit`、后续 WMS `InventoryUnit`、WMS `PackageUnit` 等业务对象。
- 扫码服务负责把字符串解析到 `TraceSubject` 或其他绑定对象。
- MES 负责返回生产历史、工序历史、资源使用、质量结果、报工与责任记录。

产品码扫描到生产中对象时：

```text
barcode
-> BarcodeBinding
-> TraceSubject
-> TraceObjectLink(current MES object)
-> ProductionUnit
-> MES 返回工序、模具、人员、WorkCenter、质量、试水等历史
```

## 7. 质量、Planning、WMS 与 Item 边界

### 7.1 Quality

- `quality-service / rule` 负责瑕疵定义、质量分类规则、责任规则、扣罚规则模板。
- `mes-service` 记录现场事实：检查执行、瑕疵事实、责任归因事实、奖罚输入事实。
- `HR / Payroll / Finance` 负责最终工资结算和最终扣款 / 奖励入账。

### 7.2 Planning

- 第一阶段不实现 APS。
- Planning 第一阶段向 MES 下达生产需求，例如 `ProductionDemand / ProductionRequest`。
- MES 接收需求后创建或调整 `WorkOrder`。
- Planning 不直接排到具体工序、工人、`WorkCenter` 或 `WorkUnit`。
- MES 向 Planning 反馈工单状态、工序进度、完工、报废、缺陷、延误和瓶颈摘要。

### 7.3 WMS

- MES 负责制造执行、WIP、后处理与制造放行真相。
- WMS 负责正式仓储库存、库存位置、库存余额、配货、出库与发货真相。
- MES 发布可交仓 / 已交仓事实后，WMS 创建自己的库存责任对象。
- MES 保留制造追溯真相，但不继续拥有该对象的仓储位置、库存余额与配发状态真相。

### 7.4 Item Master

- `item-master-service` 提供 active + manufacturable `Item` 准入边界。
- `ProductionSpec` 可引用可生产的 `Item`。
- MES 不复制 `ItemModel`、Item code、name、category、BOM、Packaging 等 Item 主数据真相。
- 本文只定义 MES 侧边界，不替代 Item Master 的完整设计。

## 8. 旧设计替换表

以下旧名只代表历史实现或旧文档状态，不再作为目标设计。

| 旧名 / 旧概念 | 新设计目标 | 处理方式 |
| --- | --- | --- |
| `ManufacturingSpec` | `ProductionSpec` | contract / runtime 后续直接重写对齐 |
| `WipUnit` | `ProductionUnit` | contract / runtime 后续直接重写对齐 |
| `ProductionMoldInstance` | `ProductionMold` | contract / runtime 后续直接重写对齐 |
| `MesLocation` | `StorageResource / CarrierResource` | contract / runtime 后续直接重写对齐 |
| `ResourcePosition` | `MoldInstallationDetail.moldPosition`、`WorkUnit` 或后续明确的位置模型 | contract / runtime 后续直接重写对齐 |
| `MoldInstallation` | `ToolingInstallation(type=MOLD) + MoldInstallationDetail` | contract / runtime 后续直接重写对齐 |
| `WorkCenter.parentWorkCenterId` | `Area` 组织关系 | contract / runtime 后续直接重写对齐 |

不再使用长期兼容设计。设计冻结后，旧 contract / runtime 按 `REWRITE`、`REPLACE` 或 `DELETE_AFTER_REWRITE` 处理。

## 9. 当前未冻结 Backlog

以下事项不阻塞当前模具管理继续推进，只作为后续设计拓展入口。

| 主题 | 当前状态 | 后续处理 |
| --- | --- | --- |
| `ProductionSpec` 完整字段结构 | 已冻结目标命名和方向，字段未完全冻结 | 后续单独冻结 ProductionSpec contract 前细化 |
| `ProductionDemand -> WorkOrder` 转换 | 方向冻结，合并、拆分、数量计算细节后置 | 后续 WorkOrder / planning 协同设计 |
| `Route / RouteNode / RouteEdge` 条件表达 | 方向冻结，字段与规则表达后置 | 后续 routing foundation |
| `OperationTask` 字段与生命周期 | 概念冻结，字段后置 | 后续 task / dispatch design |
| `FLOW_SCAN` 扫码执行模型 | 概念冻结，字段后置 | 后续 PDA / execution contract |
| `RELEASE_CONTROLLED` 放行批次 | 概念冻结，对象结构后置 | 后续 WIP release design |
| `OperationExecution / OperationUnitExecution` | 方向冻结，字段级结构后置 | 后续 execution foundation |
| `OperationOutputRecord / OperationMaterialIssue` | 概念保留，最终模型待定 | 后续 material / output execution design |
| 已交仓后道工序与 WMS `InventoryUnit` 协同 | 待定 | 后续 MES / WMS handoff collaboration |
| 窑车装载对象与 Load Profile | 概念冻结，对象名和字段后置 | 后续 kiln carrier loading design |

## 10. 后续执行顺序

1. 以本文作为唯一 MES 新设计基线。
2. 删除或归档旧 MES design workspace、旧资源模型文档、旧清理控制台和历史 feature packet。
3. 基于本文重写 `docs/contracts/mes-service/**` 与 `src/common/src/contracts/mes_service/**`。
4. 基于新 contract 重构 `mes-service` runtime、API Gateway BFF 和 tenant-web MES 页面。
5. 每次新增或扩展 MES 设计，优先更新本文；如果主题尚未冻结，只登记到本文 backlog，不新建长期并列设计入口。
