# MES Service Design Workspace

## 1. 目标

- 冻结卫浴陶瓷场景下 `mes-service` 的第一阶段边界与最小能力范围。
- 记录 `mes-service` 对制造规格主数据、计划工作台、质量规则服务的边界草稿。
- 为后续不同线程并行推进关联设计提供恢复入口与来源标记。

## 2. 当前范围

- 本 workspace 负责：
  - `mes-service` 的职责边界
  - `mes-service` 第一阶段最小能力清单
  - 在制品表达、工序流转、质检/修补/报废/烧成追溯的冻结结论
  - 从 `mes-service` 派生出的关联设计草稿入口
- 本 workspace 不负责：
  - 代码实现
  - 完整 `ERP` 设计
  - 完整 `quality-service` 设计
  - 完整 `planning-workbench` / APS 设计
  - 完整产品主数据域设计

## 3. 涉及对象

- services:
  - `mes-service`
  - `quality-service`（来源于 MES 的依赖草稿）
  - `planning-workbench`（来源于 MES 的依赖草稿）
  - `ManufacturingSpec`（MES 内部 manufacturing master object）
  - `item-master-service`（提供 `manufacturable` Item 准入边界）
- features:
  - 单件二维码追溯
  - 工序执行与巡检
  - 生产内质检与责任回溯
  - 修补、返工、报废控制
  - 窑炉/窑次/窑车/位置追溯
  - 模具优先管理
- collaborations:
  - `mes-service <-> quality-service`
  - `mes-service <-> planning-workbench`
  - `mes-service <-> ERP`
  - `mes-service <-> item-master-service`

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-17 | `mes-service` 第一阶段定位为制造执行与追溯真相服务，不吞掉完整 APS、完整质量治理和工资结算。 | MES、planning、quality、ERP 边界 | `docs/architecture/services/mes-service.md` |
| 2026-04-17 | 工艺路线允许按工厂/产品配置，但不允许随意跳步；强前置约束与放行规则必须显式建模。 | MES 流转模型 | `docs/architecture/services/mes-service.md` |
| 2026-04-17 | 大多数工序采用“一次扫码/一次提交”的轻交互；少数关键工序允许双动作，如入/出烘干房、装窑、委外发出/回厂、修补完成/复检。 | PDA 与现场交互 | `docs/contracts/mes-service/**`（未来） |
| 2026-04-17 | 有码对象必须扫码进入追溯链；无码对象继续按人工方式处理，但不伪造完整单件追溯历史。 | 上线过渡策略、追溯真相 | `docs/architecture/services/mes-service.md` |
| 2026-04-17 | 质检人员负责客观录入瑕疵事实，系统根据规则自动生成内部质量分类/标准化结果；客户接受性不放在 MES 第一阶段。 | MES、quality-service | `docs/plans/designs/quality-service-design.md`（未来） |
| 2026-04-17 | 修补是正式但可选工序；修补后必须二次质检，未通过不能继续后续工序，也不能计为成功可结算工作量。 | MES 工艺路线、ERP 输入 | `docs/architecture/services/mes-service.md` |
| 2026-04-17 | 任意工序都可发起报废，但报废必须人工确认；系统可根据当前工序自动给出处置类别。 | 报废控制、审计 | `docs/architecture/services/mes-service.md` |
| 2026-04-17 | 巡检是标准能力，车间管理员可随时用 PDA 扫码查看在制品当前工序、阻塞原因、最近检验与关键追溯摘要。 | PDA 查询视图 | `docs/contracts/mes-service/**`（未来） |
| 2026-04-17 | 模具管理是 `mes-service` 第一阶段优先能力，但依赖产品/制造规格主数据边界同步冻结。 | MES 与主数据协同 | `docs/plans/designs/manufacturing-master-data-design.md` |
| 2026-04-18 | MES WIP 管理采用“阶段推导 + 关键库区/中转区容量 + 可配置移动采集”的低负担模型，不对所有暂存点强制扫码。 | WIP 管理、planning 约束、瓶颈分析 | 本 workspace；未来 `docs/architecture/services/mes-service.md` |
| 2026-04-18 | 窑车是载具/承载单元，不是 WIP 库区；待装窑区是 WIP location，窑车容量由载具模型表达。 | 烧成追溯、WIP location 建模 | 本 workspace；未来 `docs/architecture/services/mes-service.md` |
| 2026-04-18 | 未来自动化流水线通过不同 `CaptureSource` 接入同一套工序、位置、流转事件模型，不把人工扫码写死为唯一采集方式。 | MES 自动化演进 | 本 workspace；未来 `docs/architecture/services/mes-service.md` |
| 2026-05-04 | MES 制造资源与执行建模冻结为：工序路线看 `Operation` / `Routing`；实际执行看 `WorkCenter`；实物位置看 `MesLocation`；空间瓶颈看 `MesLocation` + `CapacityProfile`；执行瓶颈看 `WorkCenter` / `Equipment` + `CapacityProfile`。 | MES 资源模型、WIP 流转、模具流转、APS 约束输入 | `docs/architecture/services/mes-service.md` |
| 2026-05-04 | 当前阶段不建立独立 `product-service`；`ManufacturingSpec` 归 `mes-service`，`item-master-service` 只提供 `manufacturable` 且 `PHYSICAL` 的 `Item` 准入边界。 | MES、Item Master、模具管理、制造规格 owner 边界 | `docs/architecture/services/mes-service.md`; `docs/contracts/mes-service/**` |

## 5. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-17 | `mes-service` 是否应在第一阶段同时新增正式服务职责卡 | 已有结论接近冻结，但仍需把关联主数据和 planning 依赖再看一轮 | 完成本轮 design draft 后再回写服务职责卡 |
| 2026-04-17 | `quality-service` 是独立服务还是先作为质量规则子域 | 当前只冻结了边界方向，未冻结服务化时机 | 在独立质量设计线程中收敛 |
| 2026-04-18 | 第一阶段 feature slice 如何拆分 | 这属于 plan 阶段，不应在 design 阶段提前写成实施步骤 | design 收口后进入 plan |
| 2026-04-18 | 字段级 contract 与 proto 如何定义 | 当前只冻结黑盒契约边界，字段级契约应在 contracts 阶段细化 | 回写 `docs/contracts/mes-service/**` |

## 6. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/mes-service.md`
- 协同蓝图：
  - `docs/architecture/collaborations/mes-planning-quality-erp.md`
- contracts：
  - `docs/contracts/mes-service/`（未来）
- feature packet：
  - 暂不进入 feature packet，先冻结设计真相
- architecture / ADR：
  - 如主数据服务化方式、quality-service 服务化方式存在分歧，再升级到 architecture / ADR

## 7. 恢复入口

- 下次继续前先读：
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
  - [planning-workbench-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/planning-workbench-design.md)
- 当前推荐下一步：
  - 回写 `mes-service` 职责卡
  - 独立开线程推进制造主数据设计
  - 独立开线程推进 planning-workbench 设计

## 8. WIP 库区 / 中转区设计草稿

### 8.1 当前判断

- 粗胚库、精胚库、釉胚库、待检区、待修补区、待装窑区等属于 MES 的制造过程暂存区，不属于 WMS 成品库存。
- 这些区域不应直接套用 WMS 的复杂库存管理，但必须支持制造流转、容量约束、瓶颈分析与计划约束。
- WIP 管理不能只靠物理库区，也不能只靠状态推导；应采用“阶段 + 位置”双维度模型。

