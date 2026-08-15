# wms-service Warehouse Query API

## 1. 模块职责

`WarehouseQueryService` 负责 phase 1 WMS 内部仓储拓扑的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`WarehouseQueryService`
- 分类：`BUSINESS / HUMAN / WEB`
- direct caller：仅 `api-gateway`
- audience：`urn:oes:service:wms-service`
- tenant、适用 org、operator 与 trace 只从 verified ET/transport context 派生；request body 不承载 authority

phase 1 query 只覆盖：

- `Warehouse` 单对象读取
- `Warehouse` 目录分页
- `Location` 单对象读取
- `Location` 目录分页

phase 1 query 不覆盖：

- warehouse / location 创建与修改
- external custody topology
- customer / supplier address lookup
- work area directory

## 2. 通用读取对象

### 2.1 `Warehouse`

phase 1 `Warehouse` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `warehouse_id` | `Warehouse` 稳定标识 |
| `warehouse_code` | 仓库编码 |
| `warehouse_name` | 仓库名称 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `warehouse_scope` | 固定为 `INTERNAL` |
| `status` | `ACTIVE / INACTIVE` |
| `default_receiving_location_id` | optional 默认收货 location |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- phase 1 `Warehouse` 只承诺 `INTERNAL` scope
- future `EXTERNAL_CUSTODY` 只作为 reserved term，不在 phase 1 runtime 中返回
- `Warehouse` 不等于 supplier / customer 地址，也不等于 work area 列表

### 2.2 `Location`

phase 1 `Location` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `location_id` | `Location` 稳定标识 |
| `warehouse_id` | 所属仓库标识 |
| `parent_location_id` | optional 父级 location |
| `location_code` | location 编码 |
| `location_name` | location 名称 |
| `location_scope` | 固定为 `INTERNAL` |
| `location_type` | `RECEIVING / STORAGE / STAGING / RESTRICTED` |
| `status` | `ACTIVE / INACTIVE` |
| `supports_receipt` | 是否允许被收货 line 作为 target |
| `supports_storage` | 是否承担正式库存责任 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `Location` 只表示承担库存责任的 stock-responsible place
- `WorkArea` 若不承担库存责任，则不是 `Location`
- customer / supplier address 不是 `Location`
- damaged stock 可以存放在 `RESTRICTED` location，但 damaged 语义来自库存状态 reason，而不是来自单独的 location truth

### 2.3 `WarehouseSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `warehouse_id` | 仓库标识 |
| `warehouse_code` | 仓库编码 |
| `warehouse_name` | 仓库名称 |
| `warehouse_scope` | 固定为 `INTERNAL` |
| `status` | 当前状态 |
| `default_receiving_location_id` | optional 默认收货 location |

### 2.4 `LocationSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `location_id` | location 标识 |
| `warehouse_id` | 所属仓库标识 |
| `parent_location_id` | optional 父级 location |
| `location_code` | location 编码 |
| `location_name` | location 名称 |
| `location_scope` | 固定为 `INTERNAL` |
| `location_type` | location 类型 |
| `status` | 当前状态 |
| `supports_receipt` | 是否允许收货 |
| `supports_storage` | 是否承担库存责任 |

## 3. RPC 语义

### `GetWarehouse`

- 作用：按 `warehouse_id` 读取单个 `Warehouse`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `warehouse_id` | 是 | 目标仓库标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `warehouse` | 单个 `Warehouse` 读取模型 |

空语义：

- 目标 `Warehouse` 存在时返回 `warehouse`
- 目标 `Warehouse` 不存在时返回 `NOT_FOUND`

### `ListWarehouses`

- 作用：按条件分页搜索 phase 1 internal warehouse 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `warehouse_code / warehouse_name` 轻量检索 |
| `status` | 否 | 按状态过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `warehouses[]` | 当前页 `WarehouseSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

补充说明：

- phase 1 `ListWarehouses` 只返回 `warehouse_scope = INTERNAL`
- 不允许把 external custody、supplier address 或 customer address 混入此目录

### `GetLocation`

- 作用：按 `location_id` 读取单个 `Location`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `location_id` | 是 | 目标 location 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `location` | 单个 `Location` 读取模型 |

空语义：

- 目标 `Location` 存在时返回 `location`
- 目标 `Location` 不存在时返回 `NOT_FOUND`

### `ListLocations`

- 作用：按条件分页搜索 phase 1 internal location 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `warehouse_id` | 否 | 按所属仓库过滤 |
| `parent_location_id` | 否 | 按父 location 过滤 |
| `location_type` | 否 | 按 location 类型过滤 |
| `status` | 否 | 按状态过滤 |
| `supports_receipt` | 否 | 是否只看可收货 location |
| `supports_storage` | 否 | 是否只看承担库存责任的 location |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `locations[]` | 当前页 `LocationSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

补充说明：

- phase 1 `ListLocations` 只返回 `location_scope = INTERNAL`
- 未承担库存责任的 work area 不应在本 RPC 中出现

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 WMS audience、有效期或 certificate-bound HUMAN ExecutionToken |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / warehouse / location 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，例如 `warehouse_id` 或 `location_id` 不存在 |
| `ALREADY_EXISTS` | 当前 query RPC 不应返回该错误；该错误码只作为跨 management/query 共享的统一错误词汇保留 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足，例如 location 已存在但当前不属于可见 tenant / org 范围 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `ListWarehouses` 与 `ListLocations` 空页都必须走正常响应语义，而不是错误替代
- phase 1 不允许 query surface 借机暴露 `EXTERNAL_CUSTODY` runtime 对象
