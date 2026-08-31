# BusinessCard Public Render Contract

> 服务设计唯一真相源：[public-entry-service.md](../../architecture/services/public-entry-service.md)。本文只描述 BusinessCard 匿名公开渲染、`BUSINESS_CARD` resolver 与 vCard 输出规则；不重新定义 ShortLink、Contact Asset、HR、Identity、Tenant Org、Party 或 CRM owner 边界。

## 1. Purpose

Defines Phase 1 public render contracts for Employee Digital Business Card.

It answers:

```text
ShortLink redirect 到 BusinessCard 后，匿名访问者如何查看公开名片、保存 vCard，以及在不可访问时看到什么？
```

## 2. Public URL Boundary

匿名 HTTP 访问者没有 HUMAN Token。Gateway 使用准确 SYSTEM MACHINE identity、mTLS 与 `aud=urn:oes:service:public-entry-service` 的 ET 调用 `RenderPublicBusinessCard` / `GenerateBusinessCardVCard`，且只携带现有 `public-entry.business-card.read` Code。`tenant_id=1` 与 `trace_id=3` 在两个 request 中删除并保留；Public Entry 只能根据 `business_card_id=2` 查找 service-owned tenant，再执行 public-safe rules。

BusinessCard resolver owns public BusinessCard page URL construction.

Rules:

- ShortLink public redirect calls `BUSINESS_CARD` resolver for `INTERNAL_REF`.
- ShortLink does not construct BusinessCard URL.
- ShortLink does not render BusinessCard content.
- `redirectUrl` must be anonymous accessible.
- `redirectUrl` must not include internal tenant id, employee identity, contact values or sensitive fields.
- Anonymous visitor 不触发 visitor/BUSINESS Permission lookup，Public Entry 也不直接调用 permission-service。Public Entry 为每个 owner resolver 向 Auth 交换 target INTERNAL Token；Auth 在既有 exact transport bootstrap 下调用 Permission `ResolveWorkloadIssuance`，只判断 original Public Entry workload -> target audience -> literal INTERNAL Code。
- Public accessibility is controlled by ShortLink status / expiresAt / resolver plus BusinessCard readiness, card status, employee active status and public-safe render rules.
- Public Entry 在服务端按 [Public Business Card owner-fact resolution](../../architecture/collaborations/public-business-card-owner-facts.md) 读取三个 target-owned public-safe projections 并组装单一 response；匿名 browser 不直接调用 HR、Identity 或 TenantOrg。
- Final path is implementation detail for BusinessCard public render contract; examples use `/public/business-cards/{businessCardId}`.
- Phase 1 does not do WeChat mini program deep routing or complex device/channel routing.

## 3. BUSINESS_CARD Target Resolver

Input:

```json
{
  "tenantId": "tenant_001",
  "targetType": "BUSINESS_CARD",
  "targetResourceId": "card_001",
  "requestContext": {
    "userAgent": "Mozilla/5.0 ...",
    "detectedChannel": "BROWSER",
    "deviceType": "MOBILE",
    "locale": "zh-CN",
    "referrer": "https://example.com/page",
    "traceId": "trace_public_001"
  }
}
```

Rules:

- `tenantId` comes from resolved ShortLink.
- `targetResourceId` is BusinessCard id.
- Resolver must not trust anonymous caller input for tenant or target identity.
- `requestContext` is advisory for locale fallback, diagnostics and trace.

Output:

```json
{
  "result": "REDIRECT",
  "redirectUrl": "https://app.oes.com/public/business-cards/card_001",
  "resultTarget": "business-card:web"
}
```

Allowed results:

```text
REDIRECT
UNAVAILABLE
NOT_FOUND
```

Result rules:

- `REDIRECT`: card can publicly render; `redirectUrl` required; `resultTarget = business-card:web`.
- `UNAVAILABLE`: card exists but should not be public, or any supplied/derived owner selector or tenant relation mismatches; no `redirectUrl`; `resultTarget = business-card:unavailable`.
- `NOT_FOUND`: opaque BusinessCard id is absent from Public Entry store; no `redirectUrl`; `resultTarget = business-card:not-found`.

`REDIRECT` requires:

- card exists.
- card belongs to `tenantId`.
- card status allows public access.
- employee active / not offboarded.
- required display data resolvable.
- template available.
- public render readiness passes.
- public page route can be generated.

`UNAVAILABLE` covers:

