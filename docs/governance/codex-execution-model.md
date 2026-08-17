# OES Codex 执行模型

## 1. 目标

本模型用最少角色完成“讨论与取舍 → 统一设计 → feature 或交付阶段 → 独立复核 → 合并验收 → 分层清理”，同时避免长期调度 task、隐式跨 task 授权和第二状态表。

核心约束：

- Human 控制语义决定、阶段授权、合并与清理边界。
- 稳定设计只有 UD 一个写者；Design Proposal 只承载稳定设计真相。
- 一个 feature 只有一个临时 FL；一个有界交付阶段最多一个临时 SL。
- 单一不可独立合并的跨服务能力归一个 FL；多个可独立安全合并的 feature 才由 SL 协调多个 FL。
- repository canonical truth 是设计同步媒介；task 路由使用 exact task id。
- 不建立 watcher、heartbeat、Pull inbox、全局执行 registry、线程账本或过程历史。

## 2. 角色

### 2.1 Human Decision Owner（HDO）

HDO 是人，不是 Codex task。Human 负责：

- 确认讨论结论、Proposal 提交、Stage Start 与范围变化；
- 处理跨 feature 的优先级、阶段目标、业务取舍和设计缺口；
- 确认受保护 <code>main</code> 的每次 merge；
- 分别确认 FL cleanup，最后确认 Stage Cleanup；
- 对遗留 FP 的精确 Recovery FL 接管范围作出确认。

系统不为 HDO 建立线程状态层。

### 2.2 Initiative Discussion Task（IDT）

IDT 讨论跨 feature 的优先级、阶段目标和业务取舍。它：

- 只分析和形成 Human 可确认的业务决定；
- 不写设计、不提交 Design Proposal、不执行 feature；
- 在 canonical truth 已足够时形成 Stage Start 确认卡；
- 发现设计缺口时转交一个 CDT，经 UD 冻结后再继续；
- 作为其创建的 SL 的唯一非设计决策返回点。

IDT 标题为 <code>OES Discussion — &lt;topic&gt;</code>。

### 2.3 Capability Design Task（CDT）

CDT 只维护一个设计主题。它：

- 与 Human 讨论并在必要时维护一个 active Design Workspace；
- 每次形成 Proposal 前重新读取相关 canonical truth；
- 形成真实本地 Git diff/commit 作为 Proposal Patch；
- 只向 UD 提交 Human 已确认的 Proposal；
- 不创建或协调 SL、FL、IT、RI。

CDT 标题为 <code>OES Design — &lt;design-key&gt;</code>。

### 2.4 Global Unified Design（UD）

