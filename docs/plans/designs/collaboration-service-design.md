# Collaboration Service Design Workspace

## 0. 文档控制

```text
designKey: collaboration-service-design
designStatus: PAUSED_DESIGN_WORKSPACE
implementationStatus: TASK_P1_IMPLEMENTED_DESIGN_DEFERRED
lastUpdatedAt: 2026-06-17 00:00:00 CST
lastUpdatedBy: Codex collaboration-service design discussion thread
supersedes: none
truthSource: docs/architecture/services/collaboration-service.md; docs/plans/features/collaboration-task-p1.md
doNotUseAsStableSource: true
conflictResolution: 本文已退出 active 设计状态，只作为 collaboration-service / task 设计过程记录与未来恢复入口；已冻结结论以 truthSource 中列出的稳定服务职责卡、feature packet 与 contracts 为准。若本文与稳定 architecture / ADR / contracts 冲突，以稳定真相源为准。
```

## 1. 目标

- 记录 `collaboration-service` 后续设计讨论的恢复入口。
- 避免 Task P2、annotation、notification、workflow、project、team queue 等议题混入 Task P1 feature packet。
- 将已冻结 Task P1 结论指向稳定真相源，而不是在 workspace 中重复维护第二份设计正文。

## 2. 当前范围

本 workspace 负责：

- 记录 `collaboration-service` 后续模块与后续 task slice 的开放问题。
- 记录已确认但尚未进入稳定文档的设计方向。
- 记录未来需要回写到哪些服务职责、协同蓝图、contract 或 feature packet。

本 workspace 不负责：

- 替代 [collaboration-service.md](../../architecture/services/collaboration-service.md)。
- 替代 [collaboration-task-p1.md](../features/collaboration-task-p1.md)。
- 冻结 annotation、comment、notification、workflow 或 project 的长期设计。
- 记录 contracts 正文、proto 字段或数据库结构。
- 指导当前实现线程直接编码。

## 3. 涉及对象

- services:
  - `collaboration-service`
  - future `notification-service`
  - future `workflow-service`
  - `permission-service`
  - `identity-service`
  - `hr-service`
  - `tenant-org-service`
- features:
  - `collaboration-task-p1`
  - future task business object binding
  - future task source binding and auto completion
  - future annotation-on-task
  - future team queue
  - future recurrence and reminder
  - future SLA and escalation
  - future project integration
- collaborations:
  - task / notification
  - task / workflow
  - task / annotation
  - task / object-activity
  - task / HR and org assignment scope

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-14 | 建立独立 `collaboration-service`，`task` 为第一模块。 | service boundary | [collaboration-service.md](../../architecture/services/collaboration-service.md) |
| 2026-06-14 | Task P1 只做 manual task，不绑定业务对象、不监听业务事件、不自动完成。 | task P1 scope | [collaboration-task-p1.md](../features/collaboration-task-p1.md) |
| 2026-06-14 | P1 支持 private self todo 与 assigned task；指派他人需要 `collaboration.task.assign`。 | authorization | service card + feature packet |
| 2026-06-14 | P1 状态为 `OPEN / IN_PROGRESS / COMPLETED / CANCELLED`，`OVERDUE` 只作为 dueAt 派生。 | task lifecycle | service card + feature packet |
| 2026-06-14 | P1 不内建 progress note，任务过程备注由 future annotation-on-task 承接。 | task / annotation boundary | service card + future annotation design |
| 2026-06-14 | P1 终态任务可由 creator archive；不支持 delete。 | task lifecycle | service card + feature packet |

## 5. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-14 | Task 如何与业务对象绑定 | P1 明确后置；不同业务对象需要 owner ref、跳转、权限与生命周期规则。 | 后续设计 `primaryObjectRef / relatedObjectRefs`。 |
| 2026-06-14 | Task 如何通过 source binding 自动完成 | 签名、文件提交、审批等需要一人一事的动作要求实例，不能让 task-service 猜业务事件。 | 后续设计 `sourceBinding / completionMode / completion signal`。 |
| 2026-06-14 | Workflow human task 是否复用 Task | workflow 设计尚未恢复，审批节点、意见、流程状态 owner 未冻结。 | workflow 线程恢复后做 task/workflow collaboration。 |
| 2026-06-14 | Annotation-on-Task 如何表达过程备注 | annotation 是独立模块设计，不能在 Task P1 中提前冻结。 | annotation 线程单独设计 object note / annotation。 |
| 2026-06-14 | TaskAssigned 如何触发通知 | notification-service 仍需单独重审边界。 | notification 线程从定位与服务边界开始确认。 |
| 2026-06-14 | 团队队列、组织范围、汇报线委派如何做 | 当前 HR 有 employee/employment/org 归属，但 reporting line 未冻结。 | 后续依赖 HR / tenant-org / permission 协同。 |
| 2026-06-14 | recurrence、reminder、SLA、escalation 是否属于 task | 这些涉及调度、日历、提醒、升级策略，P1 后置。 | 后续拆成独立 slice 或协同能力。 |
| 2026-06-14 | project 是否属于 collaboration-service | project 是更大协作容器，不是 task；需求尚未冻结。 | 后续单独讨论 project / work management。 |

## 6. 真相源回写计划

- 服务职责：
  - [collaboration-service.md](../../architecture/services/collaboration-service.md)
- 协同蓝图：
  - future task / notification collaboration
  - future task / workflow collaboration
  - future task / annotation collaboration
- contracts：
  - [task-command.md](../../contracts/collaboration-service/task-command.md)
  - [task-query.md](../../contracts/collaboration-service/task-query.md)
- feature packet：
  - [collaboration-task-p1.md](../features/collaboration-task-p1.md)
  - future task P2 business-linked feature packet
  - future annotation feature packet
- architecture / ADR：
  - 若 `collaboration-service` 与 workflow、notification、annotation 或 project 边界出现关键取舍分歧，再升级 ADR。

## 7. 恢复入口

下次继续前先读：

- [collaboration-service.md](../../architecture/services/collaboration-service.md)
- [collaboration-task-p1.md](../features/collaboration-task-p1.md)
- [task-command.md](../../contracts/collaboration-service/task-command.md)
- [task-query.md](../../contracts/collaboration-service/task-query.md)
- [service-collaboration-rules.md](../../architecture/system/service-collaboration-rules.md)
- [authorization-layering-and-resource-policy.md](../../architecture/platforms/authorization-layering-and-resource-policy.md)
- [observability-and-audit.md](../../architecture/platforms/observability-and-audit.md)
- [object-activity-and-timeline.md](../../architecture/collaborations/object-activity-and-timeline.md)

当前推荐下一步：

- 若未来继续 Task 后续设计：新开或恢复 Task P2 设计线程，优先讨论业务对象绑定、source binding、自动完成、team queue、recurrence 与 SLA。
- annotation、notification、project 分别由独立设计线程承接，不在本文继续扩写。
- 本 workspace 在重新明确设计目标前不得作为 active 入口继续维护。

## 8. 收口记录

| 日期 | 收口事项 | 说明 |
| --- | --- | --- |
| 2026-06-17 | Task P1 设计线程收口 | Task P1 已冻结并由实现线程完成；本 workspace 退出 active 状态，后续 Task P2/P3 设计后置。 |
