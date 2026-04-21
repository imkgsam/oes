# Browser Prospecting Workspace BFF Contract

## 1. Scope

This document defines the first-stage API Gateway / BFF black-box contract for the Chrome browser prospecting workspace.

The first-stage contract lets the browser extension:

- Resolve the current page against OES-visible prospecting state.
- Read a permission-trimmed target workspace detail view.
- Create or bind a target workspace.
- Append research events to a target.
- Create a lead draft as a future CRM handoff candidate.

This contract is intentionally BFF-facing. The extension must not call CRM, permission, identity, or future prospecting implementation services directly.

## 2. Current Status

This is an implementation-ready first-stage contract draft. It is not implemented yet.

Frozen for first-stage implementation:

- endpoint prefix: `/browser-prospecting`
- first-stage endpoint set
- required request fields
- response view-model shape
- first-stage action identifiers
- stable error semantics

Still not frozen by this contract:

- downstream implementation internals
- formal CRM lead / contact / account model
- `LeadDraft -> CRM Lead` contract
- AI suggestion endpoints

## 3. Responsibility Split

Back end owns:

- Resolving the authenticated operator, tenant, org, and trace context.
- Matching page signals against OES-known targets, research records, future CRM records, and negative-status markers.
- Applying permission, team relationship, manager scope, and policy-based visibility trimming.
- Returning only fields and actions the current operator may see or execute.
- Persisting target and research event writes with audit metadata.
- Creating lead drafts without treating them as formal CRM leads.

Browser extension owns:

- Capturing page signals such as URL, domain, page title, selected text, and locally extracted candidates.
- Managing local active target workspace UX.
- Rendering only the returned visibility-trimmed view.
- Sending user-confirmed write actions to BFF.
- Never deriving authorization from local role assumptions or hidden response fields.

Downstream implementation recommendation is future `crm-service` internal `prospecting` slice. The BFF contract must remain stable if a later ADR approves a different implementation owner.

## 4. Authentication And Context

All endpoints require an authenticated OES session recognized by Gateway / BFF.

For browser-extension callers in first stage, that session is expected to be established through the explicit `auth-bff` extension-connect flow:

- [auth-bff-extension-connect.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-extension-connect.md)

Gateway / BFF must derive these values from trusted context, not from client-supplied fields:

- `tenantId`
- `orgId` when applicable
- operator account / user context
- trace context
- audit metadata

The extension may send browser context fields such as `tabId`, but these are client runtime hints only. They must not become business identifiers.

### 4.1 Extension Authentication Direction

The current `tenant-web` session model uses bearer access and refresh tokens. The extension must not scrape or directly read `tenant-web` localStorage.

First-stage frozen direction:

- The user signs in through `tenant-web`.
- The user explicitly chooses a "connect browser extension" action from an authenticated OES page.
- `auth-bff` issues a short-lived, single-use extension connection grant.
- The extension redeems the grant through `auth-bff`.
- `auth-bff` returns an extension-usable authenticated session or token payload.
- The extension stores extension auth material only in extension-controlled storage.

The connect-flow black-box contract is defined separately in:

- [auth-bff-extension-connect.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-extension-connect.md)

Non-goals:

- The extension must not parse `tenant-web` Pinia persisted state from page storage.
- The extension must not ask content scripts to extract access or refresh tokens from web pages.
- The extension must not accept client-supplied `tenantId`, `orgId`, or operator identity as trust inputs.

## 5. Visibility Model

The BFF returns a trimmed view based on the current operator relationship to each matched target.

Supported relationship categories:

- `self`
- `same_team`
- `manager_scope`
- `cross_team`
- `admin_policy`

Supported visibility packs:

- `presence`
- `ownership`
- `research_summary`
- `sensitive_detail`

The extension must treat missing fields as unavailable, not as absent business facts.

## 6. Endpoint Summary

| Endpoint | Purpose |
| --- | --- |
| `POST /browser-prospecting/context/resolve` | Resolve current page signals into visible OES matches and suggested target actions. |
| `GET /browser-prospecting/targets/:targetId` | Read one target workspace detail view for the current operator. |
| `POST /browser-prospecting/targets` | Create a target workspace from page or manual input. |
| `POST /browser-prospecting/targets/:targetId/select` | Record or refresh target selection intent for browser workspace continuity. |
| `POST /browser-prospecting/targets/:targetId/events` | Append a research event to a target. |
| `POST /browser-prospecting/targets/:targetId/lead-drafts` | Create a lead draft from selected target information. |

