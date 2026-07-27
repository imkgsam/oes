# asset-service Event Contract

```text
ownerService: asset-service
serviceTruthSource: docs/architecture/services/asset-service.md
siteMediaContract: docs/contracts/asset-service/site-media.md
platformTransportContract: docs/contracts/events/platform-transport.md
catalogStatus: FROZEN_SUBSCRIBABLE
```

本文冻结 `asset-service` 对外发布的 Site Media availability 公共事实。Asset 生命周期、交付、下架与删除语义以 [asset-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/asset-service.md) 和 [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md) 为准；本文只定义可订阅事件，不重新定义 Asset 对象或 Site consumer 的业务反应。

## 1. `asset.site-media.availability.changed`

| Property                | Frozen value                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| Event Type              | `asset.site-media.availability.changed`                                |
| Event Version           | `1`                                                                    |
| Owner Service           | `asset-service`                                                        |
| CloudEvents `source`    | `urn:oes:service:asset-service`                                        |
| Aggregate Type          | `ASSET`                                                                |
| Aggregate ID            | Asset `assetId`; it is both CloudEvents `subject` and `oesaggregateid` |
| Catalog Status          | `FROZEN_SUBSCRIBABLE`                                                  |
| Notification Consumable | `false`                                                                |
| Primary Consumer        | `site-service` / `site-service__asset-site-media__v1`                  |
| NATS Subject            | `oes.events.asset.site-media.availability.changed`                     |

### Fact Trigger

`asset-service` publishes this fact when a tenant-scoped Site Media Asset's publicly consumable availability changes, including completed takedown / quarantine, completed deletion, or a completed recovery that makes public resolution available again.

- Archive alone is not an availability change when existing public delivery remains available.
- A takedown completion is publishable only after Asset has blocked every active delivery mapping origin and the CDN provider has confirmed every required precise purge.
- Asset business state, local audit record and the immutable outbox CloudEvent body must commit in one Asset-local transaction. The relay publishes that exact body; it does not rebuild the event.

### CloudEvents Envelope

The canonical body is CloudEvents `1.0` Structured JSON as defined by [platform-transport.md](./platform-transport.md). For this event:

| Envelope semantic         | CloudEvents field                                      | Requirement                                                                              |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Event identity            | `id`                                                   | Globally unique immutable `eventId`.                                                     |
| Fact time                 | `time`                                                 | Asset owner time at which this availability fact became true.                            |
| Tenant boundary           | `oestenantid`                                          | Required; equals the Asset tenant.                                                       |
| Optional organization     | `oesorgid`                                             | Optional; only when the verified originating context has an applicable org.              |
| Owner ordering            | `data.availabilityVersion`                             | Required; strictly increasing positive integer per `assetId`.                            |
| Trace                     | `oestraceid`                                           | Required.                                                                                |
| Audit / actor / causation | `oesauditref` / `oesactoraccountid` / `oescausationid` | Optional, subject to the platform transport contract.                                    |
| Schema identity           | `dataschema`                                           | Fixed by the standard mapping: `urn:oes:event:asset.site-media.availability.changed:v1`. |

`specversion` is always `1.0`; business version is only `oeseventversion = 1`. The legacy `.v1` suffix and `schema_version` payload field are forbidden.

### `data` Payload

| Field                 | Type             | Required | Meaning                                                                                        |
| --------------------- | ---------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `assetId`             | string           | Yes      | Stable Asset identity.                                                                         |
| `mediaKind`           | string           | Yes      | Asset-normalized Site Media kind.                                                              |
| `lifecycleStatus`     | string           | Yes      | Current Asset lifecycle state relevant to consumer handling.                                   |
| `deliveryStatus`      | string           | Yes      | Current public delivery availability state.                                                    |
| `availabilityVersion` | positive integer | Yes      | Strictly increasing owner version for this Asset's availability projection.                    |
| `changeReasonCode`    | string           | Yes      | Sanitized stable reason classification; no raw legal, security or provider detail.             |
| `operationId`         | string           | No       | Stable Asset lifecycle operation identity when the change came from an asynchronous operation. |

The payload must not duplicate envelope identity or context (`eventId`, `occurredAt`, `tenantId`, `traceId`, `eventVersion`), and must not carry `publicUrl`, storage key, provider credential, raw reason text, operator PII, Site Item / Category reference, or an Asset default alt.

### Consumer Compatibility

- `site-service` treats the event as an Asset fact only. It stores the minimal availability projection and never changes Asset lifecycle or automatically replaces Site content.
- For a single `assetId`, Site applies only a strictly greater `availabilityVersion`; equal or lower versions produce a durable `STALE_IGNORED` equivalent result and cannot overwrite a newer local projection.
- Inbox idempotency remains `(consumerName, CloudEvents id)`; duplicate `id` with an equivalent canonical body is ignored, while an identity/body conflict enters the consumer DLQ according to the platform contract.
- When `deliveryStatus` becomes unavailable, Site marks affected content pending / degraded and requires an explicit operator replacement or unpublish action. It does not substitute a placeholder URL.
- Consumers must fail closed on an unsupported future major `oeseventversion`.

### Compatibility Rules

Within `eventVersion = 1`, only optional `data` fields may be added. Existing fields, the Asset aggregate identity, `availabilityVersion` ordering, tenant envelope semantics and the meaning of `deliveryStatus` must not change. Any incompatible change requires a new business event version and an Event Catalog migration entry.

## 2. Compiled Contract Target

The later implementation target is:

```text
src/common/src/contracts/asset_service/events.ts
```

It must be owned by `asset-service` and export the frozen event type, business event version, owner identity, `data` payload TypeScript type, `OesCloudEvent<AssetSiteMediaAvailabilityChangedData>` composition and runtime validation descriptor. `src/common/src/contracts/asset_service/index.ts` must re-export it.

This Markdown contract remains the business semantic truth. No code is added by this alignment task; producer and consumer must not hand-copy event strings or payload interfaces before the compiled target exists.
