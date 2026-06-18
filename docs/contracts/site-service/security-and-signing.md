# site-service Security and Signing Contract

> 服务职责以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 为准。本文只冻结 External Site Integration P1 的凭证、签名、webhook 与安全错误黑盒契约。

## 1. Credential Bundle

站点后端通过单个环境变量配置：

```text
OES_SITE_CREDENTIAL
```

P1 credential bundle 对站点开发者是 opaque string；`@oes/site-runtime-kit` 负责解析与校验。

P1 序列化格式冻结为：

```text
oes_site_cred_v1.<base64url(json)>
```

说明：

- prefix 用于版本识别。
- JSON 使用 UTF-8 与 snake_case 字段。
- base64url 只用于便于环境变量传输，不是加密。
- bundle 内含 secret，因此只能放在站点后端环境变量或后端 secret manager 中。

解析后的最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | OES 分配的站点标识。 |
| `client_id` | 是 | 站点客户端标识。 |
| `credential_id` | 是 | 当前凭证标识，用于轮换和吊销。 |
| `client_secret` | 是 | HMAC request signing secret。 |
| `webhook_signing_secret` | 否 | webhook 验签 secret；P1 可与 `client_secret` 同源，长期允许分离。 |
| `oes_base_url` | 是 | OES Site-facing BFF / Site API base URL。 |
| `environment` | 是 | `local / staging / production` 等环境标识。 |

安全规则：

- OES 只在生成 credential 时展示一次 secret 明文。
- Storefront Frontend 禁止持有 credential bundle。
- credential bundle 泄露时必须支持 revoke。
- P1 支持手动 rotate，不要求自动轮换闭环。

## 2. Signed Request Headers

Site Runtime 调用 OES Site-facing API 时必须携带：

```text
x-oes-site-id
x-oes-client-id
x-oes-credential-id
x-oes-timestamp
x-oes-nonce
x-oes-signature
x-oes-request-id
x-oes-trace-id
```

可选：

```text
x-oes-idempotency-key
```

Header 格式：

| Header | 格式 |
| --- | --- |
| `x-oes-timestamp` | Unix epoch milliseconds，十进制字符串，UTC。 |
| `x-oes-nonce` | 至少 128-bit 随机值，base64url 或 hex 字符串。 |
| `x-oes-request-id` | UUID v4 或等价全局唯一请求 id。 |
| `x-oes-trace-id` | OES trace id；可映射到 W3C trace context。 |
| `x-oes-signature` | `v1=<lowercase_hex_hmac_sha256>`。 |

P1 Site Runtime 主要是读取 / sync 请求，不包含业务写入；但 preview 与未来 ingress 写入必须保留 idempotency 扩展位。

## 3. Canonical Request

P1 签名算法：

```text
HMAC-SHA256
```

canonical request 至少包含：

```text
method
path
normalized_query
body_sha256
x-oes-site-id
x-oes-client-id
x-oes-credential-id
x-oes-timestamp
x-oes-nonce
```

签名输出：

```text
x-oes-signature = v1=<hex(hmac_sha256(client_secret, canonical_request))>
```

实现约束：

- method 使用大写。
- path 使用 URL path，不包含 scheme、host、fragment。
- query 参数按 key、value 稳定排序并 RFC3986 编码。
- body hash 使用 lowercase hex SHA-256。
- body 为空时使用空字符串的 SHA-256 hash。
- canonical request 使用 `\n` 连接各行。
- timestamp 允许最大时钟偏移为 5 分钟。
- nonce 必须在至少 5 分钟服务端重放窗口内唯一。

## 4. OES Verification

OES Site-facing API 必须校验：

- site exists
- site status is `active`
- client exists
- credential exists
- credential status is active / rotating allowed
- signature valid
- timestamp inside allowed window
- nonce not replayed
- scope allowed
- rate limit allowed

fail closed 场景：

- missing required signed header
- timestamp expired
- nonce replayed
- signature invalid
- credential revoked
- site disabled
- scope insufficient

