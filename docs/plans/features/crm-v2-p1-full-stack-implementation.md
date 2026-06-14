# CRM v2 P1 Full Stack Implementation

## 1. Feature Status

Current status: `implementation planned / not started`

本 feature packet 是 CRM v2 P1 的全栈执行入口，承接以下稳定设计：

- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- [crm-v2-core-object-model.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/crm-v2-core-object-model.md)
- [ADR 0008: Tenant-scoped TenantParty As Primary Party Model](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md)

本文只冻结实现策略、阶段顺序、测试矩阵与验收方式，不重新定义 CRM 服务边界。若本文与 `crm-service.md` 冲突，以 `crm-service.md` 为准。

## 2. Goal

实现 OES CRM P1 全栈闭环：

- 同步冻结并实现 `party-service` 最小正式 TenantParty resolution contract。
- 原地替换旧 CRM runtime / schema，不兼容旧 customer master runtime，不迁移旧 CRM 数据。
- 落地 `crm-service` P1 core objects、use cases、repositories、gRPC controllers 与 smoke。
- 接入 API Gateway / BFF，提供 tenant-web 所需资源接口与动作接口。
- 完成 tenant-web CRM P1 页面，接真实 BFF，不用 mock 数据冒充完成。
- 交付 seed / fixture / smoke。
- 通过基础测试、联动测试与浏览器真机验证。

## 3. Confirmed Implementation Decisions

### 3.1 Replacement Strategy

CRM P1 采用原地替换旧 CRM。

- 不做旧 customer master runtime 兼容。
- 旧 `CustomerAccount / CustomerPartyBinding / CustomerContact / CustomerAddress` 只作为废弃对象处理。
- 旧 BFF 与旧 tenant-web customer management 页面按新 CRM P1 重写或替换。

### 3.2 Implementation Order

以后端真实闭环优先：

1. Contract / proto / schema / crm-service / Gateway-BFF 测试通过。
2. tenant-web 接真实 BFF。
3. 不用复杂 mock 前端驱动后端。
4. 必要时只允许极薄 route skeleton，skeleton 不算交付完成。

### 3.3 Database Strategy

采用破坏式 schema replacement。

- 旧 CRM 数据不迁移。
- 可以删除、废弃或重建旧 CRM 表。
- 使用新 P1 schema 建立 fresh seed / fixture / smoke 数据。

### 3.4 Party Resolution Strategy

CRM P1 同步冻结并实现 `party-service` 最小正式 resolution contract。

Party-Service 负责：

- 租户内 `TenantParty` 候选识别。
- 基于 identifiers、contact points、domain、name、country 返回匹配结果。
- 返回 `EXACT_MATCH / NO_MATCH / CANDIDATES_FOUND / IDENTITY_CONFLICT`。
- 提供 `NO_MATCH` 后创建 `TenantParty` 的正式接口。
- 不判断 `CrmAccount`，不判断客户、供应商或员工语义。

CRM 负责：

- 判断 Lead 是否具备转 Prospect Customer 的最小信息。
- 调用 Party resolution。
- 处理候选选择。
- 检查目标 `tenantPartyId` 是否已有 active formal `CrmAccount`。
- 绑定并转化。

### 3.5 BFF Shape

CRM P1 BFF 采用“资源接口 + 动作接口”的混合风格。

- 列表、详情、普通创建 / 编辑用 resource endpoint。
- 查重、转化、claim、archive、restore、close opportunity 等有业务规则的操作用 action endpoint。
- action endpoint 必须进入 application use case，不能在 controller 中写业务规则。
- 每个 command 必须携带 tenant / operator / trace / audit context。

### 3.6 Frontend Quality Standard

tenant-web CRM P1 不冻结具体实现顺序，但交付必须满足：

- 对齐 Vue 3 / Vite / Vben / Ant Design Vue。
- 不引入新 UI 框架。
- 接真实 Gateway/BFF，不用 mock 数据冒充完成。
- 4 个一级入口 + `CrmAccountDetail` 完整可用。
- 状态、空态、加载态、错误态完整。
- duplicate、convert、restricted、claim、archive、opportunity close 等关键状态必须有清晰 UI。
- 专业企业后台风格，布局稳定，文字不溢出，窄屏不崩。
- tenant-web unit tests 与浏览器真机验证覆盖核心路径。

### 3.7 Branch And Remote Policy

实现阶段使用本地分支：

- `codex/crm-v2-p1-full-stack`

最终要求：

- remote 只保留 `main`。
- 本地可以分阶段 commit。
- 不保留长期远程 feature branch。

## 4. Authoritative Existing Code Paths

### 4.1 Party-Service

Primary files to inspect and modify:

