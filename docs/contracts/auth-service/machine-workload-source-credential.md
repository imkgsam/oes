# Machine Workload Source Credential Contract

```text
status: FROZEN
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/auth-service.md
identityContract: docs/contracts/identity-service/machine-principal-resolution.md
```

> 本文只冻结第一方内部 MACHINE root source credential 的黑盒安全语义。Auth 长期 owner 边界以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准；Machine Principal 与 workload binding owner 以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。

## 1. Purpose And Boundary

`MachineWorkloadSourceCredential` 供没有入站 HUMAN/session 或上游 ExecutionToken 的第一方 Cron、Robot、worker 向 Auth / STS 建立 root MACHINE execution。

它是 Auth 签名的独立、短期、certificate-bound JWS profile：

- 不是 ExecutionToken，不授予 target audience 或 Permission Code；
- 不是外部 API Key 或 Gateway-only external token；
- 不是 Identity Machine Principal 或 `MachineWorkloadBinding`；
- 不是 Permission role/grant/policy；
- 不是 refresh token，也不允许静默续期；
- 不开放 public HTTP、external gRPC 或第三方 integration 使用。

外部 API-key exchange、DELEGATED、AI、ActionGrant 与业务 feature 不在本文范围。

## 2. Ownership And Lifecycle

Auth 独占 credential profile、受控登记/签发、验证、expiry、revocation 与 authentication audit。Identity 和 Permission 不保存 credential JWS、verifier 或 bearer value。

稳定生命周期：

1. Initial issuance 只发生在受控 machine/workload enrollment 中，并要求 Identity 已存在 active Machine Principal 与 active `MachineWorkloadBinding`。
2. 每个 credential 引用一个明确 Machine Principal 与一个明确 binding reference/version；该引用不能由 exchange caller 临时选择或替换。
3. credential 最长有效 15 分钟，且 `exp` 不得晚于签发时当前 mTLS leaf certificate 的 `notAfter`。
4. 没有 refresh token。继续运行只能经过受控 reissuance，重新绑定当时的 active Identity binding 与当前 leaf certificate。
5. credential revoke 立即阻止新 STS exchange；Machine Principal 或 binding disabled/stale 同样阻止新 exchange。
6. 已签发 ExecutionToken 的普通收敛仍使用既有 5 分钟最大 TTL；紧急事件只复用 DG-2 `CREDENTIAL`、`PRINCIPAL` 或 `MINIMUM_AUTHZ_VERSION` selector。

## 3. Presentation And Verification

worker 使用当前 mTLS connection 调用既有 `ExecutionTokenService.ExchangeExecutionToken`，并通过 transport-private `authorization: Bearer <source-credential>` 提交该 credential。请求 body 不新增 principal、tenant、SPIFFE、certificate 或 credential 字段。

Common 只传递 opaque bearer，不解析 profile，也不将其复制到 `TrustedExecutionContext`、application/domain input、日志或审计。

Auth 必须在任何 Permission lookup 或签名前按顺序完成：

1. 验证 dedicated MACHINE source profile、issuer、signature、time window 与 credential revocation state。
2. 取得 credential 内不可歧义的 Machine Principal / binding reference、binding version、workload SPIFFE binding 与 leaf-certificate thumbprint binding。
3. 要求 credential SPIFFE ID 等于当前 transport 注入的 `VerifiedWorkloadIdentity.spiffeId`。
4. 要求 credential certificate binding 等于当前 mTLS leaf certificate DER 的 SHA-256 base64url thumbprint。
5. 调用 Identity `ResolveMachinePrincipalForAuth`，确认 principal/binding active、reference 唯一、scope/tenant 与 SPIFFE/version 一致。
6. 仅从 Identity owner decision 派生 `sub`、`principal_type=MACHINE`、scope、tenant 与适用 org reference。
7. BUSINESS issuance 调用 Permission `ResolvePrincipalAuthorization`；INTERNAL issuance 调用 `ResolveWorkloadIssuance`；全部批准后才使用既有 ExecutionToken signer。

