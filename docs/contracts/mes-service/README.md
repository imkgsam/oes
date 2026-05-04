# mes-service Contracts

## 1. 目的

本目录用于冻结 `mes-service` phase 1 模具管理最小 contract，作为后续 proto 与 service implementation 的输入。

这些文档面向：

- `api-gateway` / future MES BFF
- `item-master-service`
- `procurement-service` / SRM / Party boundary
- `permission-service`
- 后续承担 `mes-service` mold module proto / runtime 实现的线程

这些文档不是 proto 副本，不展开数据库结构，不承诺 UI、事件 payload 全量字段或运行时实现细节。

本目录只回写已经冻结的 `MES Mold Foundation` phase 1 结论。

## 2. Phase 1 Contract Surface

phase 1 只冻结以下内部 gRPC contract 面：

- [mold-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-management.md)
  - `MoldManagementService`
  - `RegisterMoldDesign`
  - `RegisterMasterMold`
  - `RegisterProductionMoldInstance`
  - `MoveMold`
  - `InstallMold`
  - `UnmountMold`
  - `RecordMoldUsage`
  - `AdjustMoldLife`
  - `AcknowledgeMoldWarning`
  - `ScrapMold`
- [mold-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-query.md)
  - `MoldQueryService`
  - `GetMoldDesign`
  - `ListMoldDesigns`
  - `GetProductionMoldInstance`
  - `ListMoldInstancesByDesign`
  - `GetMoldCurrentLocation`
  - `GetMoldUsageHistory`
  - `ListCurrentMoldsByWorkCenter`
  - `ListMoldLifeWarnings`
  - `PrintDailyMoldChecklist`

phase 1 不在本目录中冻结：

- proto message 全量定义
- 外部 HTTP / BFF surface
- UI selector contract
- 数据库结构
- 完整 event catalog / payload
- 模具维修保养完整命令
- `MoldDesignRevision`
- 模具部件级或套组级建模
- 完整采购、SRM、质量或资产会计流程

## 3. Owner Boundary

phase 1 contract 明确围绕以下 owner truth 展开：

- `MoldDesign`
- `MoldDesignOutput`
- `MasterMold`
- `ProductionMoldInstance`
- `MoldMovementEvent`
- `MoldInstallation`
- `MoldUsageEvent`
- `MoldLifeCounter`
- `MoldWarningEvent`

补充冻结规则：

- 模具已冻结为 MES tooling resource，不属于 WMS 库存，不属于 `Equipment`，也不是普通 `Location`。
- `ManufacturingSpec` 归 `mes-service`，用于表达制造现场可执行规格；`MoldDesign` 只是引用它的 tooling design record，不替代 `ManufacturingSpec` truth。
- `MoldDesign` 不替代 PLM 图纸 truth、Item truth 或完整 PIM / PLM 产品主数据 truth。
- `item-master-service` 只提供 `manufacturable` 且 `PHYSICAL` 的 `Item` 准入边界，不拥有 `ManufacturingSpec`。
- `MasterMold` 与 `ProductionMoldInstance` 都是可追踪 tooling resource；phase 1 只有 `ProductionMoldInstance` 进入安装、使用、寿命与预警主闭环。
- 安装事实以 `MoldInstallation` 为准。
- 使用事实以 `MoldUsageEvent` 为准。
- `ProductionMoldInstance.current_status` 不使用长期 `IN_USE` 生命周期状态；是否正在使用由有效安装和使用事件读模型推导。
- `WorkCenter` 是逻辑制造执行单元，`MesLocation` 是物理空间；二者可以有关联，但不得假设一一对应。

## 4. Reference Boundary

### 4.1 Item Master 与 MES ManufacturingSpec 边界

- `ManufacturingSpec` 是 MES 内部 manufacturing master object，不是 `item-master-service` truth。
- `ManufacturingSpec` 必须引用当前 `manufacturable` 且 `PHYSICAL` 的 `Item`，但不复制 Item 主数据真相。
- `ProductFamily` 在 phase 1 只作为 MES 模具 / 制造规格侧的分组引用或展示摘要，不冻结独立 `product-service`。
- MES 可保存 display snapshot，例如产品族 code / name、制造规格 code / name、Item code / name，用于历史审计和列表展示。
- display snapshot 不是 Item truth，不得被实现线程当作反向修正 Item Master 的依据。
- `Item` ref 只能作为 optional 辅助引用，不能成为 `MoldDesign` 主绑定关系。

### 4.2 Procurement / SRM / Party

