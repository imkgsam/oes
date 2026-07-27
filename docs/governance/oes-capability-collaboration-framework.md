# OES Capability Collaboration Framework v1.1

## 1. 定位与启用规则

本文档是 OES 能力级协同框架的项目治理真相源。它定义设计、总控、实现与验收线程如何协同，不定义任何具体业务能力的领域模型、字段、API 或数据库结构。

框架默认关闭，按能力域显式启用。只有用户明确表示“使用/启用 OES 协同框架”并给出能力域时，才能创建配对线程或派发子线程。普通的“设计某能力”“继续实现”“修复问题”“新建讨论线程”不得推断为启用框架。

框架只对当前明确的 `capabilityKey` 生效；不会自动扩展到其他能力域。用户可以明确停用某能力域的框架，停用后不再自动创建新的实现或验收线程。

Skill 是本框架的执行器，不是真相源。Skill 必须读取本文档及其引用的治理规则；若 Skill 与本文档冲突，以项目治理文档、`AGENTS.md`、架构文档和 ADR 为准。

## 2. 线程层级

```text
Project Global Command
        ├─ Design Thread A
        │      └─ Capability Command A
        │             ├─ Implementation Threads
        │             ├─ Integration Thread
        │             ├─ Acceptance Thread
        │             └─ Focused Review（仅高风险时）
        └─ Design Thread B
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

负责跨能力域的优先级、依赖、ownership 冲突、共享文件冲突和全局调度。只产出项目级分类与调度信息，不决定最终领域归属、工作流、契约或 schema，也不直接修改业务实现。

### 3.2 Design Thread

与用户持续讨论单一能力设计，维护母分支与讨论分支，识别遗漏和冲突，冻结业务/架构结论，并将冻结结果回写到唯一真相源。发现设计不充分时，继续与用户讨论，不派发实现绕过未决设计。

### 3.3 Capability Command

消费已冻结设计，按实际 ownership 拆分垂直任务，分配允许修改路径，管理实现线程的依赖、返工与收口，并按相近能力批次安排统一验收。实现缺陷回 Capability Command；设计缺口回 Design Thread；跨域冲突回 Project Global Command。

### 3.4 Implementation Thread

只在冻结设计和明确任务边界内修改授权路径，完成定向自测并提交结构化 handoff。不得自行改变冻结设计、公共契约、权限、租户或共享边界。

### 3.5 Acceptance Thread

针对完整用户流程或相近能力批次做统一验收，不为每个实现任务重复创建完整验收。只在并发、事务、安全、迁移、权限、公共契约等高风险场景创建额外 Focused Review。

### 3.6 Integration Thread

作为能力域唯一集成写者，维护 capability integration branch/worktree，只机械合并已通过 lane gate 的提交、同步最新 `main`、协调冲突归属，并向 Acceptance Thread 提供不可变 candidate commit。不得替代 Implementation Thread 修复业务实现，也不得替代 Design Thread 改变冻结语义。

## 4. 标准生命周期

1. **Explicit intake**：确认用户明确启用框架，记录 `capabilityKey`、目标、优先级和疑似依赖。
2. **Pairing**：创建一个 Design Thread 和一个同域 Capability Command，并锁定双方 ownership。
3. **Design**：Design Thread 与用户讨论，解决母分支下的分支问题；开放问题未冻结前不得派发实现。
4. **Freeze**：将结论回写架构、ADR、contract 或 feature packet 等唯一真相源，形成下游可执行输入。
5. **Dispatch**：Capability Command 先登记 integration branch/worktree，再按垂直切片创建独立 Implementation branch/worktree；只有确有必要时才创建额外 review。
6. **Lane gate**：每个实现 lane 在自己的 worktree 中完成构建、定向测试、提交和推送，工作区干净后才允许 handoff。
7. **Capability integration**：Integration Thread 只合并已通过 lane gate 的分支，形成不可变 candidate commit。
8. **Batch acceptance**：Acceptance Thread 针对 candidate commit 做统一验证，发现实现问题回 Command，发现设计问题回 Design Thread。
9. **Main integration and close**：验收通过后，Integration Thread 同步并验证最新 `main`，以保留 ancestry 的正常 merge/fast-forward 合并并推送；随后清理分支、worktree 和临时线程。若子线程派生子线程，父线程负责确认所有子子线程先完成并关闭。

## 5. Git branch 与 worktree 隔离模型

### 5.1 三层绿色基线

框架启用后必须遵守：**模块本地绿、能力集成绿、`main` 始终绿**。

- `main` 是已验证、可运行、可部署的正式集成线；项目根工作区固定检出 `main`，不得作为设计或实现草稿区。
- 每个并发写入者必须拥有独立 branch + worktree；一个 worktree 同一时间只能有一个写 owner。
- 每个实现 lane 先在自己的 worktree 中完成构建与定向测试，再进入 capability integration branch。
- 完整跨模块链路只在 capability integration candidate 上验收；未通过不得进入 `main`。
- 禁止从 dirty working tree 派生新任务、复制未提交基线给下游、让多个线程共享未提交文件，或用 stash 作为跨线程 handoff。

### 5.2 各角色的 Git 资源

| 角色                            | Branch / worktree 规则                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Design Thread                   | 纯讨论时不创建；进入冻结写入时使用短生命周期 design branch/worktree。冻结文档先合并进 `main`，下游实现再从该稳定基线启动。 |
| Capability Command              | 只调度和登记，不写代码，不创建自己的开发 branch/worktree。                                                                 |
| Implementation / Focused Review | 每个并发写 owner 使用独立 branch/worktree；子线程若独立写文件，也必须获得自己的 branch/worktree 和路径 ownership。         |
| Integration Thread              | 每个 capability 只允许一个 integration branch/worktree 和一个写 owner。                                                    |
| Acceptance Thread               | 读取 Integration Thread 给出的精确 candidate SHA；优先使用 detached、只读验收 worktree，不创建可写业务分支，不修复实现。   |
| Project root                    | 始终保持在 `main`；日常启动稳定系统只从此目录运行。                                                                        |

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
- Global Command/Capability Command 维护 registry：`threadId`、owner、branch、worktree、base SHA、allowed paths、dependency SHA、last commit、dirty state、integration target、cleanup state。
- 未登记 branch/worktree 不得成为正式写入任务的工作面。

### 5.4 创建与依赖顺序

1. 确认项目根目录位于干净且与 `origin/main` 同步的 `main`。
2. 冻结设计先通过 design branch 合并到 `main`；未进入 `main` 的设计草稿不得作为多 lane 实现基线。
3. Integration Thread 从最新 `origin/main` 创建 capability integration branch/worktree。
4. 无依赖 lane 从当前 integration head 创建；有依赖 lane 必须等待 Producer/Contract lane 提交并合并到 integration 后，再从新的 integration head 创建或同步。
5. dependency install、生成代码、构建和测试必须在 lane worktree 中执行；初始化后 `git status` 必须干净，生成物必须被正确忽略。
6. shared proto、`src/common`、lockfile、权限、租户/operator context 等共享路径实行单写者；不得通过共享 worktree 或复制 dirty baseline 规避依赖顺序。

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

每个实现或验收任务必须明确：范围、允许修改路径、依赖、输出、验收标准和关闭条件。正式 handoff 至少包含：Thread、Type、Parent、Return target、Branch、Worktree、Base SHA、Candidate/Last Commit SHA、Dirty State、Integration Target、Scope、Changed files、Design/Contract/Data/Permission impact、Tenant/operator/audit impact、Dependencies unlocked、New blockers、Conflicts detected、Verification、Cleanup State、Recommended next tasks。

共享契约、事件、`src/common`、权限、租户、operator context、网关公共入口或架构真相源发生变化时，线程必须停止并回传，不得私自绕过。

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
- Design 与 Capability Command 通常不需要序号；临时实现、验收和复审任务必须由 Capability Command 分配序号。
- 子任务继承同一能力域和父任务序号，例如 `A/I/SITE/01.1`。
- Bugfix 归入 `I`，不额外创建 Debug 类型。
- 标题不包含状态、日期或模型名；任务状态由会话系统维护，关闭或 archive 后标题保持不变。

示例：

```text
A/D/SITE · Site Management Design
A/C/SITE · Site Management Command
A/I/SITE/01 · Runtime Presence
A/V/SITE/01 · Status and Onboarding Acceptance
A/R/SITE/01 · Sync Concurrency Review
A/X/SITE/01 · Site Capability Integration
```
