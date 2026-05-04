# MES Mold Foundation

## 1. 目标

- 将主控线程已冻结的 MES 模具管理最小闭环整理为正式 feature packet，作为后续 `MES-MOLD-CONTRACT` 与实现线程的执行输入。
- 建立 MES 第一阶段模具管理闭环：
  - 模具设计与母模 / 生产模具实例建档
  - 模具到厂、烘干、移动、安装、拆卸、使用、寿命、预警、报废
  - 按产线 / 工位查看当前安装模具与每日使用清单
  - 支持质量、采购分析按模具、供应商与制造规格追溯
- 明确模具是 MES tooling resource，不是 WMS 库存、不是 Equipment、不是普通 Location。

## 2. 不做什么

- 不在本 packet 中进入代码实现、proto 字段设计或数据库结构设计。
- 不实现 APS、完整 `WorkOrder`、完整 `OperationTask`、完整 WIP 条码闭环。
- 不实现完整 `quality-service`、质量标准治理或复杂健康评分。
- 不实现完整采购联调、`RFQ / PO / receiving` 流程或供应商商业 truth。
- 不实现模具部件级维修、`ProductionMoldPart`、`ProductionMoldSet`。
- 不实现独立 `MoldDesignRevision`；第一阶段由 `MoldDesign.revisionCode` 与 `supersedesDesignId` 表达设计变更。
- 不引入 `MoldFamily`；模具适配通过 `ProductFamily` / `ManufacturingSpec` 引用表达。
- 不做成本摊销、财务折旧或资产会计真相。

## 3. 上游依据

