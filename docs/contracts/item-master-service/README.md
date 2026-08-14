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

Contract V2 使用三个 gRPC service 作为服务面分组：

- `ItemMasterQueryService`
- `ItemMasterManagementService`
- `ItemMasterInternalQueryService`

前两个 service 的现有 50 个 RPC 只允许 Gateway 后台 HUMAN/WEB 调用；当前 46 条 BFF route 不因本迁移增加业务入口。第三个 service 只承载三个按业务能力命名的 INTERNAL 资格查询，不是 Gateway 后台接口，也不新增 Item Master 业务能力。

## 4. Documents

- [item-model.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/item-model.md)
- [attribute.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/attribute.md)
- [item.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/item.md)
- [category.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/category.md)
- [packaging.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/packaging.md)
- [bom.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/bom.md)
- [supplier-item-mapping.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/supplier-item-mapping.md)

## 5. Security And Context Baseline

所有 V2 RPC 都是内部 gRPC 契约，不直接对外部客户端开放，并使用 `aud=urn:oes:service:item-master-service`、mTLS 与 certificate-bound ExecutionToken。请求体不再携带租户或操作者 authority；现有 50 个 request 的 `tenant_id=1` 被删除并永久 reserve，tenant、org、principal、operator、trace 与 audit 只能从验证后的 ExecutionToken 和可信 transport context 派生。

现有 50 个 RPC 的冻结入口为 `BUSINESS / HUMAN / WEB`：只允许 Gateway 使用 HUMAN session ET，拒绝 MACHINE、DELEGATED、SELF_SERVICE、非 WEB terminal、错误 audience/`cnf`/Code 以及全部旧 body/ordinary-metadata/signed-operator fallback。每个 RPC 的 exact Code 以 [trusted gRPC feature packet](../../plans/features/trusted-grpc-execution-context.md) 的 Item Master 53-RPC matrix 为准。

三个资格查询的冻结入口为 `INTERNAL / SYSTEM MACHINE`：

| RPC | Exact INTERNAL Code | Exact workload allowlist |
| --- | --- | --- |
| `ResolveManufacturableItem` | `item_master.internal.manufacturable_item.resolve` | `mes-service` |
| `ResolveStockableItem` | `item_master.internal.stockable_item.resolve` | `wms-service` |
| `ResolvePurchasableItem` | `item_master.internal.purchasable_item.resolve` | `procurement-service`, `srm-service` |

每个 caller 使用自身 Machine Principal、source credential 与 SPIFFE identity，逐跳兑换 Item Master audience ET；不得复用 Gateway identity，不得把旧 signed metadata、body tenant 或 raw smoke 伪装成 workload。SYSTEM scope 不是跨租户通配：每次调用仍必须携带由可信入站链派生的准确 tenant claim。错误 workload、HUMAN、DELEGATED、TENANT MACHINE、错误 Code/audience/`cnf` 与缺失 foundation 均 fail closed。

management RPC 必须走 command 语义并进入本地 audit envelope；query RPC 不修改状态。可信 principal、source workload、tenant、trace 与 audit 不接受业务 payload 覆盖。

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

三个 INTERNAL 资格查询在 Item 不存在时返回 `NOT_FOUND`；Item 存在但 `active=false` 或缺少目标 capability 时返回 `FAILED_PRECONDITION`；成功时只返回 `item_id/item_code/item_name/active` 的最小 Item-owned projection。

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
