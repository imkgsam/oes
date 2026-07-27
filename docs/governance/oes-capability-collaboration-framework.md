# OES Capability Collaboration Framework v1.3.2

## 1. 定位与启用规则

本文档是 OES 能力级协同框架的项目治理真相源。它定义设计、总控、实现与验收线程如何协同，不定义任何具体业务能力的领域模型、字段、API 或数据库结构。

框架默认关闭，按能力域显式启用。只有用户明确表示“使用/启用 OES 协同框架”并给出能力域时，才能创建配对线程或派发子线程。普通的“设计某能力”“继续实现”“修复问题”“新建讨论线程”不得推断为启用框架。

框架只对当前明确的 `capabilityKey` 生效；不会自动扩展到其他能力域。用户可以明确停用某能力域的框架，停用后不再自动创建新的实现或验收线程。

Skill 是本框架的执行器，不是真相源。Skill 必须读取本文档及其引用的治理规则；若 Skill 与本文档冲突，以项目治理文档、`AGENTS.md`、架构文档和 ADR 为准。

## 2. 线程层级

```text
Project Global Command
        ├─ Capability A
        │      ├─ Design Thread A
        │      └─ Capability Command A
        │             ├─ Implementation Threads
        │             ├─ Integration Thread
        │             ├─ Acceptance Thread
        │             └─ Focused Review（仅高风险时）
        └─ Capability B
               ├─ Design Thread B
               └─ Capability Command B
                      ├─ Implementation Threads
                      ├─ Integration Thread
                      └─ Acceptance Thread
```

- 一个 Design Thread 只负责一个持续设计主题。
- 一个 Design Thread 只对应一个 Capability Command，二者一对一。
- 多个 Design Thread 可以并行存在；每个 Design Thread 都必须有自己的 Capability Command。
- Project Global Command 可以协调多个设计域，但不得替代 Design Thread 做服务级/功能级设计或实现。

## 3. 角色职责与回传路径

### 3.1 Project Global Command

负责能力组合级 intake、优先级、依赖、并发资源、ownership 冲突、共享文件冲突和全局调度。用户显式启用框架后，Global Command 只创建并登记对应的 Design Thread 与 Capability Command，维护能力级状态，并消费 Capability Command 的能力级汇总。

Global Command 不决定最终领域归属、工作流、契约或 schema，不直接修改业务实现，也不得创建、恢复、验收或指挥该 Capability Command 管理的 Implementation、Focused Review、Acceptance 或 Integration Thread。

### 3.2 Design Thread

与用户持续讨论单一能力设计，维护母分支与讨论分支，识别遗漏和冲突，冻结业务/架构结论，并将冻结结果回写到唯一真相源。发现设计不充分时，继续与用户讨论，不派发实现绕过未决设计。

### 3.3 Capability Command

消费已冻结设计，是当前 capability 内唯一执行状态 owner。它按实际 ownership 拆分垂直任务，独占创建和管理 Implementation、Focused Review、Acceptance 与 Integration Thread，分配允许修改路径，读取子任务完整终态，裁定 lane gate，管理依赖、返工、集成与收口，并按相近能力批次安排统一验收。

实现缺陷回 Capability Command；设计或契约缺口由 Capability Command 直接回传配对的 Design Thread；只有跨能力依赖、全局优先级或未分配/冲突的共享 ownership 才升级 Project Global Command。

### 3.4 Implementation Thread

只在冻结设计和明确任务边界内修改授权路径，完成定向自测并提交结构化 handoff。不得自行改变冻结设计、公共契约、权限、租户或共享边界。

### 3.5 Acceptance Thread

针对完整用户流程或相近能力批次做统一验收，不为每个实现任务重复创建完整验收。只在并发、事务、安全、迁移、权限、公共契约等高风险场景创建额外 Focused Review。

### 3.6 Integration Thread

作为能力域唯一集成写者，维护 capability integration branch/worktree，只机械合并已通过 lane gate 的提交、同步最新 `main`、协调冲突归属，并向 Acceptance Thread 提供不可变 candidate commit。不得替代 Implementation Thread 修复业务实现，也不得替代 Design Thread 改变冻结语义。

