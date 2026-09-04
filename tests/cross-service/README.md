# Cross-service Journey Registry

This directory is the only home for executable `*.journey.spec.*` tests. A Journey enters the
discovered inventory only after its complete production chain can be started, exercised, and torn
down deterministically by the repository runner. Component or Integration tests that replace a
service with a fake do not satisfy a Journey gap.

## Current required-family gaps

| Required family | Current status | Existing lower-class evidence | Missing executable link |
| --- | --- | --- | --- |
| Web login and authorization | `GAP` | Tenant Web auth store and session Components; Gateway Auth BFF Contracts; Auth, Identity, and Permission Contracts | One runner-owned browser session through Gateway, Auth, Identity, Permission, and Session Context |
| PDA login and device admission | `GAP` | PDA employee-code and session Units, restricted-view Component, bridge/BFF Contracts | One runner-owned PDA browser or emulator session through Gateway, Terminal Device, Auth, and Permission |
| Task notification | `GAP` | Collaboration outbox and Notification durable NATS/Postgres Integrations | One test that creates a real Collaboration Task and observes the resulting Notification Inbox item across both services |
| Site publication and public view | `GAP` | Site publication/concurrency Integrations and Site Runtime public-surface Integrations | One deterministic publish fixture observed through the real public Storefront |
| Public business card | `GAP` | Public Entry orchestration Units and Contracts plus Tenant Web public-card Components and BFF Contracts | One runner-owned Public Entry/Gateway/public-view chain covering redirect, render, vCard, and visit persistence |

The permanent trigger, consumer, risk-tag, shared-resource, and serial-group relationships live in
`scripts/test-infrastructure/relationships.json`. Change Plan reports the corresponding missing
Journey glob whenever a changed path activates one of these families.
