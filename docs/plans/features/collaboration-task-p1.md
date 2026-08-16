# Collaboration Task P1

## 1. 目标

- 建立 `collaboration-service.task` 第一阶段手动任务能力。
- 支持租户内 private self todo 与有权限的 assigned task。
- 以最小范围冻结 Task P1 的状态机、命令、查询、权限、审计与事件。
- 为后续业务对象绑定、workflow、recurrence、team queue、SLA、annotation-on-task 与 notification 协同预留边界，但不在 P1 实现。

## 2. 不做什么

- 不绑定 CRM、SRM、HR、Finance、Sales、Procurement、MES、WMS 等业务对象。
- 不实现 `sourceBinding`、自动完成或业务事件监听。
- 不实现 workflow / approval human task 集成。
- 不实现 recurrence、reminder、due soon / overdue scheduler。
- 不实现 SLA / escalation。
- 不实现 team queue、组织层级委派、汇报线委派或项目任务。
- 不实现 task batch / campaign。
- 不实现 annotation-on-task、评论、附件或 mention。
- 不实现 notification-service 投递闭环。
- 不实现管理视图、组织视图或全租户任务视图。
- 不支持物理删除任务。

## 3. 上游依赖

- architecture:
  - [collaboration-service.md](../../architecture/services/collaboration-service.md)
  - [service-collaboration-rules.md](../../architecture/system/service-collaboration-rules.md)
  - [authorization-layering-and-resource-policy.md](../../architecture/platforms/authorization-layering-and-resource-policy.md)
  - [observability-and-audit.md](../../architecture/platforms/observability-and-audit.md)
- services:
  - [permission-service.md](../../architecture/services/permission-service.md)
  - [identity-service.md](../../architecture/services/identity-service.md)
- collaborations:
  - future collaboration / notification design
  - future collaboration / object-activity design
- contracts:
  - [task-command.md](../../contracts/collaboration-service/task-command.md)
  - [task-query.md](../../contracts/collaboration-service/task-query.md)
- adr:
  - none for P1

## 4. 当前结论

- `collaboration-service` 是独立服务，`task` 是第一模块。
- P1 只实现 manual task。
- P1 支持 self todo 与 assigned task。
- `CreateTask` 使用入口 Code `collaboration.task.create`；`collaboration.task.assign` 仍只在 service 层按 assignee 条件检查。
- P1 状态为 `OPEN / IN_PROGRESS / COMPLETED / CANCELLED`。
- P1 通过 `dueAt` 派生 overdue，不把 overdue 建模为状态。
- P1 支持 creator 归档终态任务，不支持 delete。
- P1 每个 command 写 audit。
- P1 本地事务成功后发布 task fact events。
- trusted gRPC 迁移保留一个 `CreateTask` RPC，不拆 self todo / assigned task；verified ET 建立基础入口后，Collaboration 按 assignee 调 Permission Service 做条件授权。

长期职责、对象模型与 deferred 清单以 [collaboration-service.md](../../architecture/services/collaboration-service.md) 为准。

## 5. 契约真相位置

- 服务职责真相：
  - [collaboration-service.md](../../architecture/services/collaboration-service.md)
- P1 feature packet：
  - 本文
- 后续契约入口：
  - [task-command.md](../../contracts/collaboration-service/task-command.md)
  - [task-query.md](../../contracts/collaboration-service/task-query.md)
- 后续设计工作台：
  - [collaboration-service-design.md](../designs/collaboration-service-design.md)

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| COLLABORATION-ARCH thread | 冻结服务职责与 Task P1 feature packet | `docs/architecture/services/collaboration-service.md`, `docs/plans/features/collaboration-task-p1.md`, `docs/plans/designs/collaboration-service-design.md`, 必要索引页 | 已确认 Task P1 设计 | 服务职责卡、feature packet、workspace | completed |
| COLLABORATION-CONTRACT thread | 冻结 task command/query 黑盒契约 | `docs/contracts/collaboration-service/**` | 本文与服务职责卡 | task contracts | completed |
| COLLABORATION-REALIZATION thread | 实现 `collaboration-service.task` P1 runtime | future `src/services/system/collaboration-service/**`, `src/services/api-gateway/**`, common generated contracts | service card、feature packet、contracts | 可运行实现与验证结果 | pending |
| review / integration thread | 复核 Task 是否越界替代 workflow、notification、annotation 或业务对象 owner | 只读全局，必要时最小文档收口 | 本文、contracts、实现结果 | review 结论 | pending |

