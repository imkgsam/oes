# Machine Principal Resolution For Auth Contract

```text
status: FROZEN
implementationStatus: FROZEN_PENDING_IMPLEMENTATION
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/identity-service.md
consumer: auth-service
```

> 本文冻结 Identity 为第一方 MACHINE root execution 提供的黑盒 principal/binding resolution。Identity 的长期 owner 语义以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；Auth source credential 以 [machine-workload-source-credential.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/machine-workload-source-credential.md) 为准。

## 1. Surface And Purpose

Identity 将在既有 `IdentityQueryService` gRPC surface 新增 Auth-only `ResolveMachinePrincipalForAuth`。该 resolver 只回答：Auth 已验证 credential 所引用的 Machine Principal 与 `MachineWorkloadBinding` 当前是否有效且一致，以及哪些 owner facts 可用于建立 `principal_type=MACHINE` 的执行身份。

它不修改或泛化既有 `ResolveIntegrationMachineForAuth`。后者继续只服务 external API-key exchange；两个 resolver 不互为 fallback。

本文冻结黑盒语义、proto wire 与 owner persistence invariants；runtime class 名与具体实现算法仍属 implementation concern。

### 1.1 Frozen query wire

`IdentityQueryService` 新增 `ResolveMachinePrincipalForAuth`。Request 字段与 field number 固定为：

```proto
rpc ResolveMachinePrincipalForAuth(ResolveMachinePrincipalForAuthRequest) returns (ResolveMachinePrincipalForAuthResponse);
```

| Field | Number | Type |
| --- | ---: | --- |
| `machine_principal_id` | 1 | `string` |
| `machine_workload_binding_id` | 2 | `string` |
| `machine_workload_binding_version` | 3 | `int64` |
| `workload_spiffe_id` | 4 | `string` |

Response 字段与 field number 固定为：

| Field | Number | Type |
| --- | ---: | --- |
| `allowed` | 1 | `bool` |
| `machine_principal_id` | 2 | `string` |
| `principal_type` | 3 | `string`，成功时固定 `MACHINE` |
| `machine_type` | 4 | `string` |
| `scope_level` | 5 | `string` |
| `tenant_id` | 6 | `string` |
| `org_id` | 7 | `string` |
| `principal_lifecycle_status` | 8 | `string` |
| `principal_lifecycle_version` | 9 | `string` |
| `machine_workload_binding_id` | 10 | `string` |
| `machine_workload_binding_version` | 11 | `int64` |
| `workload_spiffe_id` | 12 | `string` |
| `decision_reference` | 13 | `string` |
| `reason_code` | 14 | `string` |

denied response 只回显 request principal/binding selector、`allowed=false`、safe decision reference 与 reason category；tenant/org、lifecycle 和其他 owner facts 留空，不允许通过 reason 枚举 principal 或 binding 存在性。

### 1.2 Frozen management wire

`IdentityManagementService` 新增 `EnrollMachineWorkloadBinding` 与 `DisableMachineWorkloadBinding`。两者使用普通 mTLS + target-audience ExecutionToken 和 BUSINESS Code `identity.machine.workload_binding.manage`，不是 bootstrap RPC。

```proto
rpc EnrollMachineWorkloadBinding(EnrollMachineWorkloadBindingRequest) returns (EnrollMachineWorkloadBindingResponse);
rpc DisableMachineWorkloadBinding(DisableMachineWorkloadBindingRequest) returns (DisableMachineWorkloadBindingResponse);
```

`EnrollMachineWorkloadBindingRequest` 固定为 `string machine_principal_id = 1`、`string workload_spiffe_id = 2`、`string idempotency_key = 3`。`DisableMachineWorkloadBindingRequest` 固定为 `string machine_workload_binding_id = 1`、`int64 expected_binding_version = 2`、allowlisted `string reason_code = 3`。

两个 response 都使用 `MachineWorkloadBinding` message：`string binding_id = 1`、`string machine_principal_id = 2`、`string workload_spiffe_id = 3`、`string status = 4`、`int64 binding_version = 5`、`int64 created_at_unix_seconds = 6`、`int64 disabled_at_unix_seconds = 7`、`string disable_reason_code = 8`。Enroll response 为 `MachineWorkloadBinding binding = 1`、`string audit_correlation_id = 2`；Disable response 为 `MachineWorkloadBinding binding = 1`、`bool already_disabled = 2`、`string audit_correlation_id = 3`。

## 2. Identity-owned Facts

Identity owns：

- Machine Principal stable id、type、`SYSTEM | TENANT` scope、tenant reference 与 active/disabled lifecycle；
- 适用时的 org reference，但不拥有 tenant/org tree 或 lifecycle；
- `MachineWorkloadBinding` stable reference、关联 Machine Principal、精确 workload SPIFFE ID、active/disabled lifecycle 与单调 binding version。

`MachineWorkloadBinding` 不保存 mTLS leaf certificate、certificate thumbprint、Auth credential、Permission Code、role/grant 或 ExecutionToken。

一个 SPIFFE workload 可以承载多个受控 machine binding；resolver 的唯一性来自 Auth 已验证 credential 提供的 principal reference + binding reference。该 binding 必须唯一指向该 principal，且其 SPIFFE ID/version 必须精确匹配；ambiguous result 永远不是 allowed result。

第一阶段 internal resolver 只允许 `INTERNAL_SERVICE` 与 `AUTOMATION_BOT` Machine Principal。`EXTERNAL_INTEGRATION` 继续只走 external API-key resolver；`AI_AGENT` runtime 继续 deferred，不因本 contract 开放。

### 2.1 Persistence invariants

Identity Prisma 模型 `MachineWorkloadBinding` 固定保存 UUID `id`、Auth-independent `serviceAccountId`、exact SPIFFE ID、`ACTIVE | DISABLED` state、`BigInt` monotonic version、created/disabled operator、time、allowlisted reason 与 enrollment/disable audit reference。

- `serviceAccountId` 对本地 `ServiceAccount.id` 建立 `ON DELETE RESTRICT` FK；不对 tenant/org 或 Auth 建立跨服务 FK。
- 同一 `(serviceAccountId, workloadSpiffeId)` 同时最多一个 active binding；同一 SPIFFE ID 可合法绑定多个不同 principal。
- binding 没有 expiry 或 revoked state；disable 是终态。需要恢复时创建新 binding，不复活或改写旧历史。
- 任何 lifecycle 变更递增 version；resolver 必须比较 exact version，不容许“至少”或近似匹配。
- binding row 不存 leaf certificate、thumbprint、Auth credential、Permission Code、role/grant 或 ExecutionToken。
- enroll/disable state 和 local `AuditEvent` 在同一 Identity database transaction 中提交；resolver allowed/denied decision 在响应前记录同一 local audit sink。

## 3. Trust And Logical Input

调用必须同时具备：

- transport 验证的准确 `auth-service` mTLS/SPIFFE workload；
- `aud=identity-service` 且绑定当前 Auth leaf certificate 的 ExecutionToken；
- exact INTERNAL Code `identity.internal.machine_principal.resolve`。

该 Code 只允许准确 Auth workload 通过 Permission `ResolveWorkloadIssuance` 申请，不进入 HUMAN/MACHINE role、external JWT、API-key flow 或 wildcard issuance policy。本 RPC 不是 mTLS-only bootstrap primitive。

逻辑输入只包含 Auth 从已验证 source credential 得到的：

- Machine Principal reference；
- `MachineWorkloadBinding` reference/version；
- 当前 transport-verified workload SPIFFE ID；
- trace/audit correlation。

不得输入 raw source credential、leaf certificate/thumbprint、API Key、Permission Code/grant、caller-computed tenant/org 或 body identity 作为 owner fact。

