# Notification Auth Dispatch Contract

```text
status: IMPLEMENTED_VERIFIED
architectureTruthSource: docs/architecture/services/notification-service.md
trustedGrpcArchitecture: docs/architecture/platforms/grpc-metadata-and-service-trust.md
```

> 本契约只冻结 `auth-service -> notification-service` 的 Email/SMS 认证通知受理边界。Notification 的长期 owner、对象与公共事件 consumer 以 [notification-service.md](../../architecture/services/notification-service.md) 为准；OTP、MFA、password recovery、邀请流程与认证审计以 [auth-service.md](../../architecture/services/auth-service.md) 为准。

## 1. Purpose And Ownership

用户发起登录、MFA、contact binding、password recovery 或账号邀请后，Auth 先完成对应认证域判断，再向 Notification 下达内部投递命令。`SendEmail` / `SendSms` 不是用户直接操作 Notification 的 HUMAN RPC；Notification 不重新判断用户是否可以创建 challenge，也不接管 OTP 真相。

Notification owns：

- 模板、渠道、受理、幂等、provider job/outbox、投递状态与通知侧审计；
- category/template/channel/variables/priority/subject override 的受控白名单；
- recipient address 的渠道格式校验和发送快照。

Auth owns：

- challenge、OTP value/hash、用途、期限、频控、验证与认证域审计；
- 认证流程中经过验证或受权管理流程提交的 recipient target；
- 调用 Notification 前是否应产生一次认证通知的决定。

Notification 不查询 Identity 重新解析 recipient，也不把 recipient、template、variable 或 idempotency key 当作主体、tenant 或授权事实。

## 2. Trusted gRPC Boundary

| RPC | Mode | Principal | Scope | Exact Code |
| --- | --- | --- | --- | --- |
| `NotificationService.SendEmail` | `INTERNAL` | `MACHINE` | `SYSTEM` | `notification.internal.auth.dispatch` |
| `NotificationService.SendSms` | `INTERNAL` | `MACHINE` | `SYSTEM` | `notification.internal.auth.dispatch` |

稳定边界：

- audience 固定为 `urn:oes:service:notification-service`；
- direct workload 只允许当前环境 registry 中单一、准确的 `auth-service` SPIFFE ID，不允许 pattern、wildcard、header service name 或网络位置替代；
- execution principal 是 Identity-owned、绑定该 Auth workload 的专用 SYSTEM Machine Principal；
- HUMAN、DELEGATED、TENANT MACHINE、其他 workload、错误 audience/issuer/time/`cnf`/Code 均在 controller application data 前拒绝；
- `notification.internal.auth.dispatch` 是 `kind=INTERNAL`、`assignableTo=WORKLOAD_POLICY`、`allowedScopeLevels=[SYSTEM]`、`externalApiEligible=false`，不得加入 HUMAN/MACHINE 业务角色或 external token；
- Auth 使用既有 MACHINE root：active Machine Principal/workload binding -> 当前 mTLS 取得最长 15 分钟 source credential -> `ResolveWorkloadIssuance` 全量批准准确 workload/audience/Code -> 最长五分钟 certificate-bound ET；不新增 credential profile、bootstrap method 或 Permission resolver；
- ET 仅在 Auth 进程内按 principal、SYSTEM scope、audience、精确 Code set、leaf thumbprint 与安全版本缓存。source credential 缺失/失效、证书轮换或任一 cache binding 改变时重新取得；不存在 Redis/shared bearer pool。

Auth 上游即使存在 HUMAN session，也不把 HUMAN ET 传播给这两个 RPC。上游 user/admin/challenge 归因保留在 Auth 本地审计，双方只使用可信 trace/request correlation 与 Notification `dispatch_id` 关联。

## 3. Proto Compatibility And Payload

`SourceContext` 不再承载 authority。wire tombstone 固定为：

```proto
message SourceContext {
  reserved 1, 2, 3, 4, 5;
  reserved "source_service", "tenant_id", "org_id", "trace_id", "request_id";
}
```

两个 request 都删除并 reserve `source = 1` 的字段号与名称。Notification 从 verified mTLS/ET 得到 source workload、principal 与 scope，从可信 transport context 得到 trace/request correlation。当前 Auth dispatch 明确是 `SYSTEM` scope，`tenant_id` / `org_id` 不存在；禁止以字面量 `system` 伪造 tenant。

其余字段号保持：

