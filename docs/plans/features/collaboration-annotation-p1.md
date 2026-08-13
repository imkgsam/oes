# Collaboration Annotation P1

## 1. 目标

- 建立 `collaboration-service.annotation` 第一阶段对象备注能力。
- 在全局 `Collaboration Panel` 中提供 `Notes` tab。
- P1 只接入 `crm-service / CrmAccount`，用于客户对象的内部纯文本备注。
- 冻结 Annotation P1 的边界、可见性、权限、审计、对象引用校验与后置范围。
- 保持 Task、Activity、Audit、Comment、Attachment、Notification 与业务对象 owner 边界清晰。

## 2. 不做什么

- 不支持图片、附件、富文本、Markdown、mention、emoji reaction、模板、AI 总结或改写。
- 不实现 Comment Thread、回复树、外部邮件 / IM 消息。
- 不冻结 Attachment 模块设计。
- 不触发 Notification，不冻结 annotation 公共事件。
- 不接入 ObjectActivity / ObjectTimeline。
- 不建立全局 Notes 中心、跨对象 Notes 搜索或最近备注列表。
- 不支持 `SupplierProfile`、`SalesOrder`、`PurchaseOrder`、MES、WMS 等其他对象。
- 不建立全局 Object Registry。
- 不支持 role-visible、team-visible、org-visible、external-visible 或指定人员共享。
- 不支持个人置顶、Archive、恢复删除或版本 diff 展示。
- 不处理业务对象物理删除后的备注策略。

## 3. 上游依赖

- architecture:
  - [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md)
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
  - [service-collaboration-rules.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/service-collaboration-rules.md)
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
  - [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- related features:
  - [collaboration-task-p1.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/collaboration-task-p1.md)
  - [object-activity-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/object-activity-foundation.md)
- contracts:
  - [annotation-command.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/annotation-command.md)
  - [annotation-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/annotation-query.md)
  - [crm-service/object-reference.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/object-reference.md)
- adr:
  - none for P1

## 4. 当前结论

- `annotation` 是 `collaboration-service` 的模块，不是 Task 的字段，也不是独立服务。
- `Collaboration Panel` 是全局框架 surface，只在已接入协作能力的业务对象详情页可见 / 可用。
- P1 只在 `CrmAccount` 详情页启用 Panel，且 Panel 内只开放 `Notes` tab。
- Annotation P1 是内部对象备注，不是 Task、Activity、Audit、Comment Thread、Attachment、Notification 或业务状态。
- P1 备注是纯文本、多行、无图片、无附件、无 mention、无富文本。
- P1 支持 `PRIVATE` 与 `OBJECT_VISIBLE`；默认 `OBJECT_VISIBLE`。
- P1 支持作者编辑 / 软删除自己的备注。
- P1 支持具备 manage 权限者置顶、取消置顶与软删除他人备注。
- P1 支持多条对象级置顶，排序为置顶优先，组内按创建时间倒序。
- P1 使用白名单 object reference adapter，只允许 `crm-service / CrmAccount`。
- P1 使用 `collaboration-service.annotation` 本地审计，并对齐 OES audit envelope。
- trusted gRPC 迁移保留一个 `DeleteAnnotation` RPC；服务按 verified operator 是否为作者决定作者删除，非作者路径再向 Permission Service 检查 `collaboration.annotation.manage`。
- P1 不冻结公共事件，不依赖 ObjectActivity / ObjectTimeline。

长期职责、对象边界与 deferred 清单以 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md) 为准。

## 5. 契约真相位置

- 服务职责真相：
  - [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md)
- P1 feature packet：
  - 本文
- 后续契约入口：
  - [annotation-command.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/annotation-command.md)
  - [annotation-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/annotation-query.md)
  - [crm-service/object-reference.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/object-reference.md)
- 后续设计工作台：
  - [collaboration-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/collaboration-service-design.md)

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| COLLABORATION-ANNOTATION-ARCH thread | 冻结 Annotation P1 服务边界与 feature packet | `docs/architecture/services/collaboration-service.md`, `docs/plans/features/collaboration-annotation-p1.md`, 必要索引页 | 已确认 Annotation P1 设计 | 服务职责卡更新、feature packet | completed |
| COLLABORATION-ANNOTATION-CONTRACT thread | 冻结 annotation command/query 黑盒契约 | `docs/contracts/collaboration-service/**`, 必要 common proto | 本文与服务职责卡 | annotation contracts | completed |
| CRM-OBJECT-REFERENCE thread | 冻结 / 实现 `CrmAccount` 对象引用校验能力 | `docs/contracts/crm-service/**`, `src/services/business/crm-service/**` | 本文、CRM 职责卡 | object reference validation contract/runtime | contract completed / runtime pending |
| COLLABORATION-ANNOTATION-REALIZATION thread | 实现 `collaboration-service.annotation` P1 runtime 与 API Gateway / Panel 接入 | future `src/services/system/collaboration-service/**`, `src/services/api-gateway/**`, tenant-web framework panel | service card、feature packet、contracts | 可运行实现与验证结果 | pending |
| review / integration thread | 复核 Annotation 是否越界替代 Task、Activity、Audit、Comment、Attachment 或业务 owner | 只读全局，必要时最小文档收口 | 本文、contracts、实现结果 | review 结论 | pending |

