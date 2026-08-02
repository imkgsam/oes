# collaboration-service Contracts

## 1. 目的

本目录用于提供 `collaboration-service` 的黑盒接口文档。

`collaboration-service` 的唯一稳定服务设计真相源是 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md)。本目录只描述黑盒接口、字段、错误与调用语义，不重新定义服务职责、核心对象或长期边界。

Task P1 的 feature packet 是 [collaboration-task-p1.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/collaboration-task-p1.md)。Annotation P1 的 feature packet 是 [collaboration-annotation-p1.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/collaboration-annotation-p1.md)。本目录消费这些 packet 中已冻结的 P1 范围。

这些文档面向：

- `api-gateway`
- `crm-service`
- future `notification-service`
- future ObjectActivity / ObjectTimeline projection
- future workflow / approval capability
- future collaboration modules

阅读目标：

- 理解 `collaboration-service.task` 与 `collaboration-service.annotation` P1 暴露了哪些能力。
- 明确每个接口的请求 / 响应语义。
- 明确上下文、权限、副作用与错误边界。

这些文档不是 proto 副本。

## 2. 模块划分

- [task-command.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/task-command.md)
  - Task P1 手动任务写接口，以及已冻结的 Task Assistant AI exposure、ActionDescriptor、一次性消费与幂等语义。
- [task-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/task-query.md)
  - Task P1 个人任务列表与详情查询接口。
- [annotation-command.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/annotation-command.md)
  - Annotation P1 CrmAccount 对象备注写接口。
- [annotation-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/annotation-query.md)
  - Annotation P1 CrmAccount 对象备注查询接口。

## 3. 全局调用约束

- 所有接口均为内部 gRPC 接口，不对外部客户端直接开放。
- 外部客户端必须通过 `api-gateway` / BFF 消费 task 与 annotation 能力。
- 所有调用方都应把 `collaboration-service` 当作 black box，不依赖其内部实现或数据库结构。
- 查询接口要求：
  - internal service context
  - authenticated operator context
  - trace context
  - 显式 `tenant_id`
- 写接口要求：
  - internal service context
  - authenticated operator context
  - trace context
  - audit context
  - 显式 `tenant_id`

## 4. 当前能力范围

Task P1 只支持：

- private self todo
- assigned task
- manual status lifecycle
- due date and priority
- creator archive for terminal task
- participant-based visibility
- task fact events
- command audit

Task P1 不支持：

- business object binding
- source binding
- auto completion
- workflow integration
- recurrence
- reminder scheduler
- SLA / escalation
- team queue
- org / reporting assignment scope
- project integration
- task batch / campaign
- annotation-on-task
- notification closed loop
- admin / org management views
- physical delete

Annotation P1 只支持：

- `CrmAccount` object notes
- pure text internal notes
- `PRIVATE / OBJECT_VISIBLE`
- author edit / soft delete
- manage pin / unpin / delete any
- local audit
- `CrmAccount` object reference validation

Annotation P1 不支持：

- images / attachments / rich text / mention
- comment thread
- notification closed loop
- ObjectActivity / ObjectTimeline projection
- global Notes center / cross-object Notes search
- object types other than `CrmAccount`
- global Object Registry

## 5. 权限基线

Task P1 只冻结一个显式权限码：

- `collaboration.task.assign`

该权限只控制是否可以创建 `assignee_account_id != operator.account_id` 的任务。

其他操作由 task participant rule 控制，具体见 [task-command.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/task-command.md) 与 [task-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/task-query.md)。

Annotation P1 冻结两个权限语义：

- `collaboration.annotation.create`
- `collaboration.annotation.manage`

作者编辑 / 软删除自己的备注由作者规则控制。读取必须先通过目标 `CrmAccount` 的对象读取权限，再叠加 `PRIVATE / OBJECT_VISIBLE` 可见性。
