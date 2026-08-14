---
status: SUPERSEDED_BY_TRUTH_SOURCE
truthSource: docs/architecture/services/srm-service.md
doNotUseAsStableSource: true
supersededAt: "2026-08-14"
---

# SRM Service Design（历史归档）

> 本工作台已退出 active 状态。SRM 的当前对象、边界、协同与 trusted gRPC 结论只以 [srm-service.md](../../architecture/services/srm-service.md) 及其引用的稳定 contract/collaboration 为准；本文仅保留早期设计决策历史，不得作为实现或后续设计入口。

## 1. 文档目的

本文件曾是 `SRM-MINIMAL` 线程的设计工作台，用于记录最小供应商主档闭环的早期讨论与已确认判断。结论已经回写稳定真相源，本文件不再提供恢复或执行入口。

历史保留内容：

- 记录该轮 SRM 最小主档范围
- 记录已冻结对象、边界与协同规则
- 记录当时的 scope control 与 owner 边界判断

本文件不负责：

- 直接承载 proto、数据库 schema 或代码实现
- 替代 `docs/architecture/services/*.md` 的稳定职责真相
- 替代 `docs/architecture/collaborations/*.md` 的跨服务协同真相
- 冻结采购交易、质量、绩效或商业条款模型

## 2. 历史设计范围

该轮只覆盖以下主题：

- `srm-service` 最小供应商主档闭环
- `party-service` 的 `tenantPartyId` 如何成为正式主体引用
- `item-master-service` 的 `SupplierItemMapping` 与 SRM 的 `SupplierOffering` 如何分层
- 当时规划中的 `procurement-service` 如何消费正式供应商主档，而不是反向定义 SRM 主档

该轮明确不覆盖：

- RFQ
- 采购价格
- MOQ
- 账期
- lead time
- 供应商绩效
- 质量整改
- UI、proto、schema、实现目录

## 3. 冻结对象

- `SupplierProfile`
- `SupplierPartyBinding`
- `SupplierContact`
- `SupplierAddress`
- `SupplierStatus`
- `SupplierCategory`
- `SupplierTag`
- `SupplierOffering`

## 4. 冻结边界

### 4.1 SRM Owns

- `SupplierProfile` 真相
- `SupplierPartyBinding` 真相
- `SupplierContact` 真相
- `SupplierAddress` 真相
- `SupplierStatus` 真相
- `SupplierCategory` 真相
- `SupplierTag` 真相
- `SupplierOffering` 真相

### 4.2 SRM Does Not Own

- Party truth
- Item truth
- `SupplierItemMapping` truth
- 采购单、收货、RFQ
- 采购价格、MOQ、账期、lead time
- 供应商绩效评分
- 质量真相

## 5. 核心规则

### 5.1 SupplierProfile 与 Party

- `SupplierProfile` 的正式主体引用是 `tenantPartyId`
- `ACTIVE SupplierProfile` 必须绑定 `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`

### 5.2 SupplierOffering 与 Item Master

- `SupplierOffering` 表达 `supplierId + itemId` 的“可供应关系事实”
- `ACTIVE SupplierOffering` 只允许挂 `ACTIVE SupplierProfile`
- `ACTIVE SupplierOffering` 只允许指向 `purchasable Item`
- `SupplierOffering` 不承载价格、MOQ、账期、lead time、供应表现

### 5.3 SupplierItemMapping 的继续归属

- `SupplierItemMapping` 继续归 `item-master-service`
- 它只表达：
  - `supplierId + supplierItemCode / supplierItemName -> itemId`
- 不把 `SupplierItemMapping` 扩成采购商业档

## 6. 已确认判断

| 日期 | 判断 | 影响范围 |
| --- | --- | --- |
| 2026-04-27 | `srm-service` 该轮只回写最小供应商主档闭环，不展开 RFQ、价格、MOQ、账期、lead time、绩效或质量整改。 | scope control |
| 2026-04-27 | `SupplierProfile` 的正式主体引用统一使用 `tenantPartyId`。 | SRM / Party boundary |
| 2026-04-27 | `ACTIVE SupplierProfile` 必须绑定 `tenantPartyId`，且同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`。 | invariant |
| 2026-04-27 | `SupplierOffering` 只表达 `supplierId + itemId` 的可供应关系，不表达价格或商业条款。 | SRM / Item / Procurement boundary |
| 2026-04-27 | `SupplierItemMapping` 继续归 `item-master-service`，不升级为采购商业档。 | Item Master boundary |
| 2026-04-27 | 该轮不冻结当时规划中的 `procurement-service` PO / RFQ 对象名。 | procurement contract boundary |

## 7. 退出状态

- 稳定服务真相已回写 [srm-service.md](../../architecture/services/srm-service.md)。
- 跨服务协同以 [srm-procurement-party-item-master.md](../../architecture/collaborations/srm-procurement-party-item-master.md) 为准。
- 黑盒契约以 [SRM contracts](../../contracts/srm-service/README.md) 为准。
- 当前实施范围与状态以 [trusted-grpc-execution-context.md](../features/trusted-grpc-execution-context.md) 为准。
- 本文件不再维护 deferred、next step、proto、权限、lease 或实现指导。

## 8. References

- [srm-service.md](../../architecture/services/srm-service.md)
- [party-service.md](../../architecture/services/party-service.md)
- [item-master-service.md](../../architecture/services/item-master-service.md)
- [srm-procurement-party-item-master.md](../../architecture/collaborations/srm-procurement-party-item-master.md)
- [docs/contracts/item-master-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/README.md)
