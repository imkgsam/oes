# OES Codex Global Command Model

## 1. 目的

本文档冻结 OES Codex 多小组协作的顶层组织模型。它定义 Global Command Thread、方向管理 thread、设计 thread、实现 thread、debug thread 与 integration thread 的职责边界。

核心目标是让 OES 像大型团队一样推进，而不是让多个 Codex thread 无差别修改代码。

能力级协同的显式启用、Design Thread 与 Capability Command 一对一关系、branch/worktree 隔离、integration candidate、批量验收及关闭规则，以 [`oes-capability-collaboration-framework.md`](./oes-capability-collaboration-framework.md) 为唯一治理真相源。

## 2. Global Command Thread 红线

Global Command Thread 只负责项目级规划、调度、依赖编排与冲突协调。

Global Command Thread 可以做：

- 维护 OES 全局 roadmap、能力依赖图、thread control board 与 capability 级 branch/worktree 汇总；子任务详细 registry 由对应 Capability Command 独占
- 对新需求做项目级 intake，判断候选能力域、候选 owner group、疑似依赖与优先级
- 未启用能力框架时，按普通项目流程创建或调整 design / implementation / debug / integration task
- 用户显式启用能力框架后，只创建并登记该 capability 的 Design Thread 与 Capability Command
- 协调 ownership 冲突、优先级冲突与跨组阻塞
- 通过已登记 Command 的 terminal 主动拉取能力级汇总，并决定是否更新全局计划、创建新的 capability 配对或调整跨能力调度

Global Command Thread 明确禁止：

- 不做服务级设计
- 不做功能级设计讨论
- 不定义领域对象、状态机、字段、API、proto、事件或数据库 schema
- 不定义权限语义、租户模型、operator context 或 AI tool 协议细节
- 不写业务代码
- 不 debug 具体服务问题
- 不替代 design thread 决定最终服务归属
- 不替代 implementation thread 修改实现
- 能力框架启用后，不创建、恢复、验收或指挥对应 Capability Command 下的 Implementation、Focused Review、Acceptance 或 Integration Thread
- 不读取这些子任务终态后替 Capability Command 裁定 gate、返工或解锁下游

新功能 intake 只能输出：

- proposed capability area
- candidate owner group
- suspected dependencies
- required design thread
- required architecture / contract sources to inspect
- priority class
- collision risks

新功能 intake 不能输出：

- final service placement
- final domain model
- final workflow
- final schema
- final API / event contract

## 3. 组织层级

OES Codex 协作采用四层结构：

1. Global Command Thread
   - 只做全局设计规划、调度、依赖与冲突管理
2. Management Threads
   - 管理单个方向的小组任务，例如 Foundation Platform、Customer & Growth、Collaboration、Manufacturing、Supply Chain、Experience Surface、AI Automation、Integration & Verification
3. Worker Threads
   - design / implementation / debug / integration / review 等具体执行 thread
4. Subagents
   - 只在被父 thread 内部临时调用时作为辅助；如果独立写文件、独立 debug 或独立交付，必须注册为 child thread

对于已显式启用的单一能力域，Management Thread 的职责由一个与 Design Thread 一对一配对的 Capability Command 承担；多个能力域可以并行建立各自的配对。未显式启用时，不得自动创建这组线程。

框架启用后的排他控制链、任务命名、监控恢复、branch/worktree 和紧急接管规则，以 `oes-capability-collaboration-framework.md` 为准。Global Command 只能恢复或替换失联的 Capability Command，不能穿透接管其子任务；任何紧急穿透必须由用户明确授权。

## 4. 小组方向

初始方向管理小组如下：

- Foundation Platform Group：auth、identity、permission、tenant-org、party、audit、operator context、event bus、contracts
- Customer & Growth Group：CRM、sales、marketing、Chrome browser plugin customer workflow
- Collaboration Group：IM、email、notification、inbox、task collaboration
- Manufacturing Group：MES、APS、production process、shop-floor workflow
- Supply Chain Group：WMS、SRM、procurement、inventory、logistics
- Experience Surface Group：web app shell、employee mini-program、admin portal、display website、BFF、gateway exposure
- AI Automation Group：AI tool protocol、retrieval、approval、cost control、agent workflow
- Integration & Verification Group：cross-service integration、E2E、smoke、release readiness

## 5. 单写者规则

共享计划文件不得由多个 active thread 同时写入。

默认 owner：

