# srm-service Internal Eligibility Query API

## 1. 目的与调用边界

`SrmInternalQueryService` 只向 Procurement 暴露标准 Item 进入 PO 所需的两个 SRM-owned 资格事实，避免 Procurement 复用面向 Gateway 页面展示的宽 BUSINESS 查询。

- 两个 RPC 均为 `INTERNAL / HUMAN_OBO`
- audience 固定为 `urn:oes:service:srm-service`
- subject 必须是 verified HUMAN；`act` 必须是 exact `procurement-service` SYSTEM MACHINE workload
- tenant 随 HUMAN subject 进入 target ET，request/body/local metadata 不携带或决定 tenant authority
- direct HUMAN、pure MACHINE root、DELEGATED、TENANT MACHINE、错误 workload/audience/Code/certificate 全部 fail closed
- Procurement 自身 trusted inbound 迁移完成前，caller 只能 `PREPARED_NOT_ACTIVATED`

## 2. `ResolveActiveSupplier`

- Code：`srm.internal.supplier_profile.resolve_active`
- request：`supplier_id=1`
- response：`supplier_id=1`、`display_name=2`、`status=3`
- `NOT_FOUND`：当前 tenant 内目标 SupplierProfile 不存在
- `FAILED_PRECONDITION`：目标存在但不是 `ACTIVE`
- success：只返回 Procurement 建立受控引用所需的最小 Supplier 摘要

## 3. `ResolveActiveSupplierOffering`

- Code：`srm.internal.supplier_offering.resolve_active`
- request：`supplier_id=1`、`item_id=2`
- response：`supplier_offering_id=1`、`supplier_id=2`、`item_id=3`、`status=4`
- `NOT_FOUND`：exact `supplier_id + item_id` offering 不存在
- `FAILED_PRECONDITION`：offering 存在但不是 `ACTIVE`，或 owner rule 所需的 SupplierProfile 不再 active
- success：只返回 exact active offering 引用，不返回目录页、价格、MOQ、lead time 或采购条款

## 4. 审计与禁止项

- Auth OBO exchange 保留 HUMAN subject，并从 deployment-owned workload policy 选择 Procurement actor；caller 不提交 actor。
- target ET 的 `exp` 不超过 subject ET，且 subject `jti -> target jti` 与 actor/workload 归因必须可审计。
- 不允许 dual-mode、legacy metadata/body fallback、caller-selected capability、通用搜索或新的 SRM 业务规则。
- 后台任务没有 HUMAN subject 时不使用本契约；该场景 deferred 到独立设计。