### 8.2 核心概念

- `WipStage`
  - 表达在制品的制造阶段，例如湿胚、常温干燥、烘干中、粗胚待检、精胚、釉胚、待装窑、成瓷待检。
- `WipLocation`
  - 表达在制品当前所在的物理或逻辑位置，例如产线旁缓冲区、烘干房、一检前中转区、精胚暂存区、釉胚暂存区、待修补区。
- `WipMovementEvent`
  - 表达在制品进入或离开某个位置/阶段的事实。
- `WipSummary`
  - 面向看板、计划和瓶颈分析的汇总读模型，避免每次查询都实时扫描所有在制品明细。

### 8.3 WIP location 分类

- 工艺资源型位置：
  - 烘干房等有明确工艺时间与容量约束的位置。
- 工序间缓冲位置：
  - 出烘干房后、一检前的待检缓冲区。
  - 一检后、喷釉前的精胚缓冲区。
  - 喷釉后、装窑前的釉胚缓冲区。
- 暂存/滞留位置：
  - 暂时不处理胚体的存放区。
  - 异常待判区。
  - 待修补、待返工、待复检区。

### 8.4 容量约束

每个关键 `WipLocation` 应支持：

- 理论容量
- 当前占用量
- 可用容量
- 容量单位：
  - 件
  - 板车
  - 面积
  - 工位数
- 是否作为 planning / APS 约束
- 是否允许超容
- 超容是否需要审批

出烘干房不能只看烘干时间是否满足，还应考虑：

- 一检前中转区是否有容量
- 一检人员/班组当前处理能力
- 后续精胚区、喷釉前缓冲区是否可能堵塞
- 当前 demand 优先级与插单情况

### 8.5 常温干燥缓冲

- 成型脱模后，胚体可能需要先在产线旁常温干燥，再进入烘干房。
- 该区域可能没有明确物理边界，不适合强制逐件扫码入区。
- 推荐：
  - 脱模完成后自动进入默认常温干燥缓冲阶段。
  - 入烘干房前执行放行校验。
  - 校验内容包括最小常温干燥时间、产品大小、环境湿度、工艺规则与必要人工确认。

### 8.6 移动采集模式

不同位置应支持不同 `movementCaptureMode`：

- `REQUIRED_SCAN`
  - 必须扫码或明确确认。
  - 适合烘干房、委外发出/回厂、关键装窑前节点。
- `BATCH_CONFIRM`
  - 可按批量确认。
  - 适合某些工序间中转。
- `AUTO_BY_STEP`
  - 根据工序完成自动推导。
  - 适合产线旁常温缓冲等低边界区域。
- `MANUAL_ADJUST`
  - 管理员巡检时调整。
  - 适合异常堆放或临时滞留。

### 8.7 窑车边界

- 窑车不是 `WipLocation`。
- 窑车是 `KilnCar`，属于载具/承载单元。
- 待装窑区是 WIP location。
- 产品进入窑车后，通过 `KilnPositionAssignment` 记录具体窑车、层、区、位置。

### 8.8 查询性能

- 阶段数量与位置容量不应依赖每次实时扫描全部 `WipUnit`。
- 应通过工序事件、阶段变化事件、位置移动事件维护汇总读模型：
  - `WipStageSummary`
  - `WipLocationCapacitySummary`
  - `WipBottleneckSummary`

### 8.9 自动化流水线兼容

核心模型不应写死人工扫码。

采集来源 `CaptureSource` 应支持：

- `PDA_SCAN`
- `MANUAL_ENTRY`
- `BATCH_CONFIRM`
- `AUTO_BY_STEP`
- `PLC_SIGNAL`
- `CONVEYOR_SENSOR`
- `VISION_SYSTEM`
- `SCADA_EVENT`

未来自动化流水线只改变采集来源，不改变 `WipUnit`、`ProcessStep`、`WipStage`、`WipLocation`、`WipMovementEvent` 的核心语义。

## 9. 行业场景与设计前提

### 9.1 适用行业场景

本设计当前面向卫浴陶瓷制造场景，典型产品包括：

- 马桶
- 洗手盆
- 小便器

典型主工艺链包括：

- 原料混合与过滤
- 注浆成型
- 脱模贴码
- 常温缓冲干燥
- 烘干房烘干
- 一检
- 洗胚上水
- 喷釉/色釉
- 刮脚/除尘
- 装窑
- 烧制
- 外观检
- 功能检

但本设计不把上述路线写死为唯一固定流程，因为现实中还存在：

- 外购干胚/金胚后从中间工序接入
- 本厂只做到中间工序，后续委外加工
- 白瓷完成后做花纸或 logo 二次加工、二次烧
- 同一产品在不同工厂具备不同工艺段能力
- 修补、返工、后置处理、委外修补

### 9.2 生产形态判断

- 该行业不是纯连续化工艺，也不是纯离散装配。
- 更准确的判断是：
  - 工艺链路具有强顺序约束
  - 现场执行高度依赖人工搬运、人工扫码、人工质检与人工交接
  - 批次、窑次、窑车、位置与单件追溯同时重要

因此 `mes-service` 不应直接套用“标准流水线 MES”或“纯装配 MES”模型，而应围绕：

- 单件二维码追溯
- 工序执行与放行
- WIP 缓冲与瓶颈位置
- 烧成装载与空间追溯
- 质量、修补、返工、报废闭环

## 10. 服务职责与边界

### 10.1 `mes-service` 长期负责

- 承接生产执行工单
- 管理在制品与成瓷追溯对象
- 管理工艺路线实例与工序放行
- 管理工序执行记录与工艺参数采集
- 管理生产内质检、瑕疵、责任回溯
- 管理修补、返工、复检、报废
- 管理窑炉/窑次/窑车/位置级烧成追溯
- 管理模具、泥浆、釉料等制造现场使用事实
- 管理制造过程中的 WIP location / buffer
- 为 planning、quality、WMS、ERP 输出事实事件

### 10.2 `mes-service` 不长期负责

- 主生产计划、约束求解、全局排产最优
- 企业级质量标准与客户质量政策真相
- 最终工资结算
- 财务成本核算
- 成品仓储库存真相
- 销售订单、出货单、结算单据真相
- 设备控制系统本身

### 10.3 与关联服务的边界

- `planning-workbench`
  - 负责 demand 汇总、投产建议、放行建议、派工建议
  - 不记录现场执行真相
- `quality-service`
  - 长期更适合负责缺陷字典、判定标准、客户质量接受策略、归责规则模板
  - MES 负责现场判定事实
- `WMS`
  - 负责成品仓储、库位、占用、出库与发货库存控制
  - 不接管 MES 的工序与在制品真相
- `ERP`
  - 负责订单履约、经营单据、结算、工资与财务影响
  - 消费 MES 事实，但不拥有制造现场真相

## 11. 对象总览

### 11.1 MES 核心对象

- `ExecutionOrder`
  - MES 执行主单，承接上游需求或受控临时来源工单
- `WipUnit`
  - 单件追溯对象；脱模贴码后正式建立
- `WipAttributeSnapshot`
  - 当前已锁定制造属性与未锁定属性快照
