# Feature Packet

一个临时 Feature Lead 对应一个 compact active Feature Packet，包含 1..N 个紧密相关 slices。只有 FL 写入当前状态。

## Minimal template

```markdown
# <Feature>

featureKey: <KEY>
truthCommit: <SHA>
state: READY | RUNNING | CANDIDATE_READY | ACCEPTED | COMPLETE_AWAITING_CLEANUP

## Objective

## Slices

### <sliceId>
state: READY | RUNNING | CANDIDATE_READY | ACCEPTED
candidate: <SHA | pending>
review: self | local-ri | global-ri

- Scope:
- Protected scope:
- Dependencies:
- Acceptance:

## Feature acceptance
```

FP 只保存当前范围、依赖、验收、review 和 candidate，不追加执行历史。完成并回写稳定真相后进入 `COMPLETE_AWAITING_CLEANUP`；Human 确认后删除。

详细执行规则见 [Codex 执行模型](../../governance/codex-execution-model.md)。