- `src/common/src/contracts/party_service/party.proto`
- `src/common/src/contracts/party_service/index.ts`
- `src/services/system/party-service/prisma/schema.prisma`
- `src/services/system/party-service/src/application/services/party-query.service.ts`
- `src/services/system/party-service/src/application/services/party-registration.service.ts`
- `src/services/system/party-service/src/infrastructure/repositories/prisma-tenant-party.repository.ts`
- `src/services/system/party-service/src/interfaces/grpc/party-query.grpc.controller.ts`
- `src/services/system/party-service/src/interfaces/grpc/party-registration.grpc.controller.ts`
- `src/services/system/party-service/test/l1/party-query.service.spec.ts`
- `src/services/system/party-service/test/l1/party-registration.service.spec.ts`
- `src/services/system/party-service/test/l2/prisma.tenant-party.repository.spec.ts`
- `src/services/system/party-service/test/l3/party-query.grpc.controller.spec.ts`
- `src/services/system/party-service/test/l3/party-registration.grpc.controller.spec.ts`

### 4.2 CRM-Service

Primary files to replace or rewrite:

- `src/common/src/contracts/crm_service/crm.proto`
- `src/common/src/contracts/crm_service/index.ts`
- `src/services/business/crm-service/prisma/schema.prisma`
- `src/services/business/crm-service/src/domain/models/crm-records.ts`
- `src/services/business/crm-service/src/domain/repositories/**`
- `src/services/business/crm-service/src/application/commands/**`
- `src/services/business/crm-service/src/application/queries/**`
- `src/services/business/crm-service/src/application/ports/**`
- `src/services/business/crm-service/src/infrastructure/adapters/party-query-grpc.adapter.ts`
- `src/services/business/crm-service/src/infrastructure/repositories/**`
- `src/services/business/crm-service/src/interfaces/grpc/**`
- `src/services/business/crm-service/src/modules/**`
- `src/services/business/crm-service/scripts/crm-smoke-lib.mjs`
- `src/services/business/crm-service/scripts/crm-smoke.mjs`
- `src/services/business/crm-service/scripts/crm-smoke.spec.mjs`
- `src/services/business/crm-service/test/l1/**`
- `src/services/business/crm-service/test/l2/**`
- `src/services/business/crm-service/test/l3/**`

### 4.3 API Gateway / BFF

Primary files to modify:

- `src/services/api-gateway/src/modules/crm-service/**`
- API Gateway tests under the same module.
- Gateway app/module registration if endpoint names or adapters change.

### 4.4 tenant-web

Primary files to replace or add:

- `app/web/apps/tenant-web/src/api/bff/customer-management/index.ts`
- `app/web/apps/tenant-web/src/api/bff/customer-management/index.spec.ts`
- `app/web/apps/tenant-web/src/views/admin/customer-management.vue`
- `app/web/apps/tenant-web/src/views/admin/customer-management.spec.ts`
- `app/web/apps/tenant-web/src/views/admin/customer-management-create.vue`
- `app/web/apps/tenant-web/src/views/admin/customer-management-create.spec.ts`
- `app/web/apps/tenant-web/src/views/admin/customer-management-detail.vue`
- `app/web/apps/tenant-web/src/views/admin/customer-management-detail.spec.ts`
- `app/web/apps/tenant-web/src/router/routes/modules/tenant-admin.ts`
- `app/web/apps/tenant-web/src/locales/langs/zh-CN/page.json`
- `app/web/apps/tenant-web/src/locales/langs/en-US/page.json`

If CRM grows beyond the old `customer-management` names during implementation, prefer new `crm-*` filenames while keeping menu compatibility explicit in route configuration.

## 5. Implementation Phases

### Phase 0: Baseline And Safety

Tasks:

- Confirm current branch is `codex/crm-v2-p1-full-stack`.
- Confirm unrelated user changes are not reverted.
- Keep CRM P1 docs, contract, service, gateway and tenant-web commits separated.
- Run focused status checks before every commit.

Verification:

```bash
git branch --show-current
git status --short
```

Expected:

- Current branch is `codex/crm-v2-p1-full-stack`.
- Only intended files are staged for each commit.

### Phase 1: Party Resolution Contract

Tasks:

- Extend `party.proto` with tenant-scoped resolution request / response messages.
- Add result enum:
  - `EXACT_MATCH`
  - `NO_MATCH`
  - `CANDIDATES_FOUND`
  - `IDENTITY_CONFLICT`
- Support evidence:
  - tenant id
  - type hint
  - display/name evidence
  - identifiers
  - email
  - phone
  - WhatsApp
  - domain / website
  - country
- Return candidates with:
  - `tenantPartyId`
  - display name
  - type
  - matched fields
  - confidence
  - conflict flags
- Add a formal registration path for the `NO_MATCH` create case using existing tenant-scoped `TenantParty` model.
- Ensure Party does not know CRM semantics.

