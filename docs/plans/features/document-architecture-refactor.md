# Document Architecture Refactor

```text
featureKey: DOCUMENT-ARCHITECTURE-REFACTOR
truthCommit: c42c8b5f18ccf88a49a253aa668704461f5bad64
state: COMPLETE_AWAITING_CLEANUP
owner: current Feature Lead
```

## Objective

将 OES 文档收敛为当前稳定真相与活跃工作面，删除重复治理、工具生成历史和失效状态文档，并保持仍有效设计与执行入口可发现。

## Slices

### DOC-GOVERNANCE

```text
state: ACCEPTED
candidate: current commit
review: self-review
```

- Scope：删除已被两份新治理真相覆盖的旧治理正文，修复仍有效文档中的引用。
- Acceptance：治理目录只保留当前规则；仓库中不存在指向已删治理文件的链接。

### DOC-SUPERPOWERS

```text
state: ACCEPTED
candidate: current commit
review: self-review
```

- Scope：逐项确认工具生成 specs/plans 的有效内容已有 canonical truth、active FP/Workspace 或 backlog 承接，修正引用后删除整个目录。
- Acceptance：工具生成的旧 specs/plans 目录已移除；外部引用为零；未丢失仍有效的唯一当前事项。

### DOC-INDEXES

```text
state: ACCEPTED
candidate: current commit
review: self-review
```

- Scope：精简根、architecture、services、collaborations、ADR、contracts、plans、designs、features 等入口。
- Acceptance：Index 只导航，不包含实现状态、迁移历史、长篇摘要或本机绝对链接。

### DOC-ACTIVE-WORK

```text
state: ACCEPTED
candidate: current commit
review: semantic audit
```

- Scope：逐项审计本轮已识别的 superseded Workspace/FP；每个文件删除前检查语义覆盖。
- Acceptance：本轮确认失效的 10 个 Workspace 与 13 个 FP 已删除；AI Platform Workspace 在实施 gates 完成归位前保持条件清理。

## Protected Scope

- 业务代码、schema、proto 与生成文件。
- 未完成语义审计的 architecture、contract、ADR、Workspace 和 FP 正文。
- Git 历史与当前远端状态。

## Feature Acceptance

- `git diff --check` 通过。
- 新增与修改的 Markdown 相对链接有效。
- 已删除路径没有残留引用。
- canonical indexes 不携带实现状态。
- 提供原始备份、完整 patch、验证记录和可执行 rollback。
- 完成后进入 `COMPLETE_AWAITING_CLEANUP`，由 Human 确认 FP 与临时资源清理。
