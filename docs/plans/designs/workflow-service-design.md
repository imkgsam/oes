# Workflow Service Design Workspace

## 0. 文档控制

```text
designKey: workflow-service-design
designStatus: PAUSED_DESIGN_WORKSPACE
lastUpdatedAt: 2026-05-12 21:50:58 CST
lastUpdatedBy: Codex workflow-service design discussion thread
supersedes: none
conflictResolution: 本文只记录 workflow-service 讨论思路与恢复入口，不是冻结设计；若本文与稳定 architecture / ADR / contracts 冲突，以稳定真相源为准。后续若主控确认结论，应先明确冻结范围，再回写到对应 architecture、collaboration、contract 或 feature packet。
```

## 1. 目标

- 记录本轮 workflow-service 设计讨论中有用的上下文、倾向、争议与待确认问题。
- 为后续重新开启 workflow-service 设计线程提供恢复入口。
- 明确当前内容仍处于 brainstorm / discussion 状态，不作为服务职责、契约或实现依据。

## 2. 当前范围

本 workspace 负责：

- 记录 workflow-service 在 OES 中作为人工审批、人工确认、特批放行与高风险动作确认能力的讨论线索。
- 记录请假审批作为首个应用场景时暴露出的关键需求。
- 记录与 HR、tenant-org、permission、notification、ObjectActivity / ObjectTimeline、业务 owner 服务之间的边界思路。
- 记录后续需要继续讨论的问题。

本 workspace 不负责：

- 冻结 `workflow-service` 服务职责真相。
- 冻结 proto / gRPC / event / database schema。
- 冻结 HR 请假功能 contract。
- 替代 `docs/architecture/services/*.md`、`docs/architecture/collaborations/*.md` 或 `docs/contracts/**`。
- 指导当前实现线程直接编码。

## 3. 涉及对象

- services:
  - future `workflow-service`
  - `hr-service`
  - `tenant-org-service`
  - `permission-service`
  - `identity-service`
  - `notification-service`
  - future ObjectActivity / ObjectTimeline capability
  - future AI / agent orchestration capability
- features:
  - 员工请假审批
  - 采购申请审批
  - 销售特批 / 财务放行
  - WMS 紧急库存重分配审批
  - AI 高风险动作人工确认
- collaborations:
  - `hr-service -> workflow-service`
  - `workflow-service -> permission-service`
  - `workflow-service -> tenant-org-service`
  - `workflow-service -> notification-service`
  - `workflow-service -> ObjectActivity / ObjectTimeline`
  - `workflow-service -> business owner service callback / event`

## 4. 已确认但未冻结的讨论方向

| 日期 | 讨论方向 | 当前理解 | 回写目标 |
| --- | --- | --- | --- |
| 2026-05-12 | workflow-service 第一阶段核心价值 | 主要承接 OES 中跨业务域的人工审批、人工确认、特批放行与高风险动作确认；不是先做完整 BPMN 或纯技术编排引擎。 | future `docs/architecture/services/workflow-service.md` |
| 2026-05-12 | 业务 owner 与 workflow 边界 | workflow 拥有审批过程、任务、意见、历史和结果事实；业务 owner 服务仍拥有业务对象与最终业务状态。 | service card + collaboration |
| 2026-05-12 | 请假作为首个真实场景 | 员工请假适合作为 workflow-service 第一个应用场景，但设计不能变成 HR 专用审批表。 | HR leave feature packet + workflow collaboration |
| 2026-05-12 | 请假审批需要业务主管和 HR | 一线主管最懂现场能否放人，HR 负责制度合规、假种、额度、证明与正式人事记录；普通请假仅由一线主管或仅由 HR 独自审批都不理想。 | HR leave design + workflow definition discussion |
| 2026-05-12 | 第一阶段不能只做 tenant-wide flat approval pool | 审批需要理解业务对象的责任组织，否则工人请假可能被办公室人员审批，部门采购也可能绕过部门负责人。 | workflow approver resolution design |
| 2026-05-12 | 审批按责任组织，而不是物理对象树 | MES site / workshop、WMS warehouse 等物理或执行结构不应被强行塞进 org tree；业务 owner 服务应给出本次审批的 `approvalOrgId` 或责任组织引用。 | tenant-org collaboration + business service cards |
| 2026-05-12 | 有限线性多节点值得继续讨论 | 请假至少暴露出“所属组织责任人 -> HR 最终审核”的顺序审批需求；第一阶段可能需要支持有限线性多节点，而不是完整 BPM。 | workflow-service design |
| 2026-05-12 | 退回修改需要区分于拒绝 | `RETURN_FOR_REVISION` 与 `REJECT` 不是同一语义；请假、采购等业务对象更适合支持退回修改。 | workflow action/state design + HR leave status |
| 2026-05-12 | 退回修改的轻量实现方向 | 倾向于业务对象支持退回修改；每次重新提交创建新的 workflow instance，而不是在同一个 workflow runtime 内做任意节点回退。 | workflow instance lifecycle design |

