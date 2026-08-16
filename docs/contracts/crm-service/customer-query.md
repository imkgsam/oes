# crm-service Customer Query API

> CRM 对象与查询语义以 [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md) 为唯一稳定真相源。本文只冻结当前 `CustomerQueryService` 黑盒契约。

## 1. Admission

4 个 RPC 全部是 `BUSINESS / HUMAN`，audience 为 `urn:oes:service:crm-service`，只接受 Gateway workload、mTLS/`cnf` 与准确 ET Code：

| RPC                  | Code               | `sessionTerminals`             |
| -------------------- | ------------------ | ------------------------------ |
| `ListCrmAccounts`    | `crm.account.read` | `['WEB']`                      |
| `GetCrmAccount`      | `crm.account.read` | `['WEB', 'BROWSER_EXTENSION']` |
| `ListSourceRecords`  | `crm.account.read` | `['WEB']`                      |
| `CheckLeadDuplicate` | `crm.account.read` | `['WEB', 'BROWSER_EXTENSION']` |

MACHINE、DELEGATED、SELF_SERVICE、其他 workload、未列出的 terminal 与 legacy authority 均被拒绝。tenant、适用 org、operator 与 trace 只来自 verified ET/transport context。

## 2. RPC Semantics

### `ListCrmAccounts`

按现有 keyword、lifecycle stage、record status、owner、ownerless、created-by 与分页条件读取 CRM account 目录。`owner_account_id` 与 `created_by` 是查询 selector，不建立 caller identity。空页是正常响应。

### `GetCrmAccount`

按 `crm_account_id` 返回现有 `CrmAccountP1` 详情；不存在或不属于 verified tenant 时返回 `NOT_FOUND`。普通 Web 与 Browser Extension 共用该 RPC，服务端依据准确 terminal allowlist 和 CRM resource facts 裁剪访问，而不是按 caller 复制 RPC。

### `ListSourceRecords`

返回指定 account 的 CRM-owned source evidence。source record 是 CRM 业务来源记录，不是 operator 或 transport authority；无记录返回空列表。

### `CheckLeadDuplicate`

根据当前输入执行 CRM-owned duplicate check，不写库。候选详情和 restricted result 仍按 CRM resource/visibility facts 与既有 Code 规则返回；caller 不能通过 tenant、operator 或 owner body 字段扩大可见范围。

## 3. Wire Boundary

四个 request 的 `tenant_id=1`、`operator_context=2`、`trace_context=3` 删除并 reserve。其余 keyword、filters、account ID、lead/profile evidence 与 pagination 字段保持既有业务语义和编号。response 中的 tenant、owner、created-by 与 source facts 仍是 CRM-owned projection。

## 4. Error Boundary

- `UNAUTHENTICATED`：ET、mTLS identity、`cnf`、session 或 trusted correlation 缺失/无效。
- `PERMISSION_DENIED`：Code、terminal、workload 或 CRM resource access 不满足。
- `INVALID_ARGUMENT`：业务 selector、分页或 duplicate evidence 非法。
- `NOT_FOUND`：单对象目标在 verified tenant 内不存在。

query 不新增幂等、重试、schema、event/outbox 或授权 owner。
