# party-service Registration API

## 1. 模块职责

`PartyRegistrationService` 提供租户内主体注册与停用写接口。

接口类型：内部 gRPC 服务。

当前服务面：

- `RegisterTenantParty`
- `DeactivateTenantParty`

已移除旧接口：

- `RegisterPersonParty`
- `RegisterOrganizationParty`
- `BindExistingPartyToTenant`

## 2. `RegisterTenantParty`

作用：在当前租户内创建或复用一个 `TenantParty`。

请求关键字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 租户边界 |
| `type` | 是 | `PERSON` 或 `ORGANIZATION` |
| `legal_name` | 是 | 法定 / 官方名称 |
| `display_name` | 否 | 租户内展示名 |
| `local_code` | 否 | 租户内本地编码 |
| `registered_country` | 否 | 注册国家或地区 |
| `identifiers[]` | 否 | 租户内标识 |
| `idempotency_key` | 否 | 幂等键 |

`identifiers[]` 字段：

| 字段 | 说明 |
| --- | --- |
| `identifier_type` | 标识类型 |
| `issuer_country_or_region` | 签发国家或地区 |
| `normalized_value` | 规范化值 |
| `raw_value` | 原始值 |
| `status` | 标识状态 |

关键语义：

- `TenantPartyIdentifier` 唯一性为 `tenantId + identifierType + issuerCountryOrRegion + normalizedValue`。
- 命中当前租户内同一 identifier 时返回既有 `TenantParty`。
- 不查询或复用其他租户主体。
- 不创建 system-wide `Party`。
- 不返回旧 `partyId`。

响应关键字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_party` | 租户主体摘要 |
| `match_result` | `CREATED` 或租户内复用结果 |

## 3. `DeactivateTenantParty`

作用：停用当前租户下的 `TenantParty`。

请求关键字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 租户边界 |
| `tenant_party_id` | 是 | 目标主体 |
| `reason` | 否 | 停用原因 |

关键语义：

- 停用不是物理删除。
- 若该主体已被业务域引用，是否允许继续操作由调用方业务规则决定。
- 响应返回停用后的 `tenant_party` 摘要。

## 4. 幂等性与审计

- `RegisterTenantParty` 支持 `idempotency_key`。
- 同一 `idempotency_key` + 同一 request fingerprint 可复用既有结果。
- 同一 `idempotency_key` + 不同 request fingerprint 应返回幂等冲突。
- 调用链应继续传递 operator / trace metadata；更强 permission guard 与 audit event 持久化按后续治理能力补齐。
