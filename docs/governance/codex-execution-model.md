# OES Codex 执行模型

## 1. 目标

本模型用最少角色完成“持续讨论 → 全局冻结 → 并行实现 → 独立复核 → 集成清理”，避免调度 task 长期空转、并发被中心线程限制以及历史状态持续膨胀。

核心约束：

- Human 控制语义决定和波次边界。
- 稳定设计只有一个写者。
- 一个 feature 只有一个临时交付 owner。
- subagent 结果自动返回唯一 parent。
- repository canonical truth 是设计同步媒介。
- 不建立 watcher、heartbeat、Pull inbox、全局执行 registry 或过程账本。

## 2. 角色

### 2.1 Human Decision Owner（HDO）

HDO 是人，不是 Codex task。Human 负责：

- 持续讨论并确认设计意图；
- 确认 Design Proposal 是否提交 UD；
- 处理跨能力语义冲突和设计缺口；
- 决定 feature 波次；
- 确认对受保护 `main` 的最终合并；
- 确认 FL 及其 Git 资源清理。

不同能力可以有不同 Human decision owner，也可以存在长期 owner，但系统不为 HDO 建立线程状态层。

### 2.2 Capability Design Task

一个长期设计 task 只维护一个能力或设计主题。它：

- 与 Human 多轮讨论；
- 每次恢复时刷新相关 canonical truth；
- 必要时维护一个 active Design Workspace；
- 形成真实 Git diff/commit 作为 Proposal Patch；
- 在 Human 明确确认“提交”后向 UD 推送 Proposal。

### 2.3 Global Unified Design（UD）

UD 是一个长期全局架构 task，也是 architecture、ADR 与稳定 contract 设计的唯一写者。它：

- 串行审核来自不同设计 task 的 Proposal；
- 检查全局边界、长期演进、当前真相和提案间冲突；
- 返回 `REVISION_REQUIRED`，或接受并写入 canonical truth；
- 接受后按默认执行意图创建 FL。

UD 不拆 slices、不写 Feature Packet、不管理 IT、不等待执行状态。

### 2.4 Feature Lead（FL）

FL 是一个 feature 的临时交付 owner。它：

- 从 UD 指定的 canonical commit 开始；
- 拆分 1..N 个相关 Frozen Slices；
- 独占写入一个 compact active Feature Packet；
- 选择 review 模式并派发 IT/RI；
- 自己实现一个 lane 或公共基础，保持主 task 有实际产出；
- 收集 candidates、路由返工、触发全局 review、集成与验证；
- 独占 feature 的远端 push、PR、Merge Commit 与合并后验证；
- 到达 `COMPLETE_AWAITING_CLEANUP` 后等待 Human 清理确认。

### 2.5 Implementation Task（IT）

IT 实现一个 slice，读取 Feature Packet 中该 slice 的范围、依赖和验收条件。IT 只在 FL 分配的 branch/worktree 中提交候选 SHA、验证结果和阻塞信息给唯一 parent FL；不直接修改 FP，不 push、不创建 PR、不合并或清理 Git 资源。

小型单 slice feature 可由 FL 直接承担 IT。

### 2.6 Review & Integration（RI）

RI 使用 clean context 审查精确 candidate，不承担持续监控：

- 低风险：FL 自审；
- 中高风险单 slice：局部 RI subagent；
- 多 slice 或跨服务：Global RI subagent。

RI 默认只读精确 candidate，只向 FL 返回按 `sliceId` 标识的 findings、类别和结论；不直接调度 IT 或设计 task，不修改、push、合并或清理 Git 资源。需要修复时由 FL 重新建立 IT slice，不在 RI 身份下写入。

## 3. 主数据流

