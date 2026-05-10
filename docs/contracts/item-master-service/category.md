# item-master-service ItemCategory Contract

## 1. Purpose

`ItemCategory` 是 tenant-scoped 轻量分类树，用于分类、浏览、搜索收窄、列表展示与基础统计分组。

第一阶段分类主挂 `ItemModel`：

```text
ItemModel.primaryCategoryId
```

`Item` 通过所属 `ItemModel` 获得分类上下文。`Item` 级 override / secondary category 后置。

## 2. Read Model Shape

`ItemCategory` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category_id` | Category 稳定标识。 |
| `category_code` | tenant 内 category 编码。 |
| `category_name` | category 名称。 |
| `parent_category_id` | 父分类；根节点为空。 |
| `active` | 是否可用于新建业务。 |
| `has_children` | 是否存在直接子分类。 |

## 3. Query RPCs

### `ListItemCategories`

按 tenant 读取 category tree 的某一层级列表。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `parent_category_id` | 否 | 为空时读取根节点；有值时读取该节点直接子节点。 |
| `active` | 否 | 按 active 状态过滤。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `categories[]` | 当前层级 category 列表。 |

空语义：

- tenant 当前没有 category 时，返回空列表。
- 目标父节点存在但没有子节点时，返回空列表。

## 4. Management RPCs

### `CreateItemCategory`

创建新的 category 节点。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `category_code` | 是 | tenant 内 category 编码。 |
| `category_name` | 是 | category 名称。 |
| `parent_category_id` | 否 | 父分类；为空时创建根节点。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category` | 新建后的 category。 |

### `UpdateItemCategoryBasics`

更新 category 基础字段。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `category_id` | 是 | 目标 category。 |
| `category_code` | 是 | 新 category 编码。 |
| `category_name` | 是 | 新 category 名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category` | 更新后的 category。 |

### `ChangeItemCategoryStatus`

变更 category active 状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `category_id` | 是 | 目标 category。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category` | 变更后的 category。 |

## 5. Explicit Non-goals

- 不提供 `Item` 级 primary category 写入 RPC。
- 不提供 multi-category。
- 不提供 category inheritance。
- 不提供 category-based permission / pricing / procurement / inventory / packaging / manufacturing policy。