Endpoint prefix is fixed for first-stage implementation as `/browser-prospecting`.

All successful responses are returned through the API Gateway standard response envelope. JSON examples below show the business payload inside the envelope `data` field.

## 7. Shared View Models

### 7.1 Visibility View

```json
{
  "relationship": "same_team",
  "packs": ["presence", "ownership", "research_summary"]
}
```

Required fields:

- `relationship`
- `packs`

Rules:

- `relationship` uses `VisibilityRelationship`.
- `packs` uses `VisibilityPack[]`.
- Missing detail fields must be treated by the extension as not visible.

### 7.2 Ownership Hint

```json
{
  "visible": true,
  "ownerDisplayName": "Sales A",
  "teamDisplayName": "North America Team"
}
```

Required fields:

- `visible`

Optional fields:

- `ownerDisplayName`
- `teamDisplayName`

Rules:

- If `visible` is false, the BFF must omit owner and team display names.

### 7.3 Timeline Item

```json
{
  "eventId": "re_002",
  "eventType": "fact_extracted",
  "title": "Email captured",
  "summary": "sales@example.com",
  "sourceUrl": "https://example.com/contact",
  "sourceTitle": "Example Company - Contact Us",
  "createdByDisplayName": "Sales A",
  "createdAt": "2026-04-18T08:45:00.000Z"
}
```

Required fields:

- `eventId`
- `eventType`
- `title`
- `createdAt`

Optional fields:

- `summary`
- `sourceUrl`
- `sourceTitle`
- `createdByDisplayName`

Rules:

- The BFF may omit or summarize `summary` when the operator lacks detail visibility.

## 8. Resolve Current Context

```http
POST /browser-prospecting/context/resolve
```

Purpose:

- Resolve current page signals against OES-known entities and research targets.
- Return a visibility-trimmed page information card model.
- Suggest whether to continue the active target, switch target, or create a new target.

Request shape:

```json
{
  "url": "https://example.com/contact",
  "domain": "example.com",
  "pageTitle": "Example Company - Contact Us",
  "selectedText": "sales@example.com",
  "companyNameCandidates": ["Example Company"],
  "emailCandidates": ["sales@example.com"],
  "phoneCandidates": ["+1 555 0100"],
  "activeTargetId": "rt_123",
  "browserContext": {
    "tabId": "local-tab-17",
    "referrerUrl": "https://www.google.com/search?q=example+company",
    "sourceType": "company_website"
  }
}
```

Required fields:

- `url`
- `domain`
- `pageTitle`

Optional fields:

- `selectedText`
- `companyNameCandidates[]`
- `emailCandidates[]`
- `phoneCandidates[]`
- `activeTargetId`
- `browserContext.tabId`
- `browserContext.referrerUrl`
- `browserContext.sourceType`

Response shape:

```json
{
  "matchedEntities": [
    {
      "entityId": "rt_123",
      "entityType": "research_target",
      "displayName": "Example Company",
      "matchReason": "domain",
      "confidence": 0.92
    }
  ],
  "targetSuggestions": [
    {
      "targetId": "rt_123",
      "displayName": "Example Company",
      "relationshipToActiveTarget": "same_target",
      "suggestedAction": "attach_to_active"
    }
  ],
  "visibility": {
    "relationship": "same_team",
    "packs": ["presence", "ownership", "research_summary"]
  },
  "statusBadges": ["existing_research", "has_owner"],
  "ownershipHint": {
    "visible": true,
    "ownerDisplayName": "Sales A",
    "teamDisplayName": "North America Team"
  },
  "researchSummary": {
    "visible": true,
    "lastResearchedAt": "2026-04-18T08:30:00.000Z",
    "summary": "Existing research target with contact clues and website evidence."
  },
  "counts": {
    "notes": 3,
    "facts": 8,
    "contactClues": 2,
    "evidence": 4
  },
  "actions": [
    "target.attach_page",
    "target.add_note",
    "target.add_fact",
    "target.create_lead_draft"
  ],
  "maskedFields": ["sensitive_detail"]
}
```

Stable semantics:

- The response is already visibility-trimmed.
- `confidence` is matching confidence, not AI judgement.
- `suggestedAction` is a UX hint, not an authorization decision.
- `actions[]` is the extension's button/action visibility source for this context.
- Empty matches must return empty arrays rather than an error.
- The BFF must ignore any client-supplied tenant, org, operator, or visibility fields.

