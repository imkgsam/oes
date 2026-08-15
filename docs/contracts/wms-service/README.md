# wms-service Contracts

> WMS contract 只描述 WMS 黑盒接口；涉及权限、scope、policy、checkPermission、checkResource 或 buildQueryScope 的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 和项目级授权架构为准。

## 1. 目的

本目录用于冻结 `wms-service` phase 1 最小内部收货与库存 truth contract。

这些文档面向：

- `api-gateway` WMS BFF
- `procurement-service`
- `item-master-service`
- `permission-service`
- 后续承担 `wms-service` proto / runtime 实现的线程

这些文档不是 proto 副本，不展开数据库结构，不承诺 UI、事件目录或运行时实现细节。

本目录只回写已经冻结的 `WMS-MINIMAL-CONTRACT-REFINED` 结论。

## 2. Phase 1 Contract Surface

phase 1 只冻结以下内部 gRPC contract 面：

- [warehouse-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/wms-service/warehouse-query.md)
  - `WarehouseQueryService`
  - `GetWarehouse`
  - `ListWarehouses`
  - `GetLocation`
  - `ListLocations`
- [receipt-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/wms-service/receipt-query.md)
  - `ReceiptQueryService`
  - `GetReceipt`
  - `SearchReceipts`
  - `GetReceiptLine`
  - `SearchReceiptLines`
- [receipt-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/wms-service/receipt-management.md)
  - `ReceiptManagementService`
  - `CreateReceiptDraft`
  - `AddOrReplaceReceiptLines`
  - `PostReceipt`
  - `CancelReceiptDraft`
- [inventory-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/wms-service/inventory-query.md)
  - `InventoryQueryService`
  - `SearchStockLedgerEntries`
  - `GetInventoryBalance`
  - `SearchInventoryBalances`

phase 1 不在本目录中冻结：

- proto message 全量定义
- 外部 HTTP / BFF surface
- UI / selector contract
- event catalog / payload
- warehouse / location management command
- outbound / shipment / transfer / cycle count command
- inventory adjustment / reversal command

## 3. Owner Boundary

phase 1 contract 明确围绕以下 owner truth 展开：

- `Warehouse`
- `Location`
- `Receipt`
- `ReceiptLine`
- `StockLedgerEntry`
- `InventoryBalance`
- `RestrictedStatusReason`

补充冻结规则：

- `wms-service` owns 实际收货 truth，不 owns 采购预期 truth。
- `Receipt` 是实际收货对象，不是 `ReceivingExpectation` projection。
- `StockLedgerEntry` 是库存事实真相；`InventoryBalance` 只是投影 / snapshot。
- `InventoryBalance` 不能被手工直接改成 truth。
- `Warehouse / Location` 在 phase 1 只承诺 `INTERNAL` scope。
- customer address / supplier address 不是 phase 1 `WMS Location`。
- `WorkArea` 只有在承担库存责任时才允许被建模为 `Location`。
- damaged stock 是 `RESTRICTED` 库存的一种 reason，不是单独一套总账或独立 truth。
- `tracking_refs[]` 只记录混合 coded / uncoded tracking 引用，不把条码解析平台 owner truth 转入 `WMS`。
- `attachmentRef` 只作为 evidence 引用，不等于文件 owner truth。

## 4. WMS 与 Procurement / Item Master 边界

### 4.1 Procurement 边界

- `procurement-service` owns `ReceivingExpectation / ReceivingDiscrepancy`。
- `Receipt` 或 `ReceiptLine` 可以 optional 引用 `ReceivingExpectation`。
- `Receipt.status` 绝不能并入 `ReceivingExpectation` 状态机。
- `wms-service` 只记录 physical discrepancy fact：
  - 实收数量
  - 过收 / 短收 / 破损 / 错货 / 质量待判等物理事实
- supplier-facing discrepancy resolution 继续归 `procurement-service`。
- `PostReceipt` 成功后，WMS 必须 emits/records receipt summary for Procurement：
  - 已收数量摘要
  - restricted / damaged 摘要
  - physical discrepancy 摘要
- 本目录不新增 event catalog；事件只允许作为 future candidate 或 integration boundary 被提及。

### 4.2 Item Master 边界

- `item-master-service` owns `Item` 身份与 `stockable` 能力。
- `ReceiptLine.item_id` 必须只指向当前可被 WMS 接收的 `stockable Item`。
- `wms-service` 不复制 `ItemCapability` 真相，也不把 `PackageUnit` 提前回收为 phase 1 主线能力。

## 5. Security / Context Baseline

15 个 phase 1 RPC 全部是 `BUSINESS / HUMAN / WEB`，只允许 `api-gateway` 以 `aud=urn:oes:service:wms-service` 的 certificate-bound ExecutionToken 直接调用。每个方法只使用其冻结的 existing Permission Code；MACHINE、DELEGATED、SELF_SERVICE、非 WEB terminal、错误 audience/`cnf`/Code 与非 Gateway workload 全部拒绝。

请求 body 中旧 `tenant_id / org_id / operator_context / trace_context / audit_context` 不是业务数据，均按原 field number/name 删除并 reserve。tenant、适用 org、operator、trace 与 audit 只从 verified ET、mTLS workload 与 transport correlation 派生；response 与 WMS-owned record 中的 tenant/org projection 保留。普通 metadata、signed operator payload、request-id/trace-id fallback 与 legacy body authority 均不被接受。