- card disabled / not public.
- employee offboarded.
- `businessCardId` exists but does not belong to the ShortLink-derived `tenantId`.
- any supplied/derived employee/account/org selector or tenant relation mismatch.
- readiness check failed.
- required upstream data temporarily unavailable.
- template unavailable.
- public render readiness cannot pass.

`NOT_FOUND` covers:

- `businessCardId` does not exist.

VisitEvent mapping is owned by ShortLink:

- `REDIRECT -> REDIRECTED`
- `UNAVAILABLE -> INVALID_TARGET`
- `NOT_FOUND -> INVALID_TARGET`

BusinessCard resolver does not write VisitEvent.

## 4. PublicBusinessCardView

Public render returns a view assembled from BusinessCard config and upstream facts.

Example:

```json
{
  "businessCardId": "card_001",
  "templateKey": "TENANT_STANDARD",
  "locale": "en-US",
  "display": {
    "displayName": "Zhang San",
    "englishDisplayName": "San Zhang",
    "title": "Sales Manager",
    "departmentName": "Sales",
    "companyDisplayName": "OES Demo Company",
    "officialPhotoUrl": "https://assets.example.com/photo.jpg"
  },
  "actions": [
    {
      "contactActionType": "CALL_PHONE",
      "href": "tel:+15551234567",
      "includeInVCard": true
    },
    {
      "contactActionType": "SEND_EMAIL",
      "href": "mailto:sales@example.com",
      "includeInVCard": true
    },
    {
      "contactActionType": "SAVE_VCARD",
      "href": "https://app.oes.com/public/business-cards/card_001.vcf",
      "includeInVCard": false
    }
  ],
  "publicEntry": {
    "publicUrl": "https://go.oes.com/c/CF26ZS1",
    "qrContent": "https://go.oes.com/c/CF26ZS1"
  }
}
```

Rules:

- BusinessCard stores configuration and references, not display field truth.
- Public view may include resolved display values because it is a rendered output.
- 每个 readiness/render/vCard operation 使用一个 request-private owner-fact aggregate；该 aggregate 不跨 request 持久化，不能成为 HR、Identity 或 TenantOrg 的第二真相。
- Hidden fields must not appear in public view.
- Contact values appear only through displayable action outputs.
- Renderer labels are based on `contactActionType` and locale, not stored labels.
- Public render may include `hiddenReason` only in admin diagnostics; anonymous `PublicBusinessCardView` omits hidden actions entirely.

## 5. Contact Action Render Rules

BusinessCard public render resolves identity display/binding and `CONTACT_ASSET` targets through [identity-service query contract](../identity-service/query.md) Public Entry-only `ResolvePublicBusinessCardIdentity`; generic `ResolveContactActionTargets` remains a BUSINESS/management compatibility method.

Rules:

- BusinessCard sends only card-derived `tenantId / employeeId / contactActionConfigs[].targetRef`; Identity resolves and verifies the account/binding inside its owner boundary.
- `identity-service` returns its minimum public display projection plus `ResolvedContactActionTarget.publicValueSummary` for renderable Contact Asset targets.
- BusinessCard must not store Contact Asset value snapshots after resolution.
- Anonymous public responses must omit `hiddenReason`; admin readiness diagnostics may consume normalized hidden reasons.

Action render eligibility:

| Action | Target | Render rule |
| --- | --- | --- |
| `CALL_PHONE` | `CONTACT_ASSET` | Render only when Contact Asset is `ACTIVE`, allowed for this account/card, type-compatible with phone, and display value can be resolved. |
| `SEND_EMAIL` | `CONTACT_ASSET` | Render only when Contact Asset is `ACTIVE`, allowed for this account/card, type-compatible with email, and display value can be resolved. |
| `ADD_WECHAT` | `CONTACT_ASSET` | Render only when Contact Asset is `ACTIVE`, type-compatible with WeChat / external communication display, and display value can be resolved. |
| `OPEN_WHATSAPP` | `CONTACT_ASSET` | Render only when Contact Asset is `ACTIVE`, type-compatible with WhatsApp / phone-based WhatsApp display, and display value can be resolved. |
| `SAVE_VCARD` | `NONE` | Render when the public view can produce a vCard. |
| `OPEN_COMPANY_WEBSITE` | `TENANT_PUBLIC_PROFILE` | Render only when tenant/company website display target can be resolved. |

Hidden rules:

