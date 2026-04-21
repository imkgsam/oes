# Party Service Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unused `entity-service` skeleton with a clean first-stage `party-service` implementation that matches the approved architecture, contracts, and service boundaries.

**Architecture:** Build `party-service` as a gRPC system service, aligned with the repo's current `identity-service` runtime shape, but keep the internal implementation lighter than the larger CQRS services for first-stage delivery. The service owns canonical `Party`, tenant-scoped `TenantParty`, stable `PartyIdentifier`, and a minimal `PartyRelationship` set; it does not own contact, org tree, or HR semantics.

**Tech Stack:** NestJS, gRPC, Prisma, PostgreSQL, TypeScript, Jest, pnpm workspace, ts-proto / Buf.

---

## 1. Scope Guard

This plan is executable only while these upstream documents remain accepted:

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [0003-party-master-service-and-tenant-party-binding.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)
- [party-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/party-service-foundation.md)
- [party-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/README.md)
- [party-service/registration.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/registration.md)
- [party-service/query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/query.md)
- [party-service/merge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/merge.md)

Do not implement:

- CRM / SRM contact semantics.
- org tree or org membership.
- employee / employment semantics.
- external registry sync.
- approval workflow for merge.
- automatic unmerge.

## 2. Planned File Structure

Service package:

- Delete: `src/services/system/entity-service/**`
- Create: `src/services/system/party-service/package.json`
- Create: `src/services/system/party-service/tsconfig.json`
- Create: `src/services/system/party-service/tsconfig.spec.json`
- Create: `src/services/system/party-service/jest.config.js`
- Create: `src/services/system/party-service/prisma/schema.prisma`
- Create: `src/services/system/party-service/src/main.ts`
- Create: `src/services/system/party-service/src/app.module.ts`
- Create: `src/services/system/party-service/src/modules/party-query/party-query.module.ts`
- Create: `src/services/system/party-service/src/modules/party-registration/party-registration.module.ts`
- Create: `src/services/system/party-service/src/modules/party-merge/party-merge.module.ts`
- Create: `src/services/system/party-service/src/domain/**`
- Create: `src/services/system/party-service/src/application/**`
- Create: `src/services/system/party-service/src/infrastructure/**`
- Create: `src/services/system/party-service/src/interfaces/grpc/**`
- Create: `src/services/system/party-service/test/l1/**`

Common contracts and exports:

- Delete: `src/common/src/contracts/entity_service/**`
- Create: `src/common/src/contracts/party_service/party.proto`
- Create: `src/common/src/contracts/party_service/index.ts`
- Modify: `src/common/src/contracts/index.ts`
- Modify: `src/common/src/contracts/README.md`
- Regenerate: `src/common/src/generated/**`

Common service metadata:

- Modify: `src/common/src/clients/service-map.ts`
- Modify: `src/common/src/constants/services/service-names.const.ts`
- Modify: `src/common/src/constants/services/service-tokens.const.ts`
- Delete: `src/common/src/interfaces/services/entity-service.ts`
- Create: `src/common/src/interfaces/services/party-service.ts`
- Modify: `src/common/src/interfaces/services/index.ts`
- Delete: `src/common/src/dtos/entity-service/**`
- Create: `src/common/src/dtos/party-service/**`
- Modify: `src/common/src/dtos/index.ts`

Docs:

- Modify: `docs/plans/features/party-service-foundation.md`
- Modify: `docs/architecture/services/party-service.md` only if implementation reveals boundary gaps

## 3. Implementation Slices

### Slice A: Replace Legacy Service Skeleton

**Purpose:** Remove the unused generic entity skeleton and establish the new package root.

- [ ] Delete `src/services/system/entity-service`.
- [ ] Create `src/services/system/party-service` package metadata and TypeScript / Jest config.
- [ ] Add `README.md` placeholder for local runtime notes if needed.
- [ ] Verification:
  - Run `find src/services/system -maxdepth 1 -type d | sort`.
  - Confirm `entity-service` is gone and `party-service` exists.

### Slice B: Freeze Machine-Readable Contract

**Purpose:** Translate the approved black-box contract docs into a first-stage gRPC proto.

- [ ] Add `src/common/src/contracts/party_service/party.proto`.
- [ ] Model three services:
  - `PartyRegistrationService`
  - `PartyQueryService`
  - `PartyMergeService`