```text
Human <-> Capability Design Task
              |
              | confirmed Proposal Patch
              v
             UD
        +-----+------------------+
        | REVISION_REQUIRED      | APPROVED + canonical commit
        v                        v
source Design Task              FL
                            +----+----+
                            |  IT...  |  subagent results
                            +----+----+
                                 v
                           local/global RI
                                 |
                       findings by sliceId
                                 v
                                FL
                                 |
                  merge + main validation + writeback
                                 v
                    COMPLETE_AWAITING_CLEANUP
                                 |
                       Human confirms cleanup
```

设计缺口路径固定为：

```text
RI -> FL -> Human -> relevant Design Task -> UD -> canonical update -> FL -> affected IT -> RI
```

实现缺陷路径固定为：

```text
RI -> FL -> original IT -> new candidate -> FL -> RI
```

## 4. Design Proposal 与 UD 串行化

Proposal 至少包含：

```text
proposalId = sourceDesignTaskId + proposalCommit
sourceDesignTaskId
baseCommit
proposalCommit
executionIntent = START_AFTER_APPROVAL | DESIGN_ONLY
```

提交规则：

1. Design Task 先取得 Human 明确提交确认。
2. 推送前随机等待 2–8 秒并检查 UD 状态。
3. UD 空闲时发送；UD 正在运行时等待当前 turn 结束，再次 jitter 并检查，最多三次。
4. 最后一次仍繁忙时使用确保送达的 follow-up，不自行创建另一个 UD。
5. UD 以 `proposalId` 去重，并以 `baseCommit` 检查提案是否过期。
6. UD 始终串行处理 Proposal；唯一写者保证 canonical truth 无写入竞争。

`REVISION_REQUIRED` 由 UD 定向发送给 `sourceDesignTaskId`。接受时 UD 直接写 canonical truth；无需向来源或其他设计 task 广播。其他设计 task 在 Human 恢复、形成 Proposal、推送 UD 前刷新 canonical truth。

## 5. UD Locator

UD 只通过 OES 仓库局部 runtime pointer 定位，不通过标题猜测：

```text
$(git rev-parse --path-format=absolute --git-common-dir)/codex-runtime/ud-target.json
```

最小结构：

```json
{
  "schemaVersion": 1,
  "repositoryRoot": "<absolute-repository-root>",
  "threadId": "<exact-thread-id>",
  "hostId": "<host-id>",
  "expectedTitle": "OES Unified Design"
}
```

写入采用同目录临时文件、flush/fsync 和 atomic rename。使用前验证 repository root、task 精确存在、task project/cwd 属于当前 OES 仓库且标题符合预期。pointer 无效时报告 locator 错误，不按标题回退搜索。该文件位于 Git common directory，不跟踪、不保留历史，UD 替换时直接覆盖。

## 6. Feature Packet 与 slices

一名 FL 对应一个 active FP，包含 1..N 个紧密相关 slices。FP 的 feature 级 Git 指针只记录 `truthCommit`、`baseSha`、`integrationBranch`、`worktreeKey`、`pullRequest`、`mergeSha` 与 `cleanup`；每个 slice 只记录：

- `sliceId`
- scope 与 protected scope
- dependency
- acceptance
- review mode
- current candidate
- current state

状态仅使用：

```text
READY -> RUNNING -> CANDIDATE_READY -> ACCEPTED
```

状态原位覆盖，不追加历史。只有 FL 写 FP；IT/RI 只返回 SHA 与结果。

出现以下任一情况时拆成新的 feature/FL/FP：

- 超过约 5–8 个 slices；
- FP 超过约 250–300 行；
- 存在可独立验收的波次；
- 不同 slices 之间需要长期等待。

## 7. 并行与 review

大型 feature 默认让 FL 自己推进一个 lane，并并行使用最多三个 IT subagents。subagent 完成后结果自动返回唯一 parent FL，FL 无需持续运行 wait loop。

FL 只有在所有 required slices 都达到 `CANDIDATE_READY` 后才创建 Global RI，并提供完整 Review Bundle：

```text
featureKey
baseSha
sliceIds
candidateShas
featurePacket
acceptanceCommands
```