- `ProcessRecord`
  - 某工序的一次正式处理记录
- `InspectionRecord`
  - 任意质检点的检验记录
- `DefectRecord`
  - 瑕疵事实
- `DispositionDecision`
  - 放行、返工、修补、后置处理、报废等处置决策
- `ScrapRecord`
  - 报废确认事实
- `ResponsibilityAttribution`
  - 责任回溯与奖罚输入事实
- `KilnBatch`
  - 烧成批次
- `KilnCar`
  - 载具
- `KilnPositionAssignment`
  - 单件与窑车位置关联
- `WipLocation`
  - 制造过程位置与缓冲区
- `MoldUsageRecord`
  - 模具使用事实
- `MaterialUsageRecord`
  - 泥浆/釉料/色釉使用事实

### 11.2 不在 MES 中长期拥有的对象

- `SalesOrder`
- `SalesSku`
- `WarehouseInventory`
- `PayrollSettlement`
- `CustomerQualityAcceptancePolicy`

## 12. 在制品、制造规格与 SKU 的关系

### 12.1 当前判断

- 在制品不应过早绑定最终销售 SKU。
- 在制品更适合表达为：
  - `Product Family`
  - 已锁定制造属性
  - 尚未锁定属性

### 12.2 为什么不能直接用销售 SKU 表示在制品

- 前段工艺时，颜色、logo、花纸等后段属性尚未确定
- 某些结构属性在成型前或成型时就必须锁定
- 同一制造对象后期可能因客户质量要求不同而映射到不同可销售对象

### 12.3 推荐表达

- `Product Family / SPU`
  - 表达稳定产品族
- `Manufacturing Spec`
  - 表达影响制造路线、模具适配、前段承诺点的制造规格
- `WipAttributeSnapshot`
  - 表达当前在制品已锁定与未锁定属性

### 12.4 典型例子

- `A 洗手盆没打孔前胚体`
  - `resolvedAttributes = {}`
  - `pendingAttributes = [holePattern, glazeColor]`
- `A 洗手盆单孔未喷釉`
  - `resolvedAttributes = { holePattern: single }`
  - `pendingAttributes = [glazeColor]`
- `A 洗手盆单孔黑釉`
  - `resolvedAttributes = { holePattern: single, glazeColor: black }`
  - `pendingAttributes = []`

### 12.5 设计结论

- 不是“WIP 直接变成 SKU”
- 而是 WIP 在属性全部锁定、质量闭环完成后，被映射为某个销售 SKU 的可供货实例

## 13. 工艺路线与承诺点

### 13.1 路线不是固定死流程

MES 必须支持：

- 从头到尾完整生产
- 从中间工序接入
- 在中间工序结束
- 委外后继续流转
- 花纸/二次烧/laser logo 等后加工插入
- 修补、返工、复检等条件工序

### 13.2 路线也不是可随意跳步

必须显式支持：

- 前置工序约束
- 放行规则
- 失败后回流路径
- 条件工序
- 可选工序

明确禁止：

- 成型后跳过必要工艺直接喷釉
- 一检不通过仍直接进入后序
- 未喷釉直接烧制

### 13.3 承诺点不是单一固定工序

不同属性在不同工序锁定：

- 孔位、排污孔等结构属性通常前段锁定
- 颜色通常在喷釉前锁定
- 花纸、logo、二次加工属性可能后段锁定

因此本设计采用“属性级承诺点”而不是单一全局承诺点。

## 14. 现场交互原则

### 14.1 总体原则

- 尽可能多使用扫码代替人工输入
- 一道工序尽量一次扫码一次提交
- 少让工人选系统状态，多让系统根据事实自动推导
- 少让工人理解流程，多让系统理解工艺规则

### 14.2 关键例外

少数天然需要双动作或显式节点的场景：

- 入烘干房 / 出烘干房
- 委外发出 / 委外回厂
- 修补完成 / 复检
- 装窑

### 14.3 巡检

车间管理员应可在任意时刻用 PDA 扫码查询：

- 当前工序
- 当前阶段
- 当前所在位置
- 最近检验结果
- 当前瑕疵与处置
- 模具/泥浆/釉料/窑次追溯摘要
- 是否已移交 WMS
- 阻塞原因

## 15. 质检、瑕疵、修补、报废

### 15.1 质检职责

- 质检人员负责客观记录瑕疵事实
- 系统基于规则自动生成内部质量分类与标准化结果
- 客户是否接受不在 MES 第一阶段判定

### 15.2 瑕疵记录要求

每条 `DefectRecord` 应支持：

- 缺陷类型
- 位置/面别
- 数量或大小
- 严重度
- 图片
- 发现工序
- 发现人

### 15.3 补录与漏检追责

- 任意后续质检点都可补录前序漏检瑕疵
- 补录可能触发：
  - 产品内部质量分类变化
  - 前序责任追加
  - 前序质检漏检责任成立

### 15.4 修补

- 修补是正式但可选工序
- 厂内修补、发外修补都应作为工序或处置路径对待
- 修补完成后必须二次质检
- 二次质检未通过不能继续后序，也不能计为成功可结算工作量
- 某些修补必须后置到出货前执行，MES 应支持“后置处理”状态

### 15.5 报废

- 任意工序都可能发起报废
- 报废必须人工确认
- 系统根据当前工序自动推断处置类别

典型处置类别：

- 喷釉前胚体报废 -> 回泥浆池
- 喷釉后胚体报废 -> 胚体废弃
- 成瓷报废 -> 成瓷报废

### 15.6 质检点模型

MES 需要支持多个质检点，而不是只支持“最终成品检”。

当前至少要覆盖：

- 一检
  - 关注干胚阶段的裂、变形、孔位问题、明显结构问题
- 后续工序检
  - 例如喷釉后外观异常、装窑前异常
- 成品外观检
  - 关注面别、黑点、针孔、色差、修补痕等
- 功能检
  - 例如试水、冲力、漏水、内裂等
- 修补后二次质检
  - 判断修补是否达到继续流转或可出货标准
- 委外回厂检
  - 委外修补或委外工序返回后判断是否可接回主流程

每个质检点都应支持：

- 检验对象
  - 单件
  - 批次
  - 窑次
  - 窑车位置片段
- 检验结果
  - 继续放行
  - 进入修补
  - 返工
  - 待判
  - 建议报废
- 缺陷记录补充
- 图片与备注
- 是否触发责任回溯

### 15.7 瑕疵记录结构

`DefectRecord` 不应只是自由文本。

建议至少包含：

- `defectCode`
- `defectCategory`
- `defectName`
- `surfaceScope`
  - A 面
  - B 面
  - C 面
  - 可见面
  - 不可见面
- `defectLocation`
  - 位置描述或结构区段
- `severity`
- `count`
- `size`
- `imageRefs`
- `foundAtStep`
- `foundBy`
- `inspectionRecordRef`
- `isRecoveredFromPreviousMiss`
  - 是否为后续补抓前序漏检

### 15.8 自动判级与标准化结果

第一阶段不建议让质检员手工直接选择最终等级。

推荐流程：

- 人工录入客观瑕疵事实
- 系统根据规则生成标准化判定结果

系统输出可至少包括：

- `internalQualityClassification`
  - 内部标准化分类结果
