# Tenant Web Navigation Contract Repair

featureKey: tenant-web-navigation-contract-repair
truthCommit: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
baseSha: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
integrationBranch: codex/tenant-web-navigation-contract-repair
worktreeKey: a95f
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: RUNNING

## Objective

Align the tenant-web navigation registry request with the canonical API Gateway `GET /navigation/entries` contract, map stable entry keys onto the local Web route tree, and remove the local-route recovery path that only masked the unsupported `/menu/all` request.

## Slices

### navigation-contract-client-and-route-mapping
state: RUNNING
candidate: pending
review: local-ri

- Scope:
  - `app/web/apps/tenant-web/src/api/**`
  - `app/web/apps/tenant-web/src/router/**`
  - focused tenant-web API/router tests
- Protected scope:
  - API Gateway and permission-service endpoint semantics
  - `GET /auth/session/context` navigation-summary contract
  - local Web route hierarchy, icons, layout, and legacy route redirects
  - unrelated tenant-web pages and shared Vben packages
- Dependencies:
  - `docs/contracts/api-gateway/permission-management.md`
  - `docs/contracts/api-gateway/navigation-summary.md`
  - current API Gateway `NavigationController`
- Acceptance:
  - the tenant-web request uses `GET /navigation/entries` with enabled Web registry filters and complete pagination
  - the registry response is mapped by `entryKey` onto local Web routes; no backend route/menu hierarchy is introduced
  - SYSTEM and TENANT management entry keys keep their local pages when both registry and session visibility allow them
  - an empty registry list yields no governed menu routes
  - permission denial and service failure remain observable failures and do not expose local routes through a catch-all fallback
  - unknown registry keys and local legacy redirects stay inside the documented compatibility boundary
  - no tenant-web runtime call site references `/menu/all`

## Request / response mapping truth table

| Gateway result | Session visibility | Tenant-web mapping |
| --- | --- | --- |
| enabled `WEB` registry entry with a mapped local `entryKey` | visible | keep the local route/menu record |
| enabled `WEB` registry entry with a mapped local `entryKey` | not visible | omit the local route/menu record |
| enabled `WEB` registry entry with no local mapping | any | ignore the unknown key; do not invent a Web route |
| local governed route missing from the registry result | visible or absent | omit it from the remote-registry menu result |
| empty `entries` with `total = 0` | any | return no governed menu records |
| paginated success | visible | read all pages before mapping, de-duplicate by `entryKey` |
| `403` permission denial | any | propagate the request failure; do not fall back to local routes |
| `5xx` or transport failure | any | propagate the request failure; do not fall back to local routes |
| local legacy redirect sharing an allowed `entryKey` | visible | preserve the local redirect compatibility route |

## Feature acceptance

- Focused API and router tests reproduce the former `/menu/all` request and prove the canonical request, payload mapping, empty result, denial, failure, SYSTEM/TENANT entries, pagination, and compatibility behavior.
- Tenant-web typecheck and affected build pass.
- Runtime Chrome regression records the canonical network request and verifies representative SYSTEM and TENANT management navigation.
