# AI Platform And Task Assistant Design Workspace

```text
status: SUPERSEDED_BY_TRUTH_SOURCE
frozenDate: 2026-07-28
doNotUseAsStableSource: true
truthSource:
  - docs/architecture/platforms/ai-platform.md
  - docs/architecture/collaborations/task-assistant.md
implementationPath: docs/plans/ai-platform-foundation-plan.md
```

> 本文件仅保留设计过程恢复与决策历史。冻结结论已回写上述 truth sources；不得继续把本 workspace 当作当前设计入口或第二份稳定设计。

## 1. Design Topic

冻结 OES 项目级 AI 平台最小架构边界，并用 Task Assistant 验证它消费可复用 identity、authorization、model、knowledge、tool、orchestration 与 audit 能力，而不是在 Collaboration 内建立本地 AI 模块或绕过 Task ownership。

## 2. Confirmed Decisions

用户已明确确认：

1. 建立独立、可复用的 AI 平台逻辑边界；Task Assistant 是首个场景 Profile。
2. AgentPrincipal 按安全信任边界划分；AgentProfile 定义场景；ExecutionContext 隔离每次调用。
3. AI 是执行 actor，不成为 Task creator、assignee 或 participant；业务 ownership 归 HUMAN account。
4. Task Assistant P1 是用户主动触发、人在回路的 Copilot，不做无人值守自治执行。
5. Task 实时事实从 Collaboration Query 获取；AI 知识层不复制 Task 主数据。
6. AI/Auth/Permission/Collaboration 分别记录自己拥有的事实，通过关联引用组成审计链。
7. 本轮只冻结最小基础；长期记忆、具体技术栈与高级 Agent 能力后置。

## 3. Consumed Predecessors

- frozen generic DG-4 DelegationGrant/ActionGrant collaboration and contracts；
- frozen Collaboration Task service truth and Query/Command contracts；
- GRPC baseline available at original intake；
- Identity/Auth/Permission service truths。

## 4. Implementation Gates Returned To Command

- exact integrated main SHA containing frozen truth sources；
- `EXEC-CRYPTO MAIN_READY`；
- DG-4 runtime readiness；
- Collaboration Task runtime readiness；
- Collaboration owner approval of AI-exposed mutation subset, risk class, canonical descriptor and idempotency；
- governed knowledge owner readiness only when knowledge-backed slice is included；
- separate ownership for any new service/proto/operator-context/permission/gateway path。

## 5. Scope And Path Record

Frozen paths：

- `docs/architecture/platforms/ai-platform.md`
- `docs/architecture/collaborations/task-assistant.md`
- `docs/plans/ai-platform-foundation-plan.md`

Process record：

- `docs/plans/designs/ai-platform-task-assistant.md`

Protected throughout design：all service truth sources, contracts, ADRs, code, schema, proto, packages and shared common paths。

## 6. Open Questions

No open design question blocks the frozen minimum scope. All implementation-detail questions and advanced AI capabilities are explicitly deferred to owner-assigned future design/implementation work.
