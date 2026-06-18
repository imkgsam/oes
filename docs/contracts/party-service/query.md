# party-service Query API

## 1. 模块职责

`PartyQueryService` 提供租户内主体只读查询能力，不修改状态。

当前服务面：

- `GetTenantPartyById`
- `ResolveTenantPartyByIdentifier`
- `SearchTenantPartyCandidates`

已移除旧接口：

- `GetPartyById`
- global `ResolvePartyByIdentifier`
- global `SearchPartyCandidates`
- `ListPartyRelationships`

## 2. `GetTenantPartyById`

作用：按 `tenantId + tenantPartyId` 查询当前租户主体摘要。

请求关键字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 租户边界 |
| `tenant_party_id` | 是 | 租户主体 ID |

响应关键字段：

- `tenant_party.id`
- `tenant_party.tenant_id`
- `tenant_party.type`
- `tenant_party.status`
- `tenant_party.legal_name`
- `tenant_party.display_name`
- `tenant_party.local_code`
- `tenant_party.registered_country`

未匹配、租户不一致或主体不存在时返回空响应对象。

## 3. `ResolveTenantPartyByIdentifier`

作用：在当前租户内按稳定标识精确解析 `TenantParty`。

请求关键字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 租户边界 |
| `identifier_type` | 是 | 标识类型 |
| `issuer_country_or_region` | 是 | 签发国家或地区 |
| `normalized_value` | 是 | 规范化值 |
| `raw_value` | 否 | 原始值 |

关键语义：

- 只在当前租户内解析。
- 匹配基础为 `tenantId + identifierType + issuerCountryOrRegion + normalizedValue`。
- 名称不是该接口的解析依据。

## 4. `SearchTenantPartyCandidates`

作用：在当前租户内搜索候选 `TenantParty`。

请求关键字段：

- `tenant_id`
- optional `keyword`
- optional `party_type`
- optional `registered_country`
- optional `identifiers[]`

响应关键字段：

- `candidates[]`
- `candidates[].tenant_party`
- `candidates[].confidence`
- `candidates[].match_signals[]`

返回候选不代表自动合并、跨租户复用或自动绑定结论。

## 5. 查询使用约束

- 查询接口不授予业务使用权；业务域是否可继续引用某个 `TenantParty`，仍由业务域自身规则与授权链路决定。
- 查询返回主体摘要，不代表调用方可以复制成自己的长期主数据真相。
- 业务域若需要历史法律 / 商务事实，应在单据或业务对象中保存 snapshot。