## 5. Scope Contract

P1 scopes：

| Scope | 用途 |
| --- | --- |
| `site:read` | 读取站点公开配置、public views、snapshot。 |
| `site:sync` | 拉取 latest state、changed resources、执行 sync 相关读取。 |
| `site:preview` | 使用 preview token 拉取 draft preview view。 |
| `site:status` | 上报 runtime status 或访问受保护 runtime status 相关路径。 |

## 6. Webhook Contract

OES -> Site Runtime webhook 事件：

```text
site.publish.available
```

Payload 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `event_id` | 是 | webhook 事件唯一标识。 |
| `site_id` | 是 | 目标站点。 |
| `event_type` | 是 | P1 固定 `site.publish.available`。 |
| `publish_version` | 是 | 提示版本；Site Runtime 仍执行 `syncToLatest()`。 |
| `occurred_at` | 是 | 事件发生时间。 |

Headers：

```text
x-oes-site-id
x-oes-timestamp
x-oes-nonce
x-oes-signature
x-oes-event-id
```

Webhook 签名使用与 Site-facing request 相同的 HMAC-SHA256 算法，但使用 webhook 专用 canonical request；secret 优先使用 `webhook_signing_secret`，为空时 P1 回退使用 `client_secret`。

Webhook 不携带 `x-oes-client-id` / `x-oes-credential-id`，也不复用 Site-facing request 的完整 canonical header 集。P1 冻结 webhook 专用 canonical request：

```text
method
path
normalized_query
body_sha256
x-oes-site-id
x-oes-event-id
x-oes-timestamp
x-oes-nonce
```

实现约束：

- method 使用大写。
- path 使用 webhook URL path，不包含 scheme、host、fragment。
- query 参数按 key、value 稳定排序并 RFC3986 编码。
- body hash 使用 lowercase hex SHA-256。
- canonical request 使用 `\n` 连接各行。
- `x-oes-signature = v1=<hex(hmac_sha256(webhook_secret, canonical_request))>`。

Site Runtime 必须通过 `@oes/site-runtime-kit` 验证：

- site id matches local credential
- timestamp inside allowed window
- nonce not replayed
- signature valid
- event id not processed
- event type supported

验证失败时：

- 不触发 sync
- 返回 4xx
- 记录安全日志

验证成功但重复事件：

- 幂等返回成功
- 不重复触发并发 sync

## 7. Error Model

P1 Site-facing API 错误分类：

| error_code | HTTP 建议 | 说明 |
| --- | --- | --- |
| `AUTH_MISSING` | 401 | 缺少签名身份信息。 |
| `SIGNATURE_INVALID` | 401 | 签名不合法。 |
| `TIMESTAMP_EXPIRED` | 401 | timestamp 超出时间窗。 |
| `NONCE_REPLAYED` | 401 | nonce 重放。 |
| `CREDENTIAL_REVOKED` | 403 | credential 已吊销。 |
| `SITE_DISABLED` | 403 | site 已禁用。 |
| `SCOPE_INSUFFICIENT` | 403 | scope 不足。 |
| `RATE_LIMITED` | 429 | 触发限流，可带 `Retry-After`。 |
| `VALIDATION_FAILED` | 400 | 请求字段非法。 |
| `NOT_FOUND` | 404 | 资源不存在或不可见。 |
| `CONFLICT` | 409 | 版本或状态冲突。 |
| `SERVER_ERROR` | 500 | 服务端未知错误。 |

统一错误响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `error.code` | 上表 `error_code`。 |
| `error.message` | 可读错误摘要，不包含 secret。 |
| `request_id` | 对应请求 id。 |
| `trace_id` | 对应 trace id。 |
| `retry_after_seconds` | 仅限流或临时错误时可返回。 |

Runtime kit 重试规则：

- 只重试网络超时、502、503、504、带 `Retry-After` 的 429。
- 不重试 401、403、validation、business rejection。
- `SITE_DISABLED` / `CREDENTIAL_REVOKED` 应使 runtime 进入 `blocked`。