| Message | Retained fields |
| --- | --- |
| `SendEmailRequest` | `category=2`, `template_key=3`, `recipient=4`, `variables=5`, `idempotency_key=6`, `priority=7`, `subject_override=8` |
| `SendSmsRequest` | `category=2`, `template_key=3`, `recipient=4`, `variables=5`, `idempotency_key=6`, `priority=7` |

### 3.1 Exact Auth template profiles

这四个 profile 只约束当前 Auth dispatch，不限制 Notification 未来增加其他 owner 已冻结的模板、channel 或 event-driven notification。

| Template | Channel | Category | Required variables | Optional variables | Aggregate variable-value limit | Priority | Non-empty `subject_override` |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| `AUTH_OTP_EMAIL` | `EMAIL` | `AUTH_OTP` | `code`, `ttlMinutes`, `maskedDestination` | none | 192 UTF-8 bytes | only `HIGH` | forbidden |
| `AUTH_OTP_SMS` | `SMS` | `AUTH_OTP` | `code`, `ttlMinutes`, `maskedDestination` | none | 192 UTF-8 bytes | only `HIGH` | field absent |
| `ACCOUNT_INVITATION_EMAIL` | `EMAIL` | `AUTH_SECURITY_ALERT` | `recipient`, `loginMode` | `displayName` | 384 UTF-8 bytes | only `HIGH` | forbidden |
| `ACCOUNT_INVITATION_SMS` | `SMS` | `AUTH_SECURITY_ALERT` | `recipient`, `loginMode` | `displayName` | 160 UTF-8 bytes | only `HIGH` | field absent |

Variable values use their UTF-8 encoded byte length after the normalization below. Keys are the exact case-sensitive ASCII names in the matrix; duplicate, unknown, missing required or excess keys reject the command. Aggregate limits sum value bytes, not key bytes.

| Variable | Exact bound and normalization |
| --- | --- |
| `code` | 1..16 visible ASCII bytes; whitespace and control characters are forbidden. It is always secret payload and Notification does not decide OTP validity or shape. |
| `ttlMinutes` | Canonical decimal integer string `1`..`15`; no sign, leading zero, decimal point or surrounding whitespace. |
| `maskedDestination` | 1..160 UTF-8 bytes after NFC normalization; NUL, CR/LF and Unicode control characters are forbidden. |
| `displayName` | Optional; 0..120 UTF-8 bytes after trim and NFC normalization; NUL, CR/LF and Unicode control characters are forbidden; renderer output is escaped. |
| `recipient` | Required invitation variable; after the channel normalization below it must byte-equal `RecipientSnapshot.address`. |
| `loginMode` | Exact literal `OTP_FIRST`; no other value or casing is valid. |

Recipient profile：

- Email：trim surrounding ASCII whitespace, NFC-normalize, lowercase the address and IDNA-canonicalize the domain; require exactly one `@`, local part 1..64 bytes, domain 1..253 bytes and total 3..254 bytes; embedded whitespace, NUL, CR/LF, control characters, empty labels and an invalid canonical domain reject. `RecipientSnapshot.display_name` is optional and follows the `displayName` bound.
- SMS：trim, remove only ASCII space, `-`, `(` and `)`, preserve at most one leading `+`, then require optional `+` plus 6..20 digits and total length at most 21 bytes; every other character rejects. `RecipientSnapshot.display_name` is optional and follows the `displayName` bound.
- OTP profiles require `RecipientSnapshot.display_name` absent/empty. Invitation `displayName`, when present, must equal the normalized `RecipientSnapshot.display_name`; an omitted/empty pair is valid.

Prohibited combinations：wrong channel/category/template, any priority other than `HIGH`, a non-empty Email `subject_override`, invitation variables on an OTP profile, OTP variables on an invitation profile, `code` in any invitation, recipient-variable/address mismatch, or any value/aggregate limit breach. Any of these returns `INVALID_DISPATCH_PROFILE` or `INVALID_TEMPLATE_VARIABLES` before persistence/provider work. Raw OTP、完整 variables、source bearer 与未掩码 recipient 不进入普通日志、错误或审计。

`SendEmailResponse` / `SendSmsResponse` 字段号保持：`accepted=1`, `dispatch_id=2`, `status=3`, `rejection_reason=4`。Notification response 不返回、替换或派生 OTP `effectiveCode`。

## 4. Acceptance, Idempotency And Provider Delivery