说明：

- 上表为讨论中暂时认同的方向，不是冻结决定。
- 后续恢复设计时应逐条复核，不能直接当 contract 或 implementation plan 使用。

## 5. 当前讨论出的边界思路

### 5.1 workflow-service 倾向 owns

- 审批 / 确认流程实例。
- 审批任务与当前待办。
- 审批动作，例如同意、驳回、退回修改。
- 审批意见、审批历史、任务处理人、处理时间。
- 流程运行状态与每次提交尝试。
- 审批结果对业务 owner 服务的回传事实或回调记录。

### 5.2 workflow-service 倾向 does not own

- `LeaveRequest`、`PurchaseRequest`、`SalesOrder`、`InventoryReservation`、`PaymentRequest` 等业务对象真相。
- 被审批对象的最终业务状态机。
- 员工任职、组织树、角色、权限、账号、通知投递、timeline 读模型真相。
- MES / WMS 物理现场结构。
- AI 输出的业务判断真相。

### 5.3 请假审批示例草案

当前讨论中的请假审批心智模型：

```text
员工提交请假
  -> 所属组织责任人审批
  -> HR 最终审核
  -> hr-service 正式批准 LeaveRequest
  -> hr-service 创建 EmployeeAvailabilityBlock
```

其中：

- 所属组织责任人负责判断业务现场、部门工作、排班与岗位影响。
- HR 负责假种、额度、证明、制度合规与正式人事记录。
- workflow-service 不直接创建 `EmployeeAvailabilityBlock`。
- `hr-service` 在 workflow 完成后自行决定 `LeaveRequest` 是否进入最终批准状态。

### 5.4 责任组织草案

当前讨论中较重要的区分：

- `tenant-org-service` 的 org tree 表达组织责任结构，例如公司、工厂、部门、车间组织、仓储部门。
- MES / WMS 等服务的 site、workshop、work center、warehouse、zone、location 表达物理或执行结构。
- 业务 owner 服务应根据自身对象与业务语义确定审批责任组织，例如 `approvalOrgId`。
- workflow-service 只消费 `approvalOrgId`，不自行推断 MES / WMS / HR 对象归属。

## 6. 需继续分析的方案点

### 6.1 审批人解析

待分析：

- 按 `approvalOrgId` 从当前组织向上查找审批人是否合理。
- 每个 step 是配置 role、permission，还是配置 approver resolver。
- 找到多个候选审批人时，是任一人处理即可，还是需要 primary approver。
- 找不到审批人时，是阻止提交、允许管理员补配，还是人工兜底选择。

### 6.2 有限线性多节点

待分析：

- 第一阶段是否支持 `steps[]`。
- 第一批模板是否限制在 1-2 个 step。
- 未来扩到 3 个以上线性 step 是否需要提前保留模型空间。
- 不做分支、并行、会签、加签、任意回退、流程设计器时，如何清晰表达非目标。

### 6.3 退回修改

待分析：

- `RETURNED` 是否属于业务对象状态，workflow instance 状态，或两者都需要表达。
- 同一业务对象多次提交时，如何关联多次 workflow instance。
- 重新提交是否总是重新走完整审批链。
- 修改内容是否需要版本快照，以便审计每次审批基于哪个版本。

