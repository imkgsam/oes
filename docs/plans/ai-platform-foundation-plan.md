# OES AI Platform Foundation Plan

Updated: 2026-03-25 +08:00

> AI 平台只消费授权与 policy 能力，不拥有 permission-service 服务设计真相；涉及权限、policy、scope 或授权判定的边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. Objective

Build an AI platform foundation for OES that can absorb future AI scenarios without redesigning the base architecture each time.

This plan is not limited to a single service. It is a project-level implementation path for:

- machine identity
- delegated execution context
- governed AI profiles
- knowledge and retrieval
- controlled tool execution
- audit and safety gates

## 2. Core implementation principle

New AI scenarios must be onboarded by extending stable platform objects:

- `AgentPrincipal`
- `AgentProfile`
- `KnowledgeScope`
- `ToolContract`
- `Policy`
- `ExecutionContext`
- `ModelRouting`

Do not create a new architecture branch for every new AI scenario.

## 3. Recommended delivery phases

### Phase A. Governance and architecture freeze

Target:
- freeze the project-level AI platform architecture
- define stable extension points
- define cross-service responsibilities

Deliverables:
- architecture update in `docs/architecture/04-ai-architecture.md`
- implementation plan in `docs/plans/`
- service boundary agreement for identity/auth/permission/knowledge/tool layers

### Phase B. Machine principal and delegation foundation

Target:
- establish governed machine principals and delegated execution context

Main work:
- `identity-service`: governed AI or machine principal model
- `auth-service`: machine auth and delegated execution context
- `permission-service`: combined evaluation of machine upper-bound permissions and delegated human scope

Minimum deliverables:
- machine principal model
- delegated execution context model
- audit metadata standard

### Phase C. Knowledge and retrieval foundation

Target:
- support enterprise knowledge ingestion and trusted retrieval

Main work:
- document ingestion
- metadata schema
- permission-aware retrieval
- source citation
- tenant and org filtering

Minimum deliverables:
- knowledge source registry
- retrieval API
- citation-capable assistant flow

### Phase D. Tool governance foundation

Target:
- ensure AI never mutates business core state directly

Main work:
- define `ToolContract`
- classify tools by risk level
- support read / draft / submit / auto-execute modes
- add confirmation and approval gates

Minimum deliverables:
- tool registry
- execution policy model
- audit log for AI tool invocation

### Phase E. First pilot profiles

Recommended first pilots:
- knowledge assistant
- analytics assistant
- workflow assistant in draft-first mode

Optional later pilots:
- risk and governance assistant
- quality and inspection assistant
- optimization assistant

Selection rule:
- choose scenarios with high value, clear boundaries, and lower mutation risk first

## 4. Cross-service responsibilities

`identity-service`
- governed AI and machine principal identity truth

`auth-service`
- machine authentication
- delegated execution context issuance

`permission-service`
- machine permission upper-bound evaluation
- delegated human scope evaluation

future knowledge capability
- enterprise knowledge ingestion and retrieval

future orchestration capability
- profile execution
- model routing
- tool planning
- confirmation and approval insertion

## 5. Decision rules for future AI scenarios

When a new AI idea appears, answer these questions before implementation:

1. Which existing `AgentPrincipal` should run it?
2. Does it need a new `AgentProfile`, or can it reuse an existing one?
3. What `KnowledgeScope` does it require?
4. What `ToolContract` does it require?
5. What execution mode is allowed?
6. Does it require delegated human context?
7. Does it require confirmation or approval?

If these questions can be answered within the existing framework, no architectural redesign is needed.

## 6. Immediate next step

Before implementing `6.1 ServiceAccount` as isolated code work, align it with the platform-level AI foundation:

- define whether `6.1` models generic machine principals or AI-specific governed principals
- define how `auth-service` will consume it
- define how `permission-service` will evaluate it

Without this alignment, `6.1` risks becoming a narrow local model instead of a reusable AI platform foundation.

Related alignment note:
- [machine-principal-foundation-alignment.md](./machine-principal-foundation-alignment.md)