### 3.7 排他控制与通信路径

框架启用后，正式控制链固定为：

```text
Project Global Command ↔ Capability Command
Capability Command ↔ Design Thread
Capability Command ↔ Implementation / Focused Review / Acceptance / Integration
```

禁止 `Project Global Command ↔ Implementation / Focused Review / Acceptance / Integration` 的直接 scope、gate、返工或状态变更指令。Global Command 可以读取能力级汇总，不读取子任务终态后替 Capability Command 作决定。

每个正式子任务必须登记 `parentThreadId` 与 `returnTarget`，二者都指向对应 Capability Command。子任务收到改变 scope、ownership、gate 或执行状态的指令时必须校验来源：

- 来源为注册 Capability Command：正常处理；
- 来源为 Global Command 或其他任务：拒绝执行并返回 `ROUTING_VIOLATION`；
- 来源为用户本人：用户指令始终有效；若改变既有范围，先通知 Capability Command 更新 ownership 与 registry，再进入实现。

Capability Command 失联、工具不可用或中断时，Global Command 只能恢复或替换该 Capability Command，不能穿透接管其子任务。紧急穿透必须由用户明确授权，并记录 `emergencyOverride: true`、原因、范围、失效条件和恢复目标；Global Command 不得自行声明紧急状态。

### 3.8 注册表驱动的单消费者 Pull 协议

框架内正式线程通信采用 **Registry-Governed Single-Consumer Pull**，而不是子线程或 peer 向正在工作的控制线程主动推送 handoff。

控制关系固定为：

```text
Global Command 主动拉取 Capability Command 的 capability-level terminal
Capability Command 主动拉取配对 Design 与已登记 I/R/V/X 的 terminal
```

强制规则：

- 每个控制线程在自己的 registry 中登记受控线程、`currentWorkItem`、运行状态、`deliveryLock` 与 `lastConsumedCursor`；同一时间只处理一个原子工作项。
- 正式子线程完成、失败或阻塞后，只在自己的 terminal final record 留下结构化 handoff，不调用消息工具主动唤醒或打断 parent。多个 terminal 可以并行就绪，由 parent 串行拉取。
- `ACTIVE` 线程的 `deliveryLock` 固定为 `CLOSED`。自动线程不得向其推送任务、handoff、scope、gate、返工或状态消息；结果继续保留在来源 terminal。
- Parent 只能在 child 为 `IDLE` 时下发或恢复任务。Peer-to-peer 正式控制消息一律返回 `ROUTING_VIOLATION`。
- Global Command 与 Capability Command 必须使用任务等待/读取机制消费 terminal，并在处理后记录精确 cursor；同一 terminal 不得重复裁定。
- 当前原子工作只要仍有 `ACTIVE` child 或未消费 terminal，注册 parent 就必须保持本 turn，通过有界 wait/read 循环持续监控；wait 超时只产生状态更新，不构成结束条件。
- 禁止控制线程用 `*_IN_PROGRESS`、`READY_FOR_PARENT_PULL`、“已派发”或“等待 child”作为 terminal final 后自行进入 idle。存在 active/ready child 时不属于安全检查点。
- 控制线程只有在以下稳定状态才能结束 turn：当前能力/原子工作完成；等待 Design、跨能力前置或用户决定；已证实的环境/工具 blocker；`MERGED_WAITING_FOR_USER_CLEANUP`。terminal 必须准确命名该稳定状态。
- 若 Codex 运行时意外结束控制 turn，由注册 owner 配置的轻量 liveness watchdog 只唤醒该 idle 控制线程继续原 `currentWorkItem`。watchdog 不读取或指挥 child、不消费 terminal、不裁定 gate、不创建任务、不承担业务状态，也不得作为 Inbox。
- “处理完成”指当前原子工作达到上述稳定检查点并更新 registry，不要求整个 capability 结束。

用户消息始终有效，但只有用户明确要求停止、切换、覆盖或优先处理时才抢占当前工作；当前任务补充合并处理，无关新任务等待当前原子工作达到安全检查点。

