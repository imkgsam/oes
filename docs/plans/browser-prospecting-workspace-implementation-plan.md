# Browser Prospecting Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-stage OES browser prospecting workspace so the Chrome extension can read OES-visible context, persist research events under target workspaces, and create lead drafts without depending on formal CRM lead/contact/account models.

**Architecture:** The Chrome extension is an independent frontend app under `app/web/apps/browser-extension` and talks only to `api-gateway / BFF`. BFF exposes the browser prospecting contract and delegates durable business facts to the future `crm-service` internal `prospecting` slice. AI, external auto-scraping, SMTP email verification, screenshot core flow, and formal CRM lead creation are explicitly out of first-stage scope.

**Tech Stack:** NestJS, Prisma, PostgreSQL, TypeScript, Vue 3, Vite, Chrome Extension Manifest V3, pnpm workspace.

---

## 1. Scope Guard

This plan is executable only after these upstream documents remain accepted:

- [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/browser-prospecting-workspace.md)
- [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)

Do not implement:

- Formal CRM lead/contact/account/opportunity.
- Independent `prospecting-service` without ADR.
- AI automation.
- `<all_urls>` always-on injection.
- token scraping from `tenant-web` localStorage.

## 2. Planned File Structure

Backend service slice:

- Create: `src/services/business/crm-service/package.json`
- Create: `src/services/business/crm-service/tsconfig.json`
- Create: `src/services/business/crm-service/prisma/schema.prisma`
- Create: `src/services/business/crm-service/src/main.ts`
- Create: `src/services/business/crm-service/src/app.module.ts`
- Create: `src/services/business/crm-service/src/modules/prospecting/prospecting.module.ts`
- Create: `src/services/business/crm-service/src/domain/prospecting/**`
- Create: `src/services/business/crm-service/src/application/prospecting/**`
- Create: `src/services/business/crm-service/src/infrastructure/prospecting/**`
- Create: `src/services/business/crm-service/src/interfaces/http/prospecting/**` only if local smoke endpoints are needed.

Gateway BFF:

- Create: `src/services/api-gateway/src/modules/browser-prospecting/browser-prospecting.module.ts`
- Create: `src/services/api-gateway/src/modules/browser-prospecting/interfaces/http/controllers/browser-prospecting.controller.ts`
- Create: `src/services/api-gateway/src/modules/browser-prospecting/interfaces/http/dtos/*.dto.ts`
- Create: `src/services/api-gateway/src/modules/browser-prospecting/interfaces/http/view-models/*.view-model.ts`
- Create: `src/services/api-gateway/src/modules/browser-prospecting/application/*.use-case.ts`
- Create: `src/services/api-gateway/src/modules/browser-prospecting/infrastructure/*.adapter.ts`
- Modify: `src/services/api-gateway/src/app.module.ts`

Browser extension:

- Create: `app/web/apps/browser-extension/package.json`
- Create: `app/web/apps/browser-extension/vite.config.ts`
- Create: `app/web/apps/browser-extension/tsconfig.json`
- Create: `app/web/apps/browser-extension/manifest.config.ts`
- Create: `app/web/apps/browser-extension/src/background/**`
- Create: `app/web/apps/browser-extension/src/content/**`
- Create: `app/web/apps/browser-extension/src/side-panel/**`
- Create: `app/web/apps/browser-extension/src/context-menu/**`
- Create: `app/web/apps/browser-extension/src/commands/**`
- Create: `app/web/apps/browser-extension/src/api/**`
- Create: `app/web/apps/browser-extension/src/domain/**`

Docs:

- Modify: `docs/contracts/api-gateway/browser-prospecting-workspace.md`
- Modify: `docs/plans/features/browser-prospecting-workspace.md`
- Modify: `docs/plans/designs/browser-prospecting-workspace.md`

## 3. Implementation Slices

### Slice A: Contract Freeze

**Purpose:** Convert the BFF contract draft into implementation-ready DTO, action, and error semantics.

- [x] Freeze endpoint prefix.
  - Recommended: keep `/browser-prospecting`.