- `releaseDecision`
  - 放行 / 条件放行 / 阻断 / 修补 / 报废建议
- `repairRecommendation`
  - 是否建议修补
- `scrapSuggestion`
  - 是否建议报废

自动判级规则至少应支持：

- 某类瑕疵必报废
- 某类瑕疵数量超过阈值则降级
- 某类瑕疵出现在特定面别则判定更严格
- 多瑕疵组合触发更高等级风险
- 某些瑕疵可修补，某些不可修补

这里的“等级”更适合理解为：

- 内部标准化质量分类

而不是：

- 最终客户可接受性

客户是否可接受、是否可按特定价格出售，应留给后续 `quality-service` / 销售协同域处理。

### 15.9 后续补录与重判

MES 必须允许：

- 后续质检点补录前序漏检瑕疵
- 因补录导致重新计算内部质量分类
- 因补录导致处置结果变化
- 因补录触发前序工序或前序质检的责任追加

这意味着：

- 质检结论不是只能判一次后永久不变
- 但所有重判必须保留审计轨迹

### 15.10 责任归因模型

单个瑕疵可以对应多个责任项。

建议 `ResponsibilityAttribution` 至少支持：

- `responsibilityType`
  - 工人
  - 班组
  - 工序
  - 质检漏检
  - 模具
  - 泥浆批次
  - 釉料批次
  - 窑炉/烧成控制
  - 公司责任
- `responsibilityLevel`
  - 主责
  - 次责
  - 关联责任
- `targetRef`
- `reason`
- `isPenaltyApplicable`
- `ruleRef`

典型场景：

- 产品变形
  - 成型工主责
  - 一检漏检次责
- 黑点
  - 可能归因到釉料批次、窑炉环境或公司责任
- 低级打孔错误
  - 成型工主责，通常应触发更强扣罚规则

### 15.11 奖罚输入边界

MES 第一阶段不直接做工资结算，但必须把奖罚输入事实做准。

建议输出对象至少包含：

- `penaltyInputRecord`
  - 责任对象
  - 关联瑕疵
  - 适用规则
  - 扣罚类型
    - 扣个
    - 扣款
    - 奖励
  - 数值
  - 原因
  - 关联工序
  - 关联产品/批次

#### 当前边界

- MES：
  - 记录奖罚输入事实
- quality / rule 子域：
  - 管理规则标准
- ERP 薪资/绩效模块：
  - 计算最终工资与结算结果

### 15.12 修补与质检闭环

修补必须作为正式工序进入质量闭环。

推荐规则：

- 发现可修补问题 -> 进入修补工序
- 修补完成 -> 自动进入修补后二次质检
- 二次质检通过 -> 恢复正常流转
- 二次质检不通过 -> 再修补 / 返工 / 报废 / 挂起

对于后置修补：

- 某些产品可暂时保留“待出货前修补”状态
- 但未完成修补并通过复检前，不得进入最终可出货状态

### 15.13 质量数据的经营价值

MES 沉淀的质量事实不只是为了现场放行，还应支撑：

- 模具质量表现分析
- 模具供应商优劣判断
- 泥浆/釉料批次异常回溯
- 窑次/位置级缺陷聚类
- 客户差异化供货
- 返工、修补、报废率分析
- 计件与绩效输入

## 16. 责任归因与奖罚输入

### 16.1 责任归因

单个瑕疵可关联多责任对象：

- 工人
- 班组
- 前序工序
- 质检漏检
- 模具
- 原料/釉料批次
- 窑炉/工艺控制
- 公司责任

### 16.2 奖罚边界

- MES 负责记录：
  - 事实
  - 责任归因结果
  - 适用规则引用
  - 扣个/扣款/奖励输入事实
- `ERP` 薪资/绩效模块负责最终结算

### 16.3 模具与供应商

- 模具不应成为“工资处罚对象”
- 但模具、模具供应商必须成为质量分析与采购决策的重要归因对象

## 17. 模具管理优先级

### 17.1 当前结论

模具管理是 `mes-service` 第一阶段优先能力之一。

### 17.2 核心能力

- 模具定义档
- 模具资产实例
- 模具使用事实
- 寿命统计
- 恢复时间/可用性控制
- 维修保养记录
- 与产品族、制造规格、产线适配关系

### 17.3 现场复杂性要求

必须支持：

- 材料维度：
  - 树脂模具
  - 石膏模具
- 功能维度：
  - 母模
  - 生产模具
- 生产方式维度：
  - 高压机模具
  - 上线模具
  - 立交上线模具
  - 地摊模具
- 产出结构维度：
  - 单模
  - 双胞胎
  - 多胞胎
- 组合结构维度：
  - 单款
  - 多组件组合

### 17.4 Setup 能力

某些模具具备“能力范围”而非单一固定规格，例如：

- 同一套马桶模具通过调整组件可生产 300/400 坑距

因此需要：

- `MoldCapability`
- `MoldSetup`

来表达“模具能做什么”和“本次实际设置成什么”。

## 18. 材料批次追溯

### 18.1 第一阶段要求

MES 必须能记录：

- 泥浆批次
- 釉料/色釉批次
- 常用检测数据摘要
- 成型时泥浆绑定
- 喷釉时釉料/色釉绑定
- 材料风险标记

### 18.2 目的

为了支持：

- 黑点、裂纹、变形、色差等质量回溯
- 同批材料不良率统计
- 与供应商、工艺、窑次联动分析

## 19. 扫码与统一条码能力的关系

### 19.1 MES 立场

- 第一阶段，MES 是在制品码的主要业务拥有方
- 但码的长期语义不应被写死为 MES 私有码

### 19.2 平台方向

OES 适合建设轻量 `trace identity + scan router` 能力，用于：

- 统一码注册
- 统一解析
- 统一扫码路由

MES、WMS、资产、行政等场景都应逐步接入该能力。

### 19.3 MES 第一阶段兼容

- 有码对象必须扫码
- 无码对象继续人工处理
- 不为无码对象伪造完整历史

## 20. 与 planning-workbench 的协同

### 20.1 计划工作台需要看的 MES 数据

- WIP 阶段分布
- 关键 buffer 占用与可用容量
- 模具可用性与恢复时间
- 烘干房、待检区、釉胚区、待装窑区占用情况
- 修补、返工、报废趋势
- 工序瓶颈

### 20.2 运行模式

- 手动模式
- 建议模式
- 自动模式

建议按工厂、车间、工序组分别配置，而不是全局单一开关。

## 21. 与 WMS / ERP 的交接原则

### 21.1 MES 不能直接出货

- MES 只能完成制造并移交
- 成品仓储和发运控制归 WMS
- 出货履约和经营单据归 ERP

### 21.2 MES -> WMS 一定会发生

- 无论是先入库再发货，还是快速履约，成品或可管理半成品进入仓储/发运控制时，都应发生 MES -> WMS 交接
- 区别只在于停留时间长短

### 21.3 交接方式

- 不是把 MES 对象搬到 WMS
- 而是 MES 保留制造追溯对象，发布移交事实事件
- WMS 基于该事件创建自己的仓储对象

### 21.4 二维码关联

- 二维码长期更适合绑定 `physicalTraceId`
- MES、WMS 各自对象都引用该标识
- 扫同一码时，不同终端或聚合页展示不同业务视图

