# OES Codex Global Command Model

## 1. 目的

本文档冻结 OES Codex 多小组协作的顶层组织模型。它定义 Global Command Thread、方向管理 thread、设计 thread、实现 thread、debug thread 与 integration thread 的职责边界。

核心目标是让 OES 像大型团队一样推进，而不是让多个 Codex thread 无差别修改代码。

能力级协同的显式启用、Design Thread 与 Capability Command 一对一关系、branch/worktree 隔离、integration candidate、批量验收及关闭规则，以 [`oes-capability-collaboration-framework.md`](./oes-capability-collaboration-framework.md) 为唯一治理真相源。

## 2. Global Command Thread 红线

Global Command Thread 只负责项目级规划、调度、依赖编排与冲突协调。

Global Command Thread 可以做：

- 维护 OES 全局 roadmap、能力依赖图、thread control board 与 branch/worktree registry
- 对新需求做项目级 intake，判断候选能力域、候选 owner group、疑似依赖与优先级
- 创建或调整 design / implementation / debug / integration task
- 协调 ownership 冲突、优先级冲突与跨组阻塞
- 接收下级 thread handoff，并决定是否更新全局计划或继续分派任务

Global Command Thread 明确禁止：

- 不做服务级设计
- 不做功能级设计讨论
- 不定义领域对象、状态机、字段、API、proto、事件或数据库 schema
- 不定义权限语义、租户模型、operator context 或 AI tool 协议细节
- 不写业务代码
- 不 debug 具体服务问题
- 不替代 design thread 决定最终服务归属
- 不替代 implementation thread 修改实现

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

其他 thread 只能读取这些文件，并通过结构化 handoff 或直接向 owner 报告变更、阻塞与失败。

## 6. Handoff 规则

每个正式 thread 完成、阻塞或失败时，必须提交结构化 handoff。

handoff 必须包含：

- Thread
- Type
- Parent
- Return target
- Branch
- Worktree
- Base SHA
- Candidate / Last Commit SHA
- Dirty State
- Integration Target
- Scope
- Changed files
- Design impact
- Contract impact
- Data impact
- Permission impact
- Tenant/operator/audit impact
- Dependencies unlocked
- New blockers
- Conflicts detected
- Verification
- Cleanup State
- Recommended next tasks

Global Command 只根据结构化 handoff 更新全局 roadmap、依赖图与调度状态。

## 7. 冲突升级

任意 thread 触碰以下情况必须停止并上报：

- 需要修改 shared proto
- 需要修改 `src/common`
- 需要修改 permission model
- 需要修改 tenant / operator context
- 需要修改 API Gateway 公共入口
- 需要修改 lockfile 或根 `package.json`
- 两个 thread 需要写同一个核心文件
- 设计结论影响其他服务 truth source

Global Command 或对应 Management Thread 负责决定串行、拆分、新开 integration/debug/contract thread 或升级 ADR。
