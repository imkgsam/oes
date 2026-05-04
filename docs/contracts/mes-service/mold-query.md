# mes-service Mold Query API

## 1. 模块职责

`MoldQueryService` 负责 phase 1 MES 模具管理的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`MoldQueryService`
- 所有 RPC 显式带 `tenant_id`
- 场景适用时显式带 `org_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 query 只覆盖：

- 模具设计读取与目录列表
- 生产模具实例读取与按设计列表
- 当前 MES 位置与安装摘要
- 使用历史
- work center 当前安装清单
- 寿命预警列表
- 每日模具检查清单打印读模型

phase 1 query 不覆盖：

- 模具维修保养完整历史
- 完整采购 / SRM 查询
- 完整 Item selector 或 ManufacturingSpec 管理面
- WMS location / inventory 查询
- 外部 HTTP / BFF surface
- event replay API

## 2. 通用读取对象

### 2.1 `MoldDesign`

phase 1 `MoldDesign` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_design_id` | 模具设计标识 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `design_code` | 模具设计编码 |
| `name` | 模具设计名称 |
| `revision_code` | phase 1 版本摘要 |
| `supersedes_design_id` | optional 被替代设计 |
| `product_family_ref` | 产品族 opaque ref + display snapshot |
| `manufacturing_spec_refs[]` | 制造规格 opaque refs + display snapshots |
| `item_ref` | optional 辅助 Item ref |
| `material_type` | 材料维度摘要 |
| `function_role` | 功能角色摘要 |
| `production_method_tags[]` | 生产方式标签 |
| `output_structure_type` | 产出结构摘要 |
| `outputs[]` | `MoldDesignOutput` 列表 |
| `default_life_limit` | optional 默认寿命上限 |
| `default_life_unit` | optional 默认寿命单位 |
| `status` | 设计状态摘要 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `manufacturing_spec_refs[]` 指向 MES 拥有的 `ManufacturingSpec`，`MoldDesign` 不替代其 owner truth。
- `product_family_ref` 在 phase 1 只作为 MES 模具 / 制造规格侧的分组引用或展示摘要，不冻结独立 `product-service`。
- `item_ref` 只作为 optional 辅助引用，不得被调用方当作 `MoldDesign` 主绑定关系。

### 2.2 `MoldDesignOutput`

phase 1 `MoldDesignOutput` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_design_output_id` | 产出结构标识 |
| `mold_design_id` | 所属模具设计 |
| `sequence_no` | 产出序号 |
| `output_code` | 产出编码摘要 |
| `output_kind` | `PRODUCT / COMPONENT / MANUFACTURING_SPEC` |
| `product_family_ref` | optional 产品族 ref |
| `manufacturing_spec_ref` | optional 制造规格 ref |
| `quantity_per_use` | 单次使用理论产出数量 |
| `component_role` | optional 组件角色摘要 |
| `assembly_hint` | optional 拼接或组装提示 |
| `is_primary_output` | 是否主产出 |

### 2.3 `ProductionMoldInstance`

phase 1 `ProductionMoldInstance` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `production_mold_instance_id` | 生产模具实例标识 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `mold_instance_code` | 生产模具编码 |
| `mold_design_summary` | 所属设计摘要 |
| `master_mold_summary` | optional 来源母模摘要 |
| `supplier_ref` | optional 供应商引用与展示摘要 |
| `purchase_ref` | optional 采购引用与展示摘要 |
| `received_at` | optional 到厂时间 |
| `accepted_at` | optional 验收时间 |
| `current_status` | 生命周期状态，不包含长期 `IN_USE` |
| `current_mes_location_summary` | 当前 MES 物理位置摘要 |
| `current_installation_summary` | 当前有效安装摘要；未安装时为空 |
| `life_summary` | 寿命摘要 |
| `warning_summary` | 当前预警摘要 |
| `scrapped_at` | optional 报废时间 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

`mold_design_summary` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_design_id` | 模具设计标识 |
| `design_code` | 设计编码摘要 |
| `name` | 设计名称摘要 |
| `revision_code` | 版本摘要 |
| `product_family_ref` | 产品族 ref + display snapshot |

`current_installation_summary` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_installation_id` | 当前安装标识 |
| `work_center_id` | 当前执行单元 |
| `work_center_code` | 执行单元编码摘要 |
| `work_center_name` | 执行单元名称摘要 |
| `resource_position_id` | 当前资源位置 |
| `position_code` | 资源位置编码摘要 |
| `installed_at` | 安装时间 |
| `usage_state` | derived `IDLE / RECENTLY_USED / IN_USE_WINDOW` |

说明：

- `usage_state` 是 query 读模型推导值，不是 `ProductionMoldInstance.current_status`。
- `IN_USE_WINDOW` 只表示当前班次或配置时间窗口内有使用事实，不是生命周期状态。

`life_summary` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `life_unit` | 寿命单位 |
| `used_value` | 已使用值 |
| `limit_value` | 寿命上限 |
| `warning_threshold_value` | 预警阈值 |
| `remaining_value` | 剩余值摘要 |
| `warning_level` | 当前预警等级摘要 |
| `last_usage_event_id` | 最近使用事件 |
| `last_adjusted_at` | 最近授权调整时间 |

### 2.4 `MoldCurrentLocation`

phase 1 `MoldCurrentLocation` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_resource_type` | `MASTER_MOLD / PRODUCTION_MOLD_INSTANCE` |
| `mold_resource_id` | 模具资源标识 |
| `mold_code` | 模具编码摘要 |
| `current_status` | 当前状态摘要 |
| `current_mes_location_summary` | 当前 MES 物理位置摘要 |
| `current_installation_summary` | 生产模具有效安装摘要；母模或未安装时为空 |
| `last_movement_event_id` | 最近移动事件 |
| `last_moved_at` | 最近移动时间 |

