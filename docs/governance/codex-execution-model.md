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
- 到达 `COMPLETE_AWAITING_CLEANUP` 后等待 Human 清理确认。

### 2.5 Implementation Task（IT）

IT 实现一个 slice，读取 Feature Packet 中该 slice 的范围、依赖和验收条件。IT 提交候选 SHA、验证结果和阻塞信息给唯一 parent FL，不直接修改 FP。

小型单 slice feature 可由 FL 直接承担 IT。

### 2.6 Review & Integration（RI）

RI 使用 clean context 审查精确 candidate，不承担持续监控：

- 低风险：FL 自审；
- 中高风险单 slice：局部 RI subagent；
- 多 slice 或跨服务：Global RI subagent。

RI 只向 FL 返回按 `sliceId` 标识的 findings、类别和结论，不直接调度 IT 或设计 task。

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

一名 FL 对应一个 active FP，包含 1..N 个紧密相关 slices。每个 slice 只记录：

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
- UD 接受并写入真相后，`START_AFTER_APPROVAL` 自动创建 FL。

Human 介入：

- 确认 Design Proposal 提交；
- 作出 HDO 语义决定；
- 处理 design finding；
- 选择 `DESIGN_ONLY`；
- 恢复已经结束 turn 的长期 FL；
- 确认 FL cleanup。

## 9. 完成与清理

FL 在 RI 通过、集成完成、main 验证通过且必要真相回写完成后进入：

```text
COMPLETE_AWAITING_CLEANUP
```

此时保留 FP、FL task、branches、worktrees、candidates 与 rollback 信息，并向 Human 报告。Human 明确确认后：

1. 删除已完成 FP；
2. 清理已合并临时 branches/worktrees/integration 资源；
3. archive FL task；
4. dirty 或未合并资源保持原状并报告。

## 10. 明确排除

本模型不引入：

- 全局执行控制 task；
- capability command 层；
- 长期运行的 PC/IV；
- watcher、heartbeat 或持续 wait loop；
- Pull inbox 或全局 thread registry；
- 广播同步；
- task 历史、状态流水或 cleanup archive 文档。

canonical repository、精确 task id、单一 parent 回传和 Human 决策共同构成协同边界。