## 9. Target Detail

```http
GET /browser-prospecting/targets/:targetId
```

Purpose:

- Return the side-panel detail view for one target workspace.
- Include only target details, timeline events, related targets, and actions visible to the current operator.

Response shape:

```json
{
  "target": {
    "targetId": "rt_123",
    "displayName": "Example Company",
    "domain": "example.com",
    "targetType": "company_candidate",
    "status": "researching",
    "createdAt": "2026-04-18T08:00:00.000Z",
    "updatedAt": "2026-04-18T08:30:00.000Z"
  },
  "visibility": {
    "relationship": "same_team",
    "packs": ["presence", "ownership", "research_summary"]
  },
  "ownershipHint": {
    "ownerDisplayName": "Sales A",
    "teamDisplayName": "North America Team"
  },
  "summary": {
    "notes": 3,
    "facts": 8,
    "contactClues": 2,
    "evidence": 4,
    "leadDrafts": 0
  },
  "timeline": [
    {
      "eventId": "re_001",
      "eventType": "page_attached",
      "source": "manual",
      "sourceTitle": "Example Company - Contact Us",
      "sourceUrl": "https://example.com/contact",
      "createdByDisplayName": "Sales A",
      "createdAt": "2026-04-18T08:30:00.000Z"
    }
  ],
  "relatedTargets": [
    {
      "targetId": "rt_456",
      "displayName": "Example Peer Company",
      "relationshipType": "peer_company"
    }
  ],
  "actions": [
    "target.attach_page",
    "target.add_note",
    "target.add_fact",
    "target.mark_status",
    "target.create_lead_draft"
  ],
  "maskedFields": ["sensitive_detail"]
}
```

Required path params:

- `targetId`

Required response fields:

- `target`
- `visibility`
- `summary`
- `timeline`
- `relatedTargets`
- `actions`
- `maskedFields`

Stable semantics:

- Timeline event payloads may be summarized when the operator lacks detail visibility.
- The extension must not assume `summary` counts imply permission to open underlying details.
- `actions[]` controls available target-level actions.
- If the target exists but is not visible to the operator, the BFF returns `BROWSER_PROSPECTING_TARGET_NOT_VISIBLE`.

## 10. Create Target

```http
POST /browser-prospecting/targets
```

Purpose:

- Create a target workspace from page context or manual input.
- Optionally connect the new target to another target.

Request shape:

```json
{
  "displayName": "Example Company",
  "domain": "example.com",
  "sourceUrl": "https://example.com",
  "sourceTitle": "Example Company",
  "initialType": "company_candidate",
  "relatedTargetId": "rt_123",
  "relationshipToRelatedTarget": "discovered_from"
}
```

Required fields:

- `displayName`

Optional fields:

- `domain`
- `sourceUrl`
- `sourceTitle`
- `initialType`
- `relatedTargetId`
- `relationshipToRelatedTarget`

Response shape:

```json
{
  "targetId": "rt_789",
  "displayName": "Example Company",
  "status": "researching",
  "actions": [
    "target.attach_page",
    "target.add_note",
    "target.add_fact"
  ]
}
```

Stable semantics:

- Creating a target does not create a CRM lead.
- A target can remain a research-only object until explicitly promoted to a lead draft.
- The BFF must reject creation when the caller lacks target creation permission in the current context.
- If the BFF detects likely duplicate targets, it returns `BROWSER_PROSPECTING_DUPLICATE_TARGET_CANDIDATE` unless duplicate confirmation semantics are later added.

## 11. Select Target

```http
POST /browser-prospecting/targets/:targetId/select
```

Purpose:

- Record that the extension selected a target as the active browser workspace target.
- Support continuity across side panel, context menu, and tab flows.

Request shape:

```json
{
  "browserContext": {
    "tabId": "local-tab-17",
    "url": "https://example.com/contact"
  }
}
```

Response shape:

```json
{
  "targetId": "rt_123",
  "selected": true,
  "actions": [
    "target.attach_page",
    "target.add_note"
  ]
}
```

Required path params:

- `targetId`

Optional request fields:

- `browserContext.tabId`
- `browserContext.url`

Stable semantics:

- Selection is a workspace continuity hint, not ownership assignment.
- Selection must not change target owner, team, status, or lead draft state.
- Selection must not append a `ResearchEvent` or appear in the durable target timeline.
- If server-side recency is later persisted for cross-device continuity, it must live outside durable prospecting business-fact tables.
- Selection is allowed only when the target is visible to the current operator.

## 12. Append Research Event

```http
POST /browser-prospecting/targets/:targetId/events
```

Purpose:

- Append one user-confirmed research event to the target timeline.

Request shape:

```json
{
  "eventType": "fact_extracted",
  "source": "page_extract",
  "sourceUrl": "https://example.com/contact",
  "sourceTitle": "Example Company - Contact Us",
  "capturedText": "sales@example.com",
  "structuredPayload": {
    "factType": "email",
    "value": "sales@example.com",
    "label": "General sales email"
  },
  "evidenceRefs": [],
  "visibilityScope": "team_default",
  "clientContext": {
    "tabId": "local-tab-17",
    "selectionSource": "context_menu"
  }
}
```

Required path params:

- `targetId`

Required fields:

- `eventType`
- `source`

Conditionally required fields:

- `sourceUrl` is required for `page_attached` and `external_tool_opened`.
- `capturedText` or `structuredPayload` is required for `note_added`, `fact_extracted`, and `contact_clue_added`.
- `structuredPayload.status` is required for `target_status_marked`.
- `structuredPayload.relatedTargetId` and `structuredPayload.relationshipType` are required for `target_relation_added`.

Optional fields:

- `sourceTitle`
- `capturedText`
- `structuredPayload`
- `evidenceRefs[]`
- `visibilityScope`
- `clientContext`

Response shape:

```json
{
  "eventId": "re_002",
  "targetId": "rt_123",
  "eventType": "fact_extracted",
  "createdAt": "2026-04-18T08:45:00.000Z",
  "timelineItem": {
    "eventId": "re_002",
    "eventType": "fact_extracted",
    "title": "Email captured",
    "summary": "sales@example.com",
    "createdAt": "2026-04-18T08:45:00.000Z"
  }
}
```

Supported first-stage event types:

- `page_attached`
- `note_added`
- `fact_extracted`
- `contact_clue_added`
- `external_tool_opened`
- `target_status_marked`
- `target_relation_added`
- `lead_draft_created`

Reserved future event types:

- `ai_suggestion_created`
- `ai_suggestion_confirmed`
- `tool_result_received`

Stable semantics:

- Append is not an update to a CRM record.
- The BFF must attach operator, tenant, org, trace, and audit metadata server-side.
- `source = ai_suggestion` is reserved and must not be used by first-stage clients unless AI review flow is implemented.
- The extension should send only user-confirmed events in first stage.
- The BFF must reject invalid event/payload combinations with `BROWSER_PROSPECTING_INVALID_EVENT_PAYLOAD`.
- Closed targets reject new research events with `BROWSER_PROSPECTING_TARGET_CLOSED` except explicitly allowed status events.

## 13. Create Lead Draft

```http
POST /browser-prospecting/targets/:targetId/lead-drafts
```

Purpose:

- Create a CRM handoff candidate from selected target information.
- Keep prospecting research separate from formal CRM lead creation.

Request shape:

```json
{
  "selectedFactIds": ["fact_001", "fact_002"],
  "selectedContactClueIds": ["cc_001"],
  "selectedEvidenceIds": ["ev_001"],
  "summary": "Potential apartment developer customer with public contact information.",
  "qualificationStatus": "worth_following",
  "qualificationReason": "The target appears related to apartment development and has relevant contact clues."
}
```

Required path params:

- `targetId`

Required fields:

- `summary`
- `qualificationStatus`

Optional fields:

- `selectedFactIds[]`
- `selectedContactClueIds[]`
- `selectedEvidenceIds[]`
- `qualificationReason`

Response shape:

```json
{
  "leadDraftId": "ld_001",
  "targetId": "rt_123",
  "status": "draft",
  "nextActions": [
    "lead_draft.review",
    "target.continue_research"
  ]
}
```

Stable semantics:

- Creating a lead draft does not create a formal CRM lead.
- Formal `LeadDraft -> CRM Lead` mapping is deferred until CRM service design freezes.
- The BFF must reject lead draft creation if the target is not visible or operable for the current operator.
- Creating a lead draft should also append a `lead_draft_created` timeline event.

## 14. Stable First-Stage Enums

### Entity Types

