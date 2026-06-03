# Codex OSS Maintainer Workflows

This document defines how OES maintainers use Codex-style coding agents for open-source maintenance work. It is a governance document, not a replacement for human maintainer responsibility.

## Purpose

OES is a large enterprise monorepo with many service boundaries, contracts, frontend surfaces, and governance documents. Codex is useful when it helps maintainers inspect changes consistently, route issues accurately, and preserve architecture discipline across the repository.

Codex must not be used to bypass OES business rules, architecture boundaries, tenant isolation, permission checks, or audit requirements.

## Maintainer Responsibilities

Human maintainers remain responsible for:

- Final merge decisions.
- Architecture and ADR decisions.
- Permission, tenant, audit, and security semantics.
- Public communication with contributors.
- Release approval.
- Security disclosure decisions.

Codex may assist with analysis, drafting, review, and verification, but it does not own project truth.

## Pull Request Review

Codex can help maintainers review pull requests for:

- Whether the PR scope is coherent and not mixing unrelated services.
- Whether business rules live in the correct service and layer.
- Whether controllers, DTOs, gateways, and Prisma schemas are only mapping or persistence surfaces.
- Whether cross-service collaboration uses explicit gRPC contracts, events, or anti-corruption layers.
- Whether stable service truth sources and contracts were updated when boundaries changed.
- Whether test coverage matches the blast radius.
- Whether generated files, secrets, tokens, or local environment data were introduced.

Review output should prioritize actionable findings with file and line references. Human maintainers decide whether the findings are valid.

## Issue Triage

Codex can help classify new issues by:

- Service or frontend surface.
- Contract or architecture topic.
- Severity and likely blast radius.
- Tenant, permission, audit, security, or AI governance relevance.
- Whether the issue is a bug, feature request, documentation gap, contract question, or design discussion.

Suggested labels should be treated as recommendations. Maintainers confirm routing before assigning work.

## Contract And Boundary Checks

Codex can assist with:

- gRPC/proto breaking-change review.
- BFF request/response surface review.
- Permission code catalog consistency.
- Service truth-source consistency.
- Cross-document contradiction detection.
- Detection of direct references to another service's internal types.

If a proposed change affects public contracts, shared abstractions, permission semantics, tenant models, operator context, event models, or AI tool interfaces, the maintainer workflow must require architecture or ADR review before implementation.

## Security And Tenant Safety Review

Codex-assisted review should explicitly inspect:

- Authentication and session flows.
- Tenant and organization scoping.
- Operator context propagation.
- Trace context propagation.
- Permission, role, scope, and policy decisions.
- Audit metadata preservation.
- AI-assisted actions that can read data or change state.
- PDA and terminal access policies.

Any issue that could expose data across tenants, weaken authorization, bypass audit, or allow AI to mutate core business data without approval must be escalated to maintainers before public discussion.

## Release Support

Codex can help prepare release materials:

- Changelog drafts.
- Migration-risk summaries.
- Contract change summaries.
- Known limitations.
- Upgrade notes for contributors.
- Documentation consistency checks.

Maintainers must verify release notes against the actual commits and contract changes.

## Contributor Onboarding

Codex can help contributors understand:

- Which service owns a capability.
- Which architecture truth source applies.
- Which tests are relevant.
- How to reduce a broad idea into a scoped PR.
- Why a proposed shortcut violates OES boundaries.

Contributor-facing guidance should be concise and should link to stable documents rather than restating service boundaries in ad hoc comments.

## Guardrails

Codex-assisted workflows must follow these guardrails:

- Do not auto-merge PRs.
- Do not expose secrets, private reports, or security-sensitive details.
- Do not generate business-state mutations outside approved application services.
- Do not invent service ownership when the truth source is unclear.
- Do not treat generated summaries as authoritative without source review.
- Do not replace ADRs, contracts, or service truth sources with chat history.

## Suggested Review Prompt Shape

Maintainers can use this prompt shape when asking Codex to review a pull request:

```text
Review this PR for OES architecture safety. Prioritize actionable findings.
Check service boundaries, contract changes, tenant/operator/trace context,
permission and audit impact, and whether tests match the blast radius.
Do not suggest broad refactors unrelated to the PR scope.
```

## Success Criteria

Codex is helping OES maintenance when it:

- Reduces missed boundary regressions.
- Speeds up issue routing.
- Makes release risks easier to see.
- Helps contributors produce smaller and safer PRs.
- Improves consistency between implementation, contracts, and architecture docs.

Codex is not helping when it creates vague summaries, encourages shortcuts, or hides design uncertainty behind confident language.