Tests:

```bash
pnpm --filter party-service test:l2
pnpm --filter party-service test:l2 -- --runInBand
pnpm proto:lint
```

Expected coverage:

- exact official identifier match.
- no match.
- multiple candidate match.
- identity conflict with evidence pointing at different TenantParty records.
- domain/contact-point candidate search.

### Phase 2: CRM Proto And Permission Contract

Tasks:

- Replace old customer master CRM proto surface with CRM P1 commands and queries.
- Add messages for:
  - `CrmAccount`
  - `CrmSourceRecord`
  - `CrmContact`
  - `CrmActivity`
  - `Opportunity`
  - duplicate check results
  - conversion results
- Add gRPC methods for frozen P1 use cases.
- Add or sync permission codes:
  - `crm.account.create`
  - `crm.account.read`
  - `crm.account.update`
  - `crm.account.archive`
  - `crm.account.convert`
  - `crm.contact.manage`
  - `crm.source.manage`
  - `crm.activity.create`
  - `crm.opportunity.manage`
  - `crm.duplicate.viewRestricted`
  - `crm.account.claim`

Tests:

```bash
pnpm proto:lint
pnpm --filter permission-service test:l1
```

Expected coverage:

- proto compiles and lints.
- permission catalog sync includes CRM P1 action codes.

### Phase 3: CRM Schema Replacement

Tasks:

- Replace old CRM Prisma schema with P1 schema:
  - `CrmAccount`
  - `CrmSourceRecord`
  - `CrmContact`
  - `CrmActivity`
  - `Opportunity`
  - audit / idempotency tables only if already required by service infrastructure.
- Add tenant indexes for all query paths.
- Add uniqueness / constraints:
  - active formal `tenantPartyId` uniqueness per tenant where applicable.
  - one primary source per account.
  - one primary contact per account.
  - no opportunity for non-formal accounts at application layer.
- Remove old CRM tables from the active schema.
- Generate Prisma client.

Tests:

```bash
pnpm --filter crm-service prisma:generate
pnpm --filter crm-service prisma:push
pnpm --filter crm-service test:l2
```

Expected coverage:

- CRUD repositories work under tenant isolation.
- primary source/contact invariants hold.
- old schema does not remain as active runtime truth.

### Phase 4: CRM Domain And Use Cases

Tasks:

- Implement domain models and enums for P1.
- Implement duplicate check service:
  - high confidence exact email / phone / WhatsApp / domain / lead identifier.
  - medium confidence name + country checks.
  - restricted masking.
- Implement commands:
  - draft lead creation/update/submit.
  - active lead creation/update.
  - convert lead to prospect customer.
  - archive/restore.
  - claim unowned account.
  - source/contact/activity/opportunity commands.
- Implement queries:
  - account workspace list.
  - account detail aggregate.
  - dashboard summary.
  - opportunity workspace list.
- Implement Party resolution adapter using the formal Party contract.
- Ensure `CUSTOMER` cannot be set by CRM user command.

Tests:

```bash
pnpm --filter crm-service test:l1
pnpm --filter crm-service test:l2
pnpm --filter crm-service test:l3
```

Expected coverage:

- draft lead submit rules.
- duplicate check and create blocking.
- conversion result branches.
- existing formal account conflict.
- archive/restore restrictions.
- opportunity allowed only for formal accounts.
- close won / close lost / cancel rules.

### Phase 5: CRM gRPC Controllers And Smoke

Tasks:

- Replace old customer gRPC controllers and presenters with CRM P1 controllers and presenters.
- Preserve context validation discipline.
- Update `crm-smoke-lib.mjs` and `crm-smoke.mjs` to cover P1 flow.
- Add fixture data for sales user, manager/admin, leads, prospect customer, readonly customer, source/contact/activity/opportunity and Party resolution samples.

Tests:

```bash
pnpm --filter crm-service test:l3
pnpm crm:smoke
```

Expected smoke path:

1. create draft lead.
2. submit active lead.
3. duplicate check possible duplicate.
4. high confidence duplicate blocked.
5. convert lead to prospect customer.
6. add source/contact/activity.
7. create opportunity.
8. change stage.
9. close won / close lost / cancel.

### Phase 6: Gateway / BFF

Tasks:

- Replace old customer management BFF with CRM P1 resource + action endpoints.
- Resource endpoints:
  - list accounts.
  - get account detail aggregate.
  - list opportunities.
  - create lead / draft lead / opportunity.
- Action endpoints:
  - check duplicate.
  - submit draft.
  - convert to prospect customer.
  - archive / restore.
  - claim.
  - change opportunity stage.
  - close opportunity.
  - cancel opportunity.
- Map auth/operator/tenant/trace/audit context consistently.
- Do not encode core business rules in controllers.

Tests:

```bash
pnpm --filter api-gateway exec jest src/modules/crm-service
```

Expected coverage:

- BFF request/response mapping.
- permission-sensitive duplicate masking.
- command context propagation.
- error mapping for insufficient info, conflict and authorization failure.

### Phase 7: tenant-web CRM P1

Tasks:

- Implement CRM menu entries and routes:
  - `CRM > 工作台`
  - `CRM > 线索`
  - `CRM > 客户资源`
  - `CRM > 商机`
  - `CrmAccountDetail`
- Implement pages with Vben `Page` and Ant Design Vue.
- Implement drawers:
  - create/edit lead.
  - source.
  - contact.
  - activity.
  - opportunity.
- Implement modals:
  - duplicate decision.
  - convert to prospect customer.
  - claim.
  - archive/restore.
  - close/cancel opportunity.
- Ensure pages use real BFF APIs.
- Ensure loading, empty, error and restricted states are implemented.
- Ensure table layout remains readable and text does not overflow.

Tests:

```bash
pnpm --dir app/web --filter @oes/tenant-web run typecheck
pnpm --dir app/web test:unit -- --runInBand
```

Browser verification:

- Open tenant-web locally.
- Log in with seed user.
- Execute CRM P1 core flows from the UI.
- Capture screenshots of:
  - dashboard.
  - lead workspace.
  - duplicate modal.
  - convert modal.
  - account detail.
  - opportunity workspace.

### Phase 8: Full Integration Verification

Commands:

```bash
pnpm proto:lint
pnpm --filter party-service test:l1
pnpm --filter party-service test:l2
pnpm --filter party-service test:l3
pnpm --filter crm-service test:l1
pnpm --filter crm-service test:l2
pnpm --filter crm-service test:l3
pnpm --filter api-gateway exec jest src/modules/crm-service
pnpm crm:smoke
pnpm --dir app/web --filter @oes/tenant-web run typecheck
pnpm --dir app/web test:unit -- --runInBand
```

Runtime verification:

- Start required services.
- Run Party + CRM + Gateway smoke.
- Open tenant-web in browser.
- Verify all P1 UI flows against real BFF.

## 6. Required Test Matrix

P1 must pass:

- L1 domain / use case tests.
- L2 repository / schema tests.
- L3 gRPC / API tests.
- Gateway/BFF HTTP tests.
- Smoke tests.
- tenant-web unit tests.
- Browser real-device verification.

Core acceptance paths:

1. Draft Lead -> Submit Active Lead.
2. Active Lead duplicate check -> possible duplicate acknowledge.
3. High confidence duplicate -> blocked / claim / restricted masking.
4. Lead -> Prospect Customer, covering Party exact / no match / candidates / conflict.
5. Prospect Customer -> Source / Contact / Activity / Opportunity.
6. Opportunity stage change -> close won / close lost / cancel.

## 7. Seed / Fixture / Smoke Requirements

P1 must deliver:

- `crm-service` seed / fixture.
- `crm-service` smoke.
- Gateway/BFF smoke.
- tenant-web auth/test data integration.
- Party resolution test samples.

Seed data must include:

- one salesperson account.
- one manager/admin account.
- Draft Lead.
- Active Lead.
- unowned Lead.
- Prospect Customer.
- Customer readonly sample.
- SourceRecord.
- Contact.
- Activity.
- Opportunity open / won / lost / cancelled.
- Party resolution exact / no match / candidates / conflict samples.

The Customer readonly sample is for display and verification only. CRM P1 still must not expose manual Mark as Customer.

## 8. Commit Plan

Use multiple focused commits:

1. `docs: freeze crm v2 p1 full stack plan`
2. `feat(party): add tenant party resolution contract`
3. `feat(crm): replace crm p1 schema and domain`
4. `feat(crm): implement p1 use cases and grpc`
5. `feat(gateway): expose crm p1 bff`
6. `feat(web): add crm p1 tenant workspace`
7. `test(crm): add p1 seeds smoke and integration coverage`

Do not stage unrelated user changes. Before each commit:

```bash
git status --short
git diff --name-only --cached
```

## 9. Completion Criteria

The CRM P1 goal is not complete until current evidence proves:

- Party minimum resolution contract exists, is implemented, and passes tests.
- Old CRM runtime/schema has been replaced by CRM P1.
- CRM P1 use cases are implemented behind application handlers.
- gRPC and Gateway/BFF expose the required P1 capabilities.
- tenant-web exposes the four CRM P1 entrances plus `CrmAccountDetail`.
- tenant-web uses real BFF APIs for completed flows.
- seed / fixture / smoke data exists and covers core flows.
- all required automated tests pass.
- browser verification confirms core UI flows are usable and visually acceptable.
- no deferred feature was silently pulled into P1 as a half-implemented dependency.
