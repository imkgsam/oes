# party-service Query API

## 1. 模块职责

`PartyQueryService` 负责提供只读主体查询能力，不修改状态。

适用场景：

- 按 `partyId` 查询 canonical 主体摘要
- 按 `tenantPartyId` 查询租户主体摘要
- 按 identifier 解析主体
- 按名称搜索候选主体
- 查询主体关系摘要

调用约束：

- 接口类型：内部服务接口
- 服务：`PartyQueryService`
- 调用方：内部服务
- 权限要求：以具体接口和调用场景为准
- operator context：涉及租户内主体查询时，调用方应显式传入租户上下文

## 2. 主体基础查询

### `GetPartyById`

- 作用：按 `partyId` 查询 canonical 主体摘要
- 请求关键字段：
  - `party_id`
- 响应关键字段：
  - `party.id`
  - `party.type`
  - `party.status`
  - `party.canonical_name`
  - `party.display_name`
- 返回空语义：
  - 未匹配时返回空响应对象

### `GetTenantPartyById`

- 作用：按 `tenantPartyId` 查询租户主体摘要
- 请求关键字段：
  - `tenant_id`
  - `tenant_party_id`
- 响应关键字段：
  - `tenant_party.id`
  - `tenant_party.tenant_id`
  - `tenant_party.party_id`
  - `tenant_party.local_display_name`
  - `tenant_party.local_code`
  - `tenant_party.status`
  - `party_summary`
- 返回空语义：
  - 未匹配时返回空响应对象

## 3. 标识解析与候选搜索

### `ResolvePartyByIdentifier`

- 作用：按稳定标识精确解析主体
- 请求关键字段：
  - `identifier_type`
  - `issuer_country_or_region`
  - `normalized_value`
- 响应关键字段：
  - `match_type`
  - `party`
  - optional `tenant_parties[]`
- 匹配语义：
  - 第一阶段按强匹配语义处理
  - 名称不是该接口的解析依据
- 返回空语义：
  - 未匹配时返回空响应对象

### `SearchPartyCandidates`

- 作用：按名称、地区或组合条件返回候选主体列表
- 请求关键字段：
  - `tenant_id`
  - optional `keyword`
  - optional `party_type`
  - optional `registered_country`
  - optional `identifiers[]`
- 响应关键字段：
  - `candidates[]`
  - `candidates[].party`
  - `candidates[].match_signals[]`
  - `candidates[].confidence`
- 关键语义：
  - 该接口返回的是候选，不代表自动合并或自动绑定结论
  - 中弱匹配只能作为候选，不能被调用方当作自动复用结果

## 4. 主体关系查询

### `ListPartyRelationships`

- 作用：列出某个主体的稳定关系摘要
- 请求关键字段：
  - `party_id`
  - optional `relationship_type`
- 响应关键字段：
  - `relationships[]`
  - `relationships[].from_party_id`
  - `relationships[].to_party_id`
  - `relationships[].relationship_type`
  - `relationships[].assertion_level`
  - `relationships[].effective_from`
  - `relationships[].effective_to`
- 第一阶段关系范围：
  - `SUBSIDIARY_OF`
  - `BRANCH_OF`
  - `LEGAL_REPRESENTATIVE_OF`
  - `SHAREHOLDER_OF`

## 5. 主要错误与返回约束

- 输入参数非法时：
  - 返回统一 validation failure
- 查询对象不存在时：
  - 查询接口优先返回空响应对象，而不是抛业务异常
- 调用方不应依赖内部异常结构推断主体语义
- 涉及租户主体查询时，调用方不得用错误的 `tenantId` 推断跨租户可见性

## 6. 查询使用约束

- 查询接口不授予主体使用权；业务域是否可继续引用某个 `TenantParty`，仍由业务域自身规则与授权链路决定。
- 查询接口返回主体摘要，不代表调用方可以直接把返回字段复制成自己的长期主数据真相。
- 业务域若需要历史法律 / 商务事实，仍应在单据或业务对象中保存 snapshot。
