# OES Capability Collaboration Framework v2.0 Lite

## 1. 定位与启用

本文档是 OES 能力级协同框架的治理真相源。框架只管理设计、执行、验收、Git 隔离和关闭流程，不定义业务对象、字段、API、事件或数据库结构。

框架默认关闭，只在用户明确启用某个 `capabilityKey` 后生效。Skill 是执行器，不是真相源；若 Skill 与本文档冲突，以 `AGENTS.md`、本文档、架构文档和 ADR 为准。

v2 Lite 的目标是：**一个 capability 默认一个本地开发主干、一个实现线程、一个最终验收、一次远端交付**。只有真实并发写入证据存在时才增加 lane、Integration 或 Focused Review。

## 2. 控制层级与职责

```text
Project Global Command
        ├─ A/D/<CAPABILITY> · Design
        └─ A/C/<CAPABILITY> · Capability Command
                ├─ A/I/<CAPABILITY>/01 · Default Implementation
                ├─ A/V/<CAPABILITY>/01 · Final Acceptance
                ├─ A/R/<CAPABILITY>/01 · Optional Focused Review
                └─ A/X/<CAPABILITY>/01 · Optional Multi-writer Integration
```

### 2.1 Global Command

Global Command 只负责：

- capability intake、优先级和配对；
- 跨 capability 依赖、共享 ownership 和资源冲突；
- capability 级状态、最终 main SHA 和待清理清单；
- 触发或立即执行一次全局状态检查。

Global Command 不读取 I/R/V/X 结果后替 A/C 裁定 gate，不创建、恢复或指挥 A/C 的子任务，也不做业务设计、实现或 debug。

### 2.2 Design Thread

A/D 只负责一个设计主题，和用户完成讨论与冻结，将结论写回唯一真相源。未冻结前不得要求 A/C 派发实现；冻结后只处理 A/C 返回的设计或契约缺口。

### 2.3 Capability Command

A/C 是 capability 内唯一执行状态 owner。它维护子任务注册表、任务粒度、路径 ownership、lane gate、返工、candidate、验收、main 交付和关闭状态；A/C 本身不写业务代码。

### 2.4 Implementation、Review、Acceptance、Integration

- A/I：在冻结设计和授权路径内实现、提交、本地验证；相同 ownership 的返工始终恢复同一个 A/I。
- A/V：只读验收精确 candidate SHA，不修复实现。
- A/R：仅在密码学、不可逆迁移、并发、权限或其他已证明的高风险需要独立专家复核时创建；默认并入 A/V 风险清单。
- A/X：只有两个以上独立 writer branch 需要合并时才创建；单 writer capability 不创建 A/X。

## 3. 注册表与休眠式 Pull

### 3.1 两级注册表

Global Command 只登记 A/C：

- `capabilityKey`
- A/D 与 A/C thread ID
- capability state
- cross-capability dependencies
- candidate/main SHA
- cleanup state
- A/C `lastConsumedCursor`
- checker route：`commandThreadId`、`currentObservedThreadId`、`lastObservedRevision`、`lastNotifiedApprovalRevision`

A/C 只登记自己的直接子任务：

- canonical title、thread ID、parent 和 return target
- role、state 和 allowed/protected paths
- branch/worktree/base/head/dirty state
- current child、candidate SHA 和 `lastConsumedCursor`
- blocker、verification 和 cleanup state

详细执行记录不复制到 GC registry。

### 3.2 稳定状态

控制线程允许在以下状态结束 turn：

- `WAITING_FOR_CHILD`
- `WAITING_FOR_USER`
- `WAITING_FOR_DESIGN`
- `WAITING_FOR_DEPENDENCY`
- `CANDIDATE_READY`
- `MERGED_WAITING_FOR_USER_CLEANUP`
- `CLOSED`

`WAITING_FOR_CHILD` 表示 child 已登记并在运行，parent 正常休眠；它不是能力完成，也不要求 parent 持续占用 turn。

### 3.3 全局状态检查器

v2 删除所有 per-command watchdog。整个项目只允许一个附着于 Global Command 的轻量状态检查器：

- 只在至少一个 capability 存在运行中 child 时启用，默认每 5 分钟检查一次；
- 用户说“立即跟进”时立即执行一次；
- 只读取 registry 中非空 `currentObservedThreadId` 的 thread status/revision，不读取 terminal 正文；
- child 完成、阻塞或等待审批时，只唤醒它的直接 A/C；
- A/C 产生 capability-level terminal 时，只唤醒 GC；
- 对同一审批 revision 最多通知用户一次，然后等待状态变化；
- 所有 capability 都进入稳定状态后自动停用；
- 不创建任务、不裁定 gate、不修改 Git、不承担 Inbox 或业务状态。