自动抢占只允许注册 parent 对自己的 child 发出纯 `STOP_ONLY`，且仅限代码/数据破坏、凭据或敏感信息泄露、已确认共享文件并发写、未经授权的外部或破坏性操作。`STOP_ONLY` 只能要求停止并保存现场，不得夹带新任务、scope、gate 或返工指令；跨 capability 不得直接停止对方线程。

超时不等于失败。只要 heartbeat、cursor、工具进程或状态仍变化就继续等待；child 已 idle 或留下 incomplete terminal 时恢复同一线程。连续三个监控窗口均无任何进度证据并确认失联后，注册 parent 才可执行恢复停止并恢复同一 thread/branch/worktree，禁止创建重复任务或工作面。

## 4. 标准生命周期

1. **Explicit intake**：确认用户明确启用框架，记录 `capabilityKey`、目标、优先级和疑似依赖。
2. **Pairing**：Global Command 创建一个 Design Thread 和一个同域 Capability Command，并锁定双方 ownership；此后 capability 内 I/R/V/X 的创建权转交 Capability Command。
3. **Design**：Design Thread 与用户讨论，解决母分支下的分支问题；开放问题未冻结前不得派发实现。
4. **Freeze**：将结论回写架构、ADR、contract 或 feature packet 等唯一真相源，形成下游可执行输入。
5. **Dispatch**：Capability Command 先登记 integration branch/worktree，再按垂直切片即时创建独立 Implementation branch/worktree；只有确有必要时才创建额外 review。有前置依赖的未来 lane 在 predecessor gate 与精确 base SHA 就绪前只登记 planned lane，不创建正式 task 或 worktree。任何 writer 子任务未绑定从精确 base 创建的 canonical branch，或未通过标题、父子关系和 Git 工作面校验前，不得进入 active。
6. **Lane gate**：每个实现 lane 在自己的 worktree 中完成构建、定向测试、提交和推送，工作区干净后才允许 handoff。
7. **Capability integration**：Integration Thread 只合并已通过 lane gate 的分支，形成不可变 candidate commit。
8. **Batch acceptance**：Acceptance Thread 针对 candidate commit 做统一验证，发现实现问题回 Command，发现设计问题回 Design Thread。
9. **Main integration and wait**：验收通过后，Integration Thread 同步并验证最新 `main`，以保留 ancestry 的正常 merge/fast-forward 合并并推送；状态进入 `MERGED_WAITING_FOR_USER_CLEANUP`，保留开发 branch/worktree 和临时线程，等待用户指令。
10. **User-approved cleanup**：只有用户明确确认后才清理分支、worktree 和临时线程。若子线程派生子线程，父线程负责确认所有子子线程先完成并关闭。

## 5. Git branch 与 worktree 隔离模型

### 5.1 三层绿色基线

框架启用后必须遵守：**模块本地绿、能力集成绿、`main` 始终绿**。

- `main` 是已验证、可运行、可部署的正式集成线；项目根工作区固定检出 `main`，不得作为设计或实现草稿区。
- 每个并发写入者必须拥有独立 branch + worktree；一个 worktree 同一时间只能有一个写 owner。
- 每个实现 lane 先在自己的 worktree 中完成构建与定向测试，再进入 capability integration branch。
- 完整跨模块链路只在 capability integration candidate 上验收；未通过不得进入 `main`。
- 禁止从 dirty working tree 派生新任务、复制未提交基线给下游、让多个线程共享未提交文件，或用 stash 作为跨线程 handoff。

### 5.2 各角色的 Git 资源

| 角色                            | Branch / worktree 规则                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Design Thread                   | 纯讨论时不创建；进入冻结写入时使用短生命周期 design branch/worktree。冻结文档先合并进 `main`，下游实现再从该稳定基线启动。         |
| Capability Command              | 只调度和登记，不写代码，不创建自己的开发 branch/worktree。                                                                         |
| Implementation / Focused Review | 每个并发写 owner 使用独立 canonical branch/worktree；从精确 predecessor SHA 即时创建，首次运行前必须已绑定 branch，禁止 detached。 |
| Integration Thread              | 每个 capability 只允许一个 integration branch/worktree 和一个写 owner；首次运行前必须已绑定 canonical branch，禁止 detached。      |
| Acceptance Thread               | 读取 Integration Thread 给出的精确 candidate SHA；优先使用 detached、只读验收 worktree，不创建可写业务分支，不修复实现。           |
| Project root                    | 始终保持在 `main`；日常启动稳定系统只从此目录运行。                                                                                |

