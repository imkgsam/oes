# Procurement PR PO Foundation

## 1. 目标

- 将 `procurement-service` phase 1 已冻结结论回写为可执行 feature packet，作为后续 `PROCUREMENT-CONTRACT` 的唯一主线入口。
- 建立采购第一阶段最小闭环：
  - `PurchaseRequest`
  - `PurchaseRequestLine`
  - `PurchaseRequestApprovalSnapshot`
  - `PurchaseOrder`
  - `PurchaseOrderLine`
  - `PurchaseOrderLineAllocation`
  - `PurchaseOrderChange`
  - `ReceivingExpectation`
  - `ReceivingDiscrepancy`
- 明确 Procurement 只拥有采购需求与采购交易执行，不吞掉 `SRM`、`Item Master`、`WMS`、`Finance` 的 owner truth。

## 2. 不做什么

- 不在本 packet 中进入代码实现、proto 字段设计、数据库结构设计或 UI 设计。
- 不在本 packet 中实现 `RFQ / SupplierQuote`。
- 不在本 packet 中实现安全库存 / 自动补货。
- 不在本 packet 中实现 `AP / supplier invoice / payment / allocation`。
- 不在本 packet 中引入完整 `workflow-service`。
- 不在本 packet 中把库存真相、供应商主档真相或付款真相并入 Procurement。
- 不在本 packet 中为 `Non-PO purchase` 设计复杂正常路径。
- 不在本 packet 中引入 `costing-service`。

## 3. 上游依赖

- services:
  - [procurement-service.md](../../architecture/services/procurement-service.md)
  - [srm-service.md](../../architecture/services/srm-service.md)
  - [item-master-service.md](../../architecture/services/item-master-service.md)
  - [wms-service.md](../../architecture/services/wms-service.md)
  - [finance-service.md](../../architecture/services/finance-service.md)
- collaborations:
  - [srm-procurement-party-item-master.md](../../architecture/collaborations/srm-procurement-party-item-master.md)
  - [procurement-srm-item-wms-finance.md](../../architecture/collaborations/procurement-srm-item-wms-finance.md)
- governance:
  - [service-collaboration-rules.md](../../architecture/system/service-collaboration-rules.md)

## 4. 当前结论

- `procurement-service` 是统一采购需求入口与采购交易执行服务。
- `procurement-service` owns：
  - `PurchaseRequest`
  - `PurchaseRequestLine`
  - `PurchaseRequestApprovalSnapshot`
  - `PurchaseOrder`
  - `PurchaseOrderLine`
  - `PurchaseOrderLineAllocation`
  - `PurchaseOrderChange`
  - `ReceivingExpectation`
  - `ReceivingDiscrepancy`
- Procurement also owns：
  - 采购交易事实
  - 历史采购价格事实
- `wms-service` owns：
  - 实际收货
  - 区位
  - 库存
  - 破损 / 受限库存
- `finance-service` owns：
  - `AP`
  - supplier invoice
  - payment
  - allocation
- `srm-service` owns：
  - `SupplierProfile`
  - `SupplierOffering`
- `item-master-service` owns：
  - `Item`
  - `SupplierItemMapping`
- 采购类支出在 phase 1 的正常路径必须先 `PR / PO`；`Non-PO purchase` 不作为正常路径。
- `PR` 支持：
  - 标准 `Item`
  - 非标准 / 文本型采购需求
- `PR` 统一覆盖：
  - 部门日常采购
  - 销售专采
  - 生产 / 包装需求
  - 维修需求
  - 样品采购
