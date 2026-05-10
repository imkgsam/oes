# item-master-service Contract V2

## 1. Purpose

本目录冻结 `item-master-service` Contract V2 的黑盒契约语义。

Contract V2 以上游稳定真相源为准：

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)

本目录只定义 `item-master-service` 自身 contract，不定义 Sales、MES、WMS、SRM、Procurement 的领域对象、contract 或 runtime 行为。

## 2. Contract Boundary

Contract V2 覆盖以下 item-master 主数据：

- `ItemModel`
- `AttributeDefinition`
- `AttributeOption`
- `ItemModelAttributeRule`
- `Item`
- `Item.capabilities`
- `ItemCategory`
- `PackagingMethod`
- `PackagingSpec`
- `BOM`
- `BOMLine`
- `SupplierItemMapping`

Contract V2 只承载当前稳定对象与字段语义，不在本目录保留历史 contract 对照。

## 3. Service Surface

Contract V2 仍使用两个内部 gRPC service 作为服务面分组：

- `ItemMasterQueryService`
- `ItemMasterManagementService`

## 4. Documents

- [item-model.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/item-model.md)
- [attribute.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/attribute.md)
- [item.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/item.md)
- [category.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/category.md)
- [packaging.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/packaging.md)
- [bom.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/bom.md)
- [supplier-item-mapping.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/supplier-item-mapping.md)

## 5. Security And Context Baseline

所有 V2 RPC 统一遵循以下基线：

- 全部为内部 gRPC 契约，不直接对外部客户端开放。
- 所有 RPC 显式携带 `tenant_id`。
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context
- management RPC 必须走 command 语义，不得按 query 方式滥用。
- query RPC 不修改状态。
- management RPC 必须进入本地 audit envelope。

本目录不展开 metadata header、guard、tracing、审计表结构或 event bridge 实现。

## 6. Shared Lifecycle

第一阶段统一使用简单 active / archived 语义：

- `active = true` 表示可用于新业务。
- `active = false` 表示归档，不再用于新业务。
- 归档不删除历史，不影响已有订单、库存历史、生产历史、采购历史或审计记录。
- 停用 `ItemModel` 不自动停用其下所有 `Item`。

执行入口至少校验：

```text
Item.active = true
+ required Item.capability = true
```

## 7. Shared Error Semantics

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、查询条件互相冲突，或传入超出当前 contract 的字段语义。 |
| `UNAUTHENTICATED` | 缺少有效 internal service context 或 operator context。 |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读写该 tenant 下目标资源的权限。 |
| `NOT_FOUND` | 单对象读取目标不存在，或命令引用的目标资源不存在。 |
| `ALREADY_EXISTS` | 创建或更新时违反 tenant 内唯一性约束。 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态、active 标记、capability、BOM 类型或引用关系不满足业务前提。 |

空搜索、空列表、批量读取的部分缺失、供应商型号未命中，必须走正常响应语义，不能用错误码替代。

## 8. Deferred

以下能力已识别，但不进入 Contract V2 第一阶段：

- `traceable` capability
- `kittable` capability
- `consumable` capability
- `AttributeCombinationRule`
- 虚拟套装 / kit 销售展开
- 复杂替代料
- 可选 BOM 行
- `Item` 级 category override / secondary category
- integration event catalog
- 外部 HTTP / BFF / UI contract
