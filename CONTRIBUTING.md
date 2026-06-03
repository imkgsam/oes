# Contributing To OES

Thank you for helping improve OES. This project is a large enterprise monorepo, so contribution quality depends on clear boundaries, explicit contracts, and reviewable intent.

## Contribution Scope

Keep each pull request focused on one of these scopes:

- One service.
- One frontend surface.
- One BFF or gRPC contract.
- One architecture or governance topic.
- One narrowly related cross-service collaboration.

Avoid combining unrelated service work, frontend changes, documentation rewrites, and infrastructure changes in one pull request.

## Before You Start

Read these project baselines:

- [AGENTS.md](AGENTS.md)
- [docs/index.md](docs/index.md)
- [docs/architecture/index.md](docs/architecture/index.md)
- [docs/governance/index.md](docs/governance/index.md)

If your change affects a stable service boundary, update the service truth source first:

```text
docs/architecture/services/<service-name>.md
```

If your change affects a cross-service contract, event model, permission model, tenant model, operator context, shared common API, or AI tool interface, open an architecture discussion or ADR before implementation.

## Development Setup

```bash
pnpm install
pnpm docker:infra:up
pnpm proto:lint
pnpm common:build
```

For system services:

```bash
pnpm backend:system:db:sync
pnpm backend:foundation:sync
pnpm dev:system
```

For tenant web:

```bash
pnpm web
```

## Architecture Rules

OES follows these non-negotiable boundaries:

- No shared databases across services.
- No core business rules in controllers, gateways, DTOs, or Prisma schemas.
- `src/common` must not become a home for cross-domain business semantics.
- Services communicate through explicit mechanisms: gRPC contracts, event propagation, or anti-corruption layers.
- Domain code must not depend on NestJS, Prisma, gRPC, or frontend concerns.

## Pull Request Checklist

Before opening a PR, confirm:

- The change has one clear scope.
- Business rules live in the correct service and layer.
- Architecture truth sources or contracts are updated when boundaries changed.
- Multi-tenant context, operator context, trace context, and audit metadata are preserved where applicable.
- Tests or verification commands are included in the PR description.
- Generated files are not committed unless the project expects them.
- The PR does not include secrets, local credentials, or environment-specific data.

## Review Expectations

Maintainers review for:

- Boundary correctness.
- Contract stability.
- Tenant and permission safety.
- Auditability.
- Test coverage proportional to risk.
- Long-term maintainability over short-term shortcuts.

PRs that bypass architecture boundaries may be declined even if they work in a local scenario.

## Code Comments

New or rewritten code units should include a short summary comment explaining the responsibility of the unit. Comments should describe the whole block, not restate individual lines.

## Security

Do not report security issues in public issues or pull requests. Follow [SECURITY.md](SECURITY.md).
