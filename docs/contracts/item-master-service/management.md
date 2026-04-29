# item-master-service Management API

## 1. 模块职责

`ItemMasterManagementService` 负责 phase 1 的命令型写接口。

调用基线：

- 接口类型：内部 gRPC
- 服务：`ItemMasterManagementService`
- 所有 RPC 显式带 `tenant_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 management 只冻结以下写能力：

- 创建 Item
- 修改 Item 基础信息
- 全量替换 capability
- 全量替换 composition
- 新增或更新 supplier item mapping
- 变更 Item 生命周期 / enabled 状态
- 创建 ItemCategory
- 修改 ItemCategory 基础信息
- 变更 ItemCategory 生命周期 / enabled 状态
- 设置 Item 的 `primary category`

phase 1 management 明确不冻结：

- 包装 / 制造 / 仓储 / 销售配置写接口
- integration event catalog

## 2. 通用 invariant

所有 command RPC 都必须遵守以下 invariant：

- `tenant_id` 是显式边界，不允许隐式从调用链推断
- `UpdateItemBasics` 只允许修改 `item_code / item_name`
- `structure_type / nature_type` 在 phase 1 immutable
- `stockable` 仅允许 `PHYSICAL Item`
- `manufacturable` 仅允许 `PHYSICAL Item`
- `ItemComposition.parent` 必须是 `BUNDLE`
- nested bundle deferred，不属于 phase 1 contract
- `SupplierItemMapping` 只承载 `supplierId + supplierItemCode / supplierItemName -> itemId`
- `SupplierItemMapping` 不承载价格、MOQ、账期、lead time、供应表现
- `ItemCategory` 是 tenant-scoped 轻量树
- `ItemCategory` 只表达目录浏览、搜索收窄、列表展示与轻量统计分组所需的基础分类真相
- phase 1 + 当前 slice 中，每个 `Item` 只允许 `0..1` 个 `primary category`
- `SetItemPrimaryCategory` 只维护单值关联，不扩展 multi-category
- category 不继承权限、定价、采购、库存、包装或制造规则

## 3. 本地审计要求

phase 1 不冻结 integration events，但所有命令链路都必须落本地 `audit envelope`。

本地审计至少应记录：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 受影响租户 |
| `command_name` | 当前 RPC 名称 |
| `operator_context` | 操作者身份摘要 |
| `service_context` | 调用服务摘要 |
| `trace_context` | trace / span 关联信息 |
| `target_id` | 目标 Item 或 mapping 标识 |
| `request_summary` | 受控字段摘要 |
| `result` | 成功 / 失败结果 |
| `occurred_at` | 审计时间 |

说明：

- 本文件只冻结“必须存在本地审计 envelope”这一黑盒要求
- 审计表结构、日志实现与事件桥接方式不在 phase 1 contract 中展开

## 4. RPC 语义

### `CreateItem`

- 作用：创建新的 Item 主数据

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_code` | 是 | tenant 内 Item 编码 |
| `item_name` | 是 | Item 名称 |
| `structure_type` | 是 | `SINGLE / BUNDLE` |
| `nature_type` | 是 | `PHYSICAL / VIRTUAL / SERVICE` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_id` | 新建 Item 标识 |
| `item` | 新建后的 Item 摘要 |

关键语义：

- phase 1 在创建时冻结 `structure_type / nature_type`
- 如需后续调整分类，应通过新的 contract 讨论，而不是在本命令上隐式扩展

### `UpdateItemBasics`

- 作用：更新 Item 的基础可编辑字段

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | 目标 Item 标识 |
| `item_code` | 是 | 新编码 |
| `item_name` | 是 | 新名称 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 更新后的 Item 摘要 |

关键语义：

- 本命令只改 `item_code / item_name`
- `structure_type / nature_type` 不在 phase 1 可变更范围内
- 任何试图通过本命令改变分类语义的行为都必须被拒绝

### `SetItemCapabilities`

- 作用：全量替换 Item capability 集合

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | 目标 Item 标识 |
| `capabilities` | 是 | 完整 capability 集合 |

`capabilities` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sellable` | 是否可销售 |
| `purchasable` | 是否可采购 |
| `stockable` | 是否可库存 |
| `manufacturable` | 是否可制造 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 更新后的 Item 摘要 |

关键语义：

- 这是全量替换，不是 patch
- 调用方必须提交完整 capability 集合
- 省略旧值不表示“保持不变”，而表示本次替换范围未定义，调用方不得依赖部分更新语义
- `stockable / manufacturable` 与 `nature_type = PHYSICAL` 约束必须一致

### `SetItemComposition`

- 作用：全量替换 bundle Item 的组成关系

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | bundle parent 的 `item_id` |
| `components[]` | 是 | 完整组件列表 |

`components[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `component_item_id` | 组件 Item 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_id` | parent Item 标识 |
| `components[]` | 替换后的组件列表 |

关键语义：

