# AI Platform Foundation

```text
featureKey: AI-PLATFORM-FOUNDATION
state: DESIGN_FROZEN_BLOCKED_ON_PREDECESSORS
truthSource: docs/architecture/platforms/ai-platform.md
collaborationTruth: docs/architecture/collaborations/task-assistant.md
toolContract: docs/contracts/ai-platform/task-assistant-tool-contract.md
```

## Objective

以 Task Assistant 验证可复用的 identity、authorization、model、tool、orchestration 与 audit 边界。AI 不拥有 Task、identity、credential、permission 或 policy 真相。

## Completed Foundation

- AI Platform、Task Assistant collaboration 与 ToolContract 已冻结到稳定真相源。
- immutable ToolContract `oes.ai.task-assistant.collaboration-task@1.0.0` 已登记。
- 登记只包含 `ListTasks`、`GetTask`、draft、self todo 与 assigned task 五个 operation。
- runtime、mutation 与 public exposure 均保持关闭。
- 定向 contract test 已通过；生产代码没有加载该 registration manifest。

## Open Gates

进入 runtime 实现前必须确认：

1. trusted ExecutionToken/JWS/mTLS runtime 可用；
2. [Delegated Task ActionGrant](./delegated-task-action-grant.md) 已实现并通过验收；
3. Collaboration Task Query/Command runtime 可用，且 owner 的 operation subset、risk class、descriptor、idempotency 与 consumption 约束保持一致；
4. 新服务、proto、operator context、permission、Gateway 或公共 runtime protocol 变更已先回写对应 truth source/ADR/contract；
5. 只有包含制度或 SOP 检索时，才要求 knowledge owner、visibility、version 与 citation contract 就绪。

缺少任一适用 gate 时，相关 runtime flag 保持关闭。

## Slice 1 — Interactive Read-only Assistant

- HUMAN 主动触发；
- 读取当前 HUMAN 有权访问的 Task；
- 提供总结、排序、解释与拟动作；
- 展示业务事实来源与模型建议；
- 不改变任何 Task 状态。

## Slice 2 — Controlled Task Mutation

只在相关 gates 完成后进入：

- HUMAN 明确表达执行意图；
- 使用 owner-approved、versioned ToolContract；
- self todo 遵守 delegation 与 idempotency；
- assigned task 使用 exact ActionGrant、descriptor binding 与 target-side atomic consumption；
- AI 只报告已验证的 Collaboration 业务结果。

## Acceptance

- Task 可见性仍由 Collaboration owner 判定，模型不会扩大读取或工具权限。
- Task ownership 始终归 HUMAN account；Agent 只作为可审计执行 actor。
- 缺少 permission、delegation、confirmation、ActionGrant、idempotency 或 owner runtime 时 fail closed。
- AI/Auth/Permission/Collaboration 的事实通过关联引用追踪，不共享数据库。
- 成本与模型使用可度量，但 observability 不替代正式审计。

## Non-goals

- 当前不选择模型供应商、Agent framework、向量数据库或部署拓扑。
- 当前不建立长期记忆、无人值守 workflow、多 Agent 或大而全 AI 中台。
- 当前不新增业务 Permission Code、Task owner 字段或复制业务主数据。