## 7. 当前 slice

- slice:
  - `collaboration-annotation-p1`
- scope:
  - global `Collaboration Panel` surface
  - `Notes` tab
  - `CrmAccount` object notes
  - pure text internal notes
  - `PRIVATE / OBJECT_VISIBLE`
  - author edit / soft delete
  - manage pin / unpin / delete any
  - local audit
  - `CrmAccount` object reference validation
- ready definition:
  - 服务职责卡已更新
  - P1 feature packet 已创建
  - 后续 contract 线程可以不重新讨论 Annotation 是否应支持附件、图片、mention、ObjectTimeline 或任意对象

## 8. 主线范围

- 本线程主线：
  - Annotation P1 对象备注能力。
- 本线程不做：
  - Deferred 清单中的所有能力。
- 偏移返回条件：
  - 如果讨论转向 attachment、mention、comment thread、notification、ObjectTimeline、AI summary、通用 object registry 或非 CRM 对象接入，应迁入对应新线程或 `collaboration-service-design.md` 的开放问题，不继续扩写 P1。

## 9. 阻塞 / 依赖

- Annotation command/query runtime 尚未实现。
- `CrmAccount` 对象引用校验 runtime 尚未实现。
- Annotation create / manage 权限码尚未进入 permission code source 与运行时 catalog。
- 全局 `Collaboration Panel` 前端 surface 尚未实现。
- API Gateway / BFF 的外部 annotation API 尚未冻结。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-18 | Annotation 是否支持图片、附件和富文本 | `Deferred` | 不影响 P1 | 等 Asset / Attachment 边界单独冻结后再扩展 | future attachment / annotation-rich-content feature | open |
| 2026-06-18 | Attachment 是否属于 collaboration-service 模块或独立服务 | `Deferred` | 不影响 P1 | 后续根据对象附件、文档中心、合同版本等需求单独设计 | future attachment design | open |
| 2026-06-18 | Annotation 是否投影到 ObjectActivity / ObjectTimeline | `Deferred` | 不影响 P1 | ObjectTimeline 后置；P1 Panel 直接展示 Notes | future object-activity realization | open |
| 2026-06-18 | Annotation 是否触发 Notification | `Deferred` | 不影响 P1 | mention / follower / notification 需求出现后冻结事件与通知规则 | future annotation notification feature | open |
| 2026-06-18 | Annotation 是否接入 `SupplierProfile`、`SalesOrder`、`PurchaseOrder`、MES、WMS | `Deferred` | 不影响 P1 | 按对象成熟度逐个白名单接入 | future object-specific annotation slices | open |
| 2026-06-18 | 是否建立全局 Object Registry | `Deferred` | 不影响 P1 | 多对象接入规模扩大后再评估 | future object reference governance | open |

## 11. 验收标准

- 已在 `collaboration-service` 职责卡中冻结 Annotation P1 owns / does-not-own。
- 已明确 P1 只接入 `CrmAccount`。
- 已明确 Panel 是全局 surface，但 P1 只在支持对象页面启用。
- 已明确 Annotation P1 不支持图片、附件、富文本、mention、Comment Thread、Notification 或 ObjectTimeline。
- 已明确 P1 可见性为 `PRIVATE / OBJECT_VISIBLE`。
- 已明确 P1 权限语义为 create / manage，作者规则处理自有编辑与软删除。
- 已明确 P1 使用白名单 object reference adapter，通过 `crm-service` 校验 `CrmAccount` 存在性和访问许可。
- 已明确 P1 使用本地审计并对齐 OES audit envelope。
- 已明确 deferred 清单，后续线程不得把 deferred 能力当作 P1 已承诺范围。

## 12. 关闭条件

- Annotation command/query contracts 已冻结并与服务职责卡对齐。
- `CrmAccount` object reference validation contract/runtime 已冻结并可用。
- runtime 实现与 contracts 对齐。
- audit 验证覆盖 P1 commands。
- API Gateway / BFF 对外入口对齐现有服务框架。
- tenant-web 全局 `Collaboration Panel` 在 `CrmAccount` 页面按支持对象启用。
- P1 验证通过后，本 feature packet 标记为 completed。

## 13. 备注

- 本 feature packet 不替代 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md)。
- 后续若 Annotation P2 设计冻结，应优先更新服务职责卡，并为对应 slice 新建 feature packet。
