# Navigation Summary Design

> `permission-service` 的服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只描述 API Gateway / BFF navigation-summary contract，不重新定义 NavigationEntry、RoleNavigationVisibility、RoleLandingPolicy 或 navigation governance owner 边界。

## 1. Purpose

This document defines the OES navigation-summary design used by API Gateway / BFF contracts.

The goal is to let the back end remain the source of truth for navigation visibility while keeping terminal-specific route, page, screen, menu, and layout decisions inside each front end.

## 2. Core Decision

OES navigation must not expose Web routes as the cross-terminal contract.

The stable contract is:

- Back end returns `defaultEntry` and `visibleEntries`.
- Front ends map entry keys to their own terminal-specific navigation structure.
- Web maps entry keys to routes and menu trees.
- Mobile maps entry keys to screens or tabs.
- PDA maps entry keys to task entries.
- KIOSK maps entry keys to fixed-station touch-screen workspaces.
- Mini programs map entry keys to page paths.

## 3. Responsibility Split

Back end owns:

- Current context visibility truth.
- Which navigation entries are visible for the current operator / tenant / terminal.
- Which entry should be the default entry.

Front end owns:

- `entryKey -> route / page / screen` mapping.
- Menu hierarchy, grouping, icons, layout, and rendering.
- Terminal-specific filtering of unsupported entries.
- Fallback behavior when a returned entry key is not mapped locally.

## 4. Why The Back End Does Not Return Menu Hierarchy

Menu hierarchy is not universally shared across OES terminals.

Web commonly needs a sidebar or menu tree, but PDA, mobile, and mini-program clients may use task lists, tabs, screen stacks, or page groups instead. Returning a back-end-owned hierarchy would force a Web information architecture onto other terminals.

Therefore, the back end returns visible entry keys rather than a universal menu tree. Each terminal keeps its own local navigation structure and filters it using `visibleEntries`.

## 5. Permission, Navigation, And Actions Are Separate

Navigation visibility must not be modeled as a one-to-one mapping with permission codes.

Example:

- A tenant admin may still need `permission.list` to assign permissions while editing tenant roles, but that does not imply access to the standalone permission-management entry.
- That does not mean the tenant admin should see the platform-level Permission Dictionary management page.

OES separates:

- Navigation visibility: whether an entry/page should be shown.
- Action authorization: whether a button or operation should be available.
- Data authorization: what data a page can read or mutate through `buildQueryScope` / `checkResource`.

## 6. Runtime Inputs

Navigation visibility may use these inputs:

- Current operator context.
- Current account / tenant / org context.
- Terminal type.
- Navigation visibility policy.
- Permission or capability summaries when needed.

Tenant feature / plugin enablement is intentionally not part of the current navigation visibility model. OES is not currently pursuing tenant-level module or plugin enablement as a navigation or authorization concern.

## 7. Contract Shape

The target navigation shape is:

```json
{
  "navigation": {
    "defaultEntry": "workbench.home",
    "visibleEntries": [
      "workbench.home",
      "iam.role-management",
      "auth.admin.audit"
    ]
  }
}
```

Rules:

- `defaultEntry` is the back-end-selected default navigation entry.
- `visibleEntries` is the set of entry keys visible in the current context.
- The response must not include Web routes as the stable cross-terminal truth.
- The response must not include a universal menu hierarchy.

## 8. Current Auth BFF Integration

`GET /auth/session/context` is the first consumer of this design.

Current behavior:

- Returns `navigation.defaultEntry`.
- Returns `navigation.visibleEntries`.
- Uses `PermissionAccessSummaryService.ResolveAccountNavigation` when managed role navigation config is available.
- Falls back to `workbench.home` for tenant-scope sessions and `platform.home` for system-scope sessions while managed navigation config is not seeded.
- Keeps `navigation.defaultHomePath` as a temporary Web compatibility field.
- Keeps `navigation.menus` as a temporary compatibility placeholder.

