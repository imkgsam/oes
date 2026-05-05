# mes-service Mold Management API

## 1. 模块职责

`MoldManagementService` 负责 phase 1 MES 模具管理的命令型写接口。

命令范围只覆盖：

- 模具管理用 WorkCenter 创建与停用
- 模具设计建档
- 母模建档
- 生产模具实例建档
- MES 现场位置移动
- 安装与拆卸
- 使用记录与寿命累计
- 授权寿命调整
- 寿命预警确认
- 报废

本文件不覆盖模具维修保养完整流程、采购流程、WMS 库存、财务资产或完整 quality scoring。

## 2. 通用上下文要求

所有 phase 1 management command 统一要求：

- `tenant_id`
- 场景适用时的 `org_id`
- internal service context
- operator context
- trace context
- audit context
- command id / idempotency key

补充约束：

- 本文件只冻结必须要求这些上下文存在，不展开完整内部字段结构。
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query 或同步缓存接口使用。
- command 的状态机、寿命、兼容性、安装占用和引用边界规则必须在 `mes-service` domain / application 层执行。
- gateway / DTO / Prisma schema / `src/common` 不得承载模具业务规则。

## 3. 写入基线语义

### 3.1 模具资源边界

- 模具是 MES tooling resource，不是 WMS 库存，不是 `Equipment`，不是普通 `Location`。
- `ManufacturingSpec` 归 `mes-service`，用于表达制造现场可执行规格。
- `MoldDesign` 表达 MES 模具设计记录，不替代 `ManufacturingSpec`、PLM 图纸、Item 或 PIM / PLM 产品主数据 truth。
- `MasterMold` 只进入建档、来源和状态追踪，不进入生产安装与寿命主闭环。
- `ProductionMoldInstance` 是安装、移动、使用、寿命和预警的主对象。

### 3.2 引用与快照

`ProductFamily` / `ManufacturingSpec` 引用最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `ref_type` | 是 | `PRODUCT_FAMILY / MANUFACTURING_SPEC` |
| `ref_id` | 是 | owner boundary 中的 opaque id |
| `ref_code_snapshot` | 否 | 展示 code 快照 |
| `display_name_snapshot` | 否 | 展示名称快照 |

`Item` 引用最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `item_id` | 是 | `item-master-service` 中的 Item 标识 |
| `item_code_snapshot` | 否 | Item code 展示快照 |
| `item_name_snapshot` | 否 | Item name 展示快照 |

`supplier_ref` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `supplier_id` | 是 | SRM / Party 边界中的供应商身份引用 |
| `supplier_code_snapshot` | 否 | 供应商 code 展示快照 |
| `supplier_display_name_snapshot` | 否 | 供应商名称展示快照 |

