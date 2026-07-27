# CRM Party Profile Item Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace overloaded Party contact-point semantics with Party profile items and add CRM account profile items so Lead-stage account-level data can be promoted cleanly to Party during formalization.

**Architecture:** CRM owns sales account profile items before and after formalization; Party owns tenant subject master data. `TenantPartyIdentifier` remains strong identifier-only, while `TenantPartyProfileItem` owns weak/operational profile items such as email, phone, domain, website, and social profiles. Conversion promotes accepted account-level CRM profile items into Party registration inputs without treating `CrmContact` data as account data.

**Tech Stack:** NestJS services, Prisma schemas, Jest L1/L2 tests, gRPC proto contracts under `src/common/src/contracts`.

---

### Task 1: Truth Sources And Contract Shape

**Files:**
- Modify: `docs/architecture/services/party-service.md`
- Modify: `docs/architecture/services/crm-service.md`
- Modify: `docs/contracts/party-service/registration.md`
- Modify: `docs/contracts/party-service/query.md`
- Create: `docs/plans/features/crm-party-profile-item-foundation.md`

- [x] **Step 1: Update Party truth source**

Clarify that `TenantPartyIdentifier` excludes domain/email/phone and that `TenantPartyProfileItem` replaces long-term `TenantPartyContactPoint`.

- [x] **Step 2: Update CRM truth source**

Add `CrmAccountProfileItem` as account-level profile data and keep `CrmContact` as account-scoped person role data.

- [x] **Step 3: Add feature packet**

Record scope, non-goals, migration rules, and verification commands.

### Task 2: Party Profile Item Red-Green

**Files:**
- Modify: `src/services/system/party-service/test/l1/party-registration.service.spec.ts`
- Modify: `src/services/system/party-service/test/l1/party-query.service.spec.ts`
- Modify: `src/services/system/party-service/src/domain/repositories/index.ts`
- Modify: `src/services/system/party-service/src/application/services/party-registration.service.ts`
- Modify: `src/services/system/party-service/src/application/services/party-query.service.ts`
- Modify: `src/services/system/party-service/src/infrastructure/repositories/prisma-tenant-party.repository.ts`
- Modify: `src/services/system/party-service/prisma/schema.prisma`
- Modify: `src/common/src/contracts/party_service/party.proto`

- [x] **Step 1: Write failing L1 tests**

Registration should pass `profileItems` to repository create. Consumer resolution should pass domain/email/phone/whatsapp as profile item candidate signals, not contact-point semantics.

- [x] **Step 2: Run Party L1 tests and confirm failure**

Run: `pnpm --dir src/services/system/party-service test:l1`

- [x] **Step 3: Implement minimal Party profile item model**

Rename application/repository inputs to `ProfileItemInput`, keep compatible query inputs, and update Prisma model names to `TenantPartyProfileItem`.

- [x] **Step 4: Run Party L1 tests and service build**

Run: `pnpm --dir src/services/system/party-service test:l1`
Run: `pnpm --dir src/services/system/party-service build`

### Task 3: CRM Account Profile Item Red-Green

**Files:**
- Modify: `src/services/business/crm-service/test/l1/crm-p1-conversion-use-case.spec.ts`
- Modify: `src/services/business/crm-service/src/domain/models/crm-records.ts`
- Modify: `src/services/business/crm-service/src/domain/repositories/crm-account.repository.ts`
- Modify: `src/services/business/crm-service/src/application/ports/tenant-party-resolution.port.ts`
- Modify: `src/services/business/crm-service/src/application/commands/convert-lead-to-prospect-customer.handler.ts`
- Modify: `src/services/business/crm-service/src/infrastructure/adapters/party-query-grpc.adapter.ts`
- Modify: `src/services/business/crm-service/src/infrastructure/repositories/prisma/prisma-crm-account.repository.ts`
- Modify: `src/services/business/crm-service/prisma/schema.prisma`

- [x] **Step 1: Write failing CRM conversion test**

Conversion should register Party using account profile items for account-level domain/email/phone/whatsapp and should not promote `CrmContact` fields as Party account profile items.

- [x] **Step 2: Run CRM L1 tests and confirm failure**

Run: `pnpm --dir src/services/business/crm-service test:l1`

- [x] **Step 3: Implement minimal CRM profile item model**

Add `CrmAccountProfileItemRecord`, repository list/add methods, Prisma model, and conversion promotion from profile items with legacy lead single-value fallback.

- [x] **Step 4: Run CRM L1 tests and service build**

Run: `pnpm --dir src/services/business/crm-service test:l1`
Run: `pnpm --dir src/services/business/crm-service build`

### Task 4: Linked Verification

**Files:**
- None unless tests reveal a root-cause defect.

- [x] **Step 1: Run focused Party tests**

Run: `pnpm --dir src/services/system/party-service test:l1`

- [x] **Step 2: Run focused CRM tests**

Run: `pnpm --dir src/services/business/crm-service test:l1`

- [x] **Step 3: Run both builds**

Run: `pnpm --dir src/services/system/party-service build`
Run: `pnpm --dir src/services/business/crm-service build`

- [x] **Step 4: Report residual scope**

Call out any deferred proto generation, API Gateway, tenant-web, L2 database, or smoke test work if not completed in this thread.
