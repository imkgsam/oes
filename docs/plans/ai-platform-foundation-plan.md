# OES AI Platform Foundation Plan

```text
status: FROZEN_FOUNDATION_PATH
updated: 2026-08-03
architectureTruthSource: docs/architecture/04-ai-architecture.md
firstValidationCollaboration: docs/architecture/collaborations/task-assistant.md
toolContractTruthSource: docs/contracts/ai-platform/task-assistant-tool-contract.md
predecessorDesignGate: FROZEN_AI_PLATFORM_TASK_ASSISTANT
registrationGate: FROZEN_TOOL_CONTRACT_REGISTRATION_READY
```

> 本计划只定义 AI 平台最小可持续交付顺序，不是服务设计、公共契约或 schema 真相源。涉及单个服务职责时，以 `docs/architecture/services/*.md` 为准。

## 1. Objective

先冻结防止架构越界所需的最小 AI 平台基础，再等待核心业务与可信执行能力成熟后，以 Task Assistant 完成一个小型纵向验证。AI 实现不优先于核心业务能力、Collaboration Task、Auth/Permission 或 trusted execution runtime。

## 2. Frozen Foundation

新 AI 场景必须消费以下稳定逻辑概念：

- `AgentPrincipal`：Identity-owned Machine Principal 的 AI 语义引用。
- `AgentProfile`：版本化场景行为、模型、知识、工具与执行模式定义。
- `KnowledgeScope`：知识来源与 tenant/org/visibility/version 上限。
- `ToolContract`：版本化工具 identity 和 owner-approved operation binding。
- `ExecutionContext`：每次调用的 HUMAN/Agent/tenant/org/trace/delegation/audit 关联。
- `ModelRouting`：模型选择、回退、限额与成本基础设施策略。
- `AgentRun`：AI 编排过程和结果摘要，不替代业务结果。

这些概念是逻辑边界，不预先决定服务数量、数据库或技术产品。

## 3. Delivery Order

### Gate A — Architecture freeze

状态：本轮完成后 `COMPLETE`。

Deliverables：

- `docs/architecture/04-ai-architecture.md`
- `docs/architecture/collaborations/task-assistant.md`
- `docs/contracts/ai-platform/task-assistant-tool-contract.md`
- 本计划

### Gate A.1 — Immutable ToolContract registration

This gate is registration-only and does not wait for ActionGrant runtime.

It succeeds the prior `FROZEN_AI_PLATFORM_TASK_ASSISTANT` architecture gate and becomes `FROZEN_TOOL_CONTRACT_REGISTRATION_READY` only after the immutable AI-owned contract is integrated into `main`.

Frozen registration：

- identity `oes.ai.task-assistant.collaboration-task`；
- immutable version `1.0.0`；
- exact operation set: `ListTasks`、`GetTask`、draft Task creation、`CreateTask` self todo、`CreateTask` assigned task；
- owner risk mappings copied by reference, never redefined；
- runtime execution、mutation execution and public exposure all disabled。

Repository-native artifact is a declarative JSON manifest under the AI-owned path frozen in section 7. No service、proto、schema、Gateway route、provider、UX or orchestration runtime is introduced.

### Gate B — Trusted execution predecessors

必须满足：

- `EXEC-CRYPTO MAIN_READY`
- DG-4 DelegationGrant/ActionGrant runtime 与冻结契约一致
- Identity Machine Principal、Auth STS/credential 和 Permission DELEGATED intersection 可被消费
- operator/tenant/trace/audit context 的可信传播已有 owner-approved contract

本 gate 不由 AI 实现线程绕过或补丁实现。

### Gate C — Collaboration Task readiness

必须满足：

- Collaboration Task runtime 与冻结的 Query/Command contracts 可用
- Collaboration owner 冻结 AI 可暴露 operation subset
- 每个 mutation operation 具备 owner-declared risk class
- `ACTION_GRANT_REQUIRED` operation 具备 canonical action descriptor 与 target-side idempotency/consumption 约束

Gate C 之前允许将 the frozen CreateTask variants 登记为 disabled metadata，但不得建立 runtime adapter、执行 mutation 或公开入口。

### Slice 1 — Minimal interactive Task Assistant

目标：验证 reusable identity、authorization、model、tool、orchestration 与 audit 边界。

范围：

- 用户主动触发；
- 读取当前用户有权访问的 Task；
- 总结、排序、解释和拟动作；
- 明确展示业务事实来源与模型建议；
- 不改变 Task 状态。

