# Mold Management Frontend Responsibility Design

## 1. Purpose

This design records the frozen frontend responsibility split for the first-stage mold management closed loop.

The service truth source remains [mes-service.md](../../architecture/services/mes-service.md). This document only classifies which frontend initiates each user workflow and which MES command or query it consumes.

## 2. Frontend Split

| Area | tenant-web | PDA |
| --- | --- | --- |
| MoldDesign | Manage design records, ItemModel references, output structure, default life template. | No support. |
| MasterMold | Manage completed master mold result objects. | No support. |
| ProductionMold identity | Pre-register production molds, generate QR codes, print labels, maintain ledger. | Confirm arrival by scanning an existing label. |
| Physical movement | Query and correct movement history. Configure storage resources. | Scan mold and target storage resource to record movement. |
| Drying | Configure/query drying storage resources and history. | Treat entering or leaving drying area as normal movement. |
| Installation | Query installation state and history; correct exceptional records. | Scan mold and WorkCenter, choose position index, install on line. |
| Readiness | Query readiness and history. | Confirm ready for casting or mark back to maintenance. |
| Usage | Query and aggregate usage history; exceptional correction only. | Record mold usage batch by WorkCenter. |
| Scrap | Mark scrap from ledger and query history. | Mark scrap in field and confirm physical removal. |
| Life counter | Query and adjust with audit reason. | Display only. |

## 3. First-Stage ProductionMold Lifecycle

```text
PRE_REGISTERED
  -> AVAILABLE
  -> MAINTENANCE
  -> READY
  -> SCRAP_PENDING
  -> SCRAPPED
```

`RECEIVED` is reserved for a future explicit inspection stage and is not used in the first-stage UI flow.

## 4. ProductionMold Pre-Registration And Arrival

tenant-web:

- Clerk pre-registers `ProductionMold`.
- MES creates the mold in `PRE_REGISTERED`.
- Web generates or displays the stable QR payload for the mold.
- Clerk prints the QR label and attaches it to the physical mold before or when it arrives.

PDA:

- Clerk or field operator scans the mold QR code.
- PDA loads the pre-registered mold summary.
- Operator confirms arrival.
- MES runs `ConfirmProductionMoldArrival`.
- State changes `PRE_REGISTERED -> AVAILABLE`.

Rules:

- PDA must not create mold identity records.
- PDA must not print QR labels.
- `PRE_REGISTERED` molds cannot move, install, be marked ready, record usage, or be moved to scrap through the field flow before arrival confirmation.

## 5. Movement And Drying

PDA is the normal movement entry:

```text
scan mold
-> scan target StorageResource
-> confirm movement
-> MoveTooling
```

Drying is not an independent process in the first stage:

- entering drying equals moving to a drying `StorageResource`
- leaving drying equals moving to another `StorageResource`
- no drying duration, temperature, humidity, batch, or quality result is managed in this slice

## 6. Installation Position

The first stage does not use `WorkUnit`.

Installation position is represented by:

```text
workCenterRef + moldPositionIndex
```

Rules:

- `moldPositionIndex` starts at `1`.
- Active installations in one `WorkCenter` must have unique and continuous indexes.
- If no index is provided, install at `max(index) + 1`.
- If an index is provided, insert at that index and shift existing active installations at that index and after it by `+1`.
- Removing an installed mold shifts following active installations by `-1`.
- The old free-text `moldPosition` design is replaced; new contracts and UI must use `moldPositionIndex`.

## 7. Installation And Readiness

PDA installation:

```text
AVAILABLE
  -> InstallTooling
  -> MAINTENANCE
```

Installing a mold creates an active `ToolingInstallation` but does not make the mold usable for casting.

PDA readiness:

```text
MAINTENANCE + active installation
  -> ConfirmInstalledMoldReady
  -> READY
```

PDA maintenance fallback:

```text
READY + active installation
  -> MarkInstalledMoldMaintenance
  -> MAINTENANCE
```

Rules:

- `READY` means installed and allowed to record casting usage.
- `MAINTENANCE` means not allowed to record casting usage.
- `MarkInstalledMoldMaintenance` requires a reason.
- Web may correct exceptional records but is not the normal entry for readiness changes.

## 8. Mold Usage

PDA records usage by WorkCenter:

```text
scan WorkCenter
-> list active installations ordered by moldPositionIndex
-> enter usage quantities for READY molds
-> RecordMoldUsageBatch
```

Rules:

- Only `READY` molds can submit usage.
- `MAINTENANCE` and `SCRAP_PENDING` rows remain visible but disabled.
- Rows with no quantity or zero quantity are skipped.
- Every submitted row must include `productionMoldId`, `toolingInstallationId`, and `usageQuantity > 0`.
- If any submitted row is invalid, the entire batch fails and no usage or life-counter update is written.
- MES derives `lifeDelta = usageQuantity`.
- The first stage does not save checklist or batch business objects.
- The first stage does not enforce one submission per day.

## 9. Scrap And Removal

Web and PDA can mark a mold for scrap.

Rules:

- Uninstalled molds move directly to `SCRAPPED`.
- Installed `READY` or `MAINTENANCE` molds move to `SCRAP_PENDING` and keep the active installation.
- `SCRAP_PENDING` remains visible in PDA line lists but cannot record usage.
- PDA is the normal entry for confirming physical removal.
- Confirming removal closes the installation, changes state to `SCRAPPED`, and shifts following `moldPositionIndex` values forward.

## 10. Life Counter

PDA:

- displays life usage, limit, and warning level
- cannot adjust life counters
- cannot modify historical usage rows

tenant-web:

- can adjust `MoldLifeCounter`
- must require audit reason
- can query usage and adjustment history

## 11. First-Stage Frontend Deliverables

tenant-web:

- MoldDesign management
- MasterMold management
- ProductionMold pre-registration
- QR generation and printing
- ProductionMold ledger
- current placement and installation query
- movement, installation, removal, and usage history
- scrap marking
- life counter adjustment
- audited correction workflows

PDA:

- confirm mold arrival
- move mold to target storage resource
- install mold on WorkCenter with `moldPositionIndex`
- confirm installed mold ready
- mark installed mold maintenance
- record WorkCenter mold usage batch
- mark scrap
- confirm removal
- concise mold status query