### 21.5 MES 内部库存与 WMS 库存区分

- 粗胚库、精胚库、釉胚库等属于 MES 的 WIP location
- 成品库、发货库存属于 WMS

## 22. 第一阶段最小落地范围

### 22.1 必做

- 单件二维码追溯
- 工序流转与强前置约束
- 入/出烘干房控制
- 一检、后续质检、瑕疵记录
- 修补、返工、复检、报废
- 模具管理基础闭环
- 泥浆/釉料批次追溯基础闭环
- 窑次/窑车/位置追溯
- WIP stage + location + 关键容量
- 巡检查询
- 向 WMS / ERP / planning 输出事实

### 22.2 暂不做重

- 完整 APS 优化器
- 完整 quality-service 实现
- 完整主数据服务拆分实现
- 完整薪资结算
- WMS 式重库存管理
- 重型条码平台
- 全自动流水线控制

## 23. 回写与并行设计方向

- 将本 workspace 的稳定边界提炼到 `docs/architecture/services/mes-service.md`
- 独立开线程推进：
  - manufacturing master data
  - planning-workbench
  - quality-service
  - MES <-> WMS <-> ERP handoff / collaboration

## 24. 领域事件模型草稿

### 24.1 目标

- 明确 `mes-service` 对外应发布哪些业务事实。
- 避免 planning、quality、WMS、ERP 直接依赖 MES 内部表结构或内部对象生命周期。
- 区分“领域事实事件”和“服务内部技术事件”。

### 24.2 设计原则

- 对外事件只表达已经发生且可审计的业务事实。
- 不对外发布“可能回滚”的临时中间状态。
- 事件名称应以业务事实命名，而不是以控制器/接口动作命名。
- 对外消费者应依赖事件契约，而不是阅读 MES 实现代码。
- 同一物理实体跨服务引用时，应优先携带：
  - `physicalTraceId`
  - `tenantId`
  - `orgId`（如适用）
  - `executionOrderId`
  - 关键业务时间戳

### 24.3 事件分类

建议把事件分成 6 类：

- 在制品追溯事件
- 工序执行事件
- 质检与质量事件
- 模具/材料追溯事件
- 烧成与装载事件
- 仓储移交事件

### 24.4 在制品追溯事件

#### `WipUnitCreated`

表示：

- 脱模后正式创建了单件追溯对象
- 二维码/追溯标识已建立

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `productFamilyRef`
- `resolvedAttributes`
- `pendingAttributes`
- `createdAt`
- `createdBy`
- `moldAssetRef`（如已知）
- `executionOrderId`

典型消费者：

- `planning-workbench`
- trace / scan identity 聚合视图
- 追溯分析域

#### `WipUnitAttributesResolved`

表示：

- 某些制造属性在某一步被正式锁定

典型场景：

- 成型前通过 `MoldSetup` 确定 300 / 400 坑距
- 喷釉确定颜色
- 后加工确定花纸 / logo 类型

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `resolvedAttributesDelta`
- `remainingPendingAttributes`
- `resolvedAtStep`
- `resolvedAt`

典型消费者：

- `planning-workbench`
- `WMS`
- `ERP`

#### `WipUnitStageChanged`

表示：

- 在制品制造阶段发生变化

例如：

- 湿胚 -> 常温缓冲
- 常温缓冲 -> 烘干中
- 粗胚待检 -> 精胚
- 精胚 -> 釉胚

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `fromStage`
- `toStage`
- `currentLocationRef`
- `changedAt`
- `changeSource`

典型消费者：

- `planning-workbench`
- 瓶颈分析/BI

### 24.5 工序执行事件

#### `ProcessRecordCompleted`

表示：

- 某道工序的一次正式处理已完成

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `processStep`
- `processRecordId`
- `operatorRef`
- `teamRef`
- `completedAt`
- `parameterSummary`
- `result`

典型消费者：

- `planning-workbench`
- `quality-service`
- 生产分析域

#### `WipLocationChanged`

表示：

- 在制品进入或离开关键 `WipLocation`

特别适用于：

- 入/出烘干房
- 进入待检区
- 进入待修补区
- 进入待装窑区

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `fromLocationRef`
- `toLocationRef`
- `movementCaptureMode`
- `changedAt`

典型消费者：

- `planning-workbench`
- 瓶颈分析/BI

### 24.6 质检与质量事件

#### `InspectionCompleted`

表示：

- 某个质检点的一次检验完成

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `inspectionRecordId`
- `inspectionType`
- `stepRef`
- `inspectorRef`
- `completedAt`
- `hasDefects`
- `releaseDecision`
- `internalQualityClassification`

典型消费者：

- `quality-service`
- `planning-workbench`
- `ERP`（间接消费）

#### `DefectRecorded`

表示：

- 记录了一条瑕疵事实

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `defectRecordId`
- `defectCode`
- `surfaceScope`
- `severity`
- `count`
- `size`
- `foundAtStep`
- `foundAt`
- `isRecoveredFromPreviousMiss`

典型消费者：

- `quality-service`
- BI / 缺陷分析
- 供应商质量分析

#### `QualityClassificationRecalculated`

表示：

- 由于补录或重判，内部质量分类或放行决策发生变化

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `previousClassification`
- `newClassification`
- `previousReleaseDecision`
- `newReleaseDecision`
- `reason`
- `recalculatedAt`

典型消费者：

- `quality-service`
- `WMS`
- `ERP`

#### `DispositionDecided`

表示：

- 对当前对象的后续处置已被正式决定

例如：

- 放行
- 返工
- 修补
- 后置修补
- 建议报废

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `dispositionDecisionId`
- `dispositionType`
- `decidedAt`
- `reason`

典型消费者：

- `planning-workbench`
- `quality-service`
- BI

#### `ResponsibilityAttributed`

表示：

- 已对瑕疵或漏检形成正式责任归因结果

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `defectRecordId`
- `responsibilityType`
- `responsibilityLevel`
- `targetRef`
- `isPenaltyApplicable`
- `ruleRef`
- `attributedAt`

典型消费者：

- `ERP`
- 绩效/分析域

#### `PenaltyInputGenerated`

表示：

- 已形成可供 ERP 薪资/绩效模块消费的奖罚输入事实

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `penaltyInputRecordId`
- `targetRef`
- `penaltyType`
- `value`
- `ruleRef`
- `generatedAt`

典型消费者：

- `ERP`

### 24.7 模具/材料追溯事件

#### `MoldUsageRecorded`

表示：

- 某次生产已正式绑定模具资产使用事实

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `moldAssetRef`
- `moldDefinitionRef`
- `moldSetupRef`
- `usedAt`
- `operatorRef`

典型消费者：

- 模具分析
- `quality-service`
- BI

#### `MaterialUsageRecorded`

表示：

- 某次生产已正式绑定泥浆/釉料/色釉批次使用事实

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `materialBatchRef`
- `materialType`
- `usedAtStep`
- `usedAt`
- `operatorRef`

典型消费者：

- `quality-service`
- BI
- 供应商质量分析

### 24.8 烧成与装载事件

#### `KilnBatchStarted`

表示：

- 某窑次正式开始烧成

建议携带：

- `kilnBatchId`
- `kilnRef`
- `startedAt`
- `operatorRef`
- `batchType`

典型消费者：