### 2.5 `MoldUsageHistoryEntry`

phase 1 使用历史条目最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `entry_type` | `INSTALLATION / UNMOUNT / USAGE / LIFE_ADJUSTMENT / WARNING / MOVE / SCRAP` |
| `entry_id` | 对应事实标识 |
| `occurred_at` | 发生时间 |
| `work_center_summary` | optional 执行单元摘要 |
| `resource_position_summary` | optional 资源位置摘要 |
| `mes_location_summary` | optional MES 位置摘要 |
| `usage_quantity` | optional 使用数量 |
| `life_delta` | optional 寿命增量 |
| `life_used_value_after` | optional 事件后寿命值 |
| `product_family_ref` | optional 产品族 ref + snapshot |
| `manufacturing_spec_ref` | optional 制造规格 ref + snapshot |
| `wip_unit_ref` | optional WIP 引用 |
| `physical_trace_id` | optional 单件追溯码 |
| `operator_ref` | 操作人引用摘要 |
| `audit_ref` | 审计引用摘要 |

### 2.6 `MoldLifeWarning`

phase 1 `MoldLifeWarning` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_warning_event_id` | 预警标识 |
| `production_mold_instance_summary` | 生产模具实例摘要 |
| `warning_type` | `LIFE_THRESHOLD / LIFE_EXCEEDED / STATUS_EXCEPTION` |
| `warning_level` | `INFO / WARNING / CRITICAL` |
| `life_used_value` | 触发时已使用值 |
| `life_limit_value` | 触发时寿命上限 |
| `raised_at` | 预警产生时间 |
| `acknowledged_at` | optional 确认时间 |
| `acknowledged_by_ref` | optional 确认人引用 |
| `status` | `OPEN / ACKNOWLEDGED / CLOSED` |

## 3. RPC 语义

### `GetMoldDesign`

- 作用：按 `mold_design_id` 读取单个 `MoldDesign`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `mold_design_id` | 是 | 目标模具设计 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_design` | 单个 `MoldDesign` 读取模型 |

返回语义：

- 目标 `MoldDesign` 存在且可见时返回 `mold_design`。
- 目标不存在或不在可见范围时返回 `NOT_FOUND`。

### `ListMoldDesigns`

- 作用：按条件分页读取模具设计目录。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `keyword` | 否 | 按 `design_code / name` 检索 |
| `product_family_ref_id` | 否 | 按产品族 opaque id 过滤 |
| `manufacturing_spec_ref_id` | 否 | 按制造规格 opaque id 过滤 |
| `item_id` | 否 | 按 optional Item ref 过滤 |
| `material_type` | 否 | 按材料维度过滤 |
| `function_role` | 否 | 按功能角色过滤 |
| `production_method_tag` | 否 | 按生产方式标签过滤 |
| `status` | 否 | 按设计状态过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_designs[]` | 当前页 `MoldDesign` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页。
- 空页不是异常，不返回 `NOT_FOUND`。

### `GetProductionMoldInstance`

- 作用：按 `production_mold_instance_id` 读取单个生产模具实例。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `production_mold_instance_id` | 是 | 目标生产模具实例 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `production_mold_instance` | 单个 `ProductionMoldInstance` 读取模型 |

返回语义：

- 目标存在且可见时返回 `production_mold_instance`。
- 目标不存在或不在可见范围时返回 `NOT_FOUND`。

### `ListMoldInstancesByDesign`

- 作用：按 `MoldDesign` 查询所有生产模具实例与状态摘要。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `mold_design_id` | 是 | 目标模具设计 |
| `status` | 否 | 按实例生命周期过滤 |
| `warning_level` | 否 | 按当前预警等级过滤 |
| `supplier_id` | 否 | 按供应商引用过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mold_design_summary` | 目标模具设计摘要 |
| `instances[]` | 当前页 `ProductionMoldInstance` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 目标 `MoldDesign` 不存在时返回 `NOT_FOUND`。
- 目标存在但没有生产模具实例时，正常返回空页。

### `GetMoldCurrentLocation`

- 作用：查询母模或生产模具实例当前 `MesLocation`、安装状态与所在 `WorkCenter` 摘要。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `mold_resource_type` | 是 | `MASTER_MOLD / PRODUCTION_MOLD_INSTANCE` |
| `mold_resource_id` | 是 | 目标模具资源 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `current_location` | `MoldCurrentLocation` 读取模型 |