Long-term direction:

- `defaultEntry` replaces `defaultHomePath` as the navigation truth.
- `visibleEntries` replaces `menus` as the navigation visibility truth.
- Web and other terminals perform their own mapping and rendering.

## 9. Default Entry Resolution

The default entry should eventually be resolved in this order:

- Filter entries by terminal support.
- Filter entries by operator navigation visibility.
- Resolve role landing candidates for the current `scopeLevel + terminal`.
- Drop landing candidates that are not in `visibleEntries`.
- Pick the highest-priority visible role landing entry.
- Fall back to the highest-priority visible registry entry.
- Fall back to `workbench.home` for tenant-scope sessions or `platform.home` for system-scope sessions if no better entry is available.

Important rules:

- Role landing policy must not grant entry visibility.
- `defaultEntry` must always be chosen from the current `visibleEntries`.
- User-specific landing preferences are not part of the current OES navigation model.

The current implementation resolves managed navigation through `permission-service` and preserves a scope-based fallback for rollout safety.

### 9.1 Future Managed Landing Policy

The future navigation-management feature is expected to make default-entry resolution configuration-driven while preserving the current response shape.

The first managed version is expected to use:

- `NavigationEntry Registry`
- `RoleNavigationVisibility`
- `RoleLandingPolicy`

Ownership split:

- `permission-service` owns the first-stage governance truth for entry registry, role visibility, and role landing policy.
- `api-gateway/auth-bff` consumes the runtime resolver result and exposes `navigation.defaultEntry` and `navigation.visibleEntries`.
- Front ends still own terminal-specific route, menu, icon, and layout mapping.

Conflict rule:

- When the current account has multiple roles, the first-stage managed resolver should use `RoleLandingPolicy.priority`.
- If no visible landing policy candidate remains, resolver falls back to registry priority and then scope fallback.

Explicit non-goal:

- Tenant feature / plugin enablement must not be added to the navigation visibility chain unless a future architecture decision reverses the current non-modular direction.

## 10. Entry Registry

OES needs a stable navigation entry registry to prevent drift between back end and front ends.

The registry may start as documentation and later evolve into configuration or plugin manifests.

Each entry should eventually define:

- Stable entry key.
- Human-readable purpose.
- Owning product capability.
- Supported terminals.
- Recommended priority.
- Whether it is a page, task, workspace, or abstract entry.

The registry is for governance and consistency. It is not a mandate for the back end to return terminal-specific menu trees.

## 10.1 Current Tenant Web Mapping

The current `tenant-web` implementation follows this split:

- Routes that belong to the left-side workbench navigation must declare a local `meta.entryKey`.
- `auth-bff` controls whether those entries are visible through `navigation.visibleEntries`.
- `tenant-web` only maps `entryKey -> route` and filters its local route tree using `visibleEntries`.
- Pages that belong to shell-level personal operations must not be treated as navigation entries unless the product explicitly decides to move them into the left-side navigation system.

Current `tenant-web` entry mapping:

| Entry key | Local route name | Path | Navigation ownership |
| --- | --- | --- | --- |
| `workbench.home` | `TenantWorkbenchHome` | `/workbench/home` | Back-end visible entry |
| `platform.home` | `PlatformAnalyticsHome` | `/analytics` | Back-end visible entry |
| `admin.auth-session-management` | `AdminAuthSessionManagement` | `/admin/auth-session-management` | Back-end visible entry |
| `admin.role-management` | `AdminRoleManagement` | `/admin/role-management` | Back-end visible entry |
| `admin.permission-management` | `AdminPermissionManagement` | `/admin/permission-management` | Back-end visible entry |

Current `tenant-web` routes that are intentionally **not** navigation entries:

| Local route name | Path | Reason |
| --- | --- | --- |
| `PersonalCenter` | `/account/profile` | Shell-level personal operation page entered from the user dropdown, not from left-side navigation |
| `SelfSecurityCenter` | `/account/security` | Shell-level self-service security page entered from the user dropdown, not from left-side navigation |