- [x] Freeze DTO required fields for:
  - `ResolveCurrentContextRequest`
  - `CreateTargetRequest`
  - `AppendResearchEventRequest`
  - `CreateLeadDraftRequest`
- [x] Freeze stable response view models for:
  - page information card
  - target detail
  - timeline item
  - lead draft result
- [x] Freeze first-stage action identifiers.
  - Keep UI action identifiers separate from permission codes.
- [x] Freeze stable error semantics.
  - Required errors: unauthenticated, not visible, action denied, invalid event payload, closed target, duplicate target candidate, lead draft not allowed.
- [x] Update [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md).
- [x] Verification:
  - Run `git diff --check -- docs/contracts/api-gateway/browser-prospecting-workspace.md`.

### Slice B: CRM Prospecting Persistence

**Purpose:** Build the minimal `crm-service` prospecting slice that owns durable research facts.

- [x] Freeze first-stage persisted object set and non-goals in `crm-service-design`.
- [x] Freeze that `SelectResearchTarget` is browser workspace continuity, not a durable prospecting business event.
- [x] Freeze first-stage transaction boundaries, invariants, and table direction in `crm-service-design`.
- [ ] Create `src/services/business/crm-service` as a NestJS service skeleton.
- [ ] Add Prisma models for:
  - `ResearchTarget`
  - `ResearchTargetRelation`
  - `ResearchEvent`
  - `ResearchFact`
  - `ContactClue`
  - `LeadDraft`
- [ ] Keep formal CRM `Lead`, `Account`, `Contact`, and `Opportunity` out of the first schema.
- [ ] Add domain classes or value objects for:
  - target status
  - target type
  - research event type
  - event source
  - visibility scope
- [ ] Add application use cases:
  - `ResolveProspectingContext`
  - `CreateResearchTarget`
  - `AppendResearchEvent`
  - `CreateLeadDraft`
- [ ] Add repository interfaces and Prisma implementations.
- [ ] Add unit tests for:
  - target creation does not create a formal CRM lead
  - append event requires target id
  - lead draft creation uses selected facts and clues only
  - closed target rejects new events except permitted status events
- [ ] Verification:
  - Run service unit tests for `crm-service`.
  - Run Prisma validation for `crm-service`.

### Slice C: Gateway BFF Module

**Purpose:** Expose browser prospecting HTTP endpoints and keep plugin callers behind BFF.

- [ ] Create `browser-prospecting` module in `api-gateway`.
- [ ] Add HTTP controller for the six first-stage endpoints.
- [ ] Add DTO validation classes for all write requests.
- [ ] Add view-model presenters for visibility-trimmed responses.
- [ ] Add BFF use cases that derive operator context from authenticated request context.
- [ ] Handle `SelectResearchTarget` as workspace continuity logic without turning it into a durable prospecting timeline event.
- [ ] Add downstream gRPC adapter to CRM prospecting slice.
- [ ] Ensure tenant, org, operator, trace, and audit metadata are attached server-side.
- [ ] Keep browser-facing HTTP DTO / ViewModel mapping separate from downstream gRPC contract mapping.
- [ ] Do not implement HTTP-to-HTTP forwarding from `api-gateway` into future `crm-service`.
- [ ] Add tests for:
  - unauthenticated calls are rejected
  - client-supplied tenant/operator fields are ignored
  - resolve returns action list from BFF view
  - append event forwards operator context
  - create lead draft does not call formal CRM lead creation
- [ ] Verification:
  - Run focused api-gateway tests for browser prospecting.

### Slice D: Extension Authentication Bridge

**Purpose:** Let the extension obtain authenticated access without scraping `tenant-web` storage.

- [x] Decide BFF owner:
  - `auth-bff`
- [x] Define contract location:
  - `docs/contracts/api-gateway/auth-bff-extension-connect.md`
- [x] Define connection grant endpoint.
- [x] Define grant redeem endpoint.
- [ ] Ensure connection grant is short-lived and one-time use.
- [ ] Ensure extension auth material is stored only in extension-controlled storage.
- [x] Add contract text to the API Gateway contract document.
- [ ] Add tests for:
  - expired grant rejected
  - reused grant rejected
  - grant cannot switch tenant/operator
  - content script cannot participate in token extraction