- 标准 `Item` 转 `PO` 时必须校验 `ACTIVE SupplierOffering`；日常非标准采购可不强制。
- `PO line` 必须支持 allocation，以同时表达 dedicated to `SalesOrderLine / FulfillmentDemand` 与 general stock。
- `PR` 合并生成 `PO` 时，不创建新 `PR`，也不删除旧 `PR / PR line`；源对象保留并进入 `PARTIALLY_CONVERTED / CONVERTED`。
- `PO line allocation` 必须记录来源 `PR line / SalesOrderLine / FulfillmentDemand / GENERAL_STOCK`。
- `PR` 发起人必须能通过 `PR` 查询看到已合并到哪个 `PO`、预计到货与当前到货状态摘要。
- `PO` header 可保存 `payment_terms_snapshot` 与 supplier commercial terms snapshot，但它们只是本次采购快照，不成为 `SRM` 长期商业主档。
- Procurement 只消费 `finance-service` 提供的 payment summary 与 `asset-service attachmentRef` 引用，不拥有付款真相或付款凭证文件。
- `ReceivingExpectation` 不是 `WMS receipt` truth；`WMS receipt` 才是实际收货真相。
- 当一个 `PO line` 的 allocation 指向不同目标仓 / 收货地址 / allocation grouping 时，必须拆分多个 `ReceivingExpectation`。
- Odoo 风格“先预期收货，再按差异处理”可参考，但 OES 第一阶段必须拥有 `ReceivingDiscrepancy + resolution options`，不能只支持自动补单。
- `ReceivingDiscrepancy resolution` 只记录采购侧处置选择，不直接修改库存真相。
- 取消剩余未收数量必须通过 `PurchaseOrderChange` 留痕。
- phase 1 的 return / claim 只保留 resolution 类型与引用，不实现完整 `SupplierReturn / claim workflow`。
- `PurchaseOrderChange` 在 phase 1 只要求轻量 `APPLIED` 变更留痕；后续再升级为完整申请 / 审批 / 供应商确认。
- 历史采购价格第一阶段归 Procurement 交易事实；future `Costing / BI` 只消费分析，不拥有原始交易事实。

## 5. 契约真相位置

- 稳定服务职责：
  - [procurement-service.md](../../architecture/services/procurement-service.md)
- 稳定协同蓝图：
  - [srm-procurement-party-item-master.md](../../architecture/collaborations/srm-procurement-party-item-master.md)
  - [procurement-srm-item-wms-finance.md](../../architecture/collaborations/procurement-srm-item-wms-finance.md)
- 下一步 contract 入口：
  - [procurement-service contracts](../../contracts/procurement-service/README.md)

## 6. 当前 slice

- slice:
  - `procurement-service` PR PO foundation
- status:
  - implementation-present / fresh-verification-needed
- scope:
  - `PR` intake
  - `PO` establishment
  - supplier / item validation boundary
  - line allocation
  - `PO` applied change log
  - receiving expectation
  - receiving discrepancy summary
  - procurement transaction facts / purchase price history
- ready definition:
  - 服务职责已回写
  - 关键协同蓝图已冻结 minimum 口径
  - procurement-service 黑盒 contract 已建立
  - procurement-service runtime 已存在；本次状态校准未重跑 fresh verification

### 6.1 状态校准记录

Status, 2026-06-07:

- `docs/contracts/procurement-service/**` 已存在并承接 PR、PO、receiving expectation 与 query / management contract。
- `src/services/business/procurement-service/**` 已存在 service runtime、Prisma schema、gRPC controller、tests 与 smoke script。
- 本次校准只修正文档状态；未重跑 `procurement-service` test / build / smoke，因此当前状态不得写成 fresh verified 或 fully closed。

## 7. 最小模型

### 7.1 PurchaseRequest

- 表达一次正式采购需求入口。
- phase 1 统一覆盖部门日常采购、销售专采、生产 / 包装需求、维修需求与样品采购。
- `PR` 在转单后继续保留自身真相；不会因为合并生成 `PO` 而被删除或重建。

### 7.2 PurchaseRequestLine

- 表达单行采购诉求。
- 必须支持标准 `Item` 行与非标准 / 文本型行并存。
- 转单后必须能保留行级 `PARTIALLY_CONVERTED / CONVERTED` 留痕，并回显关联 `PO`、预计到货与当前到货状态。

