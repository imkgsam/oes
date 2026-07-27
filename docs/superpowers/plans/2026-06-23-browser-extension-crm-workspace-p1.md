# Browser Extension CRM Workspace P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the unified browser extension shell with CRM Sales Workspace as the first enabled business workspace, covering personal enablement, side panel operation, `/extension/crm/*` BFF, and CRM P1 actions.

**Architecture:** Keep the extension as a terminal front end and keep CRM truth inside `crm-service`. Permission/navigation visibility remains in `permission-service`; user enablement is local extension preference only; API Gateway owns the terminal-specific `/extension/crm/*` facade and redaction.

**Tech Stack:** Vue 3, Vite MV3 Chrome extension, Vitest, NestJS, class-validator DTOs, existing API Gateway CRM proxy, existing permission-service navigation seed, Jest.

---

## Source Of Truth

- Product design: `docs/plans/designs/browser-workspace-extension-design.md`
- Feature packet: `docs/plans/features/browser-extension-crm-workspace-p1.md`
- BFF contract: `docs/contracts/api-gateway/extension-crm-workspace.md`
- CRM service truth: `docs/architecture/services/crm-service.md`
- Permission service truth: `docs/architecture/services/permission-service.md`

Do not restore `docs/plans/features/browser-prospecting-workspace.md`. Do not introduce `/browser-prospecting/*`.

## File Map

### Permission Navigation

- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
  - Register `extension.crm.workspace`.
  - Add it to `crm.sales` and `crm.sales_manager` role visibility for `BROWSER_EXTENSION`.
- Modify: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
  - Assert the new entry, Chinese name, supported terminal, and visibility rows.

### Browser Extension Shell

- Modify: `app/browser-extension/public/manifest.json`
  - Add MV3 side panel, background service worker, content script scripting support, commands, context menu permission, and `activeTab`.
- Modify: `app/browser-extension/vite.config.ts`
  - Build popup, side panel, background, and content script entries deterministically.
- Modify: `app/browser-extension/src/auth/api.ts`
  - Add `getSessionAccessSummary(accessToken)`.
- Modify: `app/browser-extension/src/auth/types.ts`
  - Add access summary types if they are not already represented strongly enough.
- Create: `app/browser-extension/src/workspaces/workspace-registry.ts`
  - Own extension workspace keys, labels, and terminal workspace display mapping.
- Create: `app/browser-extension/src/workspaces/workspace-preferences.ts`
  - Store local workspace enablement per tenant/account/workspace.
- Create: `app/browser-extension/src/runtime/messages.ts`
  - Define typed background/content/side-panel message contracts.
- Create: `app/browser-extension/src/runtime/background.ts`
  - Own side panel opening, context menu registration, command handling, and current-tab broker.
- Create: `app/browser-extension/src/runtime/page-signals.ts`
  - Collect bounded official-site and search-result signals only after user action.
- Create: `app/browser-extension/src/side-panel/main.ts`
  - Mount the side panel Vue app.
- Create: `app/browser-extension/src/side-panel/CrmWorkspaceApp.vue`
  - Render CRM workspace states and actions.
- Create: `app/browser-extension/src/side-panel/crm-api.ts`
  - Call `/extension/crm/*` with the extension access token.
- Create: `app/browser-extension/src/side-panel/crm-types.ts`
  - Keep front-end types aligned with `extension-crm-workspace.md`.
- Modify: `app/browser-extension/src/popup/PopupApp.vue`
  - Show `extension.crm.workspace`, render local enable/disable state, and open side panel.
- Modify/Create tests under `app/browser-extension/src/**/*.spec.ts`.

### API Gateway BFF

- Create: `src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.ts`
  - Compose extension-safe CRM status view models and map page signals into existing CRM P1 service calls.
- Create: `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.ts`
  - Expose the seven `/extension/crm/*` endpoints.
- Create: `src/services/api-gateway/src/modules/crm-service/interface/http/dtos/extension-crm-workspace.dto.ts`
  - Validate page/search/create/check request payloads.
- Create: `src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.spec.ts`
  - Cover status/action mapping, redaction, source mapping, and duplicate blocking.
- Create: `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.spec.ts`
  - Cover permission annotations and routing shape.
- Modify: `src/services/api-gateway/src/modules/crm-service/crm-service.module.ts`
  - Register the extension controller and service.

## Task 1: Navigation Entry And Visibility

