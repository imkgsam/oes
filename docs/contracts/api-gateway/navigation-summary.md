# Navigation Summary Design

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
- Mini programs map entry keys to page paths.

## 3. Responsibility Split

Back end owns:

- Current context visibility truth.
- Which navigation entries are visible for the current operator / tenant / terminal.
- Which entry should be the default entry.
- Tenant feature / plugin enablement as part of visibility decisions.

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

- A tenant admin may need `permission.list` to assign permissions while editing tenant roles.
- That does not mean the tenant admin should see the platform-level Permission Dictionary management page.

OES separates:

- Navigation visibility: whether an entry/page should be shown.
- Action authorization: whether a button or operation should be available.
- Data authorization: what data a page can read or mutate through `buildQueryScope` / `checkResource`.

## 6. Runtime Inputs

Navigation visibility may use these inputs:

- Current operator context.
- Current account / tenant / org context.
- Tenant feature or plugin enablement.
- Terminal type.
- Navigation visibility policy.
- Permission or capability summaries when needed.

Tenant feature / plugin enablement is required because OES is expected to evolve into a modular system where tenants enable only the modules they need.

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

Current stage-one behavior:

- Returns `navigation.defaultEntry`.
- Returns `navigation.visibleEntries`.
- Returns `workbench.home` for tenant-scope sessions and `platform.home` for system-scope sessions as the initial visible entry.
- Keeps `navigation.defaultHomePath` as a temporary Web compatibility field.
- Keeps `navigation.menus` as a temporary compatibility placeholder.

Long-term direction:

- `defaultEntry` replaces `defaultHomePath` as the navigation truth.
- `visibleEntries` replaces `menus` as the navigation visibility truth.
- Web and other terminals perform their own mapping and rendering.

## 9. Default Entry Resolution

The default entry should eventually be resolved in this order:

- Filter entries by terminal support.
- Filter entries by tenant feature / plugin enablement.
- Filter entries by operator navigation visibility.
- Pick the highest-priority visible entry.
- Fall back to `workbench.home` for tenant-scope sessions or `platform.home` for system-scope sessions if no better entry is available.

The first implementation returns one default entry until the feature registry and navigation policy are introduced.

## 10. Entry Registry

OES needs a stable navigation entry registry to prevent drift between back end and front ends.

The registry may start as documentation and later evolve into configuration or plugin manifests.

Each entry should eventually define:

- Stable entry key.
- Human-readable purpose.
- Owning feature or plugin.
- Supported terminals.
- Recommended priority.
- Whether it is a page, task, workspace, or abstract entry.

The registry is for governance and consistency. It is not a mandate for the back end to return terminal-specific menu trees.

## 11. Current Deferred Work

- Dynamic tenant feature / plugin enablement source.
- Full navigation entry registry.
- Terminal-aware visibility presenters.
- Action-code summary for button-level authorization.
- Data-level authorization remains handled by downstream `buildQueryScope` and `checkResource`.
