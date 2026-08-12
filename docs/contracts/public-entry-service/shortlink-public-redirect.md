# ShortLink Public Redirect Contract

> 服务设计唯一真相源：[public-entry-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/public-entry-service.md)。本文只描述 ShortLink anonymous public redirect contract，不重新定义 ShortLink owner、BusinessCard owner 或 VisitEvent 内部实现。

## 1. Purpose

Defines the Phase 1 anonymous public redirect contract for ShortLink public URLs.

It answers:

```text
匿名访问 /c/{shortCode} 时，系统如何解析、记录基础访问事实、跳转或返回统一失效页？
```

## 2. Endpoint

匿名 HTTP 访问者没有 HUMAN Token。Gateway 使用准确 SYSTEM MACHINE identity、mTLS 与 `aud=urn:oes:service:public-entry-service` 的 ET 调用 `ResolvePublicRedirect`，且只携带现有 `public-entry.short-link.read` Code。Public Entry 根据 `shortCode` 解析 tenant/resource 并执行公开状态规则；SYSTEM 不是 tenant wildcard。`trace_id=6` 已删除并保留，trace 只来自 trusted metadata/context。

```http
GET /c/{shortCode}
```

Example public URL:

```text
https://go.oes.com/c/CF26ZS
```

Phase 1 rules:

- Public redirect does not require login.
- `shortCode` is globally unique.
- `shortCode` resolves `ShortLink` and `tenantId`.
- Public redirect must not expose internal `targetType / targetResourceId / tenantId` in error content.
- ShortLink does not render target business pages.

## 3. Request Inputs

Path:

```json
{
  "shortCode": "CF26ZS"
}
```

Headers consumed for environment detection:

```json
{
  "user-agent": "Mozilla/5.0 ...",
  "accept-language": "zh-CN,zh;q=0.9",
  "referer": "https://example.com/page"
}
```

Network metadata:

```json
{
  "ipAddress": "203.0.113.10"
}
```

Rules:

- `userAgent` should be stored with a configured max length.
- `referrer` should be stored with a configured max length.
- `ipAddress` is recorded in Phase 1.
- Public redirect should tolerate missing optional headers.

## 4. Redirect Results

### 4.1 Success

When ShortLink is `ACTIVE`, not expired, and target resolves:

```http
302 Found
Location: https://target.example.com/public/cards/card_001
```

Rules:

- For `EXTERNAL_URL`, redirect to validated `targetUrl`.
- For `INTERNAL_REF`, redirect to the URL returned by target owner resolver.
- Phase 1 only redirects; it does not render target content.

### 4.2 Generic Unavailable Page

When ShortLink exists but cannot continue:

```http
200 OK
Content-Type: text/html
```

Displayed meaning:

```text
该链接当前不可用。
```

Internal result reasons may include:

- `DISABLED`
- `EXPIRED`
- `ARCHIVED`
- `INVALID_TARGET`

Rules:

- Public page may be generic across reasons.
- Public response must not reveal whether target object exists, target owner service, tenant id, or business object id.
- Contract does not require separate pages per reason in Phase 1.

### 4.3 shortCode Not Found

When `shortCode` does not resolve a ShortLink:

```http
404 Not Found
```

Displayed meaning may still be generic:

```text
该链接不存在或不可用。
```

Rules:

- `shortCode` not found does not create `VisitEvent`.
- Runtime may record normal access logs or future security logs outside VisitEvent.

## 5. VisitEvent Write Semantics

When ShortLink exists, public redirect writes one final VisitEvent best-effort after status / target resolution.

Result statuses:

```text
REDIRECTED
DISABLED
EXPIRED
ARCHIVED
INVALID_TARGET
```

Rules:

- One request writes at most one VisitEvent.
- VisitEvent is immutable.
- VisitEvent write failure must not block redirect or unavailable response.
- `NOT_FOUND` for missing shortCode is not a VisitEvent result.

## 6. EXTERNAL_URL Safety

For `targetKind = EXTERNAL_URL`:

- targetUrl must be syntactically valid.
- targetUrl must use `https`.
- `javascript:`, `data:`, `file:` and other unsafe protocols are forbidden.
- Phase 1 does not enforce tenant-level allowed external domains.

If targetUrl becomes invalid at read time:

```text
resultStatus = INVALID_TARGET
```

and public response uses generic unavailable page.

## 7. INTERNAL_REF Resolution

For `targetKind = INTERNAL_REF`:

```text
ShortLink -> target resolver -> ResolvedTarget
```

Resolver results map to public redirect:

| Resolver result | Public behavior | VisitEvent resultStatus |
| --- | --- | --- |
| `REDIRECT` | `302 Location = redirectUrl` | `REDIRECTED` |
| `UNAVAILABLE` | generic unavailable page | `INVALID_TARGET` |
| `NOT_FOUND` | generic unavailable page | `INVALID_TARGET` |

Rules:

- ShortLink must not construct BusinessCard or other target owner URLs directly.
- Resolver must not return business object content.

## 8. Environment Detection

Phase 1 may derive:

```text
detectedChannel
deviceType
locale
```

Suggested values:

```text
detectedChannel:
  WECHAT
  BROWSER
  UNKNOWN

deviceType:
  MOBILE
  DESKTOP
  TABLET
  UNKNOWN
```

Rules:

- These values are for statistics and resolver context.
- Phase 1 does not require WeChat mini program deep routing.
- Locale should be derived from `Accept-Language` when available.