- `supplier_ref` 只指向供应商身份边界，不复制供应商主档、联系人、评级、商业条款或供应表现 truth。
- `purchase_ref` 只指向采购交易对象或外部采购凭证，不复制 `PO`、收货、价格、付款、商业条款或 discrepancy resolution truth。
- MES 可以按模具沉淀质量表现、寿命表现与使用事实，供采购分析消费；采购决策、追偿、重下单不归 MES。

### 4.3 MES Resource References

- `MesLocation` 表达 MES 现场物理空间，不使用 WMS location。
- `WorkCenter` 表达制造执行单元，不承担实物位置 truth。
- `ResourcePosition` 表达 `WorkCenter` 下可安装 tooling resource 的具体槽位、机台位、模位或工位位置。
- `ResourcePosition` 兼容性校验属于 MES mold domain rule，不得放入 gateway、DTO 或 `src/common`。

## 5. Security / Context Baseline

所有 phase 1 RPC 统一遵循以下基线：

- 全部为内部 gRPC 契约，不直接对外部客户端开放
- 所有 RPC 显式携带 `tenant_id`
- 场景适用时必须显式携带 `org_id`
- 所有 query RPC 都要求：
  - internal service context
  - operator context
  - trace context
- 所有 management command 都要求：
  - internal service context
  - operator context
  - trace context
  - audit context

补充说明：

- 本目录只冻结必须可观察到的上下文与行为边界，不展开 metadata header、guard、幂等键或 tracing 实现。
- command 的业务规则必须位于 `mes-service` domain / application 层，不得放入 gateway、DTO、Prisma schema 或 `src/common`。

## 6. State Machine Baseline

`ProductionMoldInstance.current_status` phase 1 固定使用以下生命周期状态：

| 状态 | 含义 |
| --- | --- |
| `RECEIVED` | 生产模具实例已登记到厂，但尚未进入可安装状态 |
| `PENDING_DRYING` | 生产模具实例需要烘干、稳定处理或现场准备 |
| `PENDING_INSTALLATION` | 生产模具实例可安装，但当前没有有效安装事实 |
| `INSTALLED` | 生产模具实例存在有效 `MoldInstallation` |
| `PENDING_REPAIR` | 生产模具实例待维修、待保养或待判定 |
| `UNDER_REPAIR` | 生产模具实例正在维修或保养 |
| `DISABLED` | 生产模具实例停用但未正式报废 |
| `SCRAPPED` | 生产模具实例已报废，终态 |

冻结约束：

- `SCRAPPED` 为终态，不允许重新安装、移动到可用位置或记录使用。
- `INSTALLED` 必须存在一个有效且未关闭的 `MoldInstallation`。
- `PENDING_INSTALLATION / PENDING_REPAIR / UNDER_REPAIR / DISABLED / SCRAPPED` 不得存在有效安装事实。
- `RecordMoldUsage` 不改变生命周期到长期 `IN_USE`；使用事实只写 `MoldUsageEvent`，当前使用摘要由读模型推导。
- 如 future UI 需要展示 `IN_USE`，只能作为 transient derived usage state，不得写入 `ProductionMoldInstance.current_status`。

## 7. Audit / Event Transaction Boundary

所有成功 management command 必须写审计。

事务边界冻结如下：

- 状态变更、事实记录、审计记录必须在同一 `mes-service` 本地事务内原子提交。
- 成功命令需要发布的 integration event 必须在同一事务内写入 outbox 或等价的本地事件待发布记录。
- 本地事务提交失败时，不得发布事件。
- 事件发布失败不得回滚已经提交的 MES truth；必须通过 outbox retry / dead-letter / 运维补偿保证可观察与可恢复。
- query 不得依赖尚未发布的 event 来返回 MES 本地 truth。

phase 1 冻结事件：

- `MoldRegistered`
- `MoldMoved`
- `MoldInstalled`
- `MoldUnmounted`
- `MoldUsageRecorded`
- `MoldLifeWarningRaised`
- `MoldScrapped`

## 8. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- 完整 `MoldCapability` / `MoldSetup` 命令面
- `MoldDesignRevision`
- 模具部件级或套组级建模
- 模具维修保养完整流程
- 模具成本摊销、折旧或财务资产 truth
- 模具采购、索赔、供应商评分和重采决策
- 完整质量健康评分
- WMS 模具库存管理
- 外部 HTTP / BFF contract

## 9. 关联真相源

本目录以上游稳定文档为准：

- [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
- [mes-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/mes-service-design.md)
- [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [AGENTS.md](/Users/acehood/Documents/GitHub/oes/AGENTS.md)