- `planning-workbench`
- 烧成分析

#### `KilnPositionAssigned`

表示：

- 某在制品已被装入某个窑车位置

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `kilnBatchId`
- `kilnCarRef`
- `positionRef`
- `assignedAt`

典型消费者：

- `quality-service`
- 位置级缺陷分析

#### `KilnBatchCompleted`

表示：

- 某窑次烧成结束

建议携带：

- `kilnBatchId`
- `completedAt`
- `duration`
- `resultSummary`

典型消费者：

- `planning-workbench`
- BI

### 24.9 仓储移交事件

#### `FinishedUnitReadyForWarehouse`

表示：

- 制造范围内流程已完成，满足移交仓储前置条件

建议携带：

- `physicalTraceId`
- `finishedUnitId`
- `productFamilyRef`
- `resolvedAttributes`
- `internalQualityClassification`
- `releaseDecision`
- `readyAt`

典型消费者：

- `WMS`
- `ERP`

#### `FinishedUnitReleasedToWarehouse`

表示：

- 仓储交接已正式发生

建议携带：

- `physicalTraceId`
- `finishedUnitId`
- `releasedAt`
- `handoffRef`

典型消费者：

- `WMS`
- `ERP`
- 聚合追溯页

#### `FinishedUnitScrapped`

表示：

- 成品或在制品已正式报废，不进入正向仓储/履约链

建议携带：

- `physicalTraceId`
- `wipUnitId`
- `scrapRecordId`
- `scrapCategory`
- `scrappedAt`
- `reason`

典型消费者：

- `ERP`
- BI
- `quality-service`

### 24.10 不建议直接对外暴露的内部技术事件

这些可保留在服务内或内部总线，不建议作为外部协同契约主事件：

- `ScanSubmitted`
- `PdaFormSaved`
- `ProcessScreenOpened`
- `RuleEvaluationStarted`
- `RuleEvaluationCompleted`
- `SummaryProjectionUpdated`
- `NotificationQueued`

原因：

- 这些更像系统动作或技术实现，不是稳定业务事实

### 24.11 当前推荐结论

- `mes-service` 对外应发布少量高价值、可审计的领域事实事件。
- planning、quality、WMS、ERP 应主要消费这些事件或其黑盒读接口，而不是直接依赖 MES 内部对象。
- 事件模型必须围绕：
  - `physicalTraceId`
  - 在制品阶段变化
  - 工序完成
  - 质检/瑕疵/处置
  - 模具/材料使用
  - 烧成位置与窑次
  - 仓储移交

## 25. MES -> WMS -> ERP 交接事件与对象关系草稿

### 25.1 当前判断

- 生产完成后不是“对象消失并搬家”，而是发生“责任转移 + 下游对象创建”。
- `mes-service` 必须保留制造追溯真相。
- `WMS` 必须创建自己的仓储对象。
- `ERP` 必须基于订单、库存与经营单据执行履约与结算。

### 25.2 责任转移，而不是对象搬迁

MES 阶段，系统关注：

- 这个东西是怎么做出来的
- 当前和最后工序是什么
- 用了哪个模具、哪批泥浆、哪批釉料
- 经过哪个窑次、哪个窑车位置
- 有哪些瑕疵、修补、责任归因

WMS 阶段，系统关注：

- 这个东西现在作为什么库存对象存在
- 属于哪个可销售或可管理对象
- 在哪个仓储位置
- 是否已分配、待发货、已出货

ERP 阶段，系统关注：

- 订单是否被满足
- 发货与经营单据是否生成
- 成本、结算、绩效是否进入后续流程

因此设计上必须避免：

- MES 直接维护成品仓储库存真相
- WMS 直接复制并接管制造过程细节
- ERP 直接读取 MES 内部表作为经营真相

### 25.3 二维码与跨服务对象关系

二维码更适合绑定 `physicalTraceId`，而不是直接绑定某个服务内部对象 ID。

推荐关系：

- 二维码 -> `physicalTraceId`
- MES 对象：
  - `WipUnit` / `FinishedUnit`
  - 引用 `physicalTraceId`
- WMS 对象：
  - `InventoryUnit` / `InventoryLot`
  - 引用 `physicalTraceId`
- ERP 单据或履约对象：
  - 可引用 `physicalTraceId` 或基于其上层汇总对象关联

这样：

- MES PDA 扫码显示制造视图
- WMS PDA 扫码显示库存视图
- 租户管理员聚合页可显示全链路视图

### 25.4 MES 完工后的关键事件

建议 MES 至少发布这些事实事件：

- `FinishedUnitReadyForWarehouse`
  - 制造已完成，且满足移交仓储的基础条件
- `FinishedUnitReleasedToWarehouse`
  - 已正式移交 WMS
- `FinishedUnitRestricted`
  - 产品具有限制条件，例如待特定客户、待复核、受限放行
- `FinishedUnitScrapped`
  - 已确认报废，不能进入仓储正向履约链

其中 `FinishedUnitReadyForWarehouse` 与 `FinishedUnitReleasedToWarehouse` 不一定总是同一步：

- 前者表达“制造上已经准备好”
- 后者表达“仓储责任已经接手”

### 25.5 触发移交前的条件

MES 不得因为“工序做完了”就直接移交仓储。

至少应满足：

- 制造范围内工序完成
- 必要质检完成
- 修补 / 返工 / 复检闭环完成
- 没有待处理的报废或阻塞状态
- 允许进入仓储或履约链

### 25.6 WMS 接手后的对象创建

WMS 消费 MES 事件后，应创建自己的仓储对象，例如：

- `InventoryUnit`
- `InventoryLot`
- `WarehouseReceiptItem`

建议包含这些引用：

- `sourcePhysicalTraceId`
- `sourceMesFinishedUnitId`
- `productFamilyRef`
- `resolvedAttributes`
- `salesSkuRef`（如已可映射）
- `internalQualityClassification`
- `warehouseStatus`

设计原则：

- WMS 拥有仓储对象真相
- WMS 不直接改写 MES 对象
- MES 仅记录“已移交/关联了哪个 WMS 对象引用”的轻量信息

### 25.7 MES 是否需要知道 WMS 信息

MES 不应拥有仓储真相，但需要知道最小交接状态。

建议 MES 至少保留：

- `handoffStatus`
  - `IN_MES`
  - `RELEASED_TO_WMS`
  - `RESTRICTED`
  - `SCRAPPED`
- `lastHandoffTime`
- `lastHandoffRef`
  - 例如 `wmsInventoryUnitId` 或 `wmsReceiptItemId`

这样巡检或追溯时，MES 可以回答：

- 该对象是否还在制造侧负责范围内
- 是否已经移交 WMS
- 移交时间是什么
- 关联到哪个下游对象

但 MES 不应自己维护：

- 具体仓库库位
- 实时库存余额
- 是否已配货
- 是否已发货

### 25.8 MES 是否需要看库存

MES 不拥有仓储库存真相，但 planning 与制造管理视角需要读取库存摘要。

建议：

- MES / planning-workbench 通过查询或聚合方式读取 WMS 的库存汇总视图
- 不在 MES 内复制长期库存真相

可读的典型视图包括：

- 某产品族当前成品库存数量
- 某可销售对象当前可用库存
- 某对象是否已被订单占用
- 当前是否存在受限库存