RI 未通过时：

- implementation finding：FL 恢复原 IT；新 candidate 返回 FL 后，FL 重新创建或恢复合适的 RI；
- design finding：FL 将精确问题交给 Human，Human 恢复相关 Design Task；UD 更新真相后，FL 只重启受影响 slices。

review 是否复用原 RI 由上下文质量决定：同一候选的小修复可恢复原 RI；语义变更、范围变化或需要 clean-context 时创建新 RI。路由 owner 始终是 FL。

## 8. 自动与人工边界

自动进行：

- IT subagent → FL 结果返回；
- RI subagent → FL findings 返回；
- FL → 原 IT 返工及新 candidate 返回；
- slices ready 后 FL 创建 Global RI；
- FL 在 required candidates 与 review 通过后 push feature branch 并创建 PR；
- UD 接受并写入真相后，`START_AFTER_APPROVAL` 自动创建 FL。

Human 介入：

- 确认 Design Proposal 提交；
- 作出 HDO 语义决定；
- 处理 design finding；
- 选择 `DESIGN_ONLY`；
- 确认受保护 `main` 的最终合并；
- 恢复已经结束 turn 的长期 FL；
- 确认 FL cleanup。

## 9. Git 资源、PR 与合并协议

本节是 OES task 的 Git 权限与执行唯一真相。GitHub ruleset 是服务端最后防线，task 仍必须执行本节的本地前置检查、角色隔离、验证与清理约束。

仓库必须保持以下 server baseline；settings 与本节不一致即为 blocker：

- active ruleset `protect-main` 作用于默认分支 `main`，bypass 为空；
- 禁止删除和 force-push `main`，所有变更必须经 PR；
- required check 为 `Baseline Checks`，合并前 branch 必须更新到最新 `main`，conversations 必须解决；
- 仅允许 Merge Commit；repository-level Squash、Rebase、auto-merge 与自动删除 head branches 关闭；
- required approvals 在单一 Human reviewer 阶段为 `0`；增加可用 reviewer 时必须由 HDO 同步调整 ruleset 与本节；
- Actions 默认只读，不允许 Actions 创建或批准 PR；workflow 的显式最小权限以 `.github/workflows/ci.yml` 为准。

### 9.1 角色权限矩阵

| 角色 | 可创建的 Git 资源 | 可写范围 | Remote push / PR | 合并 `main` | 清理 |
| --- | --- | --- | --- | --- | --- |
| HDO | 无强制 Git 资源 | 语义确认，不承担 agent 写入 | 确认 Proposal、最终 merge 与 cleanup 边界 | 只作确认 | 只作确认 |
| Capability Design Task | 自己的 proposal branch/worktree | active Design Workspace 与 Proposal Patch | 默认不 push；Human 确认提交后把本地 proposal SHA 交给 UD | 禁止 | Human 确认 Proposal 已接受或放弃后清理自己的 proposal 资源 |
| UD | canonical design integration branch/worktree | architecture、ADR、稳定 contracts 与必要导航 | 仅 push 自己的 design integration branch 并创建 PR | Human 确认后由 UD 执行 Merge Commit | Human 确认后清理自己的 design integration 资源 |
| FL | 一个 feature integration branch/worktree，以及分配给 IT/RI 的 slice worktrees | Feature Packet、integration lane 与被批准的 feature 范围 | 唯一可 push feature branch、创建/更新 PR 的 task | Human 确认后由 FL 执行 Merge Commit | Human 确认后清理整个 feature 的资源 |
| IT | 无；只使用 FL 分配的 slice branch/worktree | 一个 Frozen Slice 的允许路径 | 禁止 | 禁止 | 禁止 |
| RI | 无；只使用 FL 分配的 clean review worktree/context | 默认只读精确 SHA | 禁止 | 禁止 | 禁止 |

