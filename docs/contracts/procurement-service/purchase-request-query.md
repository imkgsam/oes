# procurement-service Purchase Request Query API

## 1. 模块职责

`PurchaseRequestQueryService` 负责 phase 1 采购需求对象的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`PurchaseRequestQueryService`
- 所有 RPC 固定为 `BUSINESS / HUMAN / WEB`
- tenant/org/operator/trace/audit 只来自 verified ET/transport context；request 不携带 authority context
- audience 固定为 `urn:oes:service:procurement-service`
- `GetPurchaseRequest` 要求 `procurement.purchase_request.get_by_id`
- `SearchPurchaseRequests` 要求 `procurement.purchase_request.list`

phase 1 query 只覆盖：

- `PurchaseRequest` 单对象读取
- `PurchaseRequest` 目录搜索

phase 1 query 不覆盖：

- 审批任务列表
- workflow 待办
- `RFQ`
- `SupplierQuote`
- 采购预算控制读模型
- 事件派生读模型

## 2. 通用读取对象

### 2.1 `PurchaseRequest`

phase 1 `PurchaseRequest` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request_id` | `PurchaseRequest` 稳定标识 |
| `request_no` | PR 编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `request_type` | `DEPARTMENTAL / SALES_DEDICATED / PRODUCTION_PACKAGING / MAINTENANCE / SAMPLE` |
| `status` | `DRAFT / SUBMITTED / APPROVED / PARTIALLY_CONVERTED / CONVERTED / REJECTED / CANCELLED` |
| `requester` | 申请人摘要 |
| `title` | optional 采购主题摘要 |
| `reason` | optional 申请原因摘要 |
| `approval_snapshot` | 当前审批结论快照；未决策时为空 |
| `lines[]` | `PurchaseRequestLine` 列表 |
| `linked_purchase_orders[]` | 该 PR 当前已并入的 `PO` 摘要 |
| `next_expected_receipt_date` | optional 当前最近预计到货日摘要 |
| `receiving_status_summary` | optional 当前到货状态摘要 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `PurchaseRequest` 表达采购需求，不表达采购承诺
- `PARTIALLY_CONVERTED / CONVERTED` 表达源 `PR` 被并入 `PO` 后的保留状态，而不是创建新 `PR`
- phase 1 不在 query shape 中展开完整 workflow history
- `approval_snapshot` 只表达冻结结论与审计引用，不代表完整审批引擎

### 2.2 `PurchaseRequestRequesterSummary`

phase 1 `requester` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `operator_id` | 发起人稳定标识 |
| `display_name` | 发起人显示名 |

### 2.3 `PurchaseRequestApprovalSnapshot`

phase 1 `PurchaseRequestApprovalSnapshot` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `decision` | `APPROVED / REJECTED` |
| `decided_by` | 决策人摘要 |
| `decided_at` | 决策时间 |
| `comment` | optional 决策说明 |
| `approval_reference` | optional 审计 / workflow 引用摘要 |

说明：

- phase 1 只允许一条当前生效 snapshot
- 不在 query 侧展开多轮审批历史

### 2.4 `PurchaseRequestLine`

phase 1 `PurchaseRequestLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request_line_id` | PR 行标识 |
| `line_no` | 行号 |
| `line_type` | `STANDARD_ITEM / TEXT` |
| `item_id` | 标准 Item 行必有；文本行为空 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `description` | 行说明；文本行必须返回，标准行可作为补充说明 |
| `requested_quantity` | 需求数量 |
| `uom` | 计量单位摘要 |
| `needed_by_date` | optional 期望到货日期 |
| `conversion_status` | `NOT_CONVERTED / PARTIALLY_CONVERTED / CONVERTED` |
| `linked_purchase_order_lines[]` | 该 PR line 当前关联的 `PO line` 摘要 |
| `demand_reference_type` | optional 归因类型摘要 |
| `demand_reference_id` | optional 归因对象标识 |

说明：

- `STANDARD_ITEM` 行必须指向可采购 Item
- `TEXT` 行用于非标准 / 文本型采购需求，不强制要求先存在 Item 主数据
- `linked_purchase_order_lines[]` 用于让 PR 发起人看到该行已经并入哪个 `PO`、预计何时到货、当前收货状态
- phase 1 不在该读取模型中扩展预算控制、复杂分摊或成本中心矩阵

### 2.5 `PurchaseRequestPurchaseOrderLink`

phase 1 `PR` / `PR line` 回显的最小 `PO` 链接摘要：

| 字段 | 说明 |
| --- | --- |
| `purchase_order_id` | 关联 `PO` 标识 |
| `order_no` | 关联 `PO` 编号摘要 |
| `purchase_order_line_id` | optional 关联 `PO line` 标识 |
| `allocated_quantity` | optional 当前分配到该 `PO line` 的数量摘要 |
| `expected_receipt_date` | optional 当前预计到货日期摘要 |
| `receiving_status_summary` | optional 当前到货状态摘要 |

### 2.6 `PurchaseRequestSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request_id` | PR 标识 |
| `request_no` | PR 编号摘要 |
| `request_type` | 申请类型 |
| `status` | 当前状态 |
| `requester_display_name` | 发起人摘要 |
| `line_count` | 行数摘要 |
| `linked_purchase_orders[]` | optional 已并入 `PO` 的摘要列表 |
| `next_expected_receipt_date` | optional 当前最近预计到货日摘要 |
| `receiving_status_summary` | optional 当前到货状态摘要 |
| `created_at` | 创建时间 |
| `submitted_at` | optional 提交时间 |
| `decided_at` | optional 决策时间 |

## 3. RPC 语义

### `GetPurchaseRequest`

- 作用：按 `purchase_request_id` 读取单个 `PurchaseRequest`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_request_id` | 是 | 目标 PR 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request` | 单个 `PurchaseRequest` 读取模型 |

空语义：

- 目标 `PurchaseRequest` 存在时返回 `purchase_request`
- 目标 `PurchaseRequest` 不存在时返回 `NOT_FOUND`

### `SearchPurchaseRequests`

- 作用：按条件分页搜索采购需求目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `request_no / title / requester` 轻量检索 |
| `request_type` | 否 | 按申请类型过滤 |
| `status` | 否 | 按状态过滤 |
| `requester_operator_id` | 否 | 按申请人过滤 |
| `item_id` | 否 | 按标准 Item 行过滤 |
| `purchase_order_id` | 否 | 按已并入的 `PO` 过滤 |
| `needed_by_date_from` | 否 | 期望到货起始日 |
| `needed_by_date_to` | 否 | 期望到货截止日 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_requests[]` | 当前页 `PurchaseRequestSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

说明：

- phase 1 只冻结采购需求当前摘要搜索，不冻结审批任务箱或统计看板搜索
- `item_id` 过滤只匹配标准 `Item` 行，不匹配文本行说明

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少有效 Procurement audience ET 或 mTLS/`cnf` binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / PR 的权限 |
| `NOT_FOUND` | `GetPurchaseRequest` 的目标 PR 不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchPurchaseRequests` 空页必须走正常响应语义
- phase 1 query 不使用 `ALREADY_EXISTS`