### 25.9 直接出货与先入库

MES 无论如何都不直接执行出货。

可区分两条路径：

- 先入库后出货
  - MES -> WMS 入库 -> ERP / WMS 出货流程
- 快速履约
  - MES -> WMS 接手 -> 很快进入配货/发货

这两条路径的共同点是：

- WMS 仍然必须接手仓储/发运对象
- 只是停留时间不同

### 25.10 何为 MES 内部库存，何为 WMS 库存

MES 内部库存：

- 粗胚库
- 精胚库
- 釉胚库
- 待检区
- 待修补区
- 待装窑区

这些属于制造过程 location / buffer，不是可销售库存。

WMS 库存：

- 成品库
- 待发货区
- 受限库存区

这些属于仓储履约域。

### 25.11 管理员聚合视图

租户管理员或全局追溯页面不应由单服务独自返回“所有事实”，而应通过聚合层读取：

- MES 摘要
- WMS 摘要
- ERP 摘要
- 未来 quality-service 摘要

推荐方式：

- 二维码解析到 `physicalTraceId`
- BFF / gateway / admin workbench 聚合不同服务视图

### 25.12 当前推荐结论

- MES -> WMS 是明确责任转移，不是对象搬家。
- 二维码应绑定跨服务共享的 `physicalTraceId`。
- MES 继续保存制造追溯真相，WMS 创建仓储真相对象，ERP 承接经营履约与结算。
- MES 可以查询 WMS 摘要，但不应复制库存真相。

## 26. 服务内部模块划分草稿

### 26.1 目标

- 在不破坏 `mes-service` 单服务边界的前提下，明确其内部模块拆分。
- 为后续代码结构、线程拆分、契约设计与测试边界提供基础。
- 避免把所有制造能力堆进一个“大而全应用服务”。

### 26.2 总体结构

`mes-service` 内部仍应遵循：

- `interfaces -> application -> domain`
- `infrastructure -> domain`
- `modules` 负责装配

不建议按“控制器 / service / repository”这种纯技术层拆大文件。  
更适合按制造语义拆成边界清晰的内部业务模块。

### 26.3 推荐内部模块

#### 1. `execution-order`

职责：

- 承接上游执行需求
- 管理 MES 执行主单
- 维护执行主单与工艺路线实例的关系

Owns：

- `ExecutionOrder`
- 执行主单状态与约束

Does not own：

- 具体在制品追溯
- 模具真相
- 质量规则真相

#### 2. `traceability`

职责：

- 管理 `WipUnit`
- 管理 `physicalTraceId`
- 管理 `WipAttributeSnapshot`
- 管理制造对象跨工序的连续追溯链

Owns：

- `WipUnit`
- `WipAttributeSnapshot`
- 追溯链引用关系

Does not own：

- WMS 仓储对象
- 销售 SKU 真相

#### 3. `routing`

职责：

- 管理工艺路线模板引用
- 管理工序前置约束与放行逻辑
- 决定对象是否可进入下一工序

Owns：

- 路线实例
- 工序放行判断
- 属性级承诺点执行

Does not own：

- 质量标准字典
- 外部计划真相

#### 4. `process-record`

职责：

- 记录某道工序的一次正式处理事实
- 保存工序参数摘要
- 与扫码或其他采集来源对接

Owns：

- `ProcessRecord`
- `CaptureSource`

Does not own：

- PDA 终端实现细节
- 自动化设备控制逻辑

#### 5. `inspection`

职责：

- 管理各质检点检验记录
- 管理瑕疵事实录入
- 支持补录与重判触发

Owns：

- `InspectionRecord`
- `DefectRecord`

Does not own：

- 客户质量接受策略
- 最终工资结算

#### 6. `quality-disposition`

职责：

- 基于质检结果形成处置决策
- 管理返工、修补、后置修补、报废建议
- 输出责任归因和奖罚输入事实

Owns：

- `DispositionDecision`
- `ScrapRecord`
- `ResponsibilityAttribution`
- `PenaltyInputRecord`

Does not own：

- 质量标准长期真相
- ERP 结算结果

#### 7. `wip-buffer`

职责：

- 管理 `WipStage`
- 管理 `WipLocation`
- 管理中转区/缓冲区容量与流转事件
- 维护 WIP 汇总读模型

Owns：

- `WipLocation`
- `WipMovementEvent`
- `WipStageSummary`
- `WipLocationCapacitySummary`

Does not own：

- WMS 仓储库存真相

#### 8. `mold`

职责：

- 管理模具定义引用
- 管理模具资产实例
- 管理模具 setup、寿命、恢复、维护与使用事实

Owns：

- `MoldAsset`
- `MoldUsageRecord`
- `MoldMaintenanceRecord`
- `MoldSetup`

Does not own：

- 完整上游模具采购流程
- 模具财务折旧

#### 9. `material-batch`

职责：

- 管理泥浆、釉料、色釉等批次的最小追溯闭环
- 管理检测摘要与使用事实

Owns：

- `MaterialBatch`
- `MaterialTestRecord`
- `MaterialUsageRecord`
- `MaterialQualityFlag`

Does not own：

- 完整配方体系
- 完整实验室 LIMS

#### 10. `kiln`

职责：

- 管理窑炉、窑次、窑车、位置装载与烧成结果

Owns：

- `KilnBatch`
- `KilnCar`
- `KilnPositionAssignment`

Does not own：

- 窑炉设备控制系统本身

#### 11. `handoff`

职责：

- 管理 MES -> WMS 的移交状态
- 发布成品移交事实
- 保存轻量下游引用

Owns：

- `handoffStatus`
- `FinishedUnitReadyForWarehouse`
- `FinishedUnitReleasedToWarehouse` 相关应用协调

Does not own：

- WMS 库位或库存余额真相
- ERP 发货与结算真相

### 26.4 模块间协作原则

- `execution-order` 不应直接修改 `inspection` 内部对象。
- `inspection` 不应直接维护 `WipLocation` 容量。
- `mold`、`material-batch`、`kiln` 提供制造追溯事实，不应反向拥有工序流转主控权。
- `quality-disposition` 可以基于 `inspection` 输出处置决策，但不应自己复制缺陷真相。
- `handoff` 只能基于已完成的制造与质量事实发布移交事件，不能绕过其他模块直接宣布完工。

### 26.5 与线程拆分的关系

如果后续需要多个 thread 并行设计或实现，优先按这些内部模块拆分，而不是按“谁改 controller、谁改 repository”拆分。

更适合并行的主题包括：

- `mold`
- `inspection + quality-disposition`
- `kiln`
- `wip-buffer`
- `handoff`

不建议拆散的紧耦合边界：

- `traceability + routing + process-record`

### 26.6 当前推荐结论

- `mes-service` 应保持单服务边界，但内部按制造语义拆成多个清晰模块。
- 模块拆分的目标是控制复杂度、支持并行推进、避免未来实现时再把设计推倒重来。

## 27. 对外契约边界草稿

### 27.1 目标

- 明确 `mes-service` 对不同调用方提供什么样的黑盒能力。
- 避免下游服务通过读取 MES 内部对象或内部实现形成事实耦合。
- 为后续 `docs/contracts/mes-service/**` 形成稳定入口。

### 27.2 契约类型