UD 是长期全局设计审查 task，也是 architecture、ADR、稳定 contracts 与稳定治理/协同契约的唯一 agent writer。稳定治理/协同契约包括 <code>AGENTS.md</code>、<code>docs/governance/**</code> 与必要导航。它：

- 只串行审核 CDT 的 Human-confirmed Proposal，不自行发起未确认的 canonical 改写；
- 检查全局边界、长期演进、当前真相和提案冲突；
- 返回 <code>REVISION_REQUIRED</code>，或接受并写入 canonical truth；
- 通过 design PR、Human merge 确认和 main CI 完成 truth merge；
- 仅在 truth 已进入 <code>main</code> 且 main CI 通过后，按已确认执行意图创建 FL 或 SL。

UD 不拆 slices、不写 Feature Packet 或 Stage Packet、不管理执行状态。标题固定为 <code>OES Unified Design</code>。

### 2.5 Stage Lead（SL）

SL 是一个已获 Stage Start 授权的有界交付阶段的临时 owner。它：

- 在本地 Stage Packet 中维护 objective、scope、依赖、exit criteria、blocker 与 current state；
- 启动前检查 active FP、写路径、contract/shared scope 重叠；
- 按依赖与运行容量启动已就绪 FL，不持续轮询或建立 watcher；
- 接收 FL 的关键里程碑，安排 Stage Review 和依赖顺序；
- 用精确 FL candidates 在临时本地 verification worktree 验证阶段组合；
- 在全部 feature 合并后于最新 <code>main</code> 执行阶段退出验收；
- 各 FL 分别完成 cleanup 后，经 Human 确认清理自身本地资源并关闭。

SL 无产品交付 branch，不写产品代码或 FL 的 FP，不 push、不创建 PR、不合并 <code>main</code>，也不清理 FL 资源。标题为 <code>OES Stage — &lt;stage-key&gt;</code>。

### 2.6 Feature Lead（FL）

FL 是一个 feature 的临时交付 owner。它：

- 从指定 canonical truth commit 开始；
- 拆分 1..N 个相关 Frozen Slices；
- 独占写入一个 compact active Feature Packet；
- 派发 IT/RI，集成 candidates 并执行 feature 验证；
- 保证自己的 PR 可独立、安全、兼容地进入 <code>main</code>；
- 独占 feature 的 remote push、PR、Merge Commit、合并后验证和自身 cleanup；
- 有 parent SL 时，只向该唯一 SL 返回规定的关键里程碑。

FL 标题为 <code>OES Feature — &lt;feature-key&gt;</code>。

### 2.7 Implementation Task（IT）

IT 实现一个 Frozen Slice，只使用 FL 分配的 branch/worktree。它向唯一 parent FL 返回 candidate SHA、验证和阻塞；不写 FP，不 push、不创建 PR、不合并或清理资源。

小型单 slice feature 可由 FL 直接承担 IT。独立 IT 标题为 <code>OES Implementation — &lt;feature-key&gt;/&lt;slice-id&gt;</code>。

### 2.8 Review & Integration（RI）

RI 使用 clean context 审查精确 candidate，不承担持续监控：

- 低风险：FL 自审；
- 中高风险单 slice：local RI；
- 多 slice 或跨服务：Global RI；
- 阶段组合：由 SL 创建 Stage RI。

RI 默认只读精确 SHA，只向 parent 返回 findings 和结论；不直接调度下游、不就地修复、不 push、合并或清理。feature RI 标题为 <code>OES Review — &lt;feature-key&gt;/&lt;scope&gt;</code>；Stage RI 标题为 <code>OES Review — &lt;stage-key&gt;/stage</code>。

标题只供 Human 识别；所有路由、授权与回传均使用 exact task id。

## 3. 主数据流

当现有真相足够时：

~~~text
Human <-> IDT
             |
             | confirmed Stage Start
             v
             SL
        +----+----+
        | FL ...  |  independently mergeable features
        +----+----+
             |
     Stage Review + ordered merge
             |
      main stage acceptance
             |
 FL cleanup confirmations, then Stage Cleanup
~~~

存在设计缺口时：

~~~text
Human/IDT -> CDT -> confirmed Design Proposal -> UD
                                             |
                         truth merged to main + main CI passed
                                             |
                    executionIntent / executionShape
                         |                         |
                  SINGLE_FEATURE             DELIVERY_STAGE
                         v                         v
                         FL                        SL
~~~

<code>DESIGN_ONLY / NONE</code> 在 truth merge 后停止，不创建执行角色。

feature 内部路径：

~~~text
FL -> IT candidates -> local/global RI -> FL -> PR_READY
                           |
                 implementation finding
                           v
                     FL -> IT -> RI

design finding -> FL -> Human -> CDT -> UD -> truth merge -> affected FL/IT -> RI
~~~

阶段问题路径：

~~~text
Stage RI -> SL -> corresponding FL -> IT/RI
design gap -> Stage RI -> SL -> Human -> CDT -> UD -> affected FL
non-design decision -> SL -> exact source IDT -> DECISION_RESOLVED -> SL
~~~

若非设计决定改变 scope、order 或 protected scope，原 Stage Start 授权失效，必须重新发 Stage Change 或 Stage Start 确认卡；未改变这些绑定时，IDT 返回 <code>DECISION_RESOLVED</code> 后 SL 继续。

## 4. Design Proposal、Stage Start 与受控委派

### 4.1 Proposal schema

Proposal 至少包含：

~~~text
proposalId = sourceDesignTaskId + proposalCommit
sourceDesignTaskId
baseCommit
proposalCommit
intendedCanonicalFiles
canonicalTruthDomains = ARCHITECTURE | ADR | CONTRACT | GOVERNANCE
executionIntent = DESIGN_ONLY | START_AFTER_TRUTH_MERGE
executionShape = NONE | SINGLE_FEATURE | DELIVERY_STAGE
sourceDecisionTaskId (required for DELIVERY_STAGE)
~~~

CDT 推荐 execution intent/shape，并在 Proposal 确认卡中展示，由 Human 确认。组合约束：

- <code>DESIGN_ONLY</code> 必须对应 <code>NONE</code>；
- <code>START_AFTER_TRUTH_MERGE</code> 必须对应 <code>SINGLE_FEATURE</code> 或 <code>DELIVERY_STAGE</code>；
- <code>START_AFTER_APPROVAL</code> 不再使用；
- Design Proposal 只承载稳定设计真相，始终提交 UD；
- <code>intendedCanonicalFiles</code> 必须属于 UD 的唯一写者范围，并与 <code>canonicalTruthDomains</code> 一致；治理域包括 <code>AGENTS.md</code>、<code>docs/governance/**</code> 与必要导航；
- Stage Start 是执行授权，不叫 Proposal，也不经过 UD。

CDT 先取得 Human Proposal 提交确认，再按 UD locator 发送。UD 以 <code>proposalId</code> 去重，以 <code>baseCommit</code> 检查过期，并串行处理。<code>REVISION_REQUIRED</code> 只返回 source CDT。UD 接受后由 UD 写真相；只有 design PR 已合入 <code>main</code> 且 exact main CI 通过，才执行 <code>START_AFTER_TRUTH_MERGE</code>。

### 4.2 Human 授权转移与 parent assignment

确认只在发出确认卡的 task 中绑定。跨 task 协同分为两种不同机制：

1. **Human authorization envelope**：发卡 task 把一次已确认授权传给卡中列明的直接执行 task；只允许 CDT → UD、IDT → SL、UD → FL 或 UD → SL。
2. **Parent assignment**：已获授权的 SL/FL 在确认卡预先列明的执行拓扑内，把更窄的工作分配给 child；只允许 SL → FL、SL → Stage RI、FL → IT/RI。这不是新的 Human 授权，也不是 authorization envelope 的转发。

authorization envelope 至少绑定：

~~~text
sourceTaskId
confirmationKind
rootConfirmationFingerprint
confirmedAtState
parentRole
childRole
targetKey
objective
scope
protectedScope
allowedChildGraph
allowedResources
stopPoint
exactTruthOrCandidateRefs
sourceDecisionTaskId
~~~

parent assignment 必须携带 <code>rootConfirmationFingerprint</code> 和直接 parent exact task id，继承 root scope/protected scope/truth refs，只能缩小为 child scope、资源、acceptance/review 输入和 stop point。child 不获得修改 root scope/order/protected scope、创建未列明角色、merge、cleanup 或再分配到允许边之外的权限。

允许边及字段继承：

| 边 | 类型 | 必须继承 | 新增或收窄绑定 | 停止点 |
| --- | --- | --- | --- | --- |
| CDT → UD | Human authorization envelope | Proposal confirmation fingerprint、source CDT、base/proposal SHA、canonical domains/files、execution intent/shape、protected scope | exact UD locator | <code>REVISION_REQUIRED</code> 或 Proposal 接受决定 |
| IDT → SL | Human authorization envelope | source IDT、Stage Start fingerprint、objective、scope/protected scope、truth refs、feature graph/order、exit criteria | exact SL、stage resources | <code>STAGE_AWAITING_CLEANUP</code>；Stage Cleanup 另行确认 |
| UD → FL | Human authorization envelope | confirmed Proposal fingerprint、<code>START_AFTER_TRUTH_MERGE / SINGLE_FEATURE</code>、scope/protected scope | exact merged truth/main CI、FL key/resources | <code>PR_READY</code>；merge 另行确认 |
| UD → SL | Human authorization envelope | confirmed Proposal fingerprint、<code>START_AFTER_TRUTH_MERGE / DELIVERY_STAGE</code>、source decision task、objective、scope/protected scope、feature graph/order、exit criteria | exact merged truth/main CI、SL resources | <code>STAGE_AWAITING_CLEANUP</code>；Stage Cleanup 另行确认 |
| SL → FL | parent assignment | root fingerprint、source decision task、stage key、truth refs、stage scope/protected scope、feature graph/order | exact FL、feature/FP key、允许写路径、依赖、acceptance、resources | <code>PR_READY</code> 与 <code>READY_FOR_STAGE_REVIEW</code>；merge 另行确认 |
| SL → Stage RI | parent assignment | root fingerprint、stage key、truth refs、protected scope、exact FL candidates | review bundle、只读 verification resources | findings 或通过结论 |
| FL → IT/RI | parent assignment | root fingerprint、parent FL、feature key、truth refs、feature scope/protected scope | slice/review scope、candidate、acceptance、assigned resources | candidate handoff 或 review findings/结论 |

规则：

1. 确认卡在确认前列出 root 子角色图、每条允许边的最大范围、保护范围、资源和停止点。
2. authorization envelope 只能沿表中 Human authorization edge 发送一次；接收者不得复制、改写或再次发送同一个 envelope。唯一后续激活是 UD 在 truth merge/main CI gate 后，按 Proposal 确认中预封存的 shape、child graph 和 scope 生成一个新的 UD → FL/SL execution activation envelope；UD 不得添加或改写字段。
3. parent assignment 只沿表中 child edge 发生；child graph、scope、order、protected scope 或资源上限变化时，返回发卡 task 重新取得 Human 确认。
4. 接收 task 在写入前校验 root fingerprint、direct parent、truth/candidate、资源 owner 和 stop point；不匹配即停止。
5. merge 与 cleanup 始终由对应 UD、FL 或 SL 在自身 task 内取得独立 Human 确认，不属于任一 envelope/assignment。
6. IT、feature RI 与 Stage RI 没有继续创建 child 的边；FL 不能创建其他 FL/SL，SL 不能创建 IT 或替 FL 创建 RI。
7. task title 不参与授权绑定，所有边使用 exact task id。

## 5. UD Locator

UD 只通过 OES 仓库局部 runtime pointer 定位，不通过标题猜测：

~~~text
$(git rev-parse --path-format=absolute --git-common-dir)/codex-runtime/ud-target.json
~~~

最小结构：

~~~json
{
  "schemaVersion": 1,
  "repositoryRoot": "REPOSITORY_ROOT",
  "threadId": "EXACT_THREAD_ID",
  "hostId": "HOST_ID",
  "expectedTitle": "OES Unified Design"
}
~~~

写入采用同目录临时文件、flush/fsync 和 atomic rename。使用前验证 repository root、task 精确存在、task project/cwd 属于当前 OES 仓库且标题符合预期。pointer 无效时报告 locator 错误，不按标题搜索，也不创建第二个 UD。该文件位于 Git common directory，不跟踪、不保留历史，UD 替换时直接覆盖。

## 6. Delivery Stage、Feature 与 active packet

### 6.1 执行形状

- 一个不可独立合并、需要共同原子验收的跨服务能力：一个 FL、多个 slices、一个 Global RI、一个 PR。
- 多个可独立安全合并且共享阶段目标的 feature：一个 SL 管理多个 FL；每个 FL 独立 branch/worktree/FP/RI/PR/merge。
- 任一 FL PR 必须独立、安全、向后兼容地进入 <code>main</code>。
- feature 写路径或共享 contract scope 重叠时，按依赖顺序执行；无法保持独立安全时合并为一个 FL。
- SL 启动 FL 前检查 active FP、允许写路径、protected scope、contract/shared scope 和依赖，不接管未知或已有 owner 的资源。

### 6.2 Stage Packet

一个 SL 对应一个 Stage Packet，逻辑路径：

~~~text
docs/plans/stages/STAGE_KEY.md
~~~

Stage Packet 只存在于 SL 的本地 stage coordination branch/worktree，只记录：

- objective；
- scope 与 protected scope；
- source IDT exact id；
- canonical truth baseline；
- FL exact references、允许范围和依赖；
- exit criteria；
- blocker 与 current state。

字段原位覆盖。它不保存聊天、时间线、task/thread registry、watcher 状态、IT candidate 细节或 FP 副本。Stage Packet 不 push、不创建 PR、不合入 <code>main</code>。

### 6.3 Feature Packet 与 slices

一名 FL 对应一个 active FP。feature 级 Git 指针只记录 <code>truthCommit</code>、<code>baseSha</code>、<code>integrationBranch</code>、<code>worktreeKey</code>、<code>pullRequest</code>、<code>mergeSha</code> 与 <code>cleanup</code>；每个 slice 只记录：

- <code>sliceId</code>；
- scope 与 protected scope；
- dependency；
- acceptance；
- review mode；
- current candidate；
- current state。

slice 状态只使用：

~~~text
READY -> RUNNING -> CANDIDATE_READY -> ACCEPTED
~~~

状态原位覆盖，不追加历史。只有 FL 写 FP；IT/RI 只返回 SHA 与结果。超过约 5–8 个 slices、FP 超过约 250–300 行、存在可独立验收波次或长期等待时，应拆为可独立 feature，并在需要共同阶段目标时由 SL 协调。

## 7. Stage 生命周期、并行与 review

### 7.1 Stage 生命周期

~~~text
STAGE_AUTHORIZED
  -> FL_COORDINATION
  -> STAGE_REVIEW
  -> ORDERED_MERGE
  -> MAIN_STAGE_ACCEPTANCE
  -> FL_CLEANUP
  -> STAGE_AWAITING_CLEANUP
  -> CLOSED
~~~

- <code>STAGE_AUTHORIZED</code>：Stage Start 绑定有效，SL 创建本地 Stage Packet。
- <code>FL_COORDINATION</code>：按依赖与运行容量启动 ready FL。
- <code>STAGE_REVIEW</code>：用精确 FL candidate 和 review bundle 做组合验证。
- <code>ORDERED_MERGE</code>：每个 FL 分别取得 merge 确认并按依赖顺序合并。
- <code>MAIN_STAGE_ACCEPTANCE</code>：全部合并后，SL 在最新 <code>main</code> 执行 exit criteria。
- <code>FL_CLEANUP</code>：各 FL 在各自 task 内分别取得 cleanup 确认并清理。
- <code>STAGE_AWAITING_CLEANUP</code>：所有 FL cleanup 完成，等待 SL task 内 Stage Cleanup 确认。
- <code>CLOSED</code>：SL 本地 Stage Packet、coordination/verification 资源已清理，SL 已 archive。

### 7.2 FL 里程碑与容量

FL 有 parent SL 时只主动返回：

- <code>BLOCKED</code>：阻塞原因、owner 与所需决定；
- <code>PR_READY</code>：独立 PR gates 已满足；
- <code>READY_FOR_STAGE_REVIEW</code>：精确 accepted candidate 和 Stage Review bundle 已就绪；
- <code>MERGED</code>：merge SHA 与 main 验证结果。

SL 不持续 poll/wait，不创建 watcher 或 registry。subagent 结果自动回唯一 parent；SL 仅在消息到达或 Human 恢复时推进，并按运行容量启动依赖 ready 的 FL。

### 7.3 Review 与返工

FL 在 required slices 达到 <code>CANDIDATE_READY</code> 后创建 Global RI，并提供：

~~~text
featureKey
baseSha
sliceIds
candidateShas
featurePacket
acceptanceCommands
~~~

Stage Review bundle 至少包含：

~~~text
stageKey
truthBaseline
orderedFeatureKeys
exactFeatureCandidates
featureReviewResults
dependencyAssumptions
stageAcceptanceCommands
~~~

SL 可为 Stage Review 创建 clean-context Stage RI；SL 或 Stage RI 只读精确 candidates。失败路由：

- implementation finding：Stage RI → SL → corresponding FL → IT/RI；
- design gap：Stage RI → SL → Human → CDT → UD → affected FL；
- non-design decision：SL → exact source IDT → `DECISION_RESOLVED` → SL；
- candidate 变化：旧 Stage Review 失效，重新验证新 exact candidate；
- 上游 merge 后：下游 FL merge 最新 <code>main</code>，追加 candidate commit，重跑自身 review/CI，并在 Stage Review 依赖受影响时重跑相应阶段验证。

## 8. 自动与人工边界

自动进行：

- IT → FL candidate 回传；
- RI → parent findings 回传；
- FL → 原 IT 返工；
- FL required candidates ready 后创建 Global RI；
- confirmed Human authorization envelope 内列明的直接执行 task 创建与初始化；
- confirmed topology 内，SL → FL/Stage RI 与 FL → IT/RI 使用收窄的 parent assignment，不重复取得 Human 确认；
- UD 在 truth merge 和 exact main CI 通过后，按 <code>START_AFTER_TRUTH_MERGE</code> 创建已确认 shape 的 FL 或 SL；
- SL 按已确认范围和可用容量启动依赖 ready 的 FL；
- feature candidates 与 review 通过后，由 FL push feature branch 并创建 PR；
- FL 仅向 parent SL 返回规定里程碑。

Human 介入：

- 确认 Design Workspace 写入、Proposal 提交、Stage Start/Change；
- 作出 HDO 语义决定与非设计阶段决定；
- 处理 design finding；
- 确认每个 PR 的 merge；
- 分别确认每个 FL cleanup；
- 在全部 FL cleanup 后确认 Stage Cleanup；
- 确认遗留 FP 的精确 Recovery FL 接管范围；
- 恢复已经结束 turn 的长期或临时 owner task。

## 9. Git 资源、PR 与合并协议

本节是 OES task 的 Git 权限与执行唯一真相。GitHub ruleset 是服务端最后防线，task 仍必须执行本节本地前置检查、角色隔离、验证与清理约束。

仓库必须保持以下 server baseline；不一致即为 blocker：

- active ruleset <code>protect-main</code> 作用于默认分支 <code>main</code>，bypass 为空；
- 禁止删除和 force-push <code>main</code>，所有变更必须经 PR；
- required check 为 <code>Baseline Checks</code>，合并前 branch 必须更新到最新 <code>main</code>，conversations 必须解决；
- 仅允许 Merge Commit；Squash、Rebase、auto-merge 与自动删除 head branches 关闭；
- required approvals 在单一 Human reviewer 阶段为 0；增加 reviewer 时由 HDO 同步调整；
- Actions 默认只读，显式最小权限以 workflow 为准。

### 9.1 角色权限矩阵

| 角色 | 可创建的 Git 资源 | 可写范围 | Remote push / PR | 合并 main | 清理 |
| --- | --- | --- | --- | --- | --- |
| HDO | 无强制资源 | 只作语义与 gate 确认 | 只作确认 | 只作确认 | 只作确认 |
| IDT | 默认无 | 不写 repository 文档或代码 | 禁止 | 禁止 | 无 |
| CDT | 自己的 proposal branch/worktree | Workspace 与 Proposal Patch 的确认范围 | 默认不 push；把本地 SHA 交 UD | 禁止 | Proposal 接受或放弃后经确认清理自身资源 |
| UD | canonical design integration branch/worktree | 只按 Human-confirmed Proposal 写 architecture、ADR、稳定 contracts、<code>AGENTS.md</code>、<code>docs/governance/**</code> 与必要导航 | 只 push 自己的 design branch 并创建 PR | Human 确认后执行 Merge Commit | Human 确认后清理自身资源 |
| SL | 一个本地 stage coordination branch/worktree；一个临时本地 verification worktree | 只写 Stage Packet；verification 默认只读 candidates | 禁止 | 禁止 | Stage Cleanup 确认后只清理自身本地资源 |
| FL | 一个 feature integration branch/worktree 及分配的 slice worktrees | FP、integration lane 与 feature 允许范围 | 唯一可 push feature branch、创建/更新 PR | Human 确认后执行 Merge Commit | Human 确认后清理整个 feature 资源 |
| IT | 无；使用 FL 分配资源 | 一个 Frozen Slice | 禁止 | 禁止 | 禁止 |
| RI | 无；使用 parent 分配的 clean context | 默认只读精确 SHA | 禁止 | 禁止 | 禁止 |

同一 task 不兼任相互制衡角色。SL 不拥有产品 delivery branch，不写 FL 的 FP；所有产品 branch/worktree/PR/merge 归对应 FL。

### 9.2 Branch 与 worktree 创建

CDT、UD、SL 或 FL 只能为自己拥有的资源创建 branch/worktree；IT/RI 资源由 parent 创建。创建前必须：

1. 读取 <code>git status --short</code>、<code>git worktree list --porcelain</code>、相关 local/remote refs；
2. fetch <code>origin main</code>，记录 exact <code>origin/main</code> 与 truth SHA；
3. 确认目标 key、owner 和资源状态；未知既有资源列入 protected scope；
4. 列出 dirty worktree、未跟踪文件、未合并 branch 和其他 task commit；
5. 从 exact SHA 创建 owner 约定的 branch/worktree，不从 dirty 目录派生；
6. 重新读取 branch、HEAD、upstream 与 clean status，完全匹配才写入。

不得用 <code>git clean -fd[x]</code>、<code>git reset --hard</code>、<code>git worktree prune</code>、递归删除、force worktree removal 或 force branch deletion处理未知或既有资源。

SL 的 coordination branch 只提交当前 Stage Packet，永不 push；verification worktree 使用 detached exact candidates 或临时本地 refs，不形成产品 branch。Stage Packet 当前字段原位更新，Git commit 只为本地 crash recovery，不构成状态账本。

### 9.3 Candidate、review 与阶段验证

IT handoff 必须返回：

~~~text
sliceId
baseSha
candidateSha
changedPaths
acceptanceCommands
literalResultsAndExitCodes
remainingRisks
~~~

candidate 交给 FL 或 RI 后不得 amend、rebase 或 force-push；返工追加 commit。RI 审精确 SHA，不以工作区当前内容替代 candidate。

多 slice feature 使用 <code>git merge --no-ff ACCEPTED_SLICE_BRANCH</code> 集成，使 accepted candidate 保持祖先；不得用 cherry-pick 替换已记录 candidate。

SL 的 verification worktree 只用于 checkout/merge 精确 FL candidates 和运行 Stage Review。任何临时组合 commit/refs 均保持 local、不得 push、不得成为 FL candidate；验证报告记录输入 SHA、命令、literal result 和 exit code。Stage Review 不授予 SL 修改产品代码或解决 FL conflict 的权限。

### 9.4 Push、PR 与 required CI

Remote 写入只允许 UD push design integration branch，或 FL push feature integration branch。每次 push 前 fetch 并验证：

- <code>origin/main</code> 与 FP/Proposal baseline 关系明确；
- local head 是 exact candidate；
- remote branch 不存在，或 remote head 等于已记录 head；
- owner worktree clean；
- refspec 只包含 owner branch，不含 <code>main</code>、其他 branches 或 tags。

禁止 direct push 到 <code>main</code> 和 force-push。PR 以 <code>main</code> 为 base，并列出 scope、protected scope、candidate SHAs、精确验证、数据/契约影响、剩余风险和 rollback。

merge gate：

- <code>Baseline Checks</code> 成功；
- branch 已 merge 最新 <code>main</code>，不 rebase；
- findings、conversations 和 annotations 已处理；
- PR head 与 owner 报告 SHA 一致；
- 只使用 Merge Commit。

CI 失败时追加正式修复 commit 并重跑，不降低 ruleset、添加 bypass、扩大 token 权限或跳过验证。

### 9.5 Merge 顺序与 main 复测

单 feature 或阶段中的每个 FL 都必须发独立 merge 确认卡。确认后由该 FL 执行一次 Merge Commit，不自动删除 branch。

阶段按依赖顺序逐个 merge：

1. SL 确认相应 Stage Review 对 exact FL candidate 有效；
2. 对应 FL 展示独立 merge 卡并取得 Human 确认；
3. FL 执行 Merge Commit 和 post-merge main 验证，返回 <code>MERGED</code>；
4. 上游 merge 后，下游 FL merge 最新 <code>main</code>，重新 review、CI 和必要 Stage Review；
5. 全部 FL merge 后，SL 在 latest <code>main</code> 运行 stage exit criteria。

每次 merge 后必须验证：

1. fetch 后 <code>origin/main</code> 等于 PR <code>merge_commit_sha</code>；
2. merge commit 有两个 parent，第二 parent 等于 confirmed PR head；
3. accepted candidates 均为 merge SHA 祖先；
4. merge tree 与通过 review/CI 的 head 一致，或精确解释差异；
5. exact main merge SHA 触发 required workflow；
6. <code>Baseline Checks</code> 及 required steps 成功；
7. protected resources 保持原状。

PR CI 与 main push CI 是两个独立 gate。

### 9.6 完成、分层清理与 Recovery FL

单独 feature 在 main 复测成功后进入 <code>COMPLETE_AWAITING_CLEANUP</code>。Human 在该 FL task 确认 cleanup 后，由 FL：

1. 从 latest <code>origin/main</code> 创建独立 cleanup branch/worktree；
2. 只删除该 FP，经 cleanup PR、required CI、Merge Commit 和 main 复测；
3. 验证 PR 已 merge、candidates 为 <code>origin/main</code> 祖先、精确资源 clean；
4. 使用无 force 的精确路径移除 worktrees 和已合并 local branches；
5. remote head 仍等于记录 SHA 时删除精确 remote temporary branches并复读 refs；
6. archive FL。

有 SL 时，stage main acceptance 通过后，各 FL 仍在各自 task 内分别取得 Human cleanup 确认并执行上述流程。SL 不清理 FL 资源。全部 FL cleanup 完成后，SL 进入 <code>STAGE_AWAITING_CLEANUP</code> 并展示 Stage Cleanup 卡。Human 确认后，SL：

1. 复核 exact FL cleanup results、Stage Packet scope 与本地资源 owner；
2. 删除 Stage Packet 并提交本地 deletion，使 coordination worktree clean；
3. 精确移除 verification 与 coordination worktrees；
4. 以 expected old SHA 使用 compare-and-delete 删除只属于该 stage 的 local refs；
5. 验证 Stage Packet、worktrees 和 refs 均消失，protected scope 未变；
6. archive SL。

stage coordination commits 不 push、不合入 <code>main</code>，删除 ref 后不保留可达历史。任何 dirty、SHA 不匹配、owner 不明或未列入确认卡的资源保持原状。

遗留 FP 只能按 Recovery FL 接管：先确认原 owner 不再活动，再由 Human 对列明 FP、refs/worktrees、允许范围和 protected scope 发独立确认，创建一个 Recovery FL。禁止批量匹配或接管未知资源。

### 9.7 Human 命令契约

本小节是 Human 与 task 之间意图识别、确认、委派、merge 与 cleanup 绑定的唯一真相，版本为 <code>OES-COLLAB-COMMANDS/v3</code>。Human 使用自然语言表达目标；technical ids 由 task 读取真实状态并交叉校验。

<!-- BEGIN OES_COLLAB_COMMANDS_V3 -->

#### 9.7.1 自然语言入口

自然语言输入只表达意图，不直接授权持久状态变化。task 先识别目的并返回一张确认卡；Human 确认后才执行卡中动作。纯查看、解释、讨论、状态读取和“暂停并保留现场”直接响应。

| Human 意图示例 | task 的响应 |
| --- | --- |
| “讨论这个交付阶段的目标和优先级” | IDT 内只讨论；若需独立 IDT，先发创建确认卡。 |
| “把这个设计结论记录下来” | CDT 发 Workspace 或 Proposal 形成确认卡。 |
| “提交这个设计，只做设计” | CDT 发 Proposal 卡，绑定 <code>DESIGN_ONLY / NONE</code>。 |
| “设计合入后开始这个 feature” | CDT 发 Proposal 卡，绑定 <code>START_AFTER_TRUTH_MERGE / SINGLE_FEATURE</code>。 |
| “设计合入后启动这个阶段” | CDT 发 Proposal 卡，绑定 <code>START_AFTER_TRUTH_MERGE / DELIVERY_STAGE</code>。 |
| “按现有设计启动这个交付阶段” | IDT 发 Stage Start 卡；Human 确认后受控委派给 SL。 |
| “调整阶段范围或顺序” | SL 或 source IDT 发 Stage Change 卡，旧 Stage Start 授权失效。 |
| “阶段可以清理了” | SL 发独立 Stage Cleanup 卡，不包含 FL cleanup。 |
| “开始实现这个功能” | owner 发 feature 卡，绑定 truth SHA、范围和 FL。 |
| “按复核意见修复” | FL 发返工卡，绑定 slice、candidate 和 findings。 |
| “合并吧” | 对应 UD/FL 发独立 merge 卡；不触发其他 PR。 |
| “可以清理了” | 对应 FL 发独立 feature cleanup 卡。 |
| “接管遗留 FP” | 发 Recovery FL 卡，逐项绑定已失活 owner 与精确资源。 |
| “放弃这项工作” | owner 发放弃卡，逐项列出证据保留和资源处理。 |

Proposal、Stage Start、Stage Change、feature start、merge、feature cleanup、Stage Cleanup、Recovery FL 和放弃是相互独立的确认边界。

#### 9.7.2 任务确认卡

状态变更前，task 返回一张且仅一张当前待确认卡，至少包含：

~~~text
待确认任务
目的
目标对象
计划动作
修改范围
保护范围
执行角色
子角色与受控委派
允许的授权/assignment 边及每条边的最大范围
验证
停止点
内部绑定
请确认
~~~

“执行角色”可为 IDT、CDT、UD、SL、FL、IT 或 RI；创建新 task 时必须列出 root child graph，以及每条 Human authorization/parent assignment 边的角色、继承字段、最大允许范围、保护范围、资源和停止点。Proposal 卡必须显示 canonical truth domains/files、recommended executionIntent/executionShape；非 <code>DESIGN_ONLY</code> 时还显示 UD → FL/SL 及后续允许 child graph。Stage Start/Change 卡必须显示 objective、scope、protected scope、source IDT、SL → FL/Stage RI、FL → IT/RI 的最大范围、依赖/顺序、exit criteria 和各层停止点。merge 卡不含 cleanup；Stage Cleanup 卡不含任何 FL 资源。

#### 9.7.3 确认绑定、委派与失效

- 同一 task 同一时刻只允许一张未决确认卡；新意图使旧卡作废。
- Human 对最新卡作无附加条件的明确确认，即绑定该卡；Human 无须复述技术参数。
- 改变目标、范围、顺序、保护范围、角色、合并方式或停止点的回复视为新意图，重新发卡。
- 执行前复读内部绑定；truth、candidate、PR head、main、checks、findings、owner、branch/worktree 或 protected scope 变化时重新发卡。
- 确认只在发卡 task 中有效；跨 task 的 Human 授权只使用 4.2 的 authorization envelope，拓扑内 child 工作只使用收窄的 parent assignment。
- authorization envelope 不转发；parent assignment 不扩权。merge 与 cleanup 不属于两者；范围或 child graph 变化后 root 确认失效。
- title 只供识别，路由与授权使用 exact task id。

#### 9.7.4 技术参数由 task 负责

task 内部维护：

- stable lower-kebab-case design/feature/stage/slice key；
- full 40-character commit SHA；
- exact task id、source IDT、owner、worktree key、branch/ref 和 state fingerprint；
- PR number、head SHA、base/main、checks、findings 和 conversations；
- cleanup 绑定的 merge SHA 及逐项 local/remote resources；
- root confirmation/envelope fingerprint、allowed child graph、每个 assignment 的 direct parent 与 stop point。

合并卡显示 exact PR、摘要、head、base/main、required checks、findings、Merge Commit 和 rollback。确认后 owner 再次校验 SHA，并用 GitHub API/CLI 执行 exact-SHA merge。

feature cleanup 卡显示 main 复测和每个 FL 资源。Stage Cleanup 卡显示所有 FL cleanup 完成证据、Stage Packet 与每个 SL local ref/worktree。卡外、dirty、未合并、owner 不明或 SHA 不匹配资源保持原状。

#### 9.7.5 Shortcut

在 Codex 中调用 <code>$oes-collaboration-commands</code> 只读取并展示本小节，不创建资源或推进 gate。

<!-- END OES_COLLAB_COMMANDS_V3 -->

### 9.8 失败恢复

- push 前 remote head 变化：停止 push，fetch、审计并形成新 candidate；
- main 前进：owner branch merge latest <code>origin/main</code>，重新 review 与 CI；
- conflict：只由对应 owner 在 clean integration worktree 解决并验证；
- CI 或 post-merge 验证失败：保留资源与证据，追加正式修复，不改写历史；
- Stage Review 失败：按 finding 类型返回对应 FL 或 CDT，不由 SL 修产品代码；
- cleanup precondition 失败：保持 awaiting cleanup 状态，不使用破坏性命令；
- source IDT 或 FL owner 不明确：暂停受影响动作，保持资源，不建立 registry 猜测 owner。

## 10. 完成状态

单 feature 完成状态：

~~~text
COMPLETE_AWAITING_CLEANUP -> CLEANED
~~~

交付阶段完成状态：

~~~text
MAIN_STAGE_ACCEPTANCE
  -> FL_CLEANUP
  -> STAGE_AWAITING_CLEANUP
  -> CLOSED
~~~

任何完成声明必须绑定 exact commits、commands、literal outputs 和 exit codes。<code>CLOSED</code> 前不得遗留可达 Stage Packet、stage coordination/verification worktree 或 stage local ref。

## 11. 明确排除

本模型不引入：

- 长期全局执行控制 task；SL 只是已确认 scope 内的有界临时 owner；
- capability command 层或长期 PC/IV；
- watcher、heartbeat、持续 wait loop、Pull inbox 或全局 thread registry；
- 广播同步；
- task 历史、状态流水、迁移账本或 cleanup archive；
- 由 SL 代替 FL 拥有产品 branch、PR、merge 或 cleanup；
- 把 Stage Start 称为 Proposal，或在 truth merge/main CI 之前启动执行。

canonical repository、exact task id、单一 parent 回传、受控委派和 Human gate 共同构成协同边界。