- 这是全量替换，不是 patch
- 调用方提交的 `components[]` 就是替换后的完整真相
- 旧组件若未出现在新集合中，必须被移除
- 空 `components[]` 表示清空当前 composition
- parent Item 必须是 `BUNDLE`
- nested bundle deferred，component 不能依赖 bundle-as-component 语义进入 phase 1

### `UpsertSupplierItemMapping`

- 作用：新增或更新供应商型号到 Item 的映射

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `supplier_id` | 是 | SRM supplier 引用 |
| `supplier_item_code` | 否 | 供应商侧编码 |
| `supplier_item_name` | 否 | 供应商侧名称 |
| `item_id` | 是 | 映射到的 Item 标识 |

补充约束：

- `supplier_item_code / supplier_item_name` 至少提供一个

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mapping` | 当前生效的映射结果 |

`mapping` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_id` | 供应商标识 |
| `supplier_item_code` | 供应商侧编码 |
| `supplier_item_name` | 供应商侧名称 |
| `item_id` | 目标 Item 标识 |

关键语义：

- 该命令只维护映射关系，不维护采购商业条款
- 价格、MOQ、账期、lead time、供应表现都不在 request / response 范围内
- 若未来需要采购主档或供应表现模型，必须走新的 bounded context / contract，而不是向本 RPC 追加字段

### `ChangeItemStatus`

- 作用：变更 Item 生命周期 / enabled 状态

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | 目标 Item 标识 |
| `target_status` | 是 | 目标状态 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 变更后的 Item 摘要 |

关键语义：

- 本命令只处理状态切换
- 不借由状态切换顺带改写 code、name、classification、capability、composition 或 supplier mapping

### `CreateItemCategory`

- 作用：创建 tenant 内新的轻量 ItemCategory 节点

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `category_code` | 是 | tenant 内 category 编码 |
| `category_name` | 是 | category 名称 |
| `parent_category_id` | 否 | 为空时创建根节点；有值时挂到指定父节点下 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category` | 新建后的 category 摘要 |

`category` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category_id` | Category 稳定标识 |
| `category_code` | tenant 内 category 编码 |
| `category_name` | category 名称 |
| `parent_category_id` | 父分类标识；根节点为空 |
| `status` | 当前 category 生命周期 / enabled 摘要 |

关键语义：

- 本命令只创建轻量分类树节点，不写入品牌、包装、制造、库存类型等其他树语义
- `parent_category_id` 有值时，目标父分类必须存在
- category tree 只冻结父子层级关系，不引入 category inheritance 业务规则

### `UpdateItemCategoryBasics`

- 作用：更新 category 的基础可编辑字段

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `category_id` | 是 | 目标 category 标识 |
| `category_code` | 是 | 新 category 编码 |
| `category_name` | 是 | 新 category 名称 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category` | 更新后的 category 摘要 |

关键语义：

- 本命令只改 `category_code / category_name`
- 不借由 basics 更新隐式修改父子层级
- 不借由 basics 更新引入权限、定价、采购、库存、包装或制造语义

### `ChangeItemCategoryStatus`

- 作用：变更 category 生命周期 / enabled 状态

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `category_id` | 是 | 目标 category 标识 |
| `target_status` | 是 | 目标状态 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category` | 变更后的 category 摘要 |

关键语义：

- 本命令只处理 category 自身状态切换
- 不借由状态切换顺带改写树结构或 Item 绑定关系
- 若后续需要“停用 category 前必须先迁移 Item / 子分类”的治理规则，应在后续 contract 单独冻结

### `SetItemPrimaryCategory`

- 作用：设置或清空 Item 的单个 `primary category`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | 目标 Item 标识 |
| `primary_category_id` | 否 | 目标主分类；为空表示清空当前主分类 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 更新后的 Item 摘要，包含 `primary_category_summary?` |

关键语义：

- 本命令是单值设置，不支持一次写入多个 category
- `primary_category_id` 为空表示显式清空当前主分类，符合 `0..1` 约束
- 指定 `primary_category_id` 时，目标 category 必须存在
- 本命令只维护 Item 与 category 的主关联，不引入 category 继承、定价、采购、库存、包装或制造策略

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、传入了超出 contract 的字段语义，或 `UpsertSupplierItemMapping` 未提供 code / name |
| `UNAUTHENTICATED` | 缺少有效 internal service context 或 operator context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有写该 tenant/item 的权限 |
| `NOT_FOUND` | 目标 Item、Category，或映射所引用的 Item / Category 不存在 |
| `ALREADY_EXISTS` | 创建或更新时违反唯一性约束，例如 tenant 内 `item_code` 或 `category_code` 冲突 |
| `FAILED_PRECONDITION` | 资源存在，但不满足业务前提，例如给非 `PHYSICAL` Item 设置 `stockable / manufacturable`，给非 `BUNDLE` Item 设置 composition，或把 Item 绑定到不允许作为当前主分类目标的 category |

补充说明：

- phase 1 不要求冻结 integration event 失败语义
- 命令成功与失败都必须进入本地 `audit envelope`
- 当前 slice 不提供 multi-category、category inheritance 或 category-based policy 命令
