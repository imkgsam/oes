# finance-service Payable Management API

## 1. 模块职责

本文件冻结 `PaymentManagementService` 中 payable-side command 的黑盒语义：应付计划建立，以及来自 `PurchaseOrderChange` 的应付计划调整。

## 2. 通用上下文要求

所有当前 management command 都按 [Finance trusted gRPC baseline](README.md#6-security--context-baseline) 执行；tenant、org scope、operator、trace 与 audit identity 只来自 trusted context，以下 request 表只列业务 payload。

## 3. 写入基线语义

### 3.1 `PayableSchedule` 真相边界

- `PayableSchedule` 是 Finance 拥有的应付计划真相
- phase 1B 默认一个已发 `PO` 对应一个 `PayableSchedule`
- 多条 `PayableScheduleLine` 用于表达定金、尾款、分期与账期
- `PaymentRequest` 只是付款治理入口，不得替代 `PayableSchedule`

### 3.2 `PurchaseOrder` 来源边界

- `CreatePayableScheduleFromPurchaseOrder` 只消费 Procurement 已成立的 `PurchaseOrder` 事实
- Finance 不接管 `PurchaseOrder` owner truth
- Procurement 不直接写 Finance 的 schedule 状态

### 3.3 `PurchaseOrderChange` 调整边界

- `ApplyPayableScheduleAdjustmentFromPurchaseOrderChange` 只允许：
  - 追加新 schedule line
  - 取消未执行 schedule line
  - supersede 未执行 schedule line
- 已付款、已执行或已核销历史不得静默改写
- 所有调整都必须保留稳定 `source_ref`

## 4. RPC 语义

### `CreatePayableScheduleFromPurchaseOrder`

- 作用：基于已发 `PurchaseOrder` 的受控摘要建立应付计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_order_id` | 是 | 来源 `PurchaseOrder` 标识 |
| `purchase_order_no` | 否 | 来源 `PO` 编号摘要 |
| `procurement_snapshot_reference` | 否 | Procurement 交易快照引用摘要 |
| `supplier_tenant_party_id` | 是 | 供应商主体引用 |
| `supplier_snapshot` | 是 | 供应商显示名摘要 |
| `currency_code` | 是 | 交易币种 |
| `lines[]` | 是 | 应付计划行集合 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `line_type` | 是 | `DEPOSIT / BALANCE / INSTALLMENT / TERM_DUE` |
| `source_ref` | 是 | 来源 `PO` 的稳定引用 |
| `due_date` | 是 | 到期日 |
| `scheduled_amount` | 是 | 应付计划金额 |
| `source_purchase_order_line_id` | 否 | optional 来源采购行引用 |
| `memo` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule` | 新建后的 `PayableSchedule` |

关键语义：

- 成功创建的是应付计划，不是付款申请
- phase 1B 正常路径必须可回溯到 `PO`
- 同一租户下同一已发 `PO` 默认只允许一个活动 `PayableSchedule`

### `ApplyPayableScheduleAdjustmentFromPurchaseOrderChange`

- 作用：基于 `PurchaseOrderChange` 调整既有应付计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_order_id` | 是 | 来源 `PurchaseOrder` 标识 |
| `purchase_order_change_id` | 是 | 来源 `PurchaseOrderChange` 标识 |
| `procurement_snapshot_reference` | 否 | 变更后的 Procurement 快照引用摘要 |
| `change_reason` | 否 | optional 变更原因摘要 |
| `adjustments[]` | 是 | 本次应付计划调整集合 |

`adjustments[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `action` | 是 | `ADD / CANCEL_UNEXECUTED / SUPERSEDE_UNEXECUTED` |
| `target_source_ref` | 否 | 取消或 supersede 时指向既有 schedule line 的稳定来源引用 |
| `new_source_ref` | 否 | 追加或 supersede 后新 line 的稳定来源引用 |
| `line_type` | 否 | `ADD / SUPERSEDE_UNEXECUTED` 时必填 |
| `due_date` | 否 | `ADD / SUPERSEDE_UNEXECUTED` 时必填 |
| `scheduled_amount` | 否 | `ADD / SUPERSEDE_UNEXECUTED` 时必填 |
| `source_purchase_order_line_id` | 否 | optional 来源采购行引用 |
| `memo` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule` | 调整后的 `PayableSchedule` |

关键语义：

- 只允许基于已存在的 `PayableSchedule` 执行调整
- `CANCEL_UNEXECUTED` 与 `SUPERSEDE_UNEXECUTED` 只允许作用于尚未执行、尚未核销的 line
- 若目标 line 已存在未取消 / 未拒绝的付款申请、付款执行或核销历史，服务必须拒绝原地取消或 supersede
- 若变更只影响未来未付款部分，Finance 应通过追加新 line 表达 delta，而不是覆盖历史 line
- 所有新增或 supersede line 都必须保留与 `PO / PO change` 的 `source_ref` 追溯关系

## 5. 错误语义

phase 1B payable management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、金额非法、调整动作非法或字段组合冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 exact-audience HUMAN WEB ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有执行该 tenant / org / command 的权限 |
| `NOT_FOUND` | 目标 `PurchaseOrder`、`PurchaseOrderChange`、`PayableSchedule` 或来源引用不存在 |
| `ALREADY_EXISTS` | 尝试为同一活动 `PO` 重复创建 payable schedule，或重复应用同一变更结果 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不允许执行命令，例如对未发 `PO` 建计划、对已执行 line 做取消 / supersede |
| `UNAVAILABLE` | 当前服务或必要下游依赖暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |
