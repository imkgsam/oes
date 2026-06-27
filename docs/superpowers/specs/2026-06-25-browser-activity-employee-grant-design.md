# Browser Activity Employee Grant Design

## Confirmed Change

Browser activity collection is not controlled by a visible tenant-wide audit switch. Tenant administrators enable or disable collection per tenant account. Retention policy remains a backend governance concern and is not shown on the audit workbench.

## Collection Gate

An extension heartbeat or visit flush is accepted only when all conditions are true:

- The caller is authenticated as `BROWSER_EXTENSION`.
- The account belongs to the current tenant context.
- The account has an enabled `BrowserActivityEmployeeAuditGrant`.

An unauthenticated extension state, a WEB token, or an account without an enabled grant must not create heartbeat, online-presence, or visit records.

## Plugin Login Prerequisite

Browser activity BFF must verify terminal access before enabling a grant. The source of truth is permission-service account terminal access. A grant can be enabled only when the account's effective allowed terminals include `BROWSER_EXTENSION`.

Browser-activity-service owns the audit grant fact. It does not own or infer terminal-login eligibility.

## Workbench UI

The workbench removes the tenant policy panel and retention values. The selected employee becomes the page context:

- A top employee selector controls the timeline, domain aggregation, and URL search context.
- The selector and context bar show plugin login capability, browser audit grant status, and heartbeat-derived collection-channel state.
- Accounts without plugin login capability show a disabled enable action with guidance to configure Browser Extension terminal access first.

## Boundaries

- Online presence remains collection-channel liveness only.
- Browser activity facts remain URL/domain/title/duration summaries only.
- The UI must not imply productivity scoring or violation judgment.