同一 task 不兼任相互制衡的角色。小型单 slice feature 可由 FL 同时承担 IT，但最终 candidate、验证和 merge gate 仍按 FL 规则执行。RI 发现问题后由 FL 恢复原 IT 或创建新 IT slice，RI 不就地修复。

### 9.2 Branch 与 worktree 创建

Design Task、UD 或 FL 只能为自己拥有的 proposal/design/feature 创建资源；IT 与 RI 的资源统一由 FL 创建并分配。创建前必须：

1. 读取 `git status --short`、`git worktree list --porcelain`、相关 local refs 与 remote refs；
2. `git fetch origin main`，记录精确 `origin/main` 与 canonical truth SHA；
3. 确认目标 branch 名和 worktree key 均不存在，禁止覆盖、复用或猜测旧资源；
4. 将任何已有 dirty worktree、未跟踪文件、未合并 branch 和不属于当前 feature 的 commit 列入 protected scope；
5. 从精确 SHA 创建 `codex/<feature-key>` 或 `codex/<feature-key>/<slice-id>`，不从含未提交变更的当前目录派生；
6. 创建后重新读取 branch、HEAD、upstream 与 clean status，只有完全匹配才开始写入。

Worktree 使用唯一 `worktreeKey` 定位；仓库文档不记录本机绝对路径，实际路径以 `git worktree list --porcelain` 为准。不得使用 `git clean -fd[x]`、`git reset --hard`、`git worktree prune`、`rm -rf`、`git branch -D` 或任何 force 变体处理未知或既有资源。

FL 必须在派发 IT/RI 或首次写入前填充 FP 的 feature 级 Git 指针。实际 branch、worktree HEAD、remote head 与 FP 任一不一致时暂停该 feature 的后续动作，先由 FL 审计并修正指针或形成新 candidate。

### 9.3 Candidate、review 与集成

IT 每次 handoff 必须返回：

```text
sliceId
baseSha
candidateSha
changedPaths
acceptanceCommands
literalResultsAndExitCodes
remainingRisks
```

候选 SHA 交给 FL 或 RI 后即不可 amend、rebase 或 force-push；返工只追加新 commit 并返回新 candidate。RI 复核精确 SHA，不以工作区“当前内容”代替 candidate。

多 slice feature 中，FL 使用 `git merge --no-ff <accepted-slice-branch>` 集成 accepted candidate，使被验证的 candidate SHA 保持为最终 feature branch 与 `main` 的祖先；不得用 cherry-pick 替换已经记录的 candidate。FL 直接实现的单 slice candidate 可位于 feature branch 本身。

### 9.4 Push、PR 与 required CI

Remote 写入只允许 UD push design integration branch，或 FL push feature integration branch。每次 push 前必须 fetch 并验证：

- `origin/main` 与 FP/Proposal 中记录的基线关系明确；
- local head 是本次精确 candidate；
- remote branch 不存在，或 remote head 等于上一次已确认 head；
- 当前 branch/worktree clean；
- push refspec 只包含 owner branch，不包含 `main`、其他 branches 或 tags。

禁止 direct push 到 `main`，禁止 force-push。PR 必须以 `main` 为 base，并列出范围、protected scope、candidate SHAs、精确验证命令/结果、数据与契约影响、剩余风险和 rollback。

合并 gate 固定为：

- required `Baseline Checks` 成功；
- branch 已更新到最新 `main`；candidate 记录后只允许 merge `origin/main`，不 rebase；
- review findings 和 conversations 全部解决；
- Actions warnings/annotations 视为 findings，修复或由 Human 明确接受；
- PR head 与 FL/UD 报告的精确 SHA 一致；
- GitHub 仅提供 Merge Commit，不使用 Squash 或 Rebase merge。

CI 失败时追加修复 commit 并重新运行 required checks；不得通过改名 required check、降低 ruleset、添加 bypass、扩大 token 权限或跳过验证取得绿色状态。