### 5.3 命名与 registry

branch 统一使用：

```text
codex/<capability-key-lower>/<role><sequence>-<slug>
```

worktree 统一使用：

```text
.worktrees/<capability-key-lower>/<role><sequence>-<slug>
```

示例：

```text
codex/site/d-governance
codex/site/i01-faq-backend
codex/site/i02-runtime-reader
codex/site/x01-integration

.worktrees/site/d-governance
.worktrees/site/i01-faq-backend
.worktrees/site/i02-runtime-reader
.worktrees/site/x01-integration
```

- `d`、`i`、`r`、`x` 分别对应 Design、Implementation、Focused Review、Integration。
- branch 名必须能映射到自动任务名，例如 `A/I/SITE/01` 对应 `codex/site/i01-<slug>`。
- Global Command 只维护 capability 级 registry：`capabilityKey`、Design/Command thread、能力状态、`currentWorkItem`、`deliveryLock`、`lastConsumedCursor`、跨能力依赖、candidate/main SHA、全局风险和待用户清理状态。
- Capability Command 独占维护 capability 内部 registry：`threadId`、`hostId`、规范标题、parent/return target、owner、运行状态、`currentWorkItem`、`deliveryLock`、`lastConsumedCursor`、branch、worktree、base SHA、allowed/protected paths、dependency SHA、gate、last commit、dirty state、integration target、cleanup state。
- Predecessor 未就绪的 future lane 只以 planned lane 记录 sequence、ownership、paths、dependency gate 与预计 base，不创建 threadId、branch 或 worktree。依赖满足后再解析精确 base SHA、创建 canonical branch，并以该 branch 作为正式 task 的 worktree starting state。
- I/R/X writer worktree 的 `git branch --show-current` 必须等于登记的 canonical branch；detached HEAD 直接阻止 activation。激活前必须在 clean worktree 执行 `git update-index --refresh` 并成功，以无语义写入证明 linked-worktree Git metadata 可写。Detached worktree 仅可登记给只读 Acceptance，且不得执行 Git 写操作。
- 未登记 branch/worktree 不得成为正式写入任务的工作面。

### 5.4 创建与依赖顺序

1. 确认项目根目录位于干净且与 `origin/main` 同步的 `main`。
2. 冻结设计先通过 design branch 合并到 `main`；未进入 `main` 的设计草稿不得作为多 lane 实现基线。
3. Integration Thread 从最新 `origin/main` 创建 capability integration canonical branch，并以该 branch 创建正式 task/worktree；不得先创建 detached writer worktree。
4. 无依赖 lane 从当前 integration head 即时创建 canonical branch/task/worktree。有依赖 lane 在 Producer/Contract gate 前只登记 planned lane；依赖提交合入 integration 后，从新的精确 integration SHA 创建 canonical branch，再创建以该 branch 为 starting state 的正式 task/worktree。
5. 正式 writer task 创建后必须在首次执行前回读并证明 cwd、canonical branch、精确 HEAD 与 clean status，并在该 clean worktree 执行 `git update-index --refresh` 成功以证明 Git metadata 可写；任何 detached、错误 base 或不可写状态都必须在 activation 前修复，不得把环境修复留给业务实现回合。
6. dependency install、生成代码、构建和测试必须在 lane worktree 中执行；初始化后 `git status` 必须干净，生成物必须被正确忽略。
7. shared proto、`src/common`、lockfile、权限、租户/operator context 等共享路径实行单写者；已经在 feature packet 或 Global Command ownership 授权中分配给当前 capability 的路径由 Capability Command 调度，未分配或与其他 capability 冲突时才升级 Global Command。不得通过共享 worktree 或复制 dirty baseline 规避依赖顺序。

### 5.5 模块本地绿

独立 lane 不要求在未集成时证明完整新业务链路，但必须做到：