- `docs/plans/oes-global-roadmap.md`：Global Command Thread
- `docs/plans/oes-thread-control-board.md`：Global Command Thread
- `docs/plans/oes-capability-dependency-map.md`：Global Command Thread
- `docs/governance/**`：Global Command 或明确授权的 governance design thread
- `docs/plans/groups/<group-key>/**`：对应 Management Thread
- `docs/plans/designs/<design-key>.md`：对应 Design Thread
- `docs/plans/features/<feature-key>.md`：对应 feature owner
- `docs/contracts/**`：对应 Contract Thread
- `docs/architecture/services/<service-name>.md`：对应服务 design thread 在冻结结论后更新

其他 thread 只能读取这些文件；框架启用后把结构化 handoff 留在自身 terminal，由注册 owner 主动拉取变更、阻塞与失败。

## 6. Handoff 规则

每个正式 thread 完成、阻塞或失败时，必须提交结构化 handoff。

handoff 使用最小格式，必须包含：

- Thread、Parent、State
- Branch、Worktree、Base、HEAD、Dirty
- Changed paths
- Verification
- Blocker/dependency（如有）
- Cleanup state
- contract/data/permission/security impact 仅在非 `none` 时填写

框架未启用时，Global Command 可以按普通流程消费下级 handoff。框架启用后，Implementation、Focused Review、Acceptance 与 Integration Thread 只向对应 Capability Command 回传；Global Command 只根据 Capability Command 的能力级汇总更新全局 roadmap、依赖图与调度状态。

框架启用后的 handoff 不采用主动消息推送：下级线程把结构化结果留在自己的 terminal，由注册 parent 在恢复时依据 registry 和 cursor 拉取并串行消费。Global Command 只拉取 Capability Command 的 capability-level terminal；Capability Command 只拉取配对 Design 与自身 I/R/V/X terminal。自动线程不得向 `ACTIVE` target 发送 handoff 或控制消息。

Parent 派发 child 后可以进入稳定 `WAITING_FOR_CHILD` 并结束 turn，不持续占用会话。Global Command registry 只保存 capability state、跨能力依赖、candidate/main SHA、cleanup state 与 A/C cursor；子任务详细 registry 由 A/C 独占。多个 terminal 同时 ready 时一次只处理一个，其余保留在来源 terminal。

项目禁止 per-command watchdog。只允许一个附着于 Global Command 的轻量状态检查器。GC runtime registry 对每个 capability 至少保存 `commandThreadId`、`currentObservedThreadId`、`lastObservedRevision` 和 `lastNotifiedApprovalRevision`；检查器只读取当前 observed route 的 status/revision，变化时只唤醒注册的直接 parent，不读取 terminal 正文、不裁定 gate、不创建任务、不修改 Git，也不形成 Inbox。A/C 报告 `WAITING_FOR_CHILD` 时由 GC 登记 child；checker 唤醒 A/C 后观察目标切回 A/C，GC 消费 capability terminal 后再更新或清空 route。禁止无路由地轮询或唤醒全部 Command；同一审批 revision 只通知一次，所有 capability 稳定后检查器自动停用。

Capability 交付并 push main 后，A/C 自动 archive 已消费完成的 I/R/V/X 并把详细 registry 压缩为 cleanup manifest；Git branch/worktree 仍等待用户批准后才删除。清理完成后 GC 只保留 capability、main SHA、验证与关闭时间的不可变摘要。

## 7. 冲突升级

任意 thread 触碰以下未在冻结设计/feature packet 与已分配 ownership 内的情况必须停止并向当前 owner 上报：

- 需要修改 shared proto
- 需要修改 `src/common`
- 需要修改 permission model
- 需要修改 tenant / operator context
- 需要修改 API Gateway 公共入口
- 需要修改 lockfile 或根 `package.json`
- 两个 thread 需要写同一个核心文件
- 设计结论影响其他服务 truth source

普通流程由 Global Command 或对应 Management Thread 决定串行、拆分或升级 ADR。能力框架启用后，Capability Command 先区分：设计/契约缺口直接回 Design Thread；capability 内部拆分、返工和 gate 由自身处理；只有跨能力依赖、全局优先级或未分配/冲突的共享 ownership 才升级 Global Command。

Global Command 对升级只决定 owner capability、优先级、执行顺序、路径 ownership/lease、前置 gate、暂停/恢复状态和 return target。实际 I/R/V/X 仍由获授权的 Capability Command 创建和管理；Global Command 不下发字段、schema、payload、handler、测试实现、lane gate 或 worker 返工细节。
