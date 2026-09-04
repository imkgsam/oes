# Cross-service Journey Registry

This directory is the only home for executable `*.journey.spec.*` tests. The repository runner
allocates loopback ports, starts one task-owned Postgres/NATS Compose runtime, migrates only the
selected service owners, and always runs rollback plus a Docker residue check. Browser Journeys use
headless Playwright. The PDA Journey uses Robolectric on the JVM; emulator coverage is conditional
and a real device remains a release-stage concern.

## Executable Journey registry

| Family and executable                                                         | Prerequisites and boundaries                                                                                | Success and critical failure                                                                               |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Web login and authorization — `web-login-authorization.journey.spec.ts`       | Chromium; browser → Gateway use cases → Auth handler → Identity/Permission HTTP boundaries                  | Tenant navigation and protected action resolve; a bad password creates no protected call                   |
| PDA login and device admission — `pda-login-device-admission.journey.spec.kt` | PDA Web build, JVM/Robolectric; Android native bridge → HTTP Gateway → Auth/Terminal Device                 | Bound device credential creates and persists a PDA session; invalid credential leaves native storage empty |
| Task notification — `task-notification.journey.spec.ts`                       | Collaboration/Notification Postgres plus ACL NATS; command transaction → outbox → JetStream durable → inbox | Assigned Task becomes one inbox item; wrong-owner envelope goes to DLQ without an inbox result             |
| Site publication and public view — `site-publish-public-view.journey.spec.ts` | Chromium and Runtime SQLite; Asset resolution → signed Site API → atomic Runtime commit → storefront        | Published product and immutable image render; media-kind mismatch stops before publication                 |
| Public business card — `public-business-card.journey.spec.ts`                 | Public Entry Postgres and Chromium; ShortLink → BusinessCard application → anonymous browser/vCard          | Redirect, public-safe render, vCard, and visit persistence work; unknown card returns an empty 404         |

Run the complete registry with `pnpm test:run -- --type journey`. A generated Change Plan narrows
the command with `--plan .tmp/change-plan.json`; each family is selected only by its declared risk
triggers. Every Journey also carries the same prerequisites, boundaries, success condition, critical
failure, and reproduce command in its source documentation.

The permanent trigger, consumer, risk-tag, shared-resource, and serial-group relationships live in
`scripts/test-infrastructure/relationships.json`. Change Plan fails closed if a selected Journey
matches zero or multiple families, and reports a gap if an activated family has no executable.