`purchase_ref` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_source_type` | 是 | `PURCHASE_ORDER / PURCHASE_RECEIPT / EXTERNAL_DOCUMENT / MANUAL` |
| `purchase_source_id` | 否 | owner boundary 中的采购对象引用 |
| `purchase_no_snapshot` | 否 | 采购单号或外部凭证号展示快照 |

冻结约束：

- `ManufacturingSpec` 是 MES 内部 manufacturing master object，必须引用当前 `manufacturable` 且 `PHYSICAL` 的 Item。
- `ProductFamily` 在 phase 1 只作为 MES 模具 / 制造规格侧的分组引用或展示摘要，不冻结独立 `product-service`。
- `Item` ref 只能作为 optional 辅助引用，不能成为 `MoldDesign` 主绑定关系。
- `supplier_ref` / `purchase_ref` 只做引用格式与展示摘要，不复制 procurement / SRM truth。
- Item 引用存在性与 `manufacturable` 能力校验必须通过 `item-master-service` gRPC、缓存读模型或事件订阅读模型完成，但不得跨服务查库。

### 3.3 ProductionMoldInstance 生命周期

`ProductionMoldInstance.current_status` phase 1 固定状态：

| 状态 | 含义 | 允许进入方式 |
| --- | --- | --- |
| `RECEIVED` | 已登记到厂 | `RegisterProductionMoldInstance` |
| `PENDING_DRYING` | 需要烘干、稳定处理或现场准备 | `RegisterProductionMoldInstance`、`MoveMold` |
| `PENDING_INSTALLATION` | 可安装且当前未安装 | `RegisterProductionMoldInstance`、`MoveMold`、`UnmountMold`、授权恢复 |
| `INSTALLED` | 存在有效 `MoldInstallation` | `InstallMold` |
| `PENDING_REPAIR` | 待维修、待保养或待判定 | `UnmountMold`、寿命预警后的人工判定、授权调整 |
| `UNDER_REPAIR` | 正在维修或保养 | future maintenance command |
| `DISABLED` | 停用但未报废 | future disable command 或授权调整 |
| `SCRAPPED` | 已报废，终态 | `ScrapMold` |

冻结约束：

- phase 1 不把 `IN_USE` 写入长期生命周期状态。
- 使用事实以 `MoldUsageEvent` 为准；是否正在使用由有效 `MoldInstallation`、最近使用事件和班次 / 时间窗口读模型推导。
- 若 future 展示层保留 `IN_USE`，它只能是 derived usage state，退出条件为使用窗口结束、下一次使用事件关闭、安装拆卸或班次切换。
- `SCRAPPED` 生产模具不得安装、使用、移动到可用位置或调整为可用状态。
- `INSTALLED` 必须有且只有一个有效未关闭 `MoldInstallation`。
- `PENDING_REPAIR / UNDER_REPAIR / DISABLED / SCRAPPED` 不允许安装。

## 4. RPC 语义

### `CreateWorkCenter`

- 作用：创建第一阶段模具管理可用的制造执行单元。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `work_center_code` | 是 | tenant + org 范围内唯一执行单元编码 |
| `name` | 是 | 执行单元名称 |
| `work_center_type` | 是 | `CASTING_LINE / FLOOR_CASTING_AREA / VERTICAL_HIGH_PRESSURE_MACHINE / HORIZONTAL_HIGH_PRESSURE_MACHINE` 等 |
| `parent_work_center_id` | 否 | nested WorkCenter 父级 |
| `related_mes_location_id` | 否 | optional 关联 MES 物理空间 |
| `capacity_profile_id` | 否 | optional 产能摘要 |
| `reason` | 是 | 创建原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `work_center_summary` | 新建后的 WorkCenter 摘要 |

关键语义：

- `WorkCenter` 是逻辑制造执行单元，不替代 `MesLocation`。
- 第一阶段 tenant-web 面向实际可生产单位展示；nested parent 只作为组织 / 过滤关系，不要求主管先维护完整树。
- 能挂载模具的第一阶段类型为 `CASTING_LINE`、`FLOOR_CASTING_AREA`、`VERTICAL_HIGH_PRESSURE_MACHINE`、`HORIZONTAL_HIGH_PRESSURE_MACHINE`。
- 成功后必须写审计。

### `DeactivateWorkCenter`

- 作用：停用第一阶段模具管理可用的制造执行单元。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `work_center_id` | 是 | 目标执行单元 |
| `reason` | 是 | 停用原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `work_center_summary` | 停用后的 WorkCenter 摘要 |

关键语义：

- 存在有效未关闭模具安装时不得停用。
- 停用不删除历史安装、使用或寿命事实。
- 成功后必须写审计。

### `RegisterMoldDesign`

- 作用：登记一类模具设计 / 定义。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `design_code` | 是 | tenant + org 范围内唯一设计编码 |
| `name` | 是 | 模具设计名称 |
| `revision_code` | 否 | phase 1 设计版本摘要 |
| `supersedes_design_id` | 否 | 被替代的 `MoldDesign` |
| `product_family_ref` | 是 | 产品族 opaque ref + display snapshot |
| `manufacturing_spec_refs[]` | 否 | 适配制造规格 refs |
| `item_ref` | 否 | optional 辅助 Item ref |
| `material_type` | 是 | 材料维度摘要，例如 resin / gypsum |
| `function_role` | 是 | `MASTER / PRODUCTION` 等功能角色摘要 |
| `production_method_tags[]` | 否 | 高压机、上线、地摊等生产方式标签 |
| `output_structure_type` | 是 | `SINGLE / TWIN / MULTI / COMPONENT_COMBINATION` |
| `outputs[]` | 是 | `MoldDesignOutput` 最小产出结构 |
| `default_life_limit` | 否 | 默认寿命上限 |
| `default_life_unit` | 否 | 默认寿命单位 |
| `reason` | 是 | 建档原因 |

`outputs[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sequence_no` | 是 | 产出序号 |
| `output_code` | 是 | 产出编码摘要 |
| `output_kind` | 是 | `PRODUCT / COMPONENT / MANUFACTURING_SPEC` |
| `product_family_ref` | 否 | 产出对应产品族 ref |
| `manufacturing_spec_ref` | 否 | 产出对应制造规格 ref |
| `quantity_per_use` | 是 | 单次使用理论产出数量 |
| `component_role` | 否 | 组件角色摘要 |
| `assembly_hint` | 否 | 后续拼接或组装提示 |
| `is_primary_output` | 是 | 是否主产出 |
| `options[]` | 否 | 同一产出的互斥制造规格 / 数量选择 |

`outputs[].options[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `option_code` | 是 | option 编码摘要 |
| `label` | 是 | 展示名称，例如 `300 坑距` |
| `manufacturing_spec_ref` | 是 | option 对应制造规格 ref |
| `product_family_ref` | 否 | option 对应产品族 ref |
| `quantity_per_use` | 否 | option 选择后的单次产出数量；未传时继承 output |
| `is_default` | 否 | 是否默认选项 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_design` | 新建后的 `MoldDesign` |

关键语义：

- `design_code` 必须在 tenant + org 范围内唯一。
- `outputs[]` 至少包含一个主产出。
- 多个 `outputs[]` 表达一次模具使用同时产出的多个对象；`options[]` 表达单个 output 的互斥选择，例如注浆前选择 300 / 400 坑距。
- `product_family_ref` 是主适配边界；`item_ref` 不得替代产品族 / 制造规格绑定。
- 成功后必须写审计，并写入 `MoldRegistered` outbox event，`mold_resource_type = MOLD_DESIGN`。

### `RegisterMasterMold`

- 作用：登记母模资产。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `master_mold_code` | 是 | tenant + org 范围内唯一母模编码 |
| `mold_design_id` | 是 | 所属 `MoldDesign` |
| `supplier_ref` | 否 | 供应商引用与展示摘要 |
| `purchase_ref` | 否 | 采购引用与展示摘要 |
| `received_at` | 否 | 到厂时间 |
| `initial_mes_location_id` | 否 | 初始 MES 现场位置 |
| `quality_summary` | 否 | 到厂质量摘要，不替代 quality truth |
| `notes` | 否 | 备注 |
| `reason` | 是 | 建档原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `master_mold` | 新建后的 `MasterMold` |

关键语义：

- `master_mold_code` 必须在 tenant + org 范围内唯一。
- `mold_design_id` 必须存在且当前可被引用。
- `initial_mes_location_id` 若提供，必须是 MES location，不得是 WMS location。
- 母模不允许进入 `InstallMold`、`RecordMoldUsage` 或 `AdjustMoldLife`。
- 成功后必须写审计，并写入 `MoldRegistered` outbox event，`mold_resource_type = MASTER_MOLD`。

### `RegisterProductionMoldInstance`

- 作用：登记生产现场实际使用的一件生产模具实例。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `mold_instance_code` | 是 | tenant + org 范围内唯一生产模具编码 |
| `mold_design_id` | 是 | 所属 `MoldDesign` |
| `master_mold_id` | 否 | 来源母模引用 |
| `supplier_ref` | 否 | 供应商引用与展示摘要 |
| `purchase_ref` | 否 | 采购引用与展示摘要 |
| `received_at` | 否 | 到厂时间 |
| `accepted_at` | 否 | 验收时间 |
| `initial_status` | 否 | `RECEIVED / PENDING_DRYING / PENDING_INSTALLATION` |
| `initial_mes_location_id` | 否 | 初始 MES 现场位置 |
| `life_limit_value` | 否 | 寿命上限；未传时可继承 design 默认值 |
| `life_unit` | 否 | 寿命单位；未传时可继承 design 默认值 |
| `warning_threshold_value` | 否 | 寿命预警阈值 |
| `reason` | 是 | 建档原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `production_mold_instance` | 新建后的 `ProductionMoldInstance` |
| `mold_life_counter` | 初始 `MoldLifeCounter` |

关键语义：

- `mold_instance_code` 必须在 tenant + org 范围内唯一。
- 重复历史报废编号默认拒绝；确需复用必须走授权 override 并记录审计。
- 初始状态只能是 `RECEIVED / PENDING_DRYING / PENDING_INSTALLATION`。
- 成功登记必须创建初始 `MoldLifeCounter`。
- 成功后必须写审计，并写入 `MoldRegistered` outbox event，`mold_resource_type = PRODUCTION_MOLD_INSTANCE`。

### `MoveMold`

- 作用：将母模或生产模具实例从一个 `MesLocation` 移动到另一个 `MesLocation`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `mold_resource_type` | 是 | `MASTER_MOLD / PRODUCTION_MOLD_INSTANCE` |
| `mold_resource_id` | 是 | 目标模具资源 |
| `from_mes_location_id` | 否 | 调用方认知中的当前位置，用于 stale command 防护 |
| `to_mes_location_id` | 是 | 目标 MES 现场位置 |
| `movement_reason` | 是 | 移动原因 |
| `moved_at` | 否 | 实际移动时间；未传由服务记录当前时间 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `movement_event` | 新建的 `MoldMovementEvent` |
| `mold_current_location` | 移动后的当前位置摘要 |

关键语义：

- `to_mes_location_id` 必须是 MES location，不得是 WMS location。
- 若提供 `from_mes_location_id`，必须与服务端当前记录一致，否则返回 stale command / idempotency conflict。
- 已安装生产模具不得直接移动；必须先 `UnmountMold`。
- `SCRAPPED` 模具只允许移动到报废暂存类位置，且必须保留审计原因。
- 成功后必须写审计，并写入 `MoldMoved` outbox event。

### `InstallMold`

- 作用：将生产模具实例安装到 `WorkCenter` / `ResourcePosition`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `production_mold_instance_id` | 是 | 目标生产模具实例 |
| `work_center_id` | 是 | 安装目标执行单元 |
| `resource_position_id` | 否 | 安装目标资源位置；未传时服务自动创建或复用可用模位 |
| `installed_at` | 否 | 安装时间；未传由服务记录当前时间 |
| `setup_snapshot` | 否 | 本次安装设置摘要 |
| `operation_ref` | 否 | optional 工序引用摘要 |
| `routing_ref` | 否 | optional 路线引用摘要 |
| `work_order_ref` | 否 | optional 工单引用摘要 |
| `operation_task_ref` | 否 | optional 工序任务引用摘要 |
| `reason` | 是 | 安装原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_installation` | 新建的 `MoldInstallation` |
| `production_mold_instance` | 安装后的实例摘要 |

关键语义：

- 只允许 `PENDING_INSTALLATION` 状态安装。
- `work_center_id` 必须属于当前 tenant / org 可见范围。
- 若传入 `resource_position_id`，它必须属于目标 `work_center_id`，必须兼容目标模具设计，且当前不得存在有效未关闭安装。
- 若未传入 `resource_position_id`，服务在目标 `WorkCenter` 下自动创建或复用兼容且空闲的 `ResourcePosition`。
- 第一阶段不要求人工手动维护模位 CRUD；`ResourcePosition` 由安装 / 卸下流程维护。
- 同一生产模具实例当前不得已有有效未关闭安装。
- 成功后创建 `MoldInstallation`，实例状态更新为 `INSTALLED`。
- 成功后必须写审计，并写入 `MoldInstalled` outbox event。

### `UnmountMold`

- 作用：将已安装生产模具实例从 `WorkCenter` / `ResourcePosition` 拆卸。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `production_mold_instance_id` | 是 | 目标生产模具实例 |
| `mold_installation_id` | 否 | 调用方认知中的当前安装，用于 stale command 防护 |
| `unmounted_at` | 否 | 拆卸时间；未传由服务记录当前时间 |
| `next_status` | 是 | `PENDING_INSTALLATION / PENDING_REPAIR / DISABLED` |
| `to_mes_location_id` | 否 | 拆卸后所在 MES 位置 |
| `reason` | 是 | 拆卸原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_installation` | 关闭后的 `MoldInstallation` |
| `production_mold_instance` | 拆卸后的实例摘要 |

关键语义：

- 目标生产模具实例必须存在有效未关闭 `MoldInstallation`。
- 若提供 `mold_installation_id`，必须匹配当前有效安装。
- `next_status` 不允许为 `INSTALLED` 或 `SCRAPPED`。
- 若提供 `to_mes_location_id`，必须是 MES location。
- 成功后关闭当前 `MoldInstallation`，清空实例当前安装 / work center / resource position 摘要。
- 成功后必须写审计，并写入 `MoldUnmounted` outbox event。

### `RecordMoldUsage`

- 作用：登记一次或一批生产活动正式绑定生产模具实例的使用事实。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `production_mold_instance_id` | 是 | 目标生产模具实例 |
| `mold_installation_id` | 否 | 当前安装引用；未传时服务按实例解析 |
| `work_center_id` | 是 | 使用发生的执行单元 |
| `resource_position_id` | 否 | 使用发生的资源位置 |
| `usage_mode` | 是 | `MANUAL_CHECKLIST / PDA_SCAN / BATCH_CONFIRM / BACK_OFFICE_ENTRY / AUTOMATED_CAPTURE` |
| `used_at` | 否 | 使用发生时间；未传由服务记录当前时间 |
| `usage_quantity` | 是 | 本次使用数量 |
| `life_delta` | 是 | 本次寿命增量 |
| `life_unit` | 是 | 寿命单位 |
| `product_family_ref` | 否 | 本次生产产品族 ref |
| `manufacturing_spec_ref` | 否 | 本次生产制造规格 ref |
| `mold_design_output_id` | 否 | 本次使用对应的设计产出 |
| `mold_design_output_option_id` | 否 | 本次使用选择的产出选项 |
| `wip_unit_ref` | 否 | optional WIP 引用 |
| `physical_trace_id` | 否 | optional 单件追溯码 |
| `work_order_ref` | 否 | optional 工单引用 |
| `operation_task_ref` | 否 | optional 工序任务引用 |
| `capture_source` | 是 | 采集来源摘要 |
| `reason` | 否 | 补录或调整原因；事后录入时必填 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `usage_event` | 新建的 `MoldUsageEvent` |
| `mold_life_counter` | 更新后的寿命计数 |
| `raised_warning` | 本次触发或更新的 `MoldWarningEvent`，未触发时为空 |

关键语义：

- 目标生产模具实例必须为 `INSTALLED`。
- 必须存在有效未关闭 `MoldInstallation`。
- 若传入 `mold_installation_id`，必须匹配当前有效安装。
- `work_center_id` / `resource_position_id` 必须与当前安装一致或可由当前安装验证。
- 若目标 MoldDesignOutput 存在 options，`mold_design_output_option_id` 必须指向该 output 下可用 option；若调用方省略，服务可按唯一默认 option 解析，否则返回前置条件错误。
- `manufacturing_spec_ref` 可以由 `mold_design_output_id` / `mold_design_output_option_id` 推导；调用方显式传入时必须与所选产出一致。
- `SCRAPPED` 模具不得记录使用。
- `life_delta` 必须大于 `0`；寿命单位必须与 `MoldLifeCounter` 一致或可被服务明确换算。
- 成功后创建 `MoldUsageEvent`，累加 `MoldLifeCounter`。
- 达到阈值且当前没有同类有效未确认预警时，必须创建 `MoldWarningEvent`。
- 成功后必须写审计，并写入 `MoldUsageRecorded` outbox event；触发预警时同时写入 `MoldLifeWarningRaised` outbox event。

### `AdjustMoldLife`

- 作用：授权调整生产模具寿命计数、寿命上限或预警阈值。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `production_mold_instance_id` | 是 | 目标生产模具实例 |
| `adjustment_type` | 是 | `SET_USED_VALUE / ADD_USED_VALUE / SET_LIMIT_VALUE / SET_WARNING_THRESHOLD` |
| `adjustment_value` | 是 | 调整数值 |
| `life_unit` | 是 | 寿命单位 |
| `authorization_ref` | 是 | 授权或审批引用 |
| `reason` | 是 | 调整原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_life_counter` | 调整后的寿命计数 |
| `raised_warning` | 调整后触发或更新的 `MoldWarningEvent`，未触发时为空 |

关键语义：

- 只允许具备 `mes.mold.life.adjust` 或等价授权的 operator 执行。
- 必须记录调整前后值、原因、操作人、授权引用与审计。
- `SCRAPPED` 模具默认不得调整为可用；若只补录报废前审计修正，必须保留授权引用。
- 调整后达到阈值且当前没有同类有效未确认预警时，必须创建 `MoldWarningEvent`。
- 成功后必须写审计；触发预警时写入 `MoldLifeWarningRaised` outbox event。

### `AcknowledgeMoldWarning`

- 作用：确认一个模具寿命或状态预警已被人工查看。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `mold_warning_event_id` | 是 | 目标预警 |
| `acknowledgement_action` | 是 | `ACKNOWLEDGE / ACKNOWLEDGE_AND_MARK_REPAIR / ACKNOWLEDGE_AND_DISABLE` |
| `comment` | 否 | 确认备注 |
| `reason` | 是 | 确认原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_warning_event` | 确认后的预警 |
| `production_mold_instance` | 受影响实例摘要 |

关键语义：

- 目标预警必须存在且属于当前 tenant / org 可见范围。
- 已确认预警重复确认必须返回幂等成功或 stale conflict，具体取决于 command id 是否一致。
- `ACKNOWLEDGE_AND_MARK_REPAIR` 可将未安装实例置为 `PENDING_REPAIR`；已安装实例必须先拆卸或返回 invalid status transition。
- `ACKNOWLEDGE_AND_DISABLE` 可将未安装实例置为 `DISABLED`；已安装实例必须先拆卸或返回 invalid status transition。
- 成功后必须写审计；phase 1 不冻结独立 warning acknowledged event。

### `ScrapMold`

- 作用：正式报废母模或生产模具实例。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `mold_resource_type` | 是 | `MASTER_MOLD / PRODUCTION_MOLD_INSTANCE` |
| `mold_resource_id` | 是 | 目标模具资源 |
| `scrap_reason` | 是 | 报废原因 |
| `scrapped_at` | 否 | 报废时间；未传由服务记录当前时间 |
| `close_current_installation` | 否 | 生产模具已安装时是否在同一事务关闭安装 |
| `to_mes_location_id` | 否 | 报废后暂存位置 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_resource` | 报废后的模具资源摘要 |
| `closed_installation` | 若本次关闭安装，则返回关闭后的 `MoldInstallation` |

关键语义：

- `SCRAPPED` 是终态。
- 已安装生产模具必须先 `UnmountMold`，或由本命令在 `close_current_installation = true` 时同一事务关闭当前安装。
- 若提供 `to_mes_location_id`，必须是 MES 报废暂存类位置。
- 报废后不得安装、使用或移动到可用位置。
- 成功后必须写审计，并写入 `MoldScrapped` outbox event；若同事务关闭安装，也必须写入 `MoldUnmounted` outbox event。

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、数量非法、寿命单位非法、引用 shape 非法、`outputs[]` 缺少主产出、分页或时间窗口参数非法 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / org / mold resource 上执行命令的权限，包括无权寿命调整 |
| `NOT_FOUND` | 目标 `MoldDesign`、`MasterMold`、`ProductionMoldInstance`、`MoldInstallation`、`MoldWarningEvent`、`MesLocation`、`WorkCenter`、`ResourcePosition` 或显式引用对象不存在 |
| `ALREADY_EXISTS` | 编码重复、同一位置已有有效安装、同一实例已有有效安装，或同一 command id 已被不同请求占用 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态或业务前提不满足，例如非法状态迁移、已安装模具直接移动、不兼容 work center / resource position、模具已报废、未安装却记录使用、已确认预警重复处理 |
| `ABORTED` | stale command、并发版本冲突、调用方携带的当前位置 / 当前安装 / current version 与服务端不一致 |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

错误分类冻结：

| taxonomy | 对应错误码 | 说明 |
| --- | --- | --- |
| duplicate code | `ALREADY_EXISTS` | `design_code`、`master_mold_code`、`mold_instance_code` 重复 |
| invalid status transition | `FAILED_PRECONDITION` | 当前生命周期不允许该命令 |
| missing / invalid reference | `NOT_FOUND / INVALID_ARGUMENT / FAILED_PRECONDITION` | 不存在返回 `NOT_FOUND`，引用格式非法返回 `INVALID_ARGUMENT`，存在但能力或状态不满足返回 `FAILED_PRECONDITION` |
| incompatible work center / resource position | `FAILED_PRECONDITION` | `ResourcePosition` 不属于目标 `WorkCenter` 或不兼容模具设计 |
| position occupied | `ALREADY_EXISTS` | 目标 `ResourcePosition` 已有有效安装 |
| mold already installed | `ALREADY_EXISTS / FAILED_PRECONDITION` | 同一实例已有有效安装；可精确识别重复安装时返回 `ALREADY_EXISTS`，状态前提不满足时返回 `FAILED_PRECONDITION` |
| mold not installed | `FAILED_PRECONDITION` | 拆卸或使用时没有有效安装 |
| scrapped mold cannot be used | `FAILED_PRECONDITION` | 报废终态禁止安装、使用或恢复可用 |
| unauthorized life adjustment | `PERMISSION_DENIED` | 无寿命调整权限或缺少授权引用 |
| stale command / idempotency conflict | `ABORTED / ALREADY_EXISTS` | stale version 返回 `ABORTED`；同 idempotency key 不同 payload 返回 `ALREADY_EXISTS` |

## 6. 审计与事件

所有成功 command 必须写审计。

审计最小元数据：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 租户边界 |
| `org_id` | optional 组织边界 |
| `operator_ref` | 操作人引用 |
| `operator_role_snapshot` | 操作时角色摘要 |
| `trace_id` | trace context |
| `command_id` | command id / idempotency key |
| `reason` | 命令原因 |
| `before_snapshot` | 变更前摘要 |
| `after_snapshot` | 变更后摘要 |
| `occurred_at` | 审计发生时间 |

事务边界：

- 状态变更、事实记录、审计记录必须在同一 `mes-service` 本地事务内提交。
- 需要发布的事件必须在同一事务内写入 outbox 或等价待发布记录。
- 本地事务提交失败不得发布事件。
- 事件发布失败不得回滚已提交的 MES truth。

phase 1 command 事件映射：

| command | 必须记录的事件 |
| --- | --- |
| `RegisterMoldDesign` | `MoldRegistered` |
| `RegisterMasterMold` | `MoldRegistered` |
| `RegisterProductionMoldInstance` | `MoldRegistered` |
| `MoveMold` | `MoldMoved` |
| `InstallMold` | `MoldInstalled` |
| `UnmountMold` | `MoldUnmounted` |
| `RecordMoldUsage` | `MoldUsageRecorded`，达到阈值时 `MoldLifeWarningRaised` |
| `AdjustMoldLife` | 达到阈值时 `MoldLifeWarningRaised` |
| `AcknowledgeMoldWarning` | phase 1 不冻结独立 event |
| `ScrapMold` | `MoldScrapped`；同事务关闭安装时也记录 `MoldUnmounted` |
