# OES Thread Control Board

## 1. 定位

本文档是 OES Codex thread 调度状态的长期沉淀。实时状态以 OES Codex Command Hub 为准。

Global Command Thread 是本文档唯一写入 owner。其他 thread 不得直接修改本文档。

## 2. Thread 状态

合法状态：

- `proposed`
- `assigned`
- `active`
- `paused`
- `blocked`
- `returned`
- `accepted`
- `integrating`
- `closed`

## 3. 当前主控任务

| Thread | Type | Parent | Branch | Worktree | Status | Return Target |
| --- | --- | --- | --- | --- | --- | --- |
| control-global-roadmap | global-command | none | codex-command-hub-mvp | .worktrees/codex-command-hub-mvp | active | user |
| feature-codex-command-hub-mvp | feature | control-global-roadmap | codex-command-hub-mvp | .worktrees/codex-command-hub-mvp | active | control-global-roadmap |

## 4. 受保护共享文件

这些文件默认只能由明确 owner 写入：

- `AGENTS.md`
- `docs/governance/**`
- `docs/plans/oes-global-roadmap.md`
- `docs/plans/oes-thread-control-board.md`
- `docs/plans/oes-capability-dependency-map.md`
- `docs/architecture/**`
- `docs/contracts/**`
- `src/common/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

## 5. Handoff 摘要模板

```text
Thread:
Type:
Parent:
Return target:
Branch:
Worktree:
Scope:
Changed files:
Design impact:
Contract impact:
Data impact:
Permission impact:
Tenant/operator/audit impact:
Dependencies unlocked:
New blockers:
Conflicts detected:
Verification:
Recommended next tasks:
```