### 7.3 PurchaseRequestApprovalSnapshot

- 表达采购侧冻结的审批结论与审计引用。
- phase 1 只冻结 snapshot owner，不承诺完整 workflow engine。

### 7.4 PurchaseOrder

- 表达正式采购承诺与对供应商下达的采购交易对象。
- 采购类支出在 phase 1 的正常路径应由 `PR` 受控进入 `PO`。
- `PO` header 可保留 `payment_terms_snapshot` 与 supplier commercial terms snapshot。
- `PO` query 可展示 Finance 付款摘要与 `attachmentRef` 引用，但 Procurement 不拥有付款真相。

### 7.5 PurchaseOrderLine

- 表达单行采购承诺。
- 标准 `Item` 行转入 `PO` 时必须校验目标供应商存在 `ACTIVE SupplierOffering`。

### 7.6 PurchaseOrderLineAllocation

- 表达某条 `PO line` 数量如何分配给具体需求。
- phase 1 必须支持 dedicated to `SalesOrderLine / FulfillmentDemand` 与 general stock 混合分配。
- phase 1 还必须保留来源 `PR line` 留痕，并允许 allocation 携带目标仓 / 收货地址用于收货预期 grouping。

### 7.7 PurchaseOrderChange

- 表达已发 `PO` 的已应用变更留痕。
- phase 1 先做轻量 `APPLIED` 记录，而不是完整变更申请 / 审批 / 供应商确认。

### 7.8 ReceivingExpectation

- 表达采购侧“应该收到什么、预计什么时候到、还有多少未到”的预期。
- 它不是 `WMS` 实际收货真相，也不替代仓储库存事实。
- 当同一 `PO line` 指向不同目标仓 / 收货地址 / allocation grouping 时，必须拆分多个 expectation。

### 7.9 ReceivingDiscrepancy

- 表达采购侧“预期与实收不一致”的差异摘要与处理入口。
- phase 1 必须支持 `resolution options`，而不是只提供自动补单单一路径。
- phase 1 必须覆盖：
  - `SHORT_RECEIVED`
  - `OVER_RECEIVED`
  - `DAMAGED`
  - `WRONG_ITEM`
  - `QUALITY_HOLD`
- resolution 只记录采购侧处置选择与引用，不直接修改库存真相。
- 如需关闭剩余未收数量，必须通过 `PurchaseOrderChange` 留痕。

### 7.10 Procurement Transaction Facts

- 表达采购交易与历史采购价格的原始事实沉淀。
- future `Costing / BI` 只消费分析结果，不拥有原始交易事实。

## 8. Phase 1 范围

- 本线程主线：
  - 冻结 `PR / PO` 最小闭环 owner 边界
  - 冻结 `SupplierOffering`、`Item`、`WMS receipt`、`AP` 的协同边界
  - 冻结采购侧收货预期与差异摘要对象
  - 冻结 line allocation 与采购交易事实边界
- 本线程不做：
  - proto
  - 数据库
  - 运行时状态机字段细节
  - UI
  - 完整 workflow
  - `RFQ / SupplierQuote`
  - safety stock / auto replenishment
  - `AP / supplier invoice / payment`
- 偏移返回条件：
  - 如需新增跨服务公共契约、事件模型、租户模型、operator context 结构或审批模型，必须先升级 architecture / ADR

## 9. 阻塞 / 依赖

- `PROCUREMENT-CONTRACT` 线程需要基于本 packet 冻结 command / query / integration contract，而不是回到设计层重谈 Procurement 是否拥有 `PR / PO / expectation / discrepancy`。
- `WMS` 与 `Finance` 的更细颗粒度 integration contract 仍未冻结，但不阻塞 Procurement phase 1 owner 边界进入 contract 阶段。
- `RFQ`、自动补货、完整审批流与 `AP` 财务闭环全部后置，不阻塞当前 `PR + PO` foundation。

