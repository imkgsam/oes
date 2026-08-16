# Design Workspace

本目录只保存当前尚未完全冻结、需要多轮讨论的设计主题。一个主题对应一个 Workspace；简单设计可以直接形成 Proposal Patch 或 Feature Packet。

## Minimal template

```markdown
# <Design Topic>

## Objective
## Scope
## Current truth baseline
## Current proposed design
## Human-confirmed items pending UD review
## Open questions
## Known conflicts
## Intended truth-source changes
## Next discussion point
```

Workspace 每轮原位更新，不记录聊天、轮次和时间线。部分冻结后移除已回写正文，只保留 canonical reference；全部冻结并回写后进入 `READY_FOR_CLEANUP`，Human 确认后删除。

`SUPERSEDED_BY_TRUTH_SOURCE` 标签不是独立删除证据；删除前执行 [文档治理](../../governance/document-governance.md) 定义的语义覆盖检查。
