# OES

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/imkgsam/oes/actions/workflows/ci.yml/badge.svg)](https://github.com/imkgsam/oes/actions/workflows/ci.yml)

OES is an open-source enterprise operating system monorepo for complex business software. It brings ERP, MES, WMS, CRM, SRM, finance, tenant identity, permission governance, PDA workflows, BFF/API gateway capabilities, auditability, and AI-safe collaboration patterns into one governed architecture.

The project is not trying to be a collection of loosely related modules. Its core value is the discipline around bounded contexts, explicit service contracts, multi-tenant safety, operator context propagation, audit trails, and maintainable cross-service collaboration.

## Why OES Exists

Enterprise operating systems often fail at the boundaries: services share databases, permission logic drifts across modules, frontend screens encode business rules, and AI workflows bypass governance. OES is built to make those boundaries explicit and reviewable.

OES is useful for maintainers, contributors, and organizations that want to study or build:

- DDD-oriented enterprise service boundaries.
- Multi-tenant identity, account, role, scope, and policy governance.
- Contract-first collaboration through gRPC and documented BFF surfaces.
- ERP/MES/WMS/CRM/SRM-style workflows under one architecture.
- AI-assisted operations that remain auditable and permission-aware.
- PDA and tenant web experiences connected to governed backend services.

## Repository Layout

```text
app/
  pda/                         PDA web and Android client surfaces.
  web/                         Tenant web frontend workspace.
docs/
  architecture/                Stable architecture truth sources.
  adr/                         Architecture decision records.
  contracts/                   Black-box service and BFF contracts.
  governance/                  Collaboration and change discipline.
  plans/                       Feature plans, design workspaces, and roadmap notes.
src/
  common/                      Shared infrastructure, contracts, transport, auth helpers.
  services/
    api-gateway/               External HTTP/BFF entry point.
    business/                  Business contexts such as CRM, SRM, MES, WMS, finance.
    system/                    Identity, permission, auth, tenant, HR, party, asset services.
```

## Architecture Principles

OES follows a boundary-first architecture:

- External clients enter through the API Gateway / BFF.
- Strong internal service contracts use gRPC.
- Cross-context facts should flow through explicit integration mechanisms.
- Services must not share databases.
- Domain rules belong in domain/application layers, not controllers, DTOs, gateways, or Prisma schemas.
- Shared libraries carry infrastructure capabilities, not cross-domain business ownership.
- AI may assist business workflows but must not own core business truth or bypass authorization and audit.

For the full project baseline, start with [AGENTS.md](AGENTS.md) and [docs/index.md](docs/index.md).

## Main Capabilities

- System foundation: auth, identity, permission, tenant organization, HR, party, asset, terminal device, and item master services.
- Business foundation: CRM, SRM, procurement, sales, finance, WMS, and MES services.
- Frontend surfaces: tenant web administration/workbench and PDA-oriented operational flows.
- Contracts and governance: proto contracts, BFF contracts, service truth-source docs, ADRs, and Codex collaboration rules.
- Observability and audit direction: trace context, operator context, audit metadata, and service trust architecture.

## Getting Started

OES is a large monorepo. The commands below are the maintainer-oriented local baseline.

### Prerequisites

- Node.js 22 or newer.
- pnpm 10.x.
- Docker Desktop or compatible Docker runtime.

### Install

```bash
pnpm install
```

### Start Infrastructure

```bash
pnpm docker:infra:up
```

### Generate And Validate Contracts

```bash
pnpm proto:lint
pnpm common:build
```

### Sync System Databases And Foundation Data

```bash
pnpm backend:system:db:sync
pnpm backend:foundation:sync
```

### Run System Services

```bash
pnpm dev:system
```

### Run Tenant Web

```bash
pnpm web
```

## Documentation Map

- [Architecture index](docs/architecture/index.md)
- [ADR index](docs/adr/index.md)
- [Contracts index](docs/contracts/index.md)
- [Governance index](docs/governance/index.md)
- [Plans index](docs/plans/index.md)
- [Open-source maintainer workflows with Codex](docs/governance/codex-oss-maintainer-workflows.md)

## Contributing

OES welcomes contributors who care about long-lived enterprise architecture and clear service boundaries. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

The short version:

- Keep each change scoped to one service, one contract, one frontend surface, or one governance topic.
- Update the relevant architecture truth source before changing stable boundaries.
- Keep cross-service contracts explicit.
- Add tests or verification evidence that matches the risk of the change.
- Do not put core business rules in controllers, DTOs, gateways, or persistence schemas.

## Security

Security issues should not be reported in public issues. See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

## License

OES is released under the [Apache License 2.0](LICENSE).