## 10. Deferred 清单

- `RFQ`
- `SupplierQuote`
- 安全库存
- 自动补货
- `Non-PO purchase` 正常化路径
- 完整 `workflow-service`
- `AP`
- supplier invoice
- payment
- allocation
- 付款凭证文件 owner；phase 1 只展示 Finance 摘要与 `attachmentRef`
- 完整采购变更申请 / 审批 / 供应商确认闭环
- 完整收货差异事件目录与 resolution policy 细化
- 完整 `SupplierReturn / claim workflow`
- `costing-service`

## 11. PROCUREMENT-CONTRACT 建议

- 建议第一批 contract 按以下边界拆分：
  - `purchase-request-management`
  - `purchase-order-management`
  - `procurement-reference-query`
  - `receiving-expectation-discrepancy-integration`
  - `procurement-transaction-facts`
- `purchase-request-management`
  - 聚焦 `PR / PRLine / ApprovalSnapshot` 的 command / query 面
  - 明确标准 `Item` 与文本型需求的输入差异
- `purchase-order-management`
  - 聚焦 `PO / POLine / Allocation / POChange` 的 command / query 面
  - 明确标准 `Item` 转单时的 `ACTIVE SupplierOffering` 校验语义
- `procurement-reference-query`
  - 冻结 Procurement 读取 `SupplierProfile / SupplierOffering / Item / SupplierItemMapping` 的受控查询口径
  - 只冻结黑盒引用面，不复制上游 owner 内部结构
- `receiving-expectation-discrepancy-integration`
  - 冻结 Procurement 与 `WMS` 的 expectation / actual receipt / discrepancy 摘要交互口径
  - 明确 `ReceivingExpectation` 不是 `WMS receipt` truth
- `procurement-transaction-facts`
  - 冻结对 future `Finance / BI / Costing` 暴露的采购交易事实与历史价格摘要口径
  - 不提前把它写成会计对象或成本对象

## 12. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| PROCUREMENT-ARCH-WRITEBACK thread | 回写 `procurement-service` 稳定真相源与 feature packet | `docs/architecture/services/procurement-service.md`, `docs/architecture/collaborations/procurement-srm-item-wms-finance.md`, `docs/plans/features/procurement-pr-po-foundation.md`, 必要索引页 | 本轮冻结结论与上游服务职责 / 协同规则 | 服务职责、协同蓝图、feature packet | completed |
| PROCUREMENT-CONTRACT thread | 冻结 `procurement-service` 黑盒契约 | `docs/contracts/procurement-service/**` | 本 feature packet、服务职责、协同蓝图 | `PR / PO / discrepancy / integration` contracts | completed |
| PROCUREMENT-REALIZATION thread | 在已冻结边界内实现服务骨架与验证 | `src/services/business/procurement-service/**` | feature packet、contracts | 可运行服务、测试与验证结果 | implementation-present / fresh-verification-needed |

## 13. 验收标准

- `procurement-service` 职责卡已明确 owns / does-not-own / phase 1 范围。
- 至少一份 Procurement 与 `SRM / Item Master / WMS / Finance` 的协同蓝图已冻结。
- feature packet 已能直接作为 `PROCUREMENT-CONTRACT` 的输入，而不需要继续回到设计层重谈采购 owner 边界。
- 已明确 `ReceivingExpectation` 与 `WMS receipt` 的真相分离。
- 已明确历史采购价格第一阶段归 Procurement 交易事实 owner。

## 14. 关闭条件

- `docs/contracts/procurement-service/**` 已建立并承接本 packet。
- 后续 contract 线程无需再次讨论 Procurement 是否应拥有 `PR / PO / allocation / expectation / discrepancy`。
- `RFQ`、自动补货、`AP` 与完整 workflow 在 contract 阶段不会被误并回 phase 1 主线。
- 若需要关闭本 packet，应先重跑 procurement-service 相关 test / build / smoke，并把 fresh verification 结果回写到本文。