- package/service 可以构建或类型检查；
- 定向单元、契约或组件测试通过；
- Producer 用真实接口/适配器测试证明输出；Consumer 用冻结 fixture/mock 证明消费；
- 不依赖另一个线程尚未提交的文件；
- handoff 时所有授权改动都已 commit，worktree 无 tracked/untracked 残留。

如果一个 lane 无法满足上述条件，则说明切片不能独立推进：Capability Command 必须改为串行、缩小切片，或先完成契约/Producer gate，不得把“集成后也许能跑”当作完成。

### 5.6 合并与验收

1. Implementation Thread 推送 lane branch，handoff 精确 commit SHA、验证证据和 clean status。
2. Integration Thread 只使用正常 merge（通常 `--no-ff`）将通过 gate 的 lane 合入 integration branch，保留 branch ancestry。
3. 正常流程禁止 cherry-pick、squash merge 或 rebase 已共享提交；这些操作会破坏 ancestry，使 Git 无法可靠判断分支是否已合并。只有经用户或 Global Command 明确授权的历史修复才可例外，并必须证明 tree equivalence。
4. 所有 lane 集成后，Integration Thread 同步最新 `origin/main`，在 integration worktree 解决冲突并完成最小回归，再冻结 candidate SHA。
5. Acceptance Thread 只验收该 candidate SHA。验收期间 Integration Thread 不得改写 candidate；有新提交则生成新 SHA 并重新验收受影响范围。
6. 验收通过且远端 `main` 未变化时，本地 `main` 使用 `git merge --ff-only <integration-branch>` 并正常 push；若 `main` 已变化，必须重新同步 integration、验证并生成新 candidate，不得直接在 `main` 上解决冲突。

Implementation/Review task 及其 branch/worktree 在 candidate 验收和 `main` 合并完成前保持可恢复，不得因 lane 初次 merge 成功就提前 archive 或删除；这样验收失败时可以回到原 owner 原地返工。

### 5.7 验收失败与返工

- **实现缺陷**：回到原 Implementation Thread、原 branch/worktree 修复并提交，再次 merge 到同一 integration branch；ownership 不变时不得新建重复分支。
- **设计/契约缺口**：冻结 integration，回传 Design Thread；设计重新冻结并进入稳定真相源后，Capability Command 重新排序受影响 lane。
- **机械冲突**：Integration Thread 可以处理；涉及业务语义、数据、权限或契约选择时必须退回原 owner。
- **环境问题**：保留 candidate 和证据，修复环境后重跑，不改业务代码掩盖环境缺口。

验收失败时 `main` 不受影响，因此不得在 `main` 上 Revert，也不得把未验收 integration branch 临时推成 `main`。

### 5.8 暂停、阻塞与恢复

- 短期阻塞且预计继续：保留原 branch/worktree，并在 registry 标记 blocker 和 return point。
- 长期暂停或需要释放 worktree：将可审计的当前状态 commit/push 到原 branch，明确标记 `NOT_INTEGRATION_READY`；不得用本地 stash 或仅靠线程聊天保存代码。
- WIP/checkpoint commit 只允许存在于未合并 branch，恢复后应整理为可审查提交，再进入 lane gate。
- 任何 worktree 删除前都必须确认 tracked/untracked 状态和恢复路径；dirty worktree 不得强制删除。

### 5.9 清理门禁

Implementation、Review、Integration branch/worktree 只在以下条件全部成立后清理：

1. candidate 验收通过并已进入 `origin/main`；
2. 本地 `main` 与 `origin/main` 指向相同提交；
3. `git merge-base --is-ancestor <branch> origin/main` 成功；
4. worktree clean、无 stash handoff、无未归属文件；
5. handoff、验证和 cleanup state 已写回 registry；
6. 父线程已读取所有子线程和子子线程最终记录。
7. 用户已在合并完成后明确授权本次 cleanup。

清理顺序固定为：

```text
archive/close child task
→ git worktree remove <path>
→ git branch -d <branch>
→ git push origin --delete <branch>（若曾推送）
→ prune registry/worktree metadata
```

