# MES Mold Minimum Loop

> 服务设计唯一真相源：[mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)。本文只记录 MES 模具管理第一阶段最小闭环的执行范围、已确认设计修正、切片顺序与验证要求；MES 服务长期边界、资源模型、质量边界、Planning / WMS / Item Master 边界仍以服务真相源为准。

```text
status: BUSINESS_FEATURE_IMPLEMENTATION_PRESENT_TRUSTED_GRPC_FROZEN_PENDING_IMPLEMENTATION
trustedGrpcTruth: docs/contracts/mes-service/README.md and docs/plans/features/trusted-grpc-execution-context.md
```

当前 main 已包含本 packet 所列 `ItemModelRef`、`AcceptProductionMold`、`RecordMoldUsageBatch`、MasterMold query、scrap 与 BFF checklist 下沉等 contract/proto/runtime/BFF 基线；本文的历史线程表保留原切片记录，不再表示这些能力尚未出现。此次新增的 trusted-gRPC slice 只迁移 32 个既有 inbound RPC：全部为 HUMAN WEB BUSINESS，并删除 body/legacy metadata authority。它不实现 tenant-web/PDA、设备自动化、Planning/WMS/Quality/Site 协同或新的 MES 业务能力。

## 1. 目标

- 实现 MES 模具管理第一阶段最小闭环，支撑生产模具从到厂登记、验收、安装、使用计寿命到待报废/报废的现场管理。
- 以 `MoldDesign -> MasterMold optional -> ProductionMold -> ToolingInstallation(type=MOLD) -> MoldInstallationDetail -> MoldUsageRecord -> MoldLifeCounter` 为核心链路。
- 对齐 mes-service contract、proto、runtime、API Gateway BFF 与 tenant-web，不在 BFF 或前端定义 MES domain truth。
- 支持 Web 过渡录入流程，同时保证未来 PDA 扫产线码录入模具使用事实时可复用同一 MES 能力。
- 修正已识别的 contract/runtime/UI 冲突，不用临时补丁或旧模型兼容层掩盖问题。

## 2. 不做什么

- 不实现母模开发流程、试模、评审、修订、开发工单或内部模具制作单。
- 不实现内部模具车间生产模具制作过程、内部调拨过程或跨工厂资产流转闭环。
- 不把内部模具厂建模成外部供应商或采购。
- 不实现 ProductionUnit 自动绑定胚体。
- 不从 OperationExecution 自动反推 MoldUsageRecord。
- 不实现完整维修 / 保养工单闭环。
- 不实现模具质量分析、良率分析、缺陷关联分析或部件级寿命。
- 不实现 Route / OperationTask / FLOW_SCAN 完整执行模型。
- 不实现 WMS 交仓、废模区、报废处置仓位或库存协同。
- 不实现 Site / Area / WorkCenter / StorageResource / CarrierResource 主数据维护。
- 不保存 daily checklist / usage batch 业务单据。

## 3. 上游依赖