## 7. 当前 slice

- slice:
  - `collaboration-task-p1`
- scope:
  - manual task
  - private self todo
  - assigned task by `collaboration.task.assign`
  - participant visibility
  - status lifecycle
  - dueAt / priority
  - archive terminal task by creator
  - audit
  - task fact events
  - `ListTasks` scopes: `MY_TODO / ASSIGNED_TO_ME / CREATED_BY_ME`
- ready definition:
  - 服务职责卡已创建
  - P1 feature packet 已创建
  - 后续 contract 线程可以不重新讨论 Task 是否应绑定业务对象或是否应内建 annotation

## 8. 主线范围

- 本线程主线：
  - Task P1 手动待办能力。
- 本线程不做：
  - Deferred 清单中的所有能力。
- 偏移返回条件：
  - 如果讨论转向 annotation、notification、workflow、project、team queue 或业务对象自动完成，应迁入对应新线程或 `collaboration-service-design.md` 的开放问题，不继续扩写 P1。

## 9. 阻塞 / 依赖

- `collaboration-service` runtime 尚未建立。
- `collaboration.task.assign` 权限码尚未进入 permission code source 与运行时 catalog。
- API Gateway / BFF 的外部 task API 尚未冻结。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-14 | Task 与业务对象的 `primaryObjectRef / sourceBinding / auto completion` | `Blocker-Later` | 不影响 P1 手动任务 | 后续单独冻结业务对象联动 slice | `collaboration-service-design.md` / future feature packet | open |
| 2026-06-14 | Task 与 workflow human task / approval task 的关系 | `Blocker-Later` | 不影响 P1 手动任务 | 等 workflow 设计恢复后协同冻结 | future workflow collaboration | open |
| 2026-06-14 | Task 过程备注是否由 annotation-on-task 承接 | `Blocker-Later` | 不影响 P1 | annotation 线程单独设计 | future annotation design / contract | open |
| 2026-06-14 | TaskAssigned 如何触发通知 | `Blocker-Later` | P1 只发布事件，不要求通知闭环 | notification 线程单独设计 | future notification collaboration | open |
| 2026-06-14 | 组织层级、汇报线与 team queue 委派范围 | `Blocker-Later` | P1 使用粗粒度 assign 权限 | 等 HR reporting line / org scope 成熟后扩展 | future task assignment scope feature | open |

## 11. 验收标准

- 已建立 `collaboration-service` 服务职责真相源。
- 已明确 Task P1 owns / does-not-own。
- 已明确 Task P1 不绑定业务对象、不监听业务事件、不自动完成。
- 已冻结 Task P1 字段、状态、命令、查询、权限、审计与事件。
- 已明确 `collaboration.task.create` 为入口 Code，`collaboration.task.assign` 为条件指派 Code。
- 已明确 P1 不支持 delete，终态任务通过 creator archive 收口。
- 已明确 deferred 清单，后续线程不得把 deferred 能力当作 P1 已承诺范围。

## 12. 关闭条件

- `collaboration-service` task command/query contracts 已冻结并与服务职责卡对齐。
- runtime 实现与 contracts 对齐。
- audit 与 event 验证覆盖 P1 commands。
- API Gateway / BFF 对外入口对齐现有服务框架。
- P1 验证通过后，本 feature packet 标记为 completed。

## 13. 备注

- 本 feature packet 不替代 [collaboration-service.md](../../architecture/services/collaboration-service.md)。
- 后续若 Task P2 设计冻结，应优先更新服务职责卡，并为对应 slice 新建 feature packet。