路由状态只允许保存 `commandThreadId`、`currentObservedThreadId`、`lastObservedRevision` 和 `lastNotifiedApprovalRevision` 等调度元数据，禁止复制 child handoff 或结果正文。A/C 返回 `WAITING_FOR_CHILD` 时必须带回当前 child thread ID，由 GC 写入 `currentObservedThreadId`；checker 观察到变化并唤醒 A/C 后，将观察目标切回该 `commandThreadId`，等待 A/C 的 capability-level terminal；GC 消费后若无运行中 child 则清空该 route。禁止每五分钟无差别唤醒全部 A/C。

状态检查器不是独立会话。它只是触发已有 parent 恢复 Pull。

### 3.4 Pull 与下发

- 子任务只在自身 terminal 留下 handoff，不主动发送结果。
- Parent 恢复后先用一次即时状态检查拉取 ready terminal，并按 cursor 只消费一次。
- GC 只 Pull A/C terminal；A/C 只 Pull 配对 A/D 与自己的 I/R/V/X terminal。
- 只向 `IDLE` child 下发或恢复工作；active child 不接收 scope、gate、返工或状态消息。
- 多个 terminal 同时 ready 时，parent 一次处理一个；其余结果留在来源 terminal。
- 用户明确停止、覆盖、切换或重新排序时可以抢占；普通补充合并到当前 work item。

## 4. 默认任务粒度

### 4.1 Lite 默认

一个 capability 默认只创建：

1. 一个 A/D；
2. 一个 A/C；
3. 一个 A/I；
4. 一个最终 A/V。

同一 A/I 负责该 capability 已冻结范围内的实现和返工。跨多个 package 不自动等于多个 lane；只有路径 ownership 真正独立、各自能够构建和验证、并行收益明确时才拆分。

未经用户批准，一个 capability 同时最多两个 writer。A/C 必须先证明写路径、依赖和验证互不重叠。

### 4.2 A/X 创建条件

- 单 writer：A/I branch 就是 capability candidate branch，不创建 A/X。
- 多 writer：只创建一个 A/X 和一个 integration branch/worktree；A/X 只做正常 ancestry merge、冲突归属和 candidate 冻结。

### 4.3 A/R 创建条件

A/R 默认不创建。只有以下风险之一无法由最终 A/V 清单充分覆盖时才创建：密码学、安全信任边界、不可逆数据迁移、事务/并发一致性、权限绕过、公共契约兼容性。返工后恢复同一个 A/R，不创建重复 review。

## 5. Capability Local Trunk Git 模型

### 5.1 三层绿色基线

- `main`：已验收、可运行、可交付；项目根目录固定检出干净 `main`。
- capability branch/worktree：本地开发主干，承载实现、返工和 candidate。
- candidate SHA：A/V 验收的不可变本地提交。

### 5.2 默认工作面

- Design：需要写入时使用 design branch/worktree；冻结后正常进入 `main`。若冻结结果是跨 capability 前置，可单独完成一次设计交付。
- A/I：默认使用一个 capability branch/worktree，是唯一业务 writer。
- A/V/A/R：使用精确 candidate 的只读 detached worktree；不得绑定 branch、写 Git metadata、修复代码或安装会污染仓库的依赖。
- A/X：仅在多 writer 时存在。

Codex 自动 worktree 若为 detached，只允许进行只读 preflight。Writer 必须在任何代码或 Git 写入前一次性绑定既有 canonical branch；不得为每个角色重复创建和绑定 writer worktree。

### 5.3 本地优先与远端策略

- A/I 和 A/X 使用本地 commit 交接；默认不 push lane branch 或 integration branch。
- 同一仓库的 A/X 直接合并已通过 gate 的本地 branch，不以远端 push 作为 handoff 前置。
- 暂停、返工和 Review 都继续使用本地 branch/worktree。
- 只有用户明确要求远端备份，或长期暂停且已确认本地丢失风险时，才允许提前 push 非 main branch。
- implementation cycle 默认只在最终验收通过后 push `main` 一次。

### 5.4 标准交付流程

```text
freeze design
→ bootstrap one capability branch/worktree
→ implement + local commits + focused tests
→ optional read-only focused review
→ freeze local candidate SHA
→ one read-only acceptance
→ synchronize latest origin/main once
→ regenerate candidate and rerun affected acceptance if main changed
→ local main --ff-only
→ final root verification
→ push main once
```

正常流程禁止 cherry-pick、squash merge、rebase 已共享提交、在 `main` 解冲突或未验收先 push main。

## 6. 环境与权限纪律

### 6.1 一次性 bootstrap

Capability worktree 在 A/I 激活前只初始化一次：

- canonical branch、cwd、HEAD、clean state 和 Git metadata 写入证明；
- frozen dependency install；
- 必要的 ignored generated inputs；
- package build/test 入口；
- 初始化后 `git status` 必须 clean。