### 6.4 与 notification-service

待分析：

- workflow 任务分配、超时、审批完成是否通过事件触发 notification。
- 哪些通知需要同步受理，哪些走事件即可。
- notification 不拥有审批真相的边界如何写清。

### 6.5 与 ObjectActivity / ObjectTimeline

待分析：

- workflow 产生哪些关键里程碑投影到 ObjectActivity。
- timeline 只展示审批里程碑，不承接任务分配和审批状态 owner。
- 业务对象页面如何组合 workflow 当前状态、activity timeline 与业务状态。

### 6.6 与 AI 高风险动作

待分析：

- AI confirmation 是否复用普通 workflow task。
- AI 场景是否需要记录模型输出、工具调用、风险理由、人工确认意见。
- AI 高风险动作通过后，是否仍由业务 owner 服务执行最终状态变更。

## 7. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-05-12 | workflow-service 第一阶段到底支持几个节点 | 请假场景显示需要业务主管 + HR，但还未确认其他业务是否也需要同等能力。 | 下次先以请假、采购、WMS、销售各举 1 个真实流程验证。 |
| 2026-05-12 | 审批责任组织如何生成 | 当前只确认 workflow 不应自行推断；具体由 HR / WMS / MES / Procurement 如何传入还未冻结。 | 分别按业务 owner 服务梳理 `approvalOrgId` 来源。 |
| 2026-05-12 | 审批人角色归 permission-service 还是 tenant-org 配置 | 角色、权限、组织责任、岗位负责人边界尚未拆清。 | 对比 role / permission / org assignment 三种解析方式。 |
| 2026-05-12 | HR 请假是否需要 `LeaveRequestAttempt` 或版本快照 | 退回修改与多次 workflow instance 需要审计基线，但对象模型未讨论。 | 后续 HR leave design 单独分析。 |
| 2026-05-12 | HR 是否总是最终审核所有请假 | 当前业务倾向是需要 HR 最终审核，但不同假种、短假、调休是否可例外未讨论。 | 后续以假种和企业制度维度继续问询。 |
| 2026-05-12 | workflow result 回传业务服务采用事件还是 callback | 事件解耦更符合协同规则；callback 可提供更明确受理反馈，但会增加耦合。 | 后续结合 OES event/outbox 基础讨论。 |

## 8. 真相源回写计划

当前没有冻结结论需要立即回写。

后续如恢复并确认，应考虑以下回写目标：

- 服务职责：
  - future `docs/architecture/services/workflow-service.md`
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- 协同蓝图：
  - future `docs/architecture/collaborations/workflow-and-business-services.md`
  - future HR leave workflow collaboration
  - future workflow / notification / object-activity collaboration
- contracts：
  - future `docs/contracts/workflow-service/**`
  - future `docs/contracts/hr-service/leave-request*.md`
- feature packet：
  - future workflow-service foundation
  - future hr leave approval
- architecture / ADR：
  - 如果 workflow-service 与 process manager、task center、notification、ObjectActivity 边界出现分歧，再升级 ADR。

## 9. 恢复入口

下次继续前建议先读：

- [02-bounded-contexts.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/02-bounded-contexts.md)
- [service-collaboration-rules.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/service-collaboration-rules.md)
- [08-notification-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/08-notification-architecture.md)
- [04-ai-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/04-ai-architecture.md)
- [object-activity-and-timeline.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/object-activity-and-timeline.md)
- [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [workflow-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/workflow-service-design.md)

当前推荐下一步：

- 暂停 workflow-service 设计。
- 后续恢复时不要直接从对象模型开始；先继续用 OES 实际场景验证：
  - 产线工人请假
  - 部门采购申请
  - WMS 紧急库存重分配
  - 销售低价 / 超信用额度特批
  - AI 高风险动作人工确认
- 每个场景先回答“谁有业务判断权、谁有制度/治理审核权、业务 owner 如何接收审批结果”，再谈 workflow object model。