### 9.5 Merge 与 main 复测

满足全部 gate 后，FL 或 UD 向 HDO 报告 exact PR、head SHA、checks、findings 与 rollback，并等待 Human 明确 merge 确认。确认后由 owner 执行一次 Merge Commit；不得切换合并方式，不自动删除 head branch。

合并后必须用 Git 与 GitHub check/run 数据验证：

1. fetch 后的 `origin/main` 等于 PR 的 `merge_commit_sha`；
2. merge commit 有两个 parent，第二 parent 等于已确认 PR head；
3. 所有 accepted candidate 均通过 `git merge-base --is-ancestor`；
4. merge tree 与最终通过 review/CI 的 feature head 一致，或精确解释并验证 GitHub conflict resolution 产生的差异；
5. `push` 事件在 `main` 的 exact merge SHA 上触发 required workflow；
6. `Baseline Checks` 及其每个 required step 成功，annotations 已处理；
7. 所有 protected worktrees、commits、diffs 与未跟踪文件保持原状。

缺少任一证据时不得声明完成。PR required CI 与合并后的 `main` push CI 是两个独立 gate，均需成功。

### 9.6 完成与清理

main 复测成功且必要真相回写完成后，FL 把 feature 标为：

```text
COMPLETE_AWAITING_CLEANUP
```

此时保留 FP、tasks、local/remote branches、worktrees、candidates、patch、验证记录和 rollback。Human 明确确认 cleanup 后，由 FL 执行：

1. 从最新 `origin/main` 创建独立 cleanup branch/worktree；
2. 只删除已完成 FP，创建 cleanup PR，通过 required CI、Merge Commit 与 main 复测；
3. 再次确认 feature/cleanup worktrees clean、PRs 已 merge、candidates 是 `origin/main` 祖先；
4. 使用无 force 的精确路径 `git worktree remove <path>`；
5. 在以 `origin/main` 为基线的 clean context 使用 `git branch -d <exact-branch>`；
6. 经 Human cleanup 确认，且 remote branch head 仍等于已记录 SHA 时，删除精确 remote temporary branches 并读取 remote refs 验证结果；
7. archive 已完成 FL task。

任何 dirty、未合并、SHA 不匹配、owner 不明或验证失败的资源保持原状并报告。禁止批量匹配删除、自动删除 head branches、全局 prune、force removal、force branch deletion，以及用清理动作顺便处理其他 feature。

### 9.7 失败恢复

- push 前发现 remote head 变化：停止该 push，重新 fetch、审计来源并形成新 candidate；
- main 前进：在 feature branch merge 最新 `origin/main`，重新执行 review 与 CI；
- merge conflict：只在 owner 的 clean integration worktree 解决，列出每个 conflict 与验证；
- CI 或 post-merge 验证失败：保留所有资源与证据，追加正式修复，不改写已发布历史；
- cleanup precondition 失败：保持 `COMPLETE_AWAITING_CLEANUP`，不降级为破坏性命令。

## 10. 完成状态

FL 在 RI 通过、集成完成、main 验证通过且必要真相回写完成后进入：

```text
COMPLETE_AWAITING_CLEANUP
```

此时保留 FP、FL task、branches、worktrees、candidates 与 rollback 信息，并向 Human 报告。Human 明确确认后：

1. 按 9.6 通过 cleanup PR 删除已完成 FP；
2. 清理已合并临时 branches/worktrees/integration 资源；
3. archive FL task；
4. dirty 或未合并资源保持原状并报告。

## 11. 明确排除

本模型不引入：

- 全局执行控制 task；
- capability command 层；
- 长期运行的 PC/IV；
- watcher、heartbeat 或持续 wait loop；
- Pull inbox 或全局 thread registry；
- 广播同步；
- task 历史、状态流水或 cleanup archive 文档。

canonical repository、精确 task id、单一 parent 回传和 Human 决策共同构成协同边界。