`mes-service` 对外应以 3 类契约暴露能力：

- 命令型接口
  - 触发一个受控业务动作
- 查询型接口
  - 获取 MES 拥有的当前真相或汇总读模型
- 事件型接口
  - 发布已发生的领域事实

### 27.3 面向 `planning-workbench` 的契约边界

#### `planning-workbench` 应读取

- 在制品阶段汇总
  - `WipStageSummary`
- 关键缓冲区与库区容量汇总
  - `WipLocationCapacitySummary`
- 模具可用性与恢复时间摘要
- 烘干房、待检区、釉胚区、待装窑区的占用情况
- 报废、修补、返工、待判数量摘要
- 已创建但尚未完成的执行主单状态

#### `planning-workbench` 可触发的命令

- 下发执行主单
- 下发或更新派工任务
- 调整优先级
- 挂起/恢复某个执行主单或对象
- 发起受控放行
  - 例如允许某批对象从某缓冲区进入下一工序

#### `planning-workbench` 不应直接做的事

- 直接改 `WipUnit` 当前工序
- 直接改质检结果
- 直接改模具使用记录
- 直接维护 WIP 位置明细

### 27.4 面向 `quality-service` 的契约边界

#### `quality-service` 应读取或订阅

- `InspectionCompleted`
- `DefectRecorded`
- `QualityClassificationRecalculated`
- `ResponsibilityAttributed`
- 模具、材料、窑次、位置级追溯摘要

#### `quality-service` 可提供给 MES 的能力

- 缺陷字典
- 内部分类规则
- 责任归因规则模板
- 客户质量接受策略（未来）

#### `quality-service` 不应直接做的事

- 直接改 MES 的工序流转状态
- 直接决定对象是否已经移交 WMS

### 27.5 面向 `WMS` 的契约边界

#### `WMS` 应读取或订阅

- `FinishedUnitReadyForWarehouse`
- `FinishedUnitReleasedToWarehouse`
- `FinishedUnitScrapped`
- 可移交对象的最小制造与质量摘要

#### `WMS` 需要从 MES 获取的查询

- 根据 `physicalTraceId` 查询制造追溯摘要
- 查询某对象是否已满足移交仓储条件
- 查询某对象的内部标准化质量结果与限制标签

#### `WMS` 可回写给 MES 的最小结果

- 已创建的仓储对象引用
- 已成功接手仓储责任

#### `WMS` 不应直接做的事

- 改 MES 的质检结果
- 改 MES 的报废结论
- 改 MES 的制造属性快照

### 27.6 面向 `ERP` 的契约边界

#### `ERP` 应读取或订阅

- `PenaltyInputGenerated`
- `ResponsibilityAttributed`
- `FinishedUnitReleasedToWarehouse`
- `FinishedUnitScrapped`
- 执行主单与完工数量汇总

#### `ERP` 需要的查询

- 某期间按工人/班组/工序的有效产出
- 某期间按责任对象的扣罚输入汇总
- 某对象的来源执行主单与制造摘要

#### `ERP` 不应直接做的事

- 直接创建或修改 `WipUnit`
- 直接发起制造流程状态变化
- 直接维护 MES 的材料/模具/窑次真相

### 27.7 面向管理员聚合层的契约边界

管理员聚合层或 BFF 可做：

- 通过 `physicalTraceId` 聚合 MES、WMS、ERP 摘要
- 展示巡检视图、追溯视图、库存摘要、履约摘要

管理员聚合层不应做：

- 在聚合层拼装新的业务真相并回写给下游
- 代替 MES 做工序判定或质量判定

### 27.8 面向扫码入口的契约边界

`scan identity / scan router` 应获取：

- 码类型
- 目标服务
- 目标对象引用

MES 应提供：

- 码对应对象的制造视图查询入口
- 必要的扫码动作命令入口
  - 工序提交
  - 巡检查询
  - 入/出烘干房
  - 质检录入

扫码入口不应：

- 自己拥有制造真相
- 自己执行工序放行规则

### 27.9 命令接口设计原则

- 命令应表达业务动作，而不是技术动作。

推荐风格：

- `CreateWipUnit`
- `CompleteProcessRecord`
- `RecordInspection`
- `ConfirmScrap`
- `AssignKilnPosition`
- `ReleaseFinishedUnitToWarehouse`

不推荐风格：

- `SaveScanForm`
- `UpdateMesRecord`
- `SetState`

### 27.10 查询接口设计原则

- 查询应优先提供黑盒视图，而不是暴露内部表结构。
- 汇总型查询优先提供已投影好的读模型。
- 对外查询应区分：
  - 对象追溯摘要
  - 计划约束摘要
  - 质量摘要
  - 仓储移交摘要

### 27.11 当前推荐结论

- `mes-service` 对外契约应围绕“命令、查询、事件”三类能力组织。
- 不同调用方应读取不同黑盒视图，而不是共享一套臃肿接口。
- 后续 `docs/contracts/mes-service/**` 应按调用方和能力域拆分，而不是按 controller 或技术模块拆分。

## 28. Design 收口状态

### 28.1 已覆盖的主设计面

当前 workspace 已覆盖：

- 行业场景与制造形态判断
- `mes-service` 服务职责边界
- 在制品、制造规格、销售 SKU 的关系
- 工艺路线、前置约束、属性级承诺点
- WIP stage、WIP location、中转区容量与瓶颈约束
- 现场扫码、无码过渡、统一扫码平台边界
- 质检、瑕疵、自动判级、补录、责任归因
- 修补、返工、后置处理、报废控制
- 模具管理、模具 setup、模具寿命、模具供应商回溯
- 泥浆、釉料、色釉批次追溯
- 窑炉、窑次、窑车、位置追溯
- MES -> WMS -> ERP 责任交接
- `mes-service` 领域事件模型
- `mes-service` 内部模块划分
- 对外契约边界

### 28.2 不再继续扩散到本 design 的内容

以下内容不应继续塞进本 workspace：

- 完整 `quality-service` 设计
- 完整 `planning-workbench` / APS 设计
- 完整 Item Master 设计
- `ManufacturingSpec` 之外的包装、营销展示、客户专属组合等产品对象设计
- 完整 `WMS` 设计
- 完整 `ERP` 设计
- PDA 页面与具体交互稿
- 实现任务拆分与代码计划

这些应在本 workspace 作为来源背景的基础上，进入各自独立设计线程或后续 plan 阶段。

### 28.3 尚未冻结但不阻塞本 design 收口的事项

- `quality-service` 的服务化时机
- `scan identity / scan router` 的正式平台归属
- 字段级 proto / contract
- 第一阶段 feature slice 顺序

这些事项不阻塞 `mes-service` 职责边界设计完成，但会影响后续 plan 和 contracts。

### 28.4 Design 完成判定

本 workspace 可以视为 design 基本完成，当满足：

- 服务职责边界已清楚
- 第一阶段范围已清楚
- 关键领域对象已清楚
- 关键协同服务边界已清楚
- 关键事件与契约边界已清楚
- 未冻结事项已明确标记为后续独立主题或 plan 阶段事项

当前状态：

- `mes-service` design workspace 已接近可收口状态。
- 下一步不应继续无边界扩展细节。
- 推荐进入服务职责卡提炼前，做一次最终 review，确认是否还有会影响边界的大问题。