`accepted=true` 只表示 Notification 已在一个本地数据库事务中持久化：

1. `NotificationDispatch`；
2. append-only safe audit fact；
3. provider outbox/job。

成功受理返回既有 `dispatch_id` 与 `status=QUEUED`，不表示 provider 已送达。数据库、audit、payload protection 或 outbox 任一失败时整个事务回滚并 fail closed，不返回 accepted。外部 Email/SMS provider 只在提交后由 Notification worker 调用；失败按有界退避重试，达到终态后记录安全失败事实，不回滚已成立的受理事实。

幂等边界固定为 authenticated source principal/workload + channel + `idempotency_key`。同一 key 与相同 canonical command digest 返回原 `dispatch_id`；同一 key 与不同 digest 返回 `IDEMPOTENCY_CONFLICT`，不得覆盖原投递。并发相同请求只能形成一个 dispatch/outbox。

Provider delivery payload 中的 OTP/variables 只允许以 deployment-protected、encrypted-at-rest、带过期时间的形式持久化；不得进入 `NotificationDispatch` 可检索 JSON、审计或日志。worker 在送达终态或 challenge payload 过期后清除可恢复 payload。recipient 发送快照可由 dispatch 保存，但普通日志和审计只使用掩码或不可逆 fingerprint。

Notification audit 至少记录 safe dispatch reference、verified Machine Principal、Auth SPIFFE、SYSTEM scope、channel/category/template、idempotency reference、masked/fingerprinted recipient、trace/request correlation、acceptance/provider result 与 safe reason；不得记录 bearer、OTP、raw variables、certificate material 或 Permission decision graph。

## 5. Runtime Separation

- Auth production 与普通 local development 只使用 trusted gRPC Notification adapter；缺少 MACHINE source credential、ET producer、Notification client 或 protected configuration 时 readiness 失败。
- Auth `LocalNotificationDispatchAdaptor`、`EmailService`、`SmsService` 不再属于 runtime composition。isolated unit test module 可以注入 fake `NotificationDispatchPort`，但 fake 不修改 OTP。
- Notification 本地 provider adapter 只模拟 Notification-owned provider boundary，不允许 Auth 绕过 Notification。
- Collaboration Task NATS Inbox/DLQ consumer 继续只产生 `NotificationInboxItem`；它不复用 Auth dispatch RPC、provider outbox、template variables 或 Machine ET，也不因本契约改变 Event Bus 语义。

## 6. Stable Rejection Categories

- transport/ET trust failure: `UNAUTHENTICATED` / `PERMISSION_DENIED`；
- unsupported category/template/channel/priority/subject combination: `INVALID_DISPATCH_PROFILE`；
- invalid recipient: `INVALID_RECIPIENT`；
- invalid or secret-unsafe variables: `INVALID_TEMPLATE_VARIABLES`；
- duplicate key with different digest: `IDEMPOTENCY_CONFLICT`；
- persistence/audit/outbox/payload protection unavailable: `DISPATCH_ACCEPTANCE_UNAVAILABLE`。

错误不得泄露是否存在 user/account、OTP、recipient owner、template internals、credential facts 或 provider secret。

## 7. Acceptance Gates

1. 两个 RPC 恰有一个 INTERNAL declaration，并要求相同 exact Code、SYSTEM MACHINE 与 Notification audience。
2. exact Auth workload + valid source chain 可受理；HUMAN、DELEGATED、TENANT MACHINE、wrong workload/audience/`cnf`/Code 全部在 handler 前拒绝。
3. request `source` 与 `SourceContext` 五个字段名/号均 reserved；body/header/legacy metadata 不能创建 source/tenant/org authority。
4. 四个模板 profile、recipient、variables、priority 与 subject override 逐项正负验证。
5. identical duplicate 返回同一 dispatch；digest conflict 与并发 collision 不增加副作用。
6. dispatch/audit/outbox 原子提交；任一依赖失败不返回 accepted；provider failure 只进入受控 retry/terminal state。
7. logs、errors、audit 与普通 dispatch JSON 不含 OTP、raw variables、bearer 或完整 recipient；protected payload 按 TTL 清除。
8. Auth runtime 不存在 local dispatch fallback 或 `effectiveCode`，普通 local development 仍走 Notification gRPC。
9. Collaboration Task consumer contract、Inbox/DLQ/replay tests 与 NATS runtime byte-semantic unchanged。
