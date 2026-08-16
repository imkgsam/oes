# crm-service Customer Management API

> CRM 写入对象、状态与 Party promotion 边界以 [crm-service.md](../../architecture/services/crm-service.md) 为唯一稳定真相源。本文只冻结当前 `CustomerManagementService` 黑盒契约。

## 1. Admission

10 个 RPC 全部是 `BUSINESS / HUMAN`，audience 为 `urn:oes:service:crm-service`，只接受 Gateway workload、mTLS/`cnf` 与准确 ET Code：

| RPC                             | Code                                                                                 | `sessionTerminals`             |
| ------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| `CreateDraftLead`               | `crm.account.create`                                                                 | `['WEB', 'BROWSER_EXTENSION']` |
| `UpdateDraftLead`               | `crm.account.update`                                                                 | `['WEB']`                      |
| `SubmitDraftLead`               | `crm.account.update`                                                                 | `['WEB']`                      |
| `DeleteDraftLead`               | `crm.account.update`                                                                 | `['WEB']`                      |
| `CreateLead`                    | `crm.account.create`                                                                 | `['WEB', 'BROWSER_EXTENSION']` |
| `ClaimCrmAccount`               | `crm.account.claim`                                                                  | `['WEB', 'BROWSER_EXTENSION']` |
| `ReleaseCrmAccount`             | `crm.account.release`                                                                | `['WEB']`                      |
| `ArchiveCrmAccount`             | `crm.account.manage`                                                                 | `['WEB']`                      |
| `UpdateCrmAccountIdentifiers`   | `crm.account.update`                                                                 | `['WEB']`                      |
| `ConvertLeadToProspectCustomer` | `crm.account.convert`; ownerless override additionally requires `crm.account.manage` | `['WEB']`                      |

MACHINE、DELEGATED、SELF_SERVICE、其他 workload、未列出的 terminal 与 legacy authority 均被拒绝。tenant、适用 org、operator、trace 与 audit identity/source 只来自 verified ET/transport context。

## 2. Ownership And Decision Inputs

- `assignment_intent` 是 bounded business intent，保留 `OWNED_BY_OPERATOR / POOL`。前者的 owner 只能从 verified HUMAN subject 派生；后者保持 owner 为空。
- caller 不得提交 `owner_account_id` 或 `claim_for_current_user` 建立 owner authority。
- `duplicate_warning_acknowledged` 是业务确认，不是授权事实；CRM 仍重新执行 duplicate check。
- ownerless conversion override 只能从 verified ET 是否同时包含 `crm.account.manage` 派生，body bool 不建立权限。
- `source_captured_by_account_id`、source type/name/time/reference/note/raw payload 是受业务校验的来源证据，不是当前 caller identity。
- Party resolution/creation 继续通过 CRM 已集成的 Party MACHINE_ROOT dedicated client；它不改变当前 HUMAN operation 的主体、tenant、审计归因或 CRM transaction ownership。

## 3. RPC Semantics

- `CreateDraftLead`：创建 `DRAFT + LEAD`；保留 `createdBy`，owner 为空。
- `UpdateDraftLead`：只更新仍为 Draft 的既有 Lead。
- `SubmitDraftLead`：执行 CRM duplicate check，把 Draft 转成 `ACTIVE + LEAD`，并按 `assignment_intent` 归属当前 verified operator 或 Pool。
- `DeleteDraftLead`：只 hard-delete `DRAFT + LEAD`。
- `CreateLead`：执行 CRM duplicate check，创建 `ACTIVE + LEAD`，并按 `assignment_intent` 决定当前 operator owner 或 Pool。
- `ClaimCrmAccount`：只领取 owner 为空且满足既有状态规则的 Pool Lead/Prospect Customer。
- `ReleaseCrmAccount`：只把当前允许释放的已归属 Lead/Prospect Customer 显式释放回 Pool。
- `ArchiveCrmAccount`：保持既有 record/lifecycle rule，不扩展 archive/unarchive 状态机。
- `UpdateCrmAccountIdentifiers`：更新 CRM-owned identifiers，不修改 Party truth 或 owner。
- `ConvertLeadToProspectCustomer`：保持既有 legal-name、duplicate、Party resolution 与 CRM conversion result；ownerless override 需额外 verified `crm.account.manage`。

既有 mutation、CRM audit 与 transaction/rollback 语义保持不变；迁移不增加幂等键、自动重试、schema、event/outbox 或业务状态。

## 4. Wire Boundary

每个 management request 的 `tenant_id=1`、`operator_context=2`、`trace_context=3`、`audit_context=4` 删除并 reserve。另删除并 reserve：

- `CreateLeadRequest.owner_account_id=15`
- `CreateLeadRequest.claim_for_current_user=26`
- `SubmitDraftLeadRequest.claim_for_current_user=7`
- `ConvertLeadToProspectCustomerRequest.allow_ownerless_conversion=6`

其余 account ID、lead/profile fields、source evidence、assignment intent、duplicate acknowledgment、archive reason、legal name 与 identifier fields 保持业务语义和原编号。response shape 与 CRM-owned projection 不变。

## 5. Error Boundary

- `UNAUTHENTICATED`：ET、mTLS identity、`cnf`、session、trusted correlation 或 audit authority 缺失/无效。
- `PERMISSION_DENIED`：Code、terminal、workload、owner/resource rule 或额外 ownerless override Code 不满足。
- `INVALID_ARGUMENT`：业务字段、assignment intent、source evidence 或 legal name 非法。
- `NOT_FOUND`：目标在 verified tenant 内不存在。
- `ALREADY_EXISTS / FAILED_PRECONDITION`：保持现有 duplicate、claim/release、draft、archive 与 conversion 前提语义。