- services:
  - [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
  - [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- plans:
  - [mes-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/mes-service-design.md)
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
- governance:
  - [AGENTS.md](/Users/acehood/Documents/GitHub/oes/AGENTS.md)

## 4. 当前结论

- 工序路线看 `Operation` / `Routing`。
- 实际执行看 `WorkCenter`。
- 实物位置看 `MesLocation`。
- 空间瓶颈看 `MesLocation` + `CapacityProfile`。
- 执行瓶颈看 `WorkCenter` / `Equipment` + `CapacityProfile`。
- MES 拥有模具实例、安装、移动、使用、寿命、预警事实。
- 第一阶段使用 `ProductionMoldInstance`，不拆 `ProductionMoldPart` / `ProductionMoldSet`。
- 第一阶段 `MoldInstallation` 与 `MoldUsageEvent` 可以独立于完整 `WorkOrder` 存在；若未来绑定 `WorkOrder` / `OperationTask`，只能通过 nullable reference 扩展。
- `MoldDesign` 是 MES tooling design record，不替代 PLM 图纸真相、Item 主数据真相或完整制造主数据真相；它只能引用 `ProductFamily` / `ManufacturingSpec` / `Item`，不能复制对方 owner truth。
- `MasterMold` 与 `ProductionMoldInstance` 都是可追踪资产型 tooling resource，但第一阶段只有生产模具进入安装、使用与寿命主闭环。

## 5. 当前 slice

- slice:
  - `mes-service` mold foundation
- status:
  - ready-for-mes-mold-contract
- scope:
  - `MoldDesign`
  - `MoldDesignOutput`
  - `MasterMold`
  - `ProductionMoldInstance`
  - `MesLocation`
  - `WorkCenter`
  - `ResourcePosition`
  - `MoldMovementEvent`
  - `MoldInstallation`
  - `MoldUsageEvent`
  - `MoldLifeCounter`
  - `MoldWarningEvent`
- ready definition:
  - owner 边界已冻结
  - phase 1 对象、状态机、命令、查询、事件草案已给出
  - 后续 contract 线程可以在不重新讨论“模具是否属于 MES / WMS / Equipment”的前提下继续推进

## 6. 第一阶段对象清单与职责

### 6.1 MoldDesign

- 表达一类模具设计 / 定义，记录该模具可生产什么、按什么产出结构、适配哪些产品族与制造规格。
- 不表达采购订单、供应商商业条款、完整图纸版本库或 PLM truth。
- 最小字段草案：
  - `moldDesignId`
  - `tenantId`
  - `orgId`
  - `designCode`
  - `name`
  - `revisionCode`
  - `supersedesDesignId`
  - `productFamilyRef`
  - `manufacturingSpecRefs`
  - `itemRef`
  - `materialType`
  - `functionRole`
  - `productionMethodTags`
  - `outputStructureType`
  - `defaultLifeLimit`
  - `defaultLifeUnit`
  - `status`
  - `createdAt`
  - `updatedAt`

### 6.2 MoldDesignOutput

- 表达一次模具使用理论上会产出哪些产品、组件或制造规格。
- 支持单模、双胞胎、多胞胎、多组件组合，不假设“一套模具 = 一个完整产品”。
- 最小字段草案：
  - `moldDesignOutputId`
  - `tenantId`
  - `orgId`
  - `moldDesignId`
  - `sequenceNo`
  - `outputCode`
  - `outputKind`
  - `productFamilyRef`
  - `manufacturingSpecRef`
  - `quantityPerUse`
  - `componentRole`
  - `assemblyHint`
  - `isPrimaryOutput`

### 6.3 MasterMold

- 表达母模资产，用于复制或生产生产模具。
- 第一阶段只进入建档、来源与状态追踪，不进入生产安装和使用寿命主链。
- 最小字段草案：
  - `masterMoldId`
  - `tenantId`
  - `orgId`
  - `masterMoldCode`
  - `moldDesignId`
  - `supplierRef`
  - `purchaseRef`
  - `receivedAt`
  - `currentStatus`
  - `currentMesLocationId`
  - `qualitySummary`
  - `notes`
  - `createdAt`
  - `updatedAt`

### 6.4 ProductionMoldInstance

- 表达生产现场实际使用的一件生产模具实例，是安装、移动、使用、寿命和预警的主对象。
- 第一阶段不拆模具部件或模具套组。
- 最小字段草案：
  - `productionMoldInstanceId`
  - `tenantId`
  - `orgId`
  - `moldInstanceCode`
  - `moldDesignId`
  - `masterMoldId`
  - `supplierRef`
  - `purchaseRef`
  - `receivedAt`
  - `acceptedAt`
  - `currentStatus`
  - `currentMesLocationId`
  - `currentWorkCenterId`
  - `currentResourcePositionId`
  - `currentInstallationId`
  - `lifeUsedValue`
  - `lifeLimitValue`
  - `lifeUnit`
  - `warningLevel`
  - `scrappedAt`
  - `createdAt`
  - `updatedAt`

### 6.5 MesLocation

- 表达 MES 现场物理空间与模具实物所在位置。
- 可用于模具库、烘干区、待安装区、待维修区、报废暂存区等，不是 WMS 库位。
- 最小字段草案：
  - `mesLocationId`
  - `tenantId`
  - `orgId`
  - `locationCode`
  - `name`
  - `locationType`
  - `parentLocationId`
  - `relatedWorkCenterId`
  - `capacityProfileId`
  - `status`

### 6.6 WorkCenter

- 表达逻辑制造单元 / 执行单元，产线、工位组或具体可执行单元都可建模为 `WorkCenter`。
- 用于表达模具安装到哪个执行单元，不承担实物位置 truth。
- 最小字段草案：
  - `workCenterId`
  - `tenantId`
  - `orgId`
  - `workCenterCode`
  - `name`
  - `workCenterType`
  - `parentWorkCenterId`
  - `relatedMesLocationId`
  - `capacityProfileId`
  - `status`

### 6.7 ResourcePosition

- 表达 `WorkCenter` 下可安装 tooling resource 的具体槽位、机台位、模位或工位位置。
- 用于避免只记录“安装到产线”但无法区分具体模位。
- 最小字段草案：
  - `resourcePositionId`
  - `tenantId`
  - `orgId`
  - `workCenterId`
  - `positionCode`
  - `name`
  - `positionType`
  - `compatibleMoldDesignRefs`
  - `status`

### 6.8 MoldMovementEvent

- 表达生产模具或母模在 MES 现场位置之间移动的事实。
- 所有模具实物流转必须记录到 `MesLocation`，不能记录到 WMS location。
- 最小字段草案：
  - `moldMovementEventId`
  - `tenantId`
  - `orgId`
  - `moldResourceType`
  - `moldResourceId`
  - `fromMesLocationId`
  - `toMesLocationId`
  - `movementReason`
  - `movedAt`
  - `operatorRef`
  - `sourceCommandId`
  - `auditRef`

### 6.9 MoldInstallation

- 表达生产模具安装到 `WorkCenter` / `ResourcePosition` 的事实。
- 第一阶段允许独立于完整 `WorkOrder` / `OperationTask` 存在。
- 最小字段草案：
  - `moldInstallationId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `workCenterId`
  - `resourcePositionId`
  - `installedAt`
  - `unmountedAt`
  - `installedByRef`
  - `unmountedByRef`
  - `installationStatus`
  - `setupSnapshot`
  - `operationRef`
  - `routingRef`
  - `workOrderRef`
  - `operationTaskRef`
  - `auditRef`

### 6.10 MoldUsageEvent

- 表达一次或一批生产活动正式绑定模具实例的使用事实。
- 第一阶段支持主管勾选使用、文员事后录入和现场扫码录入，不要求完整 `WorkOrder`。
- 最小字段草案：
  - `moldUsageEventId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `moldInstallationId`
  - `workCenterId`
  - `resourcePositionId`
  - `usageMode`
  - `usedAt`
  - `usageQuantity`
  - `lifeDelta`
  - `lifeUnit`
  - `productFamilyRef`
  - `manufacturingSpecRef`
  - `wipUnitRef`
  - `physicalTraceId`
  - `workOrderRef`
  - `operationTaskRef`
  - `operatorRef`
  - `captureSource`
  - `auditRef`

### 6.11 MoldLifeCounter

- 表达生产模具寿命累计、阈值与调整事实。
- 可由 `MoldUsageEvent` 自动累加，也允许授权人员做审计化寿命调整。
- 最小字段草案：
  - `moldLifeCounterId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `lifeUnit`
  - `usedValue`
  - `limitValue`
  - `warningThresholdValue`
  - `lastUsageEventId`
  - `lastAdjustedAt`
  - `lastAdjustedByRef`
  - `adjustmentReason`
  - `updatedAt`

### 6.12 MoldWarningEvent

- 表达模具寿命、状态或使用异常的预警事实。
- 第一阶段优先支持寿命预警，不引入复杂健康评分。
- 最小字段草案：
  - `moldWarningEventId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `warningType`
  - `warningLevel`
  - `triggeredByEventId`
  - `lifeUsedValue`
  - `lifeLimitValue`
  - `raisedAt`
  - `acknowledgedAt`
  - `acknowledgedByRef`
  - `status`
  - `auditRef`

## 7. 引用与协同边界

### 7.1 item-master / manufacturing master data

- `MoldDesign.itemRef` 只能引用 `item-master-service` 中 `manufacturable` 且 `PHYSICAL` 的 `Item`。
- `MoldDesign.productFamilyRef` 与 `MoldDesign.manufacturingSpecRefs` 引用制造主数据边界中的产品族与制造规格。
- MES 不跨服务查库；后续契约线程应通过 gRPC 查询、缓存读模型或事件订阅完成引用校验与展示摘要。
- MES 可保存必要 display snapshot，例如产品族名称、制造规格 code，用于历史审计展示；snapshot 不是 owner truth。
- `ManufacturingSpec`、route、operation、工序参数与质量规则 truth 不进入 `MoldDesign`。

### 7.2 procurement / SRM

- `MasterMold` 与 `ProductionMoldInstance` 只保存 `supplierRef` 与 `purchaseRef`。
- `supplierRef` 指向 SRM / Party 边界中的供应商身份，不复制供应商主档、联系人、评级或供应表现。
- `purchaseRef` 指向采购交易对象或外部采购凭证，不复制 `PO`、收货、价格、付款、商业条款 truth。
- MES 可以按模具实例沉淀质量表现、寿命表现与使用事实，供采购分析消费；采购是否换供应商、追偿或重新下单不归 MES 决策。

## 8. 编码规则建议

- `ProductionMoldInstance.moldInstanceCode` 必须 tenant + org 范围内唯一。
- 支持两种录入口径：
  - 手工录入供应商或工厂已有编号。
  - 系统按规则生成编号，人工确认后生效。
- 建议默认生成格式：
  - `PM-{factoryCode}-{moldDesignCode}-{yyyy}-{seq4}`
  - 示例：`PM-F01-WB-A100-2026-0037`
- 校验规则：
  - 去除首尾空格，英文统一大写。
  - 禁止空值、控制字符、全角空格和不可打印字符。
  - 同一 `tenantId + orgId` 下不得重复。
  - 若手工编号与历史报废模具重复，默认拒绝；确需复用必须走授权 override 并记录审计。
  - 编号一经发生安装、使用或寿命事实后不可直接修改；只能通过受控更正命令保留旧编号、原因与审计。

## 9. 关键状态机

`ProductionMoldInstance.currentStatus` 第一阶段固定状态：

| 状态 | 含义 | 允许进入方式 |
| --- | --- | --- |
| `RECEIVED` | 模具到厂并已登记 | 登记模具 |
| `PENDING_DRYING` | 到厂后需烘干或稳定处理 | 登记模具、移动模具 |
| `PENDING_INSTALLATION` | 已可安装但尚未装到产线 / 工位 | 烘干完成、拆卸模具、移动模具 |
| `INSTALLED` | 存在有效 `MoldInstallation` | 安装模具 |
| `PENDING_REPAIR` | 待维修或待保养判定 | 拆卸模具、寿命预警、人工判定 |
| `UNDER_REPAIR` | 正在维修或保养 | 维修接收 |
| `DISABLED` | 停用但未正式报废 | 停用命令 |
| `SCRAPPED` | 已报废，不得再安装或使用 | 报废模具 |

约束：

- `SCRAPPED` 为终态，不允许重新进入安装或使用。
- `INSTALLED` 必须存在有效 `MoldInstallation`。
- `PENDING_INSTALLATION / PENDING_REPAIR / UNDER_REPAIR / DISABLED / SCRAPPED` 不得存在有效 `MoldInstallation`。
- `RecordMoldUsage` 不改变 `ProductionMoldInstance.currentStatus`；使用事实只写 `MoldUsageEvent`。
- 如 UI 需要展示 `IN_USE`，只能作为 derived usage state，由有效 `MoldInstallation`、最近使用事件和班次 / 时间窗口读模型推导，不写入 `ProductionMoldInstance.currentStatus`。
- `PENDING_REPAIR / UNDER_REPAIR / DISABLED` 不允许安装；恢复必须先进入 `PENDING_INSTALLATION`。
- 状态变更必须携带 operator context、trace context 与审计元数据。

## 10. 关键命令

### 10.1 RegisterMold

- 登记母模或生产模具。
- 必须校验 `moldDesignId`、`moldInstanceCode` 唯一性、`supplierRef` / `purchaseRef` 引用格式。
- 对生产模具创建初始 `MoldLifeCounter`。
- 产出事件：`MoldRegistered`。

### 10.2 MoveMold

- 将模具从一个 `MesLocation` 移动到另一个 `MesLocation`。
- 不允许使用 WMS location。
- 若生产模具存在有效 `MoldInstallation` 或处于 `INSTALLED`，必须先拆卸或由命令显式处理拆卸前置。
- 产出事件：`MoldMoved`。

### 10.3 InstallMold

- 将生产模具安装到 `WorkCenter` / `ResourcePosition`。
- 必须校验状态可安装、位置可用、模具设计与 resource position 兼容。
- 创建 `MoldInstallation`，更新实例状态为 `INSTALLED`。
- 产出事件：`MoldInstalled`。

### 10.4 UnmountMold

- 将已安装生产模具从 `WorkCenter` / `ResourcePosition` 拆卸。
- 关闭当前 `MoldInstallation`，更新状态为 `PENDING_INSTALLATION` 或 `PENDING_REPAIR`。
- 产出事件：`MoldUnmounted`。

### 10.5 RecordMoldUsage

- 登记一次或一批模具使用事实。
- 支持独立于完整 `WorkOrder` 存在，但应尽量携带 `productFamilyRef` / `manufacturingSpecRef` / `workCenterId`。
- 创建 `MoldUsageEvent`，累加 `MoldLifeCounter`，必要时触发 `MoldWarningEvent`。
- 不改变 `ProductionMoldInstance.currentStatus`；当前使用摘要由读模型推导。
- 产出事件：`MoldUsageRecorded`，达到阈值时产出 `MoldLifeWarningRaised`。

### 10.6 AdjustMoldLife

- 授权调整生产模具寿命计数或寿命上限。
- 必须记录调整前后值、原因、操作人、审批或授权引用。
- 如果调整后超过阈值，必须触发或更新寿命预警。

### 10.7 ScrapMold

- 正式报废生产模具或母模。
- 已安装模具必须先拆卸或由命令在同一事务中关闭安装事实。
- 更新状态为 `SCRAPPED`，禁止后续安装与使用。
- 产出事件：`MoldScrapped`。

## 11. 关键查询

- `ListCurrentMoldsByWorkCenter`
  - 查询某产线 / 工位组 / 工位当前已安装模具清单。
- `ListMoldLifeWarnings`
  - 查询寿命接近上限、超限或已确认的预警清单。
- `GetMoldUsageHistory`
  - 查询单个生产模具的历史使用、安装、拆卸与寿命变化。
- `GetMoldCurrentLocation`
  - 查询模具当前 `MesLocation`、安装状态与所在 `WorkCenter` 摘要。
- `ListMoldInstancesByDesign`
  - 按 `MoldDesign` 查询所有生产模具实例与状态摘要。
- `PrintDailyMoldChecklist`
  - 面向主管打印每日产线模具清单，包含当前安装、预计使用、寿命预警与异常备注。

## 12. 第一阶段 UI / 操作闭环

- 文员登记：
  - 登记 `MoldDesign` 基础信息、母模、生产模具实例、供应商引用、采购引用、初始位置与寿命上限。
- 主管查看 / 打印每日清单：
  - 按 `WorkCenter` 查看当前安装模具、待安装模具、寿命预警、待维修模具，并打印每日清单。
- 主管勾选使用：
  - 对当天已安装模具按清单勾选使用，补充数量、制造规格、班组或操作人摘要。
- 文员录入：
  - 对纸质清单或现场记录进行事后补录，形成正式 `MoldUsageEvent`。
- 寿命预警：
  - 系统按 `MoldLifeCounter` 阈值产生预警，主管确认后安排维修、停用或报废。

## 13. 审计要求

- 以下行为必须审计：
  - 所有状态变更
  - 安装与拆卸
  - 位置移动
  - 使用登记
  - 寿命调整
  - 停用与报废
  - 编号 override 或编号更正
- 审计元数据至少包含：
  - `tenantId`
  - `orgId`
  - `operatorRef`
  - `operatorRoleSnapshot`
  - `traceId`
  - `commandId`
  - `reason`
  - `beforeSnapshot`
  - `afterSnapshot`
  - `occurredAt`

## 14. 权限码草案

- `mes.mold.design.read`
- `mes.mold.design.manage`
- `mes.mold.instance.read`
- `mes.mold.instance.register`
- `mes.mold.instance.move`
- `mes.mold.instance.install`
- `mes.mold.instance.unmount`
- `mes.mold.usage.record`
- `mes.mold.life.adjust`
- `mes.mold.warning.read`
- `mes.mold.warning.acknowledge`
- `mes.mold.scrap`
- `mes.mold.audit.read`
- `mes.mold.code.override`

## 15. 事件草案

### 15.1 MoldRegistered

- 表示模具已在 MES 中正式建档。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `moldResourceType`
  - `moldResourceId`
  - `moldDesignId`
  - `moldCode`
  - `supplierRef`
  - `purchaseRef`
  - `registeredAt`
  - `operatorRef`

### 15.2 MoldMoved

- 表示模具已在 MES 现场位置间移动。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `moldResourceType`
  - `moldResourceId`
  - `fromMesLocationId`
  - `toMesLocationId`
  - `movementReason`
  - `movedAt`
  - `operatorRef`

### 15.3 MoldInstalled

- 表示生产模具已安装到执行单元。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `moldInstallationId`
  - `workCenterId`
  - `resourcePositionId`
  - `installedAt`
  - `operatorRef`

### 15.4 MoldUnmounted

- 表示生产模具已从执行单元拆卸。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `moldInstallationId`
  - `workCenterId`
  - `resourcePositionId`
  - `unmountedAt`
  - `nextStatus`
  - `operatorRef`

### 15.5 MoldUsageRecorded

- 表示生产活动已正式绑定模具使用事实。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `moldInstallationId`
  - `workCenterId`
  - `usageQuantity`
  - `lifeDelta`
  - `lifeUnit`
  - `productFamilyRef`
  - `manufacturingSpecRef`
  - `wipUnitRef`
  - `physicalTraceId`
  - `usedAt`
  - `operatorRef`

### 15.6 MoldLifeWarningRaised

- 表示生产模具寿命或使用状态触发预警。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `productionMoldInstanceId`
  - `warningType`
  - `warningLevel`
  - `lifeUsedValue`
  - `lifeLimitValue`
  - `raisedAt`

### 15.7 MoldScrapped

- 表示模具已正式报废。
- 建议字段：
  - `eventId`
  - `tenantId`
  - `orgId`
  - `moldResourceType`
  - `moldResourceId`
  - `previousStatus`
  - `scrapReason`
  - `scrappedAt`
  - `operatorRef`

## 16. 实现切片建议

### 16.1 service foundation

- 建立 MES mold bounded module。
- 落地核心对象、命令 handler、状态机校验、审计写入与事件发布。
- 优先验证登记、移动、安装、拆卸、使用、寿命预警、报废闭环。

### 16.2 gateway / ui

- 提供文员登记、主管每日清单、当前安装模具查询、使用勾选、寿命预警确认与历史查询入口。
- API Gateway / BFF 只做协议映射与权限校验，不承载模具状态机和寿命规则。

### 16.3 smoke / hardening

- 覆盖最小 smoke：
  - 登记生产模具
  - 移动到待安装区
  - 安装到 `WorkCenter`
  - 登记使用并累计寿命
  - 达到阈值产生预警
  - 拆卸后报废
- 强化重复编号、报废后使用、未安装使用、跨 org 引用、无权限寿命调整等负向用例。

## 17. 风险与开放问题

- 当前未识别会阻塞 `MES-MOLD-CONTRACT` 的开放问题。
- 主要风险：
  - manufacturing master data contract 尚未冻结时，`ProductFamily` / `ManufacturingSpec` 只能先按 opaque reference 处理。
  - 采购与 SRM 更细契约未冻结时，`supplierRef` / `purchaseRef` 只能做引用格式校验和展示摘要，不能做强业务校验。
  - 若实现线程试图把 `ResourcePosition` 直接等同设备或 WMS 库位，会破坏 MES 已冻结资源边界。
  - 若现场要求一套模具由多个可替换部件组成，必须升级到后续 `ProductionMoldPart` / `ProductionMoldSet` 设计，不能塞进 phase 1 特殊字段。

## 18. 下一步 contract / proto 设计输入

- `MES-MOLD-CONTRACT` 应优先冻结 command / query 边界和状态迁移错误语义，而不是先画数据库。
- 必须先回答的 contract 输入：
  - 每个命令的 request / response / error code。
  - `MoldDesign` 与 `ManufacturingSpec` 引用校验方式。
  - `MesLocation`、`WorkCenter`、`ResourcePosition` 的查询与兼容性校验方式。
  - `MoldLifeCounter` 阈值触发和重复预警去重语义。
  - 审计记录与事件发布的事务边界。
  - gateway / UI 每个页面需要的 summary query。