Governance rule:

- If a page should be shown or hidden through the left-side menu, it must have a stable `entryKey` and be controlled by `auth-bff navigation.visibleEntries`.
- If a page is a shell-level personal action, modal flow, fallback page, or authentication page, front ends may expose it through local shell UI without introducing a back-end navigation entry.
- Front ends must not invent a second business-level visibility system for pages that already belong to the navigation-entry model.

## 10.2 Current Auth BFF Entry Registry

As of the current `auth-bff` implementation, the emitted navigation-entry set is intentionally still minimal.

This section records the entry keys that are already treated as stable output of `GET /auth/session/context`, so later threads do not invent parallel keys or reassign existing ones casually.

| Entry key | Current default usage | Current emission rule | Current tenant-web route |
| --- | --- | --- | --- |
| `workbench.home` | Default entry for tenant-scope sessions | Always emitted when the current account scope is `TENANT` | `TenantWorkbenchHome` -> `/workbench/home` |
| `platform.home` | Default entry for system-scope sessions | Always emitted when the current account scope is `SYSTEM` | `PlatformAnalyticsHome` -> `/analytics` |
| `admin.auth-session-management` | Optional admin navigation entry | Emitted only when the current context is granted admin visibility for authentication and session management | `AdminAuthSessionManagement` -> `/admin/auth-session-management` |
| `admin.role-management` | Optional role management navigation entry | Emitted for current contexts that are allowed to manage role instances; `SYSTEM` scope can also manage templates, while `TENANT` scope stays on instance management only | `AdminRoleManagement` -> `/admin/role-management` |
| `admin.permission-management` | Optional permission management navigation entry | Emitted only when the current account is in `SYSTEM` scope and carries the `system.admin` role code | `AdminPermissionManagement` -> `/admin/permission-management` |

Current governance constraints:

- `auth-bff` owns whether an entry key is emitted in `navigation.visibleEntries`.
- Front ends may only map and render entry keys that already exist in the back-end contract.
- Adding a new left-navigation page requires first assigning or documenting its stable `entryKey`; front ends must not silently treat route names as contract keys.
- If a route does not have a back-end-owned `entryKey`, it must not be treated as part of the business navigation visibility model by default.

Current implementation decision:

- Navigation entries are not persisted as independent database records yet.
- Entry visibility can remain hardcoded in `auth-bff` while the entry set is still small and the product policy is not yet configuration-driven.
- Persisted role, permission, and account-role data remain the source facts used by `auth-bff` to derive `visibleEntries`.
- A future navigation-management feature should introduce the durable model for entry registry, terminal support, role visibility policy, role landing policy, and resolver preview.

## 11. Current Deferred Work

- Full navigation entry registry.
- Navigation-management feature for persisted entry registry and configurable role / capability visibility policy.
- Managed role landing policy and resolver preview contract.
- Terminal-aware visibility presenters.
- Action-code summary for button-level authorization.
- Data-level authorization remains handled by downstream `buildQueryScope` and `checkResource`.

## 12. PDA / KIOSK Baseline

PDA and KIOSK consume the same `navigation.defaultEntry` and `navigation.visibleEntries` shape as Web, but each terminal maps entries to its own local UI.

Phase 1 Terminal Access Policy work may seed only minimal system entries:

| Entry key | Terminal | Purpose |
| --- | --- | --- |
| `pda.home` | `PDA` | PDA shell home / first task surface |
| `kiosk.home` | `KIOSK` | Fixed station touch-screen shell home |

Business entries such as quality inspection, warehouse receiving, production execution, or scan result pages are not part of the terminal access baseline. They must be introduced by their owning business feature contracts.

Terminal access and navigation visibility remain separate:

- Terminal Access Policy decides whether a session can be established or refreshed from a terminal.
- Navigation visibility decides which entry keys are visible after a session exists.