Gateway 必须使用 dedicated WMS mTLS client 与 HUMAN ET producer，不再保留 generic `SERVICE_NAMES.WMS` transport registration。WMS trusted ingress 建立 request-isolated verified HUMAN proof 后，才可激活 WMS→Item Master `ResolveStockableItem` 与 WMS→Procurement `ResolveReceivingExpectationForReceipt` 两条 exact HUMAN_OBO caller；每一跳都换成 target audience ET，保留 HUMAN subject，并以 exact `wms-service` SYSTEM MACHINE actor 归因。

补充说明：本轮不改变业务幂等、审计、事务、schema、event/outbox 或 tracing 语义；后台无 HUMAN subject 的 worker/Cron/Robot 与 AI/ActionGrant 继续 deferred。

### 5.1 Exact RPC / Permission Code Matrix

| RPC | Exact existing Code |
| --- | --- |
| `GetWarehouse` | `wms.warehouse.read` |
| `ListWarehouses` | `wms.warehouse.read` |
| `GetLocation` | `wms.location.read` |
| `ListLocations` | `wms.location.read` |
| `GetReceipt` | `wms.receipt.read` |
| `SearchReceipts` | `wms.receipt.read` |
| `GetReceiptLine` | `wms.receipt.read` |
| `SearchReceiptLines` | `wms.receipt.read` |
| `CreateReceiptDraft` | `wms.receipt.manage` |
| `AddOrReplaceReceiptLines` | `wms.receipt.manage` |
| `PostReceipt` | `wms.receipt.manage` |
| `CancelReceiptDraft` | `wms.receipt.manage` |
| `SearchStockLedgerEntries` | `wms.inventory.read` |
| `GetInventoryBalance` | `wms.inventory.read` |
| `SearchInventoryBalances` | `wms.inventory.read` |

## 6. 同步 / 异步边界

phase 1 固定采用以下协同规则：

- 写入前强校验走 `gRPC`
- 本地事务成功后才允许 future event 扩散
- 不允许依赖 `Event` 完成本地库存 truth 写入

当前明确需要同步 `gRPC` 的校验只有：

- `wms-service -> item-master-service`
  - 校验 `item_id` 是否存在
  - 校验 `item_id` 当前是否具备 `stockable` 能力
- `wms-service -> procurement-service`
  - 当 receipt 显式引用 `ReceivingExpectation` 时，校验 expectation 是否存在且当前 tenant 可见
- `api-gateway / Auth STS -> permission-service`
  - 在 WMS audience ET 签发或 OBO exchange 时完成 exact Code / actor workload decision；WMS 普通 RPC admission 只本地验证最终 ET，不同步调用 Permission

future event 或 integration candidate 只保留为 deferred candidate，例如：

- `ReceiptPosted`
- `ReceiptPhysicalDiscrepancyRecorded`
- `InventoryBalanceProjected`

说明：

- 本目录不冻结事件目录、命名全集、payload 字段或 outbox 实现
- “records receipt summary for Procurement” 可以通过 projection table、integration outbox 或 future event 实现，但黑盒语义必须保持一致

## 7. Phase 1 Fixed Semantics

phase 1 最小 contract 明确承诺：

- WMS owns actual receipt / inventory ledger / inventory balance / physical stock status truth。
- 只承诺 internal warehouse / location runtime scope。
- 支持 manual receiving。
- 支持 operator-confirmed quantity。
- 支持 mixed coded / uncoded `tracking_refs[]`。
- 支持 `attachmentRef` evidence 引用。
- 支持 `AVAILABLE / RESTRICTED` 两类库存状态。
- `DAMAGED` 通过 `RestrictedStatusReason` 表达，而不是单独 ledger 体系。
- `StockLedgerEntry` 采用 posting-friendly 语义，但不称为 finance double-entry。

phase 1 明确不承诺：

- 把 Procurement `ReceivingExpectation` 状态并入 WMS `Receipt.status`
- 让 WMS 决定 supplier-facing discrepancy resolution
- 把 `InventoryBalance` 暴露为可手改 truth
- 把 customer / supplier address 建成 phase 1 `WMS Location`
- 运行时 external custody 支持

## 8. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- `EXTERNAL_CUSTODY` warehouse / location runtime support
- subcontracting / `OP`
- transfer / outbound / shipment
- cycle count
- `PackageUnit`
- barcode platform
- quality workflow
- supplier return / claim workflow
- inventory reversal / adjustment command
- full event catalog / payload
- MES `WIP reservation`

补充约束：

- future `EXTERNAL_CUSTODY` 只能作为 reserved scope / type 出现在术语设计中，phase 1 运行时不得返回或写入该值
- future subcontracting / `OP` 设计不得推翻本目录对 `INTERNAL` 仓储 truth 的命名与 owner 边界

## 9. 关联真相源

本目录以上游稳定文档为准：

- [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- [procurement-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/procurement-service.md)
- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [procurement-srm-item-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/procurement-srm-item-wms-finance.md)
- [receiving-expectation.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/procurement-service/receiving-expectation.md)
- [service-collaboration-rules.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/service-collaboration-rules.md)