知识检索不是 Slice 1 的强制运行依赖。若加入制度/SOP 解释，必须等待 Gate D。

### Gate D — Governed knowledge readiness

仅对知识型场景或 Task + policy/SOP 联合回答必需：

- knowledge owner 与唯一事实边界已冻结；
- ingestion、source version、tenant/org visibility 与 citation contract 可用；
- 不把 Task 交易数据复制进知识库。

### Slice 2 — Controlled Task mutation

只在 Gate B/C 完成后进入：

- HUMAN 明确表达执行意图；
- 调用 owner-approved、versioned ToolContract；
- 按 risk class 走 delegation 或 exact ActionGrant；
- Collaboration Task 执行参与者规则、domain transition 与 idempotency；
- AI 只报告已验证的业务结果。

### Later — Evidence-driven expansion

只有真实需求和运行证据出现后再评估：

- 长期记忆；
- 无人值守 MACHINE workflow；
- 多 Agent；
- Task events / AI projection；
- 高级模型路由与自动评测；
- 独立知识、工具或编排服务拆分。

## 4. Ownership Summary

| Capability | Stable owner |
| --- | --- |
| Machine Principal identity/lifecycle | Identity truth source |
| Machine auth, ExecutionToken, DelegationGrant, ActionGrant | Auth truth source |
| HUMAN/MACHINE/DELEGATED authorization and policy | Permission truth source |
| Task, participant rules, operation risk class, business result | Collaboration truth source |
| Enterprise knowledge ingestion/retrieval/citation | future governed knowledge owner |
| AgentProfile, ToolContract identity/version, orchestration and AgentRun | AI platform logical boundary |

## 5. Contract And Data Discipline

- 当前冻结不新增 proto、HTTP API、permission code、event payload、schema 或 `src/common` 类型。
- Task Assistant 消费既有 Task Query/Command 和 DG-4 黑盒契约，不重新定义它们。
- 后续新增 AI contract 必须取得明确 owner/path lease，并先更新 architecture/ADR/contract。
- AI-owned persistence 只能保存 Profile/Run/knowledge/tool governance 自身事实，不复制 Task、role、session、credential 或 policy truth。

## 6. Success Criteria

最小纵向验证只有在以下条件同时成立时才算成功：

1. 一个 HUMAN 请求可被关联到稳定 AgentPrincipal、Profile version 与 ExecutionContext。
2. Task 读取遵守 tenant 和 participant visibility，且结果来自 Collaboration owner。
3. 模型不能扩大读取或工具权限。
4. mutation 在未完成 owner risk gate 与 delegation 时 fail closed；风险分类要求 exact confirmation、step-up 或 ActionGrant 时，缺少任一适用条件同样 fail closed。
5. Task ownership 仍归 HUMAN account，Agent 仅作为执行 actor 被审计。
6. AI/Auth/Permission/Collaboration 各自事实可通过关联引用追踪，且没有共享数据库。
7. 成本和模型使用可度量，但观测工具不成为正式审计真相源。

## 7. ToolContract Registration A/I Lease

One v2 Lite A/I receives exactly these writable paths：

- `src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.json`
- `src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.contract.test.mjs`

All other paths are protected, including all service truths/code, `src/common`, proto/generated contracts, schemas, permission/operator context, Gateway/public routes, root package/lockfile, model/provider/UX/orchestration/runtime code and DG-4/Collaboration implementation.

Acceptance must prove：

1. manifest identity/version and the five-operation set match the frozen AI contract exactly；
2. every owner mapping and risk class equals the cited owner truth；
3. no duplicate or additional operation exists；
4. global and per-operation runtime/mutation/public flags remain false；
5. immutable `1.0.0` uses the versioned filename and no existing version is modified；
6. candidate diff contains only the two leased paths；
7. no production source imports or executes the manifest；
8. `node --test src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.contract.test.mjs` passes。

## 8. Explicit Non-goals

- 当前不承诺 AI implementation date 或高于核心业务的优先级。
- 当前不选择模型供应商、Agent framework、向量数据库或观测产品。
- 当前不建立大而全 AI 中台。
- 当前不设计长期记忆、自治 Agent 或跨业务自动化。
- 当前不改变任何服务 truth source、Task contract 或 DG-4 semantics。
- 当前不创建 ToolContract runtime registry service、adapter、execution API 或 public exposure。