- `enabled = false` or `visibility = HIDDEN` hides the action.
- Missing `targetRefId` hides `CONTACT_ASSET` actions.
- `PENDING_HANDOVER / DISABLED / RELEASED / missing` Contact Asset hides the action.
- Contact Asset type mismatch hides the action and may appear in admin diagnostics.
- Contact Asset hidden / unavailable reasons are normalized to admin-side `CONTACT_TARGET_UNAVAILABLE`.
- Same social entry class should display one action target by default; company-controlled Contact Asset has priority over employee-owned fallback when BusinessCard selection is automatic.
- BusinessCard must not expose hidden Contact Asset values in public render or vCard.
- vCard or individual Contact Action unavailability does not block public page render when required display data is available.

## 6. vCard Output Rules

Endpoint shape is implementation-owned by BusinessCard public render, for example:

```http
GET /public/business-cards/{businessCardId}.vcf
```

Rules:

- vCard is generated from current `PublicBusinessCardView`.
- vCard includes only fields currently visible on the public card.
- Hidden Contact Asset values must not enter vCard.
- `includeInVCard = true` only applies to visible actions with compatible contact values.
- vCard may include:
  - display name
  - title
  - department
  - company display name
  - visible phone
  - visible email
  - visible public card URL
  - visible company website
- vCard must not include:
  - hidden phone / email / WeChat / WhatsApp
  - CRM tracking fields
  - private notes
  - internal tenant id
  - account id
  - employee id
  - Contact Asset id
- If no contact values are visible, vCard may still include display name, company and title when visible.

## 7. Public Unavailable Response

Public unavailable page:

```json
{
  "status": "PUBLIC_CARD_UNAVAILABLE",
  "message": "This business card is currently unavailable."
}
```

Rules:

- Anonymous public response must be generic.
- Public render uses only generic anonymous states: `PUBLIC_CARD_UNAVAILABLE` and `PUBLIC_CARD_NOT_FOUND`.
- It must not reveal whether card is disabled, employee offboarded, target missing, tenant mismatch, Contact Asset missing, template unavailable or upstream unavailable.
- Admin readiness diagnostics are handled by management contract, not public render.

## 8. Error Semantics

| Condition | Public behavior |
| --- | --- |
| card disabled / not public | generic unavailable |
| employee offboarded | generic unavailable |
| required display data unavailable | generic unavailable |
| template unavailable | generic unavailable |
| opaque `businessCardId` absent from Public Entry store | generic `PUBLIC_CARD_NOT_FOUND` / resolver `NOT_FOUND` |
| existing card with any supplied/derived owner selector or tenant relation mismatch | generic `PUBLIC_CARD_UNAVAILABLE` / resolver `UNAVAILABLE` |
| optional Contact Asset unavailable | hide action |
| vCard cannot include optional contact | omit optional contact |
| owner resolver trust/dependency or required owner fact unavailable | generic unavailable |
| supplied employee/account/org selector owner mismatch | generic unavailable |

Rules:

- Public render should not leak stack traces or internal reason codes.
- Public render may log diagnostics with trace id.

## 9. Owner-Fact Projection And Readiness

Public Entry loads its BusinessCard first, then composes the exact owner projections:

| Owner | Dedicated resolver | Required result | Optional result |
| --- | --- | --- | --- |
| HR | `ResolvePublicBusinessCardEmployee` | active employee + unique current active employment | position, org reference, official photo URL |
| Identity | `ResolvePublicBusinessCardIdentity` | enabled same-tenant account/binding + nonblank display name | per-ref public-safe contact target |
| TenantOrg | `ResolvePublicBusinessCardOrganization` | active tenant + nonblank company display name; when a non-empty org ref exists, it must resolve active and same-tenant | website; absent org ref omits department display |

Public Entry uses a tenantless SYSTEM MACHINE direct root and asks Auth for exact workload -> audience -> INTERNAL Code issuance for each resolver. Public Entry does not call Permission directly; Auth consumes Permission `ResolveWorkloadIssuance`. Card-derived `tenant_id` is only a target owner lookup selector. The resolver contracts do not grant tenant authority, and Public Entry receives no tenant role or existing BUSINESS read grant.

Required resolver unavailable, inactive owner fact, malformed relation or tenant mismatch keeps the existing generic unavailable behavior. Missing optional position/photo/website/contact, or an absent org reference, only omits that field/action. A non-empty org reference that TenantOrg proves missing, inactive or cross-tenant is an owner-integrity failure and therefore generic unavailable.

Phase 1 performs request-time composition and does not persist owner projection snapshots. Cache/event invalidation/materialized view remains a separately designed optimization.