- `research_target`
- `contact_clue`
- `lead_draft`
- `future_crm_lead`
- `future_crm_account`
- `unknown`

Rules:

- `future_crm_lead` and `future_crm_account` are reserved for future matching views and must not imply first-stage formal CRM implementation.

### Target Types

- `company_candidate`
- `contact_source`
- `peer_company`
- `channel_partner`
- `competitor`
- `existing_customer`
- `unknown`

### Target Status

- `researching`
- `worth_following`
- `low_value`
- `not_target`
- `duplicate`
- `competitor`
- `closed`

### Match Reasons

- `domain`
- `company_name`
- `email_domain`
- `email_address`
- `phone`
- `manual_selection`

### Suggested Actions

- `attach_to_active`
- `switch_target`
- `create_new_target`
- `ignore`

### Visibility Relationships

- `self`
- `same_team`
- `manager_scope`
- `cross_team`
- `admin_policy`

### Visibility Packs

- `presence`
- `ownership`
- `research_summary`
- `sensitive_detail`

### Event Sources

- `manual`
- `page_extract`
- `tool_jump`
- `tool_result`
- `ai_suggestion`

Rules:

- `ai_suggestion` is reserved in first stage and must not be emitted by the extension until AI review flow exists.
- `tool_result` is reserved for future external tool result ingestion.

### Visibility Scopes

- `private`
- `team_default`
- `manager_visible`
- `cross_team_masked`

### Fact Types

- `company_name`
- `domain`
- `email`
- `phone`
- `address`
- `person_name`
- `job_title`
- `certificate`
- `product_keyword`
- `other`

### Target Relationship Types

- `related_company`
- `peer_company`
- `channel_partner`
- `competitor`
- `discovered_from`
- `unknown`

### Status Badges

- `existing_research`
- `has_owner`
- `same_team_owned`
- `cross_team_owned`
- `manager_visible`
- `low_value`
- `not_target`
- `competitor`
- `duplicate`
- `closed`
- `has_contact_clues`
- `has_evidence`

### Action Codes

These are UI action identifiers returned by this BFF view. They are not a replacement for permission codes.

- `target.create`
- `target.select`
- `target.attach_page`
- `target.add_note`
- `target.add_fact`
- `target.add_contact_clue`
- `target.mark_status`
- `target.create_relation`
- `target.create_lead_draft`
- `target.request_collaboration`

## 15. Error Semantics

The first-stage implementation must expose stable error semantics. HTTP status may follow Gateway conventions, but clients should branch on stable `code`.

| Code | Meaning | Typical HTTP status |
| --- | --- | --- |
| `BROWSER_PROSPECTING_UNAUTHENTICATED` | Extension session is missing, expired, or invalid. | `401` |
| `BROWSER_PROSPECTING_TARGET_NOT_FOUND` | Target does not exist. | `404` |
| `BROWSER_PROSPECTING_TARGET_NOT_VISIBLE` | Target exists but current operator cannot see it. | `404` or `403` |
| `BROWSER_PROSPECTING_ACTION_DENIED` | Current operator cannot execute the requested action. | `403` |
| `BROWSER_PROSPECTING_TARGET_CLOSED` | Target is closed and cannot accept the requested event. | `409` |
| `BROWSER_PROSPECTING_DUPLICATE_TARGET_CANDIDATE` | Create target request matches likely existing targets and requires explicit user review. | `409` |
| `BROWSER_PROSPECTING_INVALID_EVENT_PAYLOAD` | Event payload does not satisfy event-type requirements. | `400` |
| `BROWSER_PROSPECTING_LEAD_DRAFT_NOT_ALLOWED` | Lead draft cannot be created from the current target state or visibility. | `409` |

Callers should not depend on downstream service exception names.

## 16. Deferred Work

- CRM lead draft handoff contract.
- AI suggestion endpoints and review workflow.
- Email verification endpoint.
- External tool result ingestion.
- Screenshot / attachment upload contract.
- Page annotation recovery contract.
- Broader host permission model for automatic page status display.
- Independent `prospecting-service` decision, if future ADR proves it necessary.

## 17. Design References

- [Browser Prospecting Workspace Design](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/browser-prospecting-workspace.md)
- [Gateway / BFF Architecture](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
- [AI Architecture](/Users/acehood/Documents/GitHub/oes/docs/architecture/04-ai-architecture.md)
- [Authorization Layering Architecture](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