- architecture:
  - [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
- mes-service contracts:
  - [README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/README.md)
  - [mold-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-management.md)
  - [mold-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-query.md)
- API Gateway contract:
  - [mes-mold-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/mes-mold-management.md)
- proto:
  - [mes.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/mes_service/mes.proto)

## 4. 当前结论

- `MoldDesign` 是模具设计方案真相，决定输出结构、材质、生产方式和默认寿命模板。
- `MoldDesign` 主关联 `ItemModel`，不是执行层 `Item`；具体 `Item` 在生产执行、交仓、库存、BOM、成本核算等场景再解析或引用。
- `MoldDesign` 的 primary output 和 `outputs[]` 应表达理论输出模型，第一阶段 contract/proto 应从 `ItemRef` 修正为 `ItemModelRef`。
- 不同材质或明显不同生产方式应创建不同 `MoldDesign`，例如石膏地摊模和树脂高压模不共用同一个设计。
- `MasterMold` 是母模结果对象，是未来模具开发流程的最终产物；第一阶段不实现开发流程，只管理结果对象。
- `ProductionMold` 是生产模实物，是安装、使用、计寿命与报废状态的主体。
- `ProductionMold` 不应在开始制作时创建；应在实际到达使用工厂并收货登记时创建。
- 外部模具厂来源通过 `supplierRef / purchaseRef` 引用外部供应商与采购事实；内部模具厂来源通过 `sourceMasterMoldId` 表达母模来源，内部制作单后置。
- 自己的模具车间应建模为内部组织 / 内部制造地点，可作为 MES 资源体系中的另一个 `Site / StorageResource` 被引用，但本 feature 不实现资源主数据维护。
- Web daily checklist 是 PDA 未实现前的过渡作业形态，不是 MES 领域对象。
- 未来 PDA 目标流程是主管扫 WorkCenter / 产线码，读取当前安装模具，确认使用次数并提交 usage batch。

## 5. 对象与生命周期规则

### 5.1 MoldDesign

- 第一阶段只支持 `RegisterMoldDesign`。
- 不支持 `UpdateMoldDesign`、默认寿命修改、revision / supersede 流程。
- `functionRole` 第一阶段保留但弱化，默认 `PRODUCTION`，不用于限制 MasterMold 或 ProductionMold 创建。
- `defaultLifeLimit / defaultLifeUnit` 是创建 ProductionMold 时的默认寿命模板，不是 MoldDesign 自身寿命。
- `primaryItemModelRef` 是 MoldDesign 的主产品模型归属；多腔、多件、组合产出时由 `outputs[].itemModelRef` 表达每个理论产出位置的模型。
- 创建 ProductionMold 时用 MoldDesign 默认寿命初始化独立 `MoldLifeCounter`。
- `outputs[]` 保留理论输出结构概念，但字段口径按本 packet 修正为 `ItemModelRef`；tenant-web 第一阶段只支持一个 primary output 和可选一个 option。

### 5.2 MasterMold

- 第一阶段采用结果对象最小闭环。
- 支持 `RegisterMasterMold / ListMasterMolds / GetMasterMold`。
- `RegisterMasterMold` 表示母模已经完成并入库 / 可作为生产模来源引用，不表示开始开发母模。
- `MasterMoldStatus = AVAILABLE / DISABLED`。
- 创建后状态为 `AVAILABLE`。
- 必须填写初始位置，且只能提供 `initialStorageResourceRef` 或 `initialCarrierResourceRef` 之一。
- 第一阶段不支持 MasterMold 移动、安装、使用、寿命、报废。
- tenant-web 在现有“模具管理”页面增加 `MoldDesign / MasterMold` 两个 tab，不新增独立母模菜单。

### 5.3 ProductionMold

- `RegisterProductionMold` 表示使用工厂到厂收货 / 登记一套生产模实物。
- 第一阶段新增 `AcceptProductionMold`，表示验收通过并进入可用状态。
- `RegisterProductionMold -> RECEIVED`。
- `AcceptProductionMold -> AVAILABLE`。
- `RegisterProductionMold` 必须填写初始位置，且只能提供 `initialStorageResourceRef` 或 `initialCarrierResourceRef` 之一。
- `AcceptProductionMold` 只记录 `acceptedAt` 和 audit reason，不记录验收明细。
- `sourceMasterMoldId` 可选；有值时必须引用同 tenant/org 可见、`AVAILABLE`、同 `moldDesignId` 的 MasterMold。
- `supplierRef / purchaseRef` 用于表达外部模具厂 / 采购来源引用。
- 第一阶段不新增 `sourceType`，来源通过字段组合表达。

第一阶段 ProductionMold 状态：

```text
RECEIVED
PREPARING
AVAILABLE
INSTALLED
MAINTENANCE
DISABLED
SCRAP_PENDING
SCRAPPED
```

命令状态迁移：

```text
RegisterProductionMold:
  -> RECEIVED

AcceptProductionMold:
  RECEIVED -> AVAILABLE

MoveTooling:
  allow: RECEIVED / PREPARING / AVAILABLE / MAINTENANCE / DISABLED
  reject: INSTALLED / SCRAP_PENDING / SCRAPPED

InstallTooling:
  allow: AVAILABLE
  reject: RECEIVED / PREPARING / INSTALLED / MAINTENANCE / DISABLED / SCRAP_PENDING / SCRAPPED

UnmountTooling:
  INSTALLED -> AVAILABLE
  SCRAP_PENDING -> SCRAPPED

RecordMoldUsage / RecordMoldUsageBatch:
  allow: INSTALLED
  reject: all other statuses

AdjustMoldLifeCounter:
  allow: all non-SCRAPPED statuses, including SCRAP_PENDING
  reject: SCRAPPED

MarkProductionMoldForScrap:
  INSTALLED -> SCRAP_PENDING
  RECEIVED / PREPARING / AVAILABLE / MAINTENANCE / DISABLED -> SCRAPPED
  reject: SCRAP_PENDING / SCRAPPED
```

## 6. 安装、使用与寿命

- `ToolingInstallation(type=MOLD)` 是模具安装主事实。
- `MoldInstallationDetail` 保存模具专属安装字段，例如 `moldPosition / cavityPosition / cavityMapping / setupParameters`。
- `WorkUnitRef` 不是历史遗留，但第一阶段 optional；如果安装记录包含 WorkUnitRef，usage fact 可从安装记录继承。
- `MoldUsageRecord` 是模具寿命事实，不替代 OperationExecution。
- 第一阶段新增 `RecordMoldUsageBatch`，用于一次提交一个 WorkCenter 一组模具使用事实。
- `RecordMoldUsageBatch` 不是 checklist 单据，不保存 batch 业务对象。
- batch 使用一个 batch-level `usedAt`，所有行共用，不支持行级 usedAt override。
- 已提交 usage 行必须 `usageQuantity > 0`。
- Web/PDA 不暴露 `lifeDelta` 给用户；服务端默认 `lifeDelta = usageQuantity`。
- `lifeUnit` 第一阶段默认 `CASTING_CYCLE`。
- 每条已提交 usage 行必须携带 `productionMoldId` 和 `toolingInstallationId`。
- 服务端必须校验 installation active、installation.toolingId 与 productionMoldId 匹配、installation.workCenterRef 与 batch workCenterRef 匹配。
- 行级 `moldDesignOutputId / moldDesignOutputOptionId / productionSpecRef` 不强制；能可靠推导则填，不能推导允许为空。
- `MoldLifeCounter` 是独立寿命真相；ProductionMold 详情和列表都必须实时读取 / 组装当前 counter，不依赖 ProductionMold 表上的旧 summary 快照作为真相。
- `AdjustMoldLifeCounter` 只放后台管理端手工调整，必须填写 audit reason，不进入每日注浆录入流程。

## 7. 报废模型

- 第一阶段采用两步简化报废模型。
- `MarkProductionMoldForScrap` 标记生产模待报废或终态报废。
- 对已安装模具执行 `MarkProductionMoldForScrap` 时进入 `SCRAP_PENDING`，active installation 保持 active，等待现场拆除。
- 对未安装模具执行 `MarkProductionMoldForScrap` 时直接进入 `SCRAPPED`。
- `SCRAP_PENDING` 表示已禁止继续使用，但模具可能仍在产线上，等待拆除。
- `UnmountTooling` 卸下 `SCRAP_PENDING` 模具后，ProductionMold 自动进入 `SCRAPPED`。
- `SCRAP_PENDING` 仍显示当前 active installation 位置，状态显示“待报废 / 待拆除”。
- `SCRAP_PENDING` 和 `SCRAPPED` 都不允许 `MoveTooling`。
- `SCRAPPED` 是终态，不允许使用、安装、移动或寿命调整。

## 8. Web 过渡清单与 PDA 目标

- daily checklist 是 Web 过渡作业形态，不是 MES 领域对象。
- Web 过渡流程：

```text
文员在 Web 按 WorkCenter 打印产线模具清单
-> 成型主管拿纸质清单去现场记录当天注浆次数
-> 成型主管交回纸质记录
-> 文员在 Web 按产线录入每日注浆记录
-> BFF 调用 mes-service RecordMoldUsageBatch
-> MES 写 MoldUsageRecord 并累计 MoldLifeCounter
```

- mes-service 不应把 `PrintDailyMoldChecklist` 作为稳定核心 query 暴露。
- API Gateway BFF 可保留 `daily-mold-checklists` HTTP 路由作为 Web convenience，内部基于 `ListCurrentMoldsByWorkCenter` 组装打印模型。
- tenant-web 打印清单不写数据库。
- tenant-web 批量录入不创建 checklist / batch 单据。
- 最终只保存 usage facts、life counter、audit、outbox、idempotency。
- `SCRAP_PENDING` 行必须出现在 Web 打印/录入清单和未来 PDA 中，以保留模位顺序，但必须禁用，不允许提交 usage。
- SCRAP_PENDING 行不需要备注栏，不保存拆除提醒。

## 9. Contract / Proto 修正范围

本节业务修正已存在于 current main；trusted-gRPC 只在保持这些字段和行为的前提下实施 [MES contract trusted execution](../../contracts/mes-service/README.md#trusted-execution-contract) 的 authority tombstone、reason/capture-source 与 method declaration，不重新打开对象或生命周期设计。

- mes-service management contract:
  - 将 MoldDesign 主引用从 `ItemRef` 修正为 `ItemModelRef`。
  - 将 MoldDesign output 引用从执行层 `ItemRef` 修正为设计层 `ItemModelRef`。
  - 新增 `AcceptProductionMold`。
  - 新增 `MarkProductionMoldForScrap`，替代现有“直接终态报废并关闭安装”的 `ScrapProductionMold` 语义。
  - 新增 `RecordMoldUsageBatch`。
  - 明确 `RegisterProductionMold -> RECEIVED`，且初始位置必填。
  - 明确 `RecordMoldUsageBatch` 整批事务语义：未勾选行忽略；已提交行任一无效则整批失败，全部不写。
- mes-service query contract:
  - 新增 `GetMasterMold / ListMasterMolds`。
  - 移除或下沉 `PrintDailyMoldChecklist`，避免把 Web 过渡流程固化为 MES 核心 query。
  - 明确 ProductionMold detail 必须返回实时 life counter summary。
- proto:
  - 新增 `ItemModelRef`，并用于 `MoldDesign.primaryItemModelRef` 与 `MoldDesignOutput.itemModelRef`。
  - 新增 `MasterMoldStatus`。
  - 新增 `ProductionMoldStatus.SCRAP_PENDING`。
  - 新增 `AcceptProductionMold` RPC。
  - 新增 `MarkProductionMoldForScrap` RPC。
  - 新增 `RecordMoldUsageBatch` RPC。
  - 新增 `GetMasterMold / ListMasterMolds` RPC。
  - 移除或废弃 `PrintDailyMoldChecklist` RPC。
- API Gateway:
  - daily checklist 作为 BFF convenience，不作为 mes-service domain truth。
  - BFF batch usage 映射到 mes-service `RecordMoldUsageBatch`，不再拆成多次单条 `RecordMoldUsage`。
  - 补齐 `AcceptProductionMold`、`MarkProductionMoldForScrap`、`AdjustMoldLifeCounter`、MasterMold query / management HTTP surface。
- tenant-web:
  - 修正 ProductionMoldStatus 数字枚举映射。
  - Mold 管理页面增加 MoldDesign / MasterMold tab。
  - 生产模创建必须选择初始位置，可选选择同 MoldDesign 且 AVAILABLE 的 MasterMold。
  - 生产模从 RECEIVED 经 Accept 后才可安装。
  - usage batch 只提交 `usageQuantity > 0` 的可用安装模具。
  - SCRAP_PENDING 行显示但禁用。

## 10. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结 MES mold 第一阶段修正版边界与切片顺序 | `docs/plans/features/mes-mold-minimum-loop.md` | 用户确认、MES 服务真相源、当前 contracts / proto / runtime / BFF / UI 现状 | 当前 feature packet | completed |
| contract owner | 按本 packet 修正 mes-service 与 API Gateway contract / proto | `docs/contracts/mes-service/**`, `docs/contracts/api-gateway/mes-mold-management.md`, `src/common/src/contracts/mes_service/mes.proto`, generated proto | 当前 feature packet | 合法 contract/proto 与 proto lint 结果 | implementation-present / fresh-verification-needed |
| mes-service owner | 实现 application/domain/infrastructure/interface 修正 | `src/services/business/mes-service/**` | 更新后的 contract/proto | mes-service runtime、Prisma、L1/L2/L3 tests | implementation-present / fresh-verification-needed |
| api-gateway owner | 对齐 BFF HTTP surface 与 gRPC adapters | `src/services/api-gateway/src/modules/mes-service/**` | 更新后的 proto 与 API Gateway contract | BFF routes、DTO、adapter、tests | implementation-present / fresh-verification-needed |
| tenant-web owner | 对齐 Web 过渡流程与模具页面 | `app/web/apps/tenant-web/src/api/bff/mes/**`, `app/web/apps/tenant-web/src/views/admin/**` | BFF contract | tenant-web API client、页面、unit tests | pending |

## 11. 切片顺序

1. Contract / proto alignment
   - MasterMold query。
   - AcceptProductionMold。
   - MarkProductionMoldForScrap + SCRAP_PENDING。
   - RecordMoldUsageBatch。
   - 下沉 daily checklist 到 BFF convenience。
2. mes-service runtime alignment
   - ProductionMold 收货 / 验收 lifecycle。
   - MasterMold status 与 query。
   - batch usage transaction。
   - life counter detail freshness。
   - two-step scrap model。
3. API Gateway BFF alignment
   - HTTP route / DTO / adapter 对齐新 proto。
   - daily checklist BFF convenience 内部基于 current molds。
   - batch usage 单次 gRPC 调用。
4. tenant-web alignment
   - MoldDesign / MasterMold tabs。
   - ProductionMold 创建、验收、安装、使用、寿命调整、待报废 / 报废 UI。
   - enum normalize 修复。
5. Verification and closure
   - proto lint。
   - mes-service L1/L2/L3。
   - api-gateway MES BFF jest。
   - tenant-web MES API / 页面 vitest 或现有 test command。

## 12. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-16 | MasterMold 是开发流程产物还是生产模来源对象 | Blocker-Now | 影响 ProductionMold 创建和 UI 来源选择 | 第一阶段只管理结果对象，开发流程后置 | 本 packet / contract | closed |
| 2026-05-16 | 内部模具厂是否建成采购来源 | Blocker-Now | 若建成采购会污染采购与内部制造边界 | 内部模具厂作为内部 Site / 资源引用，制作单后置 | 本 packet / architecture follow-up | closed |
| 2026-05-16 | ProductionMold 创建节点 | Blocker-Now | 影响状态、位置、验收、安装规则 | 到厂收货时 Register，验收通过时 Accept | contract / proto / runtime | closed |
| 2026-05-16 | daily checklist 是否是 MES 领域对象 | Blocker-Now | 影响 mes-service query contract 与未来 PDA | 不保存 checklist，不作为 MES 核心 query，BFF 仅做 Web convenience | contract / BFF | closed |
| 2026-05-16 | BFF 拆行记录 usage 是否合理 | Blocker-Now | 一条产线多模具会导致多次下游调用和分散事务 | mes-service 新增 RecordMoldUsageBatch | contract / proto / runtime | closed |
| 2026-05-16 | 报废是否同步拆除 active installation | Blocker-Now | 原直接报废模型不符合现场拆除安排 | 两步模型：Mark -> SCRAP_PENDING，Unmount 后 SCRAPPED | contract / proto / runtime / UI | closed |
| 2026-05-16 | ProductionMold detail 寿命 summary 可能过期 | Defect-Now | 详情可能读取旧投影，不符合 MoldLifeCounter 独立真相 | 详情实时读取独立 counter 组装 read model | mes-service runtime | open |
| 2026-05-16 | tenant-web ProductionMoldStatus 数字枚举映射错误 | Defect-Now | proto `SCRAPPED=7` 可能显示成 DISABLED | 集中修正 enum normalize | tenant-web | open |
| 2026-05-16 | MoldDesign 应关联 ItemModel 还是 Item | Blocker-Now | 影响 contract/proto 字段和 UI 产品选择器 | MoldDesign 设计层主关联 ItemModel，执行层 Item 留给生产执行和交仓等场景 | architecture / contract / proto / UI | closed |

## 13. 验收标准

- contract / proto 不再把内部模具厂建模为采购来源。
- contract / proto 不再把 MoldDesign 主绑定到执行层 Item，而是绑定到 ItemModel。
- contract / proto 支持 MasterMold 最小查询闭环。
- RegisterProductionMold 创建 `RECEIVED` 状态生产模，且初始位置必填。
- AcceptProductionMold 将 `RECEIVED` 生产模推进到 `AVAILABLE`。
- 未验收生产模不可安装。
- ProductionMold 创建时可选 sourceMasterMoldId，且必须引用同 MoldDesign、AVAILABLE 母模。
- InstallTooling 只允许 AVAILABLE 生产模。
- RecordMoldUsageBatch 以单次 MES command 记录一组使用事实，并在同一事务内累计对应 MoldLifeCounter。
- usage batch 中任一已提交行无效时整批失败，且不写 usage / counter。
- SCRAP_PENDING 模具不可记录 usage，但仍出现在当前安装视图和 Web/PDA 使用录入清单中，并被禁用。
- MarkProductionMoldForScrap 对已安装模具产生 SCRAP_PENDING，对未安装模具产生 SCRAPPED。
- UnmountTooling 卸下 SCRAP_PENDING 模具后推进 SCRAPPED。
- ProductionMold detail 和 list 都返回实时 MoldLifeCounter summary。
- tenant-web 不再把 `ProductionMoldStatus` 数字 7 显示为 DISABLED。
- daily checklist 不保存业务单据，不进入 mes-service domain truth。

## 14. 验证计划

- `pnpm proto:lint`
- 如 proto 修改：`pnpm proto:gen`
- `pnpm --filter mes-service test:l1`
- `pnpm --filter mes-service test:l2`
- `pnpm --filter mes-service test:l3`
- `pnpm --filter api-gateway exec jest src/modules/mes-service --runInBand`
- `pnpm --dir app/web test:unit -- apps/tenant-web/src/api/bff/mes/index.spec.ts apps/tenant-web/src/views/admin/mes-mold-management.spec.ts apps/tenant-web/src/views/admin/mes-production-mold-management.spec.ts apps/tenant-web/src/views/admin/mes-mold-design-detail.spec.ts --dom`
- 如果前端 test command 与仓库实际脚本不匹配，执行仓库现有 vitest 精确文件命令并在交付中说明。

## 15. 关闭条件

- 本 feature packet 经用户确认。
- 更新 `docs/architecture/services/mes-service.md` 中与本 packet 冲突的稳定规则，尤其是报废模型、ProductionMold 创建节点、daily checklist 边界。
- 更新 mes-service 与 API Gateway contract。
- 更新 proto 并生成 common generated code。
- mes-service runtime、BFF、tenant-web 对齐新 contract。
- 验证计划中的必要命令通过，无法运行的命令必须说明原因和剩余风险。
