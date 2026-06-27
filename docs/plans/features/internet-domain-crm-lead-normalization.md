# InternetDomain And CRM Lead Domain Normalization

## 1. Feature Status

Current status: `implementation blocked on CRM/Gateway ownership`

This feature packet records the agreed boundary for adding a global `InternetDomain` value object and applying it to CRM Lead domain write and duplicate paths.

Stable truth sources remain:

- [03-technical-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/03-technical-architecture.md)
- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- [browser-extension-crm-workspace-p1.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/browser-extension-crm-workspace-p1.md)

This packet does not redefine CRM service ownership, Party ownership, browser extension ownership, or Gateway BFF contracts.

## 2. Goal

Introduce one shared formatting value object so services can canonicalize internet host/domain text consistently before applying their own business rules.

The immediate business outcome is that CRM Lead domain matching treats `www.vintagetub.com` and `vintagetub.com` as the same host evidence while preserving subdomains such as `shop.vintagetub.com`.

## 3. Common Boundary

`src/common` owns only syntactic internet domain normalization:

- trim input
- lower-case host text
- accept URL or hostname input
- remove protocol, path, query and hash when a URL is supplied
- remove a trailing dot
- remove the common display prefix `www.`
- preserve non-display subdomains such as `shop.example.com`
- expose validity as data instead of throwing for blank or invalid input

`src/common` must not own:

- CRM duplicate policy
- Party identity resolution
- customer ownership
- public suffix or registrable-domain business interpretation
- data merge or migration decisions

## 4. CRM Integration Boundary

CRM service remains the owner of Lead write/update/duplicate behavior.

Once ownership is available, CRM should:

- canonicalize `leadDomain` before saving Lead create values
- canonicalize `leadDomain` before saving Draft Lead create values
- canonicalize `leadDomain` before saving Draft Lead update values
- canonicalize duplicate-check input before querying
- compare duplicate candidates by canonical host so historical `www.` values can still match canonical input

This is not a historical data merge. Existing rows may be read and compared with canonicalization, but no automatic bulk update or duplicate merge should run in this feature.

## 5. Gateway And Extension Boundary

The browser extension may continue sending page-derived domains such as `www.vintagetub.com`.

API Gateway should keep BFF behavior focused on HTTP presentation and downstream invocation. CRM service must remain the fallback owner of canonical duplicate recognition so non-extension clients get the same behavior.

## 6. Required Verification

The complete feature requires:

- `@oes/common` tests covering `InternetDomain`
- CRM Lead create, Draft create, Draft update and duplicate tests
- API Gateway extension CRM resolve/search tests showing `www.vintagetub.com` matches `vintagetub.com`
- relevant typecheck/build commands for common, CRM service and API Gateway
- live or semi-live extension CRM/search resolve smoke

## 7. Current Blocker

Hub ownership currently blocks the CRM service and Gateway extension CRM files required for full integration. The current thread may implement and verify the `@oes/common` value object, but the feature is not complete until those ownership conflicts are resolved.