- 正常收口禁止 `git branch -D`、`git worktree remove --force`、`git reset --hard` 或批量 `git clean`。
- 若 `git branch -d` 拒绝删除，必须停止并审计；不能把强制删除当作常规清理。
- 恢复备份是异常保险，不替代 clean handoff、正常 merge 和 ancestry 证明。

### 5.10 运行版本纪律

- 从项目根目录启动时，运行的是稳定 `main`。
- 实现线程必须显式把 command cwd 指向自己的 worktree；不得在根目录安装依赖、构建或启动半成品。
- 集成联调与验收从 integration/candidate worktree 运行，并在输出中报告 branch、commit SHA 和 cwd。
- 用户询问“当前运行哪个版本”时，必须同时报告 cwd、branch、HEAD 和 dirty state，不能只报告 branch 名。

## 6. 任务边界与 handoff

每个实现或验收任务必须明确：范围、允许与保护路径、依赖、输出、验收标准和关闭条件。正式 handoff 至少包含：Thread、Type、Parent、Return target、Branch、Worktree、Base SHA、Candidate/Last Commit SHA、Dirty State、Integration Target、Scope、Changed files、Design/Contract/Data/Permission impact、Tenant/operator/audit impact、Dependencies unlocked、New blockers、Conflicts detected、Verification、Cleanup State、Recommended next tasks。

Implementation Thread 不得自行创建正式项目任务；可以使用不拥有独立 branch/worktree、路径 ownership 或独立交付的内部临时 subagent。需要独立写入或交付时，必须向 Capability Command 请求创建并登记正式任务。

共享契约、事件、`src/common`、权限、租户、operator context、网关公共入口或架构真相源不在已冻结 feature packet 和已分配 ownership 内时，线程必须停止并回传 Capability Command；Capability Command 判断是设计缺口还是跨能力 ownership 冲突并按本文件路由，不得私自绕过。

## 7. 文档归位

- 稳定服务边界：`docs/architecture/services/`
- 跨服务协同：`docs/architecture/collaborations/`
- 关键取舍：`docs/adr/`
- 黑盒契约：`docs/contracts/`
- 长周期未冻结设计：`docs/plans/designs/`
- 可执行 feature 状态：`docs/plans/features/`
- 项目级调度：由 Project Global Command 独占 `docs/plans/oes-*` 共享计划文件

Design workspace 只记录未冻结过程；结论冻结并回写真相源后，应标记退出 active 或归档，不得形成第二份长期设计真相。

## 8. 与其他治理文档的关系

- 顶层 Global Command 红线：`codex-global-command-model.md`
- 线程类型与路径 ownership：`codex-threading-rules.md`
- feature 拆分与验收：`codex-feature-threading.md`
- 标准执行步骤与失败升级：`codex-workflow.md`
- 共享计划单写者：`docs/plans/oes-thread-control-board.md`

本文件补充上述文档的“能力级 Design Thread—Capability Command 配对、显式启用和批量验收”规则；若发生冲突，以 `AGENTS.md` 和更高优先级架构/ADR 为准。

## 9. 自动任务命名规范

框架自动创建的任务统一使用以下格式：

```text
A/<Role>/<CapabilityKey>[/<Sequence>] · <Task Name>
```

- `A` 表示由 OES 协同框架自动创建；人工创建的任务不使用该前缀。
- `D` 表示 Design，`C` 表示 Capability Command，`I` 表示 Implementation，`V` 表示 Verification/Acceptance，`R` 表示高风险 Focused Review，`X` 表示 Integration。
- `CapabilityKey` 使用稳定的大写短码，例如 `SITE`、`CRM`、`ITEM`。
- Design 与 Capability Command 通常不需要序号；临时实现、验收、复审和集成任务必须由 Capability Command 按 Role 独立、单调递增地分配两位序号。
- 子任务继承同一能力域和父任务序号，例如 `A/I/SITE/01.1`。
- Bugfix 归入 `I`，不额外创建 Debug 类型。
- 标题不包含状态、日期或模型名；任务状态由会话系统维护，关闭或 archive 后标题保持不变。
- 序号只表达任务身份；`OPS`、`R`、`01R`、`01RR` 等状态、角色或续作后缀不得占用 Sequence。
- 相同 ownership、范围和 branch/worktree 的返工必须恢复原任务。只有拆出独立 ownership 和独立工作面时才分配 `.1`、`.2` 子序号；高风险复审使用独立 `A/R` 序列。