**Files:**
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
- Modify: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`

- [ ] **Step 1: Write failing navigation seed expectations**

Add `extension.crm.workspace` to the registry expectation after `extension.designer.workspace`, with name `CRM Sales Workspace`. Add assertions that `supportedTerminals` is exactly `['BROWSER_EXTENSION']` and `entryType` is `workspace`.

Add visibility expectations for both CRM sales roles:

```ts
expect(visibility).toEqual(
  expect.arrayContaining([
    {
      roleId: 'template-crm-sales',
      entryKey: 'extension.crm.workspace',
      terminal: 'BROWSER_EXTENSION',
      enabled: true
    },
    {
      roleId: 'template-crm-sales-manager',
      entryKey: 'extension.crm.workspace',
      terminal: 'BROWSER_EXTENSION',
      enabled: true
    }
  ])
)
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
pnpm --filter permission-service test:l1 -- navigation-foundation.seed.spec.ts
```

Expected: FAIL because `extension.crm.workspace` is not in `DEFAULT_NAVIGATION_ENTRIES` or CRM role visibility.

- [ ] **Step 3: Add the navigation seed**

In `navigation-foundation.ts`, add `extension.crm.workspace` to `NAVIGATION_VISIBILITY_ENTRY_KEYS_BY_ROLE_CODE.crm.sales` and `.crm.sales_manager`. Register the entry with:

```ts
{
  entryKey: 'extension.crm.workspace',
  name: 'CRM Sales Workspace',
  description: '浏览器插件 CRM Sales Workspace 入口。',
  featureKey: 'crm',
  supportedTerminals: ['BROWSER_EXTENSION'],
  registryPriority: 37,
  enabled: true,
  entryType: 'workspace'
}
```

Keep registry priorities contiguous.

- [ ] **Step 4: Run the navigation test**

Run:

```bash
pnpm --filter permission-service test:l1 -- navigation-foundation.seed.spec.ts
```

Expected: PASS.

## Task 2: Popup Workspace Registry And Local Enablement

**Files:**
- Create: `app/browser-extension/src/workspaces/workspace-registry.ts`
- Create: `app/browser-extension/src/workspaces/workspace-preferences.ts`
- Modify: `app/browser-extension/src/popup/PopupApp.vue`
- Modify: `app/browser-extension/src/popup/PopupApp.spec.ts`
- Modify: `app/browser-extension/src/auth/api.ts`
- Modify: `app/browser-extension/src/auth/api.spec.ts`

- [ ] **Step 1: Add failing workspace registry tests**

In `PopupApp.spec.ts`, expect `visibleWorkspaces()` to map `extension.crm.workspace` to:

```ts
{
  disabled: false,
  key: 'extension.crm.workspace',
  label: 'CRM Sales Workspace',
  secondaryLabel: '浏览器侧客户识别与线索创建'
}
```

Also assert `crm.accounts` and `crm.pool` do not render as browser extension workspaces.

- [ ] **Step 2: Add failing local preference tests**

Create tests for:

```ts
buildWorkspacePreferenceKey({
  tenantId: 'tenant-1',
  accountId: 'acc-1',
  workspaceKey: 'extension.crm.workspace'
})
```

Expected key:

```text
workspace-enabled:tenant-1:acc-1:extension.crm.workspace
```

Default preference must be `false`; tenant/account/workspace combinations must not bleed into each other.

- [ ] **Step 3: Implement registry and preferences**

Move workspace display mapping out of `PopupApp.vue` into `workspace-registry.ts`. Implement `WorkspacePreferenceStore` on top of `chrome.storage.local` when available, with an in-memory fallback for Vitest.

- [ ] **Step 4: Add access-summary API support**

Add:

```ts
getSessionAccessSummary(accessToken: string): Promise<SessionAccessSummary> {
  return this.get<SessionAccessSummary>('/extension/auth/session/access-summary', accessToken)
}
```

Do not use access summary to grant visibility; visibility still comes from `navigation.visibleEntries`.

- [ ] **Step 5: Update popup UI behavior**

In authenticated state:

- Show CRM workspace only when `navigation.visibleEntries` contains `extension.crm.workspace`.
- Show the local enable switch for CRM workspace.
- Keep CRM disabled by default.
- When enabled, call background to open the side panel.
- When disabled, close no session and revoke no backend permissions; only stop extension-local CRM runtime.

- [ ] **Step 6: Verify extension unit tests**

Run:

```bash
pnpm --dir app/browser-extension test:unit
pnpm --dir app/browser-extension typecheck
```

Expected: PASS.

## Task 3: MV3 Side Panel Runtime

**Files:**
- Modify: `app/browser-extension/public/manifest.json`
- Modify: `app/browser-extension/vite.config.ts`
- Create: `app/browser-extension/src/runtime/messages.ts`
- Create: `app/browser-extension/src/runtime/background.ts`
- Create: `app/browser-extension/src/runtime/page-signals.ts`
- Create: `app/browser-extension/src/runtime/page-signals.spec.ts`
- Create: `app/browser-extension/src/side-panel/main.ts`
- Create: `app/browser-extension/src/side-panel/CrmWorkspaceApp.vue`

- [ ] **Step 1: Write runtime contract tests**

Test that the page signal collector:

- returns URL, domain, title, pageKind, selectedText, emails, phones, social links, and capturedAt for official pages;
- caps selected text length;
- caps search results count;
- returns no body text dump.

- [ ] **Step 2: Add MV3 manifest capabilities**

The manifest must include only P1 permissions:

```json
{
  "permissions": ["storage", "activeTab", "scripting", "sidePanel", "contextMenus"],
  "background": {
    "service_worker": "src/runtime/background.ts",
    "type": "module"
  },
  "side_panel": {
    "default_path": "side-panel.html"
  },
  "commands": {
    "open-crm-workspace": {
      "suggested_key": {
        "default": "Alt+Shift+O"
      },
      "description": "Open OES CRM workspace"
    }
  }
}
```

Do not add persistent `<all_urls>` content injection.

- [ ] **Step 3: Implement background broker**

`background.ts` owns:

- side panel open request from popup;
- command/context-menu registration only when CRM workspace is locally enabled;
- active tab lookup;
- one-shot script execution for page signal collection.

- [ ] **Step 4: Add side panel entry**

Add `side-panel.html` through Vite multi-entry build and mount `CrmWorkspaceApp.vue`.

- [ ] **Step 5: Verify extension runtime**

Run:

```bash
pnpm --dir app/browser-extension test:unit
pnpm --dir app/browser-extension build
```

Expected: PASS and `dist/manifest.json` references generated background and side-panel assets.

## Task 4: Extension CRM BFF Facade

**Files:**
- Create: `src/services/api-gateway/src/modules/crm-service/interface/http/dtos/extension-crm-workspace.dto.ts`
- Create: `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.ts`
- Create: `src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.ts`
- Create: `src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.spec.ts`
- Create: `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/extension-crm-workspace.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/crm-service/crm-service.module.ts`

- [ ] **Step 1: Write service mapping tests**

Cover:

- `UNKNOWN` page result exposes `CHECK_DUPLICATE`, `CREATE_DRAFT_LEAD`, `CREATE_ACTIVE_LEAD` when action codes permit.
- `POOL_LEAD` exposes `CLAIM_POOL_LEAD`.
- `OTHER_OWNER_LEAD` and `RESTRICTED` redact email, phone, owner account id, internal notes, and activity fields.
- search result resolve never exposes create or claim actions.
- create active lead maps `sourceType = BROWSER_EXTENSION`, `assignmentIntent = OWNED_BY_OPERATOR`, `claimForCurrentUser = false`.
- duplicate-blocked CRM result is passed through without fabricated success.

- [ ] **Step 2: Write controller tests**

Assert these route handlers and permissions:

```text
POST /extension/crm/page-context/resolve       crm.account.read
POST /extension/crm/search-results/resolve    crm.account.read
POST /extension/crm/leads/check-duplicate     crm.account.read
POST /extension/crm/draft-leads               crm.account.create
POST /extension/crm/leads                     crm.account.create
POST /extension/crm/accounts/:crmAccountId/claim crm.account.claim
GET  /extension/crm/accounts/:crmAccountId    crm.account.read
```

- [ ] **Step 3: Implement DTOs**

Use `class-validator` for required page fields, bounded arrays, and enum-like string checks. Normalize page body evidence into bounded `sourceRawPayload`; never accept tenant/operator/terminal from request body.

- [ ] **Step 4: Implement service**

Reuse `CustomerManagementService` and existing adapters. Add extension-safe mappers in this service rather than changing CRM domain behavior.

- [ ] **Step 5: Register controller and service**

Add `ExtensionCrmWorkspaceController` and `ExtensionCrmWorkspaceService` to `CrmServiceProxyModule`.

- [ ] **Step 6: Verify API Gateway tests**

Run:

```bash
pnpm --filter api-gateway test -- extension-crm-workspace
pnpm --filter api-gateway build
```

Expected: PASS.

## Task 5: CRM Side Panel UI And Actions

**Files:**
- Create: `app/browser-extension/src/side-panel/crm-api.ts`
- Create: `app/browser-extension/src/side-panel/crm-types.ts`
- Create: `app/browser-extension/src/side-panel/CrmWorkspaceApp.spec.ts`
- Modify: `app/browser-extension/src/side-panel/CrmWorkspaceApp.vue`
- Modify: `app/browser-extension/src/popup/styles.css` or create `app/browser-extension/src/side-panel/styles.css`

- [ ] **Step 1: Write side panel state tests**

Cover states:

```text
disabled
enabled-empty
resolving
unknown
possible-duplicate
owned-lead
pool-lead
other-owner-lead
prospect-customer
customer
restricted
mutation-success
error
```

- [ ] **Step 2: Implement API client**

Create a small `ExtensionCrmApi` with methods matching `extension-crm-workspace.md`. It must attach bearer token from extension auth storage and never call `/extension/crm/*` when local workspace preference is disabled.

- [ ] **Step 3: Implement official-site flow**

The primary action sequence:

```text
Enable CRM workspace -> Open side panel -> Identify current page -> Resolve status -> Check duplicate -> Create Draft Lead or Active Lead -> Refresh summary -> Open in OES
```

`OPEN_OES_DETAIL` opens `/crm/accounts/:crmAccountId` in tenant-web.

- [ ] **Step 4: Implement Pool claim flow**

For `POOL_LEAD`, render claim and detail actions only when returned in `allowedActions`. After claim, refresh status as `OWNED_LEAD`.

- [ ] **Step 5: Implement search-results read-only flow**

Resolve candidates and render low-sensitivity statuses. Do not render create, claim, or batch import actions on search results pages.

- [ ] **Step 6: Verify frontend**

Run:

```bash
pnpm --dir app/browser-extension test:unit
pnpm --dir app/browser-extension typecheck
pnpm --dir app/browser-extension build
```

Expected: PASS.

## Task 6: End-To-End Smoke And Cleanup Guardrails

**Files:**
- Create or modify smoke script only if an existing local smoke pattern is present and lightweight.
- Modify no global roadmap/control-board files from this thread.

- [ ] **Step 1: Static cleanup scan**

Run:

```bash
rg -n "browser-prospecting|/browser-prospecting|browser-prospecting-workspace" docs app src -g '!**/node_modules/**' -g '!**/dist/**'
```

Expected: only intentional deprecation notes in design/feature/contract docs, or no matches.

- [ ] **Step 2: Backend focused verification**

Run:

```bash
pnpm --filter permission-service test:l1 -- navigation-foundation.seed.spec.ts
pnpm --filter api-gateway test -- extension-crm-workspace
pnpm --filter api-gateway build
```

Expected: PASS.

- [ ] **Step 3: Extension focused verification**

Run:

```bash
pnpm --dir app/browser-extension test:unit
pnpm --dir app/browser-extension typecheck
pnpm --dir app/browser-extension build
```

Expected: PASS.

- [ ] **Step 4: Manual local extension check**

Load `app/browser-extension/dist` in Chrome extension developer mode and verify:

- unauthenticated popup shows login;
- authenticated popup shows `CRM Sales Workspace` only when backend navigation includes `extension.crm.workspace`;
- CRM workspace defaults off;
- enabling opens side panel;
- identifying a normal website triggers a user-initiated resolve request;
- search results view is read-only;
- logout still clears session and returns to login.

- [ ] **Step 5: Record implementation handoff**

Record the verified implementation scope, changed files, test evidence, and follow-up risks in the feature packet before handing the work to the next owner.

## Self-Review

- Spec coverage: navigation, local enablement, popup launcher, side panel, background/content runtime, `/extension/crm/*`, CRM P1 actions, search read-only flow, and old direction cleanup are covered.
- Boundary check: no new CRM truth in extension, no shared database access, no `/browser-prospecting/*`, no tenant-level plugin enablement.
- Verification: focused permission-service, api-gateway, and browser-extension commands are listed with expected results.
