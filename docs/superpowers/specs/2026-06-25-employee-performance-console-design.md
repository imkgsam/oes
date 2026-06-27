# Employee Performance Console Design

## Goal

Build a tenant-web admin Employee Performance Console that uses the visual language of the existing `/analytics` page while keeping CRM, employee, permission, and browser-extension boundaries intact.

## Confirmed Direction

- Use the `Analytics Command Console` direction.
- Treat browser-extension data as one source slice, not as the core model.
- Add an API Gateway admin-facing read facade first.
- Use existing CRM/source facts where available.
- Show empty or pending states for metrics that cannot be derived from current data.
- Do not create a new performance service in P1.
- Do not add a second CRM truth model in tenant-web or the browser extension.

## Product Surface

The page is a tenant-web admin page, not a browser-extension page.

P1 UI areas:

- Header with period/source controls and refresh action.
- Employee switcher with selected employee context.
- Overview metrics: new leads, browser-extension recognitions, duplicate blocks, follow-up completion.
- Trend chart comparing source contribution over time.
- Source structure chart where `BROWSER_EXTENSION` is one segment.
- Recent activity stream.
- Admin actions: open employee CRM view, create review task placeholder, view source detail placeholder.

## Architecture

Tenant-web calls API Gateway:

```text
tenant-web admin page
  -> /admin/crm/performance/overview
  -> api-gateway CRM admin performance facade
  -> existing CRM BFF/query capabilities where available
```

API Gateway owns only the admin view model and redaction. It must not create CRM business rules. CRM remains the source of Lead, source record, owner, lifecycle, and archive facts.

## Data Contract Shape

P1 response returns:

- employee list
- selected employee summary
- period and source filter options
- overview metrics
- source breakdown
- trend series
- recent activities
- unavailable metric notices

The facade may initially be computed from existing CRM account/source records. If a metric is not available through current service APIs, it must be returned as unavailable instead of being fabricated.

## Permissions

The page requires CRM read/admin visibility. Frontend route visibility is controlled by navigation entry. API Gateway must enforce backend permission checks.

P1 uses a new tenant-web route entry:

- `admin.crm-performance-console`

## Frontend Design

The UI must align with current Vben tenant-web mode and `/analytics` page conventions:

- overview cards
- chart cards
- ECharts-based trend/source charts
- restrained light dashboard palette
- compact but premium controls
- loading, empty, error states
- responsive single-column fallback on narrow viewports

## Testing And Delivery

Required automated verification:

- API Gateway unit tests for the facade.
- tenant-web API client tests.
- tenant-web page tests for employee switching, empty states, and chart sections.
- tenant-web typecheck/build.

Required manual browser verification before delivery:

- Start tenant-web locally.
- Open the new page in a real browser.
- Confirm analytics-style layout renders.
- Switch employees.
- Change period/source filters.
- Confirm loading, empty, and error state behavior.
- Check desktop and narrow viewport.

## Non-goals

- No new performance-service.
- No plugin-owned admin truth.
- No AI scoring.
- No write-side CRM changes.
- No full BI-grade historical aggregation in P1.