## 4. Decision Semantics

`allowed=true` 必须同时满足：

1. principal 存在、类型为允许的内部 MACHINE 类型且 lifecycle active；
2. scope 合法；`SYSTEM` tenant 为空，`TENANT` 具有有效且一致的 tenant reference；
3. binding 存在、active、唯一指向该 principal；
4. binding 的 SPIFFE ID 等于 Auth 提交的 transport-verified SPIFFE ID；
5. binding version 等于 credential 引用的当前 version；
6. 适用 tenant/org reference 没有 owner-boundary mismatch。

稳定输出只包含：

- `allowed` 与 safe reason category；
- principal stable id（Auth 用作 ExecutionToken `sub`）、`principal_type=MACHINE`、machine type、scope、tenant 与适用 org reference；
- principal lifecycle version、binding reference/version、SPIFFE ID echo 与 safe decision reference。

Identity 不返回 source credential、leaf thumbprint、Permission grant、role graph、target audience authorization 或业务资源事实。Auth 仍独立验证 leaf certificate binding，Permission 仍独立判定 BUSINESS/INTERNAL authorization。

## 5. Failure And Availability

not found、inactive、wrong type/scope、tenant/org mismatch、binding missing/disabled/stale、SPIFFE mismatch、ambiguous mapping、trust failure、timeout 或 dependency unavailable 均 fail closed。

HUMAN OBO 不改变本 resolver contract：MES、WMS、Procurement 与 SRM 的 `SYSTEM` Machine Principal response 仍不得包含 tenant。Auth 通过 immutable verified-SPIFFE/self-audience registry 选择 principal/binding selector，再用本 resolver 验证 actor owner facts。Identity 不接收 subject ExecutionToken、subject tenant 或 target audience，不把 HUMAN tenant 写入 principal/binding，也不参与 subject/target Token `jti` 关联。

Identity 返回安全 reason category；Auth 将其稳定映射为 MACHINE execution error。不得回退到 `ResolveIntegrationMachineForAuth`、legacy `AuthenticateApiKey`、Auth hardcoded root mapping、service-name header 或 caller/body principal fields。

stable reason category 只允许：

- `MACHINE_PRINCIPAL_NOT_ELIGIBLE`
- `MACHINE_PRINCIPAL_SCOPE_INVALID`
- `MACHINE_WORKLOAD_BINDING_NOT_ELIGIBLE`
- `MACHINE_WORKLOAD_BINDING_PRINCIPAL_MISMATCH`
- `MACHINE_WORKLOAD_BINDING_STALE`
- `MACHINE_WORKLOAD_SPIFFE_MISMATCH`
- `MACHINE_RESOLUTION_DEPENDENCY_UNAVAILABLE`

transport mTLS / ExecutionToken / INTERNAL Code failure 使用 gRPC `UNAUTHENTICATED` 或 `PERMISSION_DENIED`，malformed field 使用 `INVALID_ARGUMENT`，owner dependency/audit unavailable 使用 `UNAVAILABLE`。这些 transport error 不伪装为 `allowed=false` owner decision。

## 6. Acceptance

1. 只有准确 Auth mTLS workload + identity-service audience Token + exact INTERNAL Code 可以调用。
2. active principal 与 active binding 的 principal/SPIFFE/version 全部一致时返回唯一 allowed decision。
3. principal disabled、binding disabled/stale、wrong principal、wrong SPIFFE、wrong scope/tenant 或 ambiguous mapping 返回 denied；Auth 不进入 Permission lookup/signing。
4. 同一 SPIFFE 下存在多个合法 binding 时，exact credential binding reference 仍只解析一个 principal；缺失或歧义 reference 拒绝。
5. external Integration resolver 与 API-key legacy surface 不参与内部 MACHINE resolution。
6. contract/runtime 不接收或返回 raw credential、leaf material、Permission facts 或 caller-computed authority。