返回语义：

- 目标存在且可见时返回当前位置摘要。
- 目标不存在或不在可见范围时返回 `NOT_FOUND`。
- 母模不返回安装摘要。

### `GetMoldUsageHistory`

- 作用：查询单个生产模具的历史使用、安装、拆卸、移动、寿命调整、预警与报废摘要。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `production_mold_instance_id` | 是 | 目标生产模具实例 |
| `entry_types[]` | 否 | 按历史条目类型过滤 |
| `occurred_from` | 否 | 起始时间 |
| `occurred_to` | 否 | 截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `production_mold_instance_summary` | 目标实例摘要 |
| `entries[]` | 当前页历史条目 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 目标生产模具实例不存在时返回 `NOT_FOUND`。
- 目标存在但过滤后没有历史条目时，正常返回空页。

### `ListCurrentMoldsByWorkCenter`

- 作用：查询某产线 / 工位组 / 工位当前已安装模具清单。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `work_center_id` | 是 | 目标执行单元 |
| `include_child_work_centers` | 否 | 是否包含子 work centers |
| `warning_level` | 否 | 按预警等级过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `work_center_summary` | 目标执行单元摘要 |
| `installed_molds[]` | 当前安装模具列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

`installed_molds[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `production_mold_instance` | 生产模具实例摘要 |
| `mold_installation` | 当前有效安装摘要 |
| `resource_position_summary` | 资源位置摘要 |
| `life_summary` | 寿命摘要 |
| `warning_summary` | 当前预警摘要 |

空语义：

- 目标 `WorkCenter` 不存在时返回 `NOT_FOUND`。
- 目标存在但当前无安装模具时，正常返回空页。

补充语义：

- 本 RPC 只读取 `WorkCenter` 当前安装事实，不把 `WorkCenter` 等同于 `MesLocation`。
- 若调用方需要物理位置，应使用 `GetMoldCurrentLocation` 或实例摘要中的 `current_mes_location_summary`。

### `ListMoldLifeWarnings`

- 作用：查询寿命接近上限、超限或已确认的预警清单。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `status` | 否 | `OPEN / ACKNOWLEDGED / CLOSED` |
| `warning_type` | 否 | 预警类型过滤 |
| `warning_level` | 否 | 预警等级过滤 |
| `work_center_id` | 否 | 按当前安装 work center 过滤 |
| `mold_design_id` | 否 | 按模具设计过滤 |
| `raised_from` | 否 | 预警起始时间 |
| `raised_to` | 否 | 预警截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `warnings[]` | 当前页 `MoldLifeWarning` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页。
- 空页不是异常，不返回 `NOT_FOUND`。

### `PrintDailyMoldChecklist`

- 作用：生成每日产线模具清单的打印读模型，包含当前安装、预计使用、寿命预警与异常备注。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `work_center_ids[]` | 是 | 目标执行单元集合 |
| `checklist_date` | 是 | 清单日期 |
| `include_child_work_centers` | 否 | 是否包含子 work centers |
| `include_warnings` | 否 | 是否包含寿命预警 |
| `include_recent_usage` | 否 | 是否包含近期使用摘要 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `checklist` | `DailyMoldChecklist` 读模型 |

`DailyMoldChecklist` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `checklist_date` | 清单日期 |
| `work_centers[]` | work center 清单分组 |
| `generated_at` | 生成时间 |
| `generated_by_ref` | 生成操作者引用 |

`work_centers[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `work_center_summary` | 执行单元摘要 |
| `installed_molds[]` | 当前安装模具 |
| `life_warnings[]` | 当前相关寿命预警 |
| `recent_usage_summary[]` | optional 近期使用摘要 |
| `exception_notes[]` | 异常备注摘要 |

返回语义：

- 任一 `work_center_id` 不存在或不可见时返回 `NOT_FOUND`。
- 目标 work centers 当前没有安装模具时，仍返回空分组清单，不返回 `NOT_FOUND`。

补充语义：

- 本 RPC 返回打印所需读模型，不负责创建纸质清单事实。
- 本 RPC 不替代 `RecordMoldUsage`；主管勾选或文员补录后的正式使用事实必须通过 command 写入。

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法、时间窗口非法或查询条件互相冲突 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / mold resource 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，或列表 / 打印请求中显式引用的 `MoldDesign`、`ProductionMoldInstance`、`WorkCenter` 不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足，例如查询生产模具专属历史时传入非生产模具资源 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `ListMoldDesigns` 空页、`ListMoldInstancesByDesign` 空页、`GetMoldUsageHistory` 空历史、`ListCurrentMoldsByWorkCenter` 空安装、`ListMoldLifeWarnings` 空页，都必须走正常响应语义。
- phase 1 query 不使用 `ALREADY_EXISTS` 或 `ABORTED`。
- query 返回的 display snapshot 只服务历史展示与列表阅读，不代表跨服务 owner truth。
