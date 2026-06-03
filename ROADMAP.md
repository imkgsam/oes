# OES Roadmap

OES is being built as a vertical enterprise application system for sanitary ceramic manufacturing. The roadmap below describes the product direction, not a guarantee of release dates.

## Phase 1: Enterprise Foundation

Focus: make the system safe to run as a governed multi-tenant enterprise application.

- Tenant and organization management.
- Account, identity, employee binding, and login foundations.
- Role, permission, scope, and policy governance.
- API Gateway / BFF entry points.
- Service contracts and backend module structure.
- Tenant web administration foundation.
- Audit-aware authentication and operator context propagation.

## Phase 2: Product And Mold Foundation

Focus: establish the product and mold records that sanitary ceramic manufacturing depends on.

- Item master, product models, categories, attributes, and packaging.
- Mold design records and mold detail pages.
- Production mold lifecycle and status management.
- Mold-to-product and mold-to-design linkage.
- Manufacturing data screens for tenant web.
- Contract alignment between item master, MES, and frontend BFF surfaces.

## Phase 3: Shop-floor Execution

Focus: connect office workflows with factory-floor operations.

- PDA web and Android operational shell.
- Employee-code and PIN login flows for shop-floor use.
- Terminal device restrictions and terminal access policies.
- Barcode/camera scanning support.
- Workbench flows for production and warehouse operators.
- Slip-casting entry and daily production record capture.

## Phase 4: Manufacturing Operations Integration

Focus: connect mold, production, warehouse, supplier, procurement, sales, and finance workflows.

- CRM and sales demand collaboration.
- WMS inventory movement and warehouse execution.
- SRM and procurement collaboration.
- MES production progress and exception tracking.
- Finance settlement and operating visibility.
- Cross-service traceability from customer demand to production and inventory.

## Phase 5: Operational Intelligence

Focus: help operators and managers understand risk, workload, and manufacturing state without weakening governance.

- Production and mold health dashboards.
- Inventory and material alerts.
- Exception summaries for shop-floor and management users.
- Audit-friendly operational history.
- AI-assisted analysis and recommendations through controlled application services.
- Cost, permission, and audit controls for AI-assisted workflows.

## Near-term Priorities

- Stabilize the mold-management product path.
- Improve the runnable demo path for system foundation and tenant web.
- Add screenshots and walkthroughs for sanitary ceramic manufacturing workflows.
- Keep service boundaries, contracts, and frontend behavior aligned as implementation expands.