- [ ] Include request/response messages for:
  - `RegisterPersonParty`
  - `RegisterOrganizationParty`
  - `BindExistingPartyToTenant`
  - `DeactivateTenantParty`
  - `GetPartyById`
  - `GetTenantPartyById`
  - `ResolvePartyByIdentifier`
  - `SearchPartyCandidates`
  - `ListPartyRelationships`
  - `MergeParties`
- [ ] Add `src/common/src/contracts/party_service/index.ts`.
- [ ] Remove `src/common/src/contracts/entity_service/**` and its exports.
- [ ] Regenerate `src/common/src/generated/**`.
- [ ] Verification:
  - Run `pnpm proto:gen`.
  - Run `pnpm proto:lint`.

### Slice C: Red Tests for Core Behavior

**Purpose:** Establish first failing tests before production code.

- [ ] Add `test/l1/party-registration.service.spec.ts` covering:
  - canonical name required
  - duplicate tenant binding rejected
  - strong identifier match prevents blind duplicate canonical creation
- [ ] Add `test/l1/party-query.service.spec.ts` covering:
  - `GetPartyById` returns null when not found
  - candidate search does not auto-bind or auto-merge
- [ ] Add `test/l1/party-merge.service.spec.ts` covering:
  - merge rejects survivor included in merged list
  - merge marks merged parties as non-active in returned result
- [ ] Add `test/l1/grpc-controller-validation.spec.ts` covering minimal request validation wiring.
- [ ] Run the focused tests and verify they fail for the expected missing implementation reasons.

### Slice D: Implement Domain and Persistence

**Purpose:** Build the minimal first-stage `party-service` write and read model.

- [ ] Create Prisma enums and models for:
  - `Party`
  - `PersonParty`
  - `OrganizationParty`
  - `TenantParty`
  - `PartyIdentifier`
  - `PartyRelationship`
- [ ] Create domain entities / value objects for:
  - `PartyType`
  - `PartyStatus`
  - `TenantPartyStatus`
  - `IdentifierStatus`
  - `RelationshipType`
- [ ] Create repository interfaces and Prisma implementations.
- [ ] Implement registration, query, and merge application services.
- [ ] Keep implementation minimal:
  - no contact model
  - no employee model
  - no org tree model
  - no approval workflow
- [ ] Verification:
  - Run focused l1 tests until green.

### Slice E: Wire gRPC Service Runtime

**Purpose:** Expose the first-stage API through a real service package.

- [ ] Create gRPC controllers using generated `party_service` types.
- [ ] Create three modules:
  - `party-registration`
  - `party-query`
  - `party-merge`
- [ ] Wire Prisma, controllers, and providers in `app.module.ts`.
- [ ] Set runtime service name to `party-service`.
- [ ] Set gRPC package to `party_service`.
- [ ] Use a dedicated listen port and env fallback instead of the old TCP `ENTITY_TCP` endpoint.
- [ ] Verification:
  - Run `pnpm --filter party-service build`.
  - Run `pnpm --filter party-service test`.

### Slice F: Clean Common-Layer Legacy Exports

**Purpose:** Remove unused generic entity exports so new code cannot keep depending on old semantics.

- [ ] Replace `entity-service` constants and service names with `party-service` equivalents where still relevant.
- [ ] Remove unused `ENTITY_TCP`, `ENTITY_SERVICE`, `ENTITY_PORT`, entity DTO exports, and entity interface exports.
- [ ] Add `party-service` replacements only where they are actually needed by current code.
- [ ] Update common contract README to list `party_service` instead of `entity_service`.
- [ ] Verification:
  - Run `pnpm --filter @oes/common build`.

### Slice G: Final Verification

**Purpose:** Prove the new foundation compiles and the focused tests pass.

- [ ] Run `pnpm proto:gen`.
- [ ] Run `pnpm proto:lint`.
- [ ] Run `pnpm --filter @oes/common build`.
- [ ] Run `pnpm --filter party-service build`.
- [ ] Run `pnpm --filter party-service test`.
- [ ] If Prisma client generation is required for build, run `pnpm --filter party-service prisma:generate`.

## 4. Review Notes Before Execution

- The old service is explicitly unused, so deleting it is allowed and preferred over compatibility layering.
- The first implementation should stay small and service-local; avoid importing identity, CRM, HR, or tenant-org semantics into the write model.
- If a later step reveals runtime callers still depend on deleted `entity_service` generated code, stop and add a compatibility decision rather than silently reintroducing entity semantics.