Identity resolver 调用本身使用 Auth verified mTLS identity、`aud=identity-service` 的 certificate-bound INTERNAL ExecutionToken 与 exact Code `identity.internal.machine_principal.resolve`。该 Token 通过 Permission 唯一的 `ResolveWorkloadIssuance` bootstrap primitive 获得；本契约不增加另一个 mTLS-only bootstrap interface。

## 4. Binding And Fail-closed Rules

- mTLS 证明当前连接 workload；source credential 证明 Auth-issued root credential；Identity resolver 证明 active Machine Principal 与 stable workload binding。三者必须同时成立。
- 同一 SPIFFE workload 可以承载多个受控 machine binding，但一次 credential 只能引用一个 binding 并解析到一个 principal。ambiguous binding 或 principal mapping 必须拒绝。
- 正确 SPIFFE ID + 错误 leaf、正确 leaf binding + 错误 SPIFFE、stale binding version、wrong principal/scope/tenant 或 inactive owner fact 均在 Permission lookup 前失败。
- credential 中重复出现的 principal、scope、tenant/org 或 Permission facts 都不构成 authority；与 owner decision 不一致时拒绝，不做字段覆盖或 fallback。
- Auth/Identity/Permission unavailable、timeout 或 malformed decision 全部 fail closed，不允许使用 API-key resolver、legacy operator context、body identity、cached caller facts 或硬编码 root mapping。

## 5. Stable Error Categories

- `EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID`
- `EXECUTION_MACHINE_SOURCE_CREDENTIAL_EXPIRED`
- `EXECUTION_MACHINE_SOURCE_CREDENTIAL_REVOKED`
- `EXECUTION_MACHINE_PRINCIPAL_INACTIVE`
- `EXECUTION_MACHINE_SCOPE_MISMATCH`
- `EXECUTION_MACHINE_WORKLOAD_BINDING_MISMATCH`
- `EXECUTION_MACHINE_CERTIFICATE_BINDING_MISMATCH`
- `EXECUTION_MACHINE_BINDING_STALE`
- `EXECUTION_MACHINE_IDENTITY_UNAVAILABLE`

错误响应不得泄露 credential 内容、签名匹配细节、可枚举 principal/binding 信息、grant graph 或 certificate material。

## 6. Audit

成功与失败记录至少包括 opaque credential/binding reference、principal reference/type、scope、tenant/org、verified SPIFFE ID、leaf thumbprint、binding/lifecycle version、target audience、result、safe reason category 与 trace correlation。

审计不得记录 bearer JWS、私钥、可恢复 credential、API Key、Permission grant graph 或 request-body identity fallback。

## 7. Acceptance

1. active credential、当前 SPIFFE/leaf、active Identity principal/binding 与 Permission decision 全部匹配时，可签发既有五分钟 target-audience ExecutionToken。
2. forged、wrong-profile、expired 或 revoked source credential 在 Permission lookup 与 signing 前失败。
3. credential 从另一个 SPIFFE workload 或同 SPIFFE 的另一张 leaf certificate 重放时失败。
4. binding disabled/stale、principal inactive、scope/tenant mismatch 或 ambiguous mapping 时失败。
5. leaf certificate 轮换后旧 source credential 失败；受控 reissuance 后的新 credential 可重新 exchange。
6. Identity resolver 使用 normal mTLS + target-audience INTERNAL ExecutionToken；没有新增 bootstrap exception。
7. API Key、external token、ExecutionToken、DELEGATED reference 或 caller-supplied principal facts 不能被当作本 profile 的替代品。
8. credential/principal/binding disable 阻止新 exchange；已签发 ExecutionToken 只按既有 TTL 或 DG-2 selector 收敛。
9. audit 与 logs 不含 source bearer、secret 或可恢复 credential。