示例：

```text
A/D/SITE · Site Management Design
A/C/SITE · Site Management Command
A/I/SITE/01 · Runtime Presence
A/V/SITE/01 · Status and Onboarding Acceptance
A/R/SITE/01 · Sync Concurrency Review
A/X/SITE/01 · Site Capability Integration
```

### 9.1 创建门禁

正式任务只通过 Codex 项目任务机制创建，不得用内部 `/root/...` subagent 代替用户可见的独立 lane。Capability Command 必须按以下顺序执行：

```text
reserve sequence in registry
→ generate canonical title
→ wait for predecessor gate and resolve exact base SHA
→ create canonical branch at that exact base
→ create project task/worktree with the canonical branch as starting state
→ explicitly set UI title
→ read task back and verify title/threadId/hostId
→ verify cwd/branch/HEAD/dirty state and run git update-index --refresh
→ register parent/return target/paths/dependencies/gate
→ activate task
```

只把标题写入 prompt 不视为完成命名。Predecessor 未就绪时流程停在 planned lane，不得通过预创建 detached task/worktree 占位。创建工具不可用时，Capability Command 返回 `TOOL_BLOCKED` 并暂停；Global Command 只能恢复或替换 Capability Command 的工具环境，不得代建子任务。

## 10. 监控、恢复与跨能力升级

### 10.1 Capability Command 主动监控

Capability Command 创建子任务后保持执行所有权，通过任务等待机制监控已登记的活动子任务，不在派发后立即以“应启动”或“等待 Global Command”结束控制链。

- 子任务不得主动推送 handoff；Command 按第 3.8 节主动拉取已登记 terminal；
- Command 在当前原子工作存在 active/ready child 时不得返回 terminal final；必须留在同一 turn，以有界 `wait_threads` 连续等待，超时后继续且不重复读取完整上下文；
- 子任务终态出现后按 cursor 完整读取一次 final record，再裁定 gate 并记录已消费 cursor；
- `idle`、部分结果或测试运行中不能视为完成；
- 已有可信证据不重复执行完整测试，只补实际风险缺口；
- 实现缺陷恢复原 Implementation，验收脚本/fixture 缺陷恢复原 Acceptance；
- 设计/契约缺口直接回 Design Thread，Capability Command 标记 `WAITING_FOR_DESIGN`；
- 连续三个监控窗口无任何进度证据且确认失联后，只恢复同一个 thread/branch/worktree，不重新创建任务。

Capability 进入执行态时必须建立或确认只唤醒对应 Capability Command 的轻量 liveness watchdog，作为 control turn 意外结束的兜底。watchdog 只在 Command 为 idle 且 registry 仍有非稳定 `currentWorkItem` 时恢复同一 Command；它不得读取或指挥子任务、消费 handoff、裁定 gate、创建任务或形成第二个 Inbox。Command 到达稳定终态、能力完成或用户停用框架后必须停用该 watchdog。

### 10.2 跨能力升级与授权

只有跨能力依赖、全局优先级、未分配/冲突共享路径、能力归属变化、新 Capability 配对或 Capability Command 替换进入 Global Command。升级至少包含：Capability、Blocker type、Current state、Affected capabilities、Requested ownership/resource、Conflicting paths、Required predecessor gate、Impact if delayed、Safe paused state、Forbidden workaround、Recommended scheduling options。

Global Command 只返回 owner capability、执行顺序、路径 ownership/lease、前置 gate、暂停/恢复状态和 return target；不得返回 proto 字段、schema、领域对象、事件 payload、handler 实现、测试实现方式、lane gate 结论或 worker 返工细节。

Capability Command 向 Global Command 的正常汇总只包含能力状态、candidate/main SHA、当前里程碑、跨能力 blocker、已解锁依赖、重大风险和下一项能力级动作，不逐个转发 worker 回合或测试细节。