### Slice E: Browser Extension Skeleton

**Purpose:** Create the extension app and runtime boundaries without business-heavy UI.

- [ ] Create `app/web/apps/browser-extension`.
- [ ] Add package scripts:
  - `dev`
  - `build`
  - `typecheck`
- [ ] Add Manifest V3 config.
- [ ] Use first-stage permissions:
  - `storage`
  - `sidePanel`
  - `contextMenus`
  - `activeTab`
  - `scripting`
- [ ] Do not add `<all_urls>` default host permission.
- [ ] Add background service worker.
- [ ] Add side panel Vue entry.
- [ ] Add content script collection function.
- [ ] Add context menu registration.
- [ ] Add command handlers.
- [ ] Add typed BFF api client.
- [ ] Add local domain models for:
  - active target state
  - page capture draft
  - resolve result
  - timeline item
- [ ] Verification:
  - Run `pnpm --dir app/web --filter @oes/browser-extension typecheck`.
  - Run `pnpm --dir app/web --filter @oes/browser-extension build`.

### Slice F: Extension First User Flow

**Purpose:** Implement the minimal usable research loop.

- [ ] Open side panel from extension action.
- [ ] Resolve current page after user action.
- [ ] Display page information card.
- [ ] Create/select active target.
- [ ] Attach current page to active target.
- [ ] Save selected text as note.
- [ ] Save selected text as fact.
- [ ] Save selected text as contact clue.
- [ ] Open external tool URL from active target.
- [ ] Append `external_tool_opened`.
- [ ] Create lead draft from selected target data.
- [ ] Verification:
  - Manual load unpacked extension in Chrome.
  - Run smoke against local BFF.
  - Confirm no action works without authenticated extension session.

### Slice G: Integration Review

**Purpose:** Ensure the first-stage implementation respects project architecture boundaries.

- [ ] Confirm plugin never calls downstream services directly.
- [ ] Confirm content script does not read token storage.
- [ ] Confirm BFF does not persist prospecting business facts.
- [ ] Confirm `crm-service` prospecting slice does not define formal CRM lead/contact/account.
- [ ] Confirm AI event types remain reserved and unused.
- [ ] Confirm no `<all_urls>` always-on injection was introduced.
- [ ] Confirm docs are updated if endpoint or DTO names changed.

## 4. Testing Strategy

- Backend unit tests:
  - prospecting domain and application use cases.
- Gateway tests:
  - controller DTO validation and use-case orchestration.
- Extension unit tests:
  - local state reducer / store behavior.
  - BFF client request shape.
- Extension build checks:
  - typecheck.
  - production build.
- Manual smoke:
  - load unpacked extension.
  - authenticate through connection flow.
  - resolve current page.
  - create target.
  - append event.
  - create lead draft.

## 5. Commit Strategy

- Commit 1: contract freeze.
- Commit 2: CRM prospecting persistence skeleton.
- Commit 3: Gateway BFF module.
- Commit 4: extension auth bridge.
- Commit 5: browser extension skeleton.
- Commit 6: first user flow.
- Commit 7: integration review and docs sync.

## 6. Plan Self-Review

Spec coverage:

- BFF contract is covered by Slice A and Slice C.
- CRM prospecting ownership is covered by Slice B.
- Extension runtime is covered by Slice E and Slice F.
- Auth bridge is covered by Slice D.
- AI-ready but not AI implementation is covered by scope guard and Slice G.
- Manifest minimum permission strategy is covered by Slice E and Slice G.

Known gaps intentionally left out:

- Formal CRM lead/contact/account/opportunity implementation.
- AI-assisted prospecting feature.
- Email verification feature.
- Screenshot upload and attachment feature.
- Page annotation recovery.

Type consistency:

- This plan uses the current design terms: `ResearchTarget`, `ResearchEvent`, `ContactClue`, `LeadDraft`, `Target Workspace`, `Research Timeline`.

Placeholder scan:

- No placeholder markers are used.