后续 Review、Acceptance 和返工不得重复安装整个 workspace。

### 6.2 仓库卫生

- `node_modules`、包管理器链接、构建输出和 generated cache 不得作为 tracked 文件存在。
- frozen install 或 generation 改写 tracked 环境链接时，必须先修复仓库卫生，不能让每个 capability 重复清理。
- 工作面环境缺失与产品失败必须分开报告；不得通过修改业务代码掩盖环境问题。

### 6.3 权限请求

- Git branch/worktree 初始化集中为一次 bootstrap 操作。
- 中间 lane 不执行远端 push/fetch。
- A/R/A/V 不执行 Git metadata 写操作。
- 最终只在 main 同步与 push 时请求远端权限。
- 必须用普通中文说明权限请求的动作、范围、原因和不会改变的内容；禁止只报告 watchdog、metadata、relink 等内部术语。
- 同一未变化的审批只提醒一次，不循环打扰用户。

## 7. 验证与失败处理

### 7.1 Lane gate

A/I 必须做到：

- 授权路径内的实现与总结性注释完整；
- package build/typecheck 和定向测试通过；
- 所有改动已本地 commit；
- worktree clean；
- 无未归属生成物、依赖链接或无关文件。

### 7.2 Candidate acceptance

A/V 只验收精确 candidate SHA。验收失败时：

- 实现问题：恢复同一个 A/I；
- Review/Acceptance harness 问题：恢复同一个 A/R/A/V；
- 设计/契约问题：返回 A/D；
- 跨 capability ownership：A/C 升级 GC；
- 环境问题：保留 candidate，修复环境后重跑。

任何返工都会形成新的 candidate SHA，并只重跑受影响验证与最终必要回归。

## 8. Handoff 最小格式

子任务 terminal 只需包含：

- Thread、Parent、State；
- Branch、Worktree、Base、HEAD、Dirty；
- Changed paths；
- Verification；
- Blocker/dependency（如有）；
- Cleanup state；
- contract/data/permission/security impact 仅在非 `none` 时填写。

A/C 向 GC 只报告 capability state、candidate/main SHA、跨能力 blocker、最终验证和 cleanup state，不转发 worker 回合细节。

## 9. 合并后归档与清理

### 9.1 自动会话收口

Capability 验收并 push main 后，A/C 自动：

- archive 已消费完成的 A/I、A/R、A/V、A/X；
- 停止全局检查器继续检查这些 child；
- 将详细 registry 压缩成 cleanup manifest；
- 保留 A/D、A/C、branch、worktree、commit、cursor 和验证摘要；
- 进入 `MERGED_WAITING_FOR_USER_CLEANUP`。

Archive 可恢复，不等于删除 Git 资源。

### 9.2 用户批准后的 Git 清理

只有用户在合并完成后明确批准，才按顺序执行：

```text
confirm origin/main ancestry and clean worktrees
→ remove worktrees normally
→ delete local branches with git branch -d
→ delete remote non-main branches only if they were exceptionally pushed
→ prune active registry routes
→ mark capability cycle CLOSED
```

禁止把 `-D`、`--force`、`reset --hard` 或批量 `git clean` 当作常规清理。

清理后 GC 只保留不可变关闭摘要：capability、main SHA、verification、children archived、Git resources removed、closedAt。以后复用同一 A/C 时创建新的 execution cycle，不恢复旧活动注册表。

## 10. 命名与迁移

正式任务仍使用：

```text
A/<Role>/<CapabilityKey>[/<Sequence>] · <Task Name>
```

I/R/V/X 使用 role-local 两位序号；返工恢复原任务。禁止用 `OPS`、`R`、`01R`、`01RR` 等充当序号。

v1.3.2 迁移规则：

- 已 active 的 child 不因治理迁移被打断；在下一个稳定 terminal 由 A/C 切换 v2。
- 已完成但未清理的远端 lane/branch 原样保留，等待用户清理批准。
- 新 cycle 和新 child 必须直接使用 v2 Lite。
- per-command watchdog 停用；有 active capability 时只保留一个 Global Command 状态检查器。
- 现有多 lane capability 不强制重写历史，但不得继续为相同 ownership 创建新任务。

## 11. 红线

出现以下情况必须停止：

- child 主动向 active parent 推送 handoff；
- GC 读取 I/R/V/X 终态并替 A/C 裁定；
- 为同一 ownership 创建重复 task/branch/worktree；
- 单 writer capability 无证据创建 A/X；
- 普通风险无证据创建 A/R；
- lane 或 integration branch 默认 push 远端；
- A/R/A/V 写 Git metadata 或修复实现；
- 未验收 candidate 进入 main；
- tracked `node_modules` 或环境 relink 污染被当作每个 lane 的正常成本；
- 合并后不归档已完成 child；
- 未经用户批准删除 branch/worktree。
