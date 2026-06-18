# Employee Official Photo Business Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an HR-owned employee official public photo flow and make employee digital business cards display only `officialPhotoUrl` or a formal placeholder, never account avatar fallback.

**Architecture:** `asset-service` owns employee official photo file assets and URLs, `hr-service` owns `Employee.officialPhotoAssetId / officialPhotoUrl`, API Gateway orchestrates upload plus HR binding, and `public-entry-service` consumes only HR employee summaries. `tenant-web` exposes admin upload/removal in employee detail and renders business-card photos from `officialPhotoUrl` or placeholder across admin, personal-center, and public views.

**Tech Stack:** NestJS, Prisma, gRPC/proto, Postgres, S3-compatible asset storage, API Gateway HTTP BFF, Vue 3, Ant Design Vue, Vitest/Jest

---

## Frozen References

- HR service truth source: `docs/architecture/services/hr-service.md`
- Asset service truth source: `docs/architecture/services/asset-service.md`
- HR management contract: `docs/contracts/hr-service/management.md`
- HR query contract: `docs/contracts/hr-service/query.md`
- Asset employee photo contract: `docs/contracts/asset-service/employee-official-photo.md`
- BusinessCard feature packet: `docs/plans/features/employee-digital-business-card.md`

## File Structure

- `src/common/src/contracts/asset_service/asset.proto`: add employee official photo upload/bind RPCs and `owner_employee_id`.
- `src/services/system/asset-service/**`: extend avatar asset slice to support `EMPLOYEE_OFFICIAL_PHOTO`.
- `src/common/src/contracts/hr_service/hr.proto`: add employee official photo fields and management RPCs.
- `src/services/system/hr-service/prisma/schema.prisma`: persist `officialPhotoAssetId` and `officialPhotoUrl` on `Employee`.
- `src/services/system/hr-service/src/domain/repositories/employee.repository.ts`: expose update/remove official photo repository methods.
- `src/services/system/hr-service/src/application/services/hr-management.service.ts`: implement set/remove official photo use cases.
- `src/services/system/hr-service/src/application/services/hr-query.service.ts`: return official photo fields in employee summaries.
- `src/services/system/hr-service/src/interfaces/grpc/*.ts`: map new proto fields and RPCs.
- `src/services/api-gateway/src/modules/hr-service/**`: add HTTP upload/remove endpoints that orchestrate Asset + HR.
- `src/services/system/public-entry-service/src/infrastructure/adapters/business-card-upstream.grpc.adapters.ts`: stop reading `accountProfile.avatarUrl` for BusinessCard official photo.
- `app/web/apps/tenant-web/src/api/bff/hr-management/index.ts`: add employee official photo APIs.
- `app/web/apps/tenant-web/src/views/admin/components/employee-business-card-display.vue`: redesign employee detail BusinessCard tab with left preview and right avatar setting.
- `app/web/apps/tenant-web/src/views/_core/profile/components/personal-business-card-section.vue`: keep formal card UI, but ensure it never substitutes account avatar.
- `app/web/apps/tenant-web/src/views/public/business-card-public.vue`: render official photo or formal placeholder only.

---

### Task 1: Add Employee Official Photo Asset Capability

**Files:**
- Modify: `src/common/src/contracts/asset_service/asset.proto`
- Modify: `src/services/system/asset-service/prisma/schema.prisma`
- Modify: `src/services/system/asset-service/src/domain/entities/asset.entity.ts`
- Modify: `src/services/system/asset-service/src/application/commands/avatar/*.ts`
- Modify: `src/services/system/asset-service/src/interfaces/grpc/asset.grpc.controller.ts`
- Test: `src/services/system/asset-service/test/l1/avatar-command-validation.spec.ts`
- Test: `src/services/system/asset-service/test/l1/avatar-command-handlers.spec.ts`

- [ ] **Step 1: Write failing tests for employee photo upload validation**

Add tests proving:

```ts
await expect(
  uploadEmployeeOfficialPhotoHandler.execute({
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    employeeId: 'employee-1',
    operatorId: 'admin-1',
    file: validPngBuffer,
    fileName: 'official.png',
    contentType: 'image/png'
  })
).resolves.toMatchObject({
  category: 'EMPLOYEE_OFFICIAL_PHOTO',
  tenantId: 'tenant-1',
  ownerEmployeeId: 'employee-1',
  status: 'PENDING_BIND'
})

await expect(
  uploadEmployeeOfficialPhotoHandler.execute({
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    employeeId: '',
    operatorId: 'admin-1',
    file: validPngBuffer,
    fileName: 'official.png',
    contentType: 'image/png'
  })
).rejects.toThrow('employeeId is required')
```

Run: `pnpm --filter asset-service test -- --runTestsByPath test/l1/avatar-command-validation.spec.ts`

- [ ] **Step 2: Extend the Asset proto without reusing account avatar semantics**

Add proto shape:

```proto
service AssetService {
  rpc UploadAccountAvatar(UploadAccountAvatarRequest) returns (UploadAccountAvatarResponse);
  rpc BindAccountAvatar(BindAccountAvatarRequest) returns (BindAccountAvatarResponse);
  rpc UploadEmployeeOfficialPhoto(UploadEmployeeOfficialPhotoRequest) returns (UploadEmployeeOfficialPhotoResponse);
  rpc BindEmployeeOfficialPhoto(BindEmployeeOfficialPhotoRequest) returns (BindEmployeeOfficialPhotoResponse);
  rpc ResolveAssetPublicUrl(ResolveAssetPublicUrlRequest) returns (ResolveAssetPublicUrlResponse);
}

message UploadEmployeeOfficialPhotoRequest {
  string scope_level = 1;
  string tenant_id = 2;
  string employee_id = 3;
  string operator_id = 4;
  bytes file = 5;
  string file_name = 6;
  string content_type = 7;
}

message BindEmployeeOfficialPhotoRequest {
  string scope_level = 1;
  string tenant_id = 2;
  string employee_id = 3;
  string operator_id = 4;
  string new_asset_id = 5;
  string previous_asset_id = 6;
}
```

Add `owner_employee_id` to `AssetSummary` using the next available field number.

- [ ] **Step 3: Persist employee owner and category**

Extend the asset model with nullable `ownerEmployeeId` and category value `EMPLOYEE_OFFICIAL_PHOTO`. Storage keys must use:

```text
avatar/tenant/<tenantId>/employee/<employeeId>/official/<generated-file-name>
```

Do not store employee official photos in account avatar paths.

- [ ] **Step 4: Implement upload/bind handlers and gRPC mappings**

Use the existing account avatar upload/bind flow as the storage and status reference, but validate:

```ts
scopeLevel === 'TENANT'
tenantId.trim().length > 0
employeeId.trim().length > 0
category === 'EMPLOYEE_OFFICIAL_PHOTO'
```

Reject any bind where the asset has `ownerAccountId` or where `ownerEmployeeId !== employeeId`.

- [ ] **Step 5: Verify asset-service**

Run:

```bash
pnpm --filter asset-service test
pnpm --filter asset-service build
```

Expected: all asset-service tests and build pass.

---

### Task 2: Add HR Employee Official Photo Fields, Commands, and Queries

**Files:**
- Modify: `src/common/src/contracts/hr_service/hr.proto`
- Modify: `src/services/system/hr-service/prisma/schema.prisma`
- Modify: `src/services/system/hr-service/src/domain/repositories/employee.repository.ts`
- Modify: `src/services/system/hr-service/src/infrastructure/repositories/prisma-employee.repository.ts`
- Modify: `src/services/system/hr-service/src/application/services/hr-management.service.ts`
- Modify: `src/services/system/hr-service/src/interfaces/grpc/hr-management.grpc.controller.ts`
- Modify: `src/services/system/hr-service/src/interfaces/grpc/hr-query.grpc.controller.ts`
- Test: `src/services/system/hr-service/test/l1/hr-management.service.spec.ts`
- Test: `src/services/system/hr-service/test/l1/hr-query.service.spec.ts`
- Test: `src/services/system/hr-service/test/l3/hr-management.grpc.controller.spec.ts`
- Test: `src/services/system/hr-service/test/l3/hr-query.grpc.controller.spec.ts`

- [ ] **Step 1: Write failing HR service tests**

Cover:

```ts
await service.updateEmployeeOfficialPhoto({
  tenantId: 'tenant-1',
  employeeId: 'employee-1',
  officialPhotoAssetId: 'asset-1',
  officialPhotoUrl: 'https://assets.example.com/photo.webp'
})

expect(employeeRepository.updateOfficialPhoto).toHaveBeenCalledWith({
  tenantId: 'tenant-1',
  employeeId: 'employee-1',
  officialPhotoAssetId: 'asset-1',
  officialPhotoUrl: 'https://assets.example.com/photo.webp'
})

await service.removeEmployeeOfficialPhoto({ tenantId: 'tenant-1', employeeId: 'employee-1' })
expect(employeeRepository.removeOfficialPhoto).toHaveBeenCalledWith({
  tenantId: 'tenant-1',
  employeeId: 'employee-1'
})
```

Also assert tenant mismatch returns not found and blank URLs are rejected for update.

- [ ] **Step 2: Add Prisma fields**

Add to `Employee`:

```prisma
officialPhotoAssetId String? @db.VarChar(100)
officialPhotoUrl     String? @db.VarChar(1000)
```

Keep both nullable. An empty HR official photo is a valid employee state.

- [ ] **Step 3: Extend HR proto**

Add fields to `EmployeeSummary`:

```proto
string official_photo_asset_id = 7;
string official_photo_url = 8;
```

Add management RPCs:

```proto
rpc UpdateEmployeeOfficialPhoto(UpdateEmployeeOfficialPhotoRequest) returns (UpdateEmployeeOfficialPhotoResponse);
rpc RemoveEmployeeOfficialPhoto(RemoveEmployeeOfficialPhotoRequest) returns (RemoveEmployeeOfficialPhotoResponse);

message UpdateEmployeeOfficialPhotoRequest {
  string tenant_id = 1;
  string employee_id = 2;
  string official_photo_asset_id = 3;
  string official_photo_url = 4;
}

message UpdateEmployeeOfficialPhotoResponse {
  EmployeeSummary employee = 1;
}

message RemoveEmployeeOfficialPhotoRequest {
  string tenant_id = 1;
  string employee_id = 2;
}

message RemoveEmployeeOfficialPhotoResponse {
  EmployeeSummary employee = 1;
}
```

- [ ] **Step 4: Implement repository mapping**

Extend `EmployeeSummary`:

```ts
officialPhotoAssetId?: string | null
officialPhotoUrl?: string | null
```

Add repository methods:

```ts
updateOfficialPhoto(input: {
  tenantId: string
  employeeId: string
  officialPhotoAssetId: string
  officialPhotoUrl: string
}): Promise<EmployeeSummary>

removeOfficialPhoto(input: {
  tenantId: string
  employeeId: string
}): Promise<EmployeeSummary>
```

`mapEmployee` must include both official photo fields.

- [ ] **Step 5: Implement management service and gRPC controller**

Rules:

- `tenantId`, `employeeId`, `officialPhotoAssetId`, and `officialPhotoUrl` are required for update.
- URL must be a non-blank string returned by Asset.
- remove sets both fields to `null`.
- no Identity/account avatar read is allowed in HR.

- [ ] **Step 6: Verify HR service**

Run:

```bash
pnpm --filter hr-service test:l2
pnpm --filter hr-service test:l1
pnpm --filter hr-service prisma:push
```

Expected: HR focused tests pass and local HR DB schema is updated.

---

### Task 3: Add API Gateway HR Photo Orchestration

**Files:**
- Modify: `src/services/api-gateway/src/modules/hr-service/hr-service.module.ts`
- Modify: `src/services/api-gateway/src/modules/hr-service/hr-management.service.ts`
- Modify: `src/services/api-gateway/src/modules/hr-service/adapters/hr-management-grpc.adapter.ts`
- Create or modify: `src/services/api-gateway/src/modules/hr-service/adapters/employee-official-photo-asset-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/hr-service/interface/http/controllers/hr-management.controller.ts`
- Create: `src/services/api-gateway/src/modules/hr-service/interface/http/dtos/employee-official-photo.dto.ts`
- Test: `src/services/api-gateway/src/modules/hr-service/hr-management.service.spec.ts`
- Test: `src/services/api-gateway/src/modules/hr-service/interface/http/controllers/hr-management.controller.spec.ts`

- [ ] **Step 1: Write failing gateway orchestration tests**

Cover upload success order:

```ts
expect(assetAdapter.uploadEmployeeOfficialPhoto).toHaveBeenCalledWith(
  expect.objectContaining({
    tenantId: 'tenant-1',
    employeeId: 'employee-1',
    operatorId: 'admin-account-1',
    contentType: 'image/png'
  }),
  source
)

expect(hrManagementAdapter.updateEmployeeOfficialPhoto).toHaveBeenCalledWith(
  {
    tenantId: 'tenant-1',
    employeeId: 'employee-1',
    officialPhotoAssetId: 'asset-1',
    officialPhotoUrl: 'https://assets.example.com/official.webp'
  },
  source
)

expect(assetAdapter.bindEmployeeOfficialPhoto).toHaveBeenCalledWith(
  expect.objectContaining({
    tenantId: 'tenant-1',
    employeeId: 'employee-1',
    newAssetId: 'asset-1'
  }),
  source
)
```

Also cover remove calls HR remove and does not call Identity.

- [ ] **Step 2: Add HTTP endpoints**

Use existing HR management route shape:

```text
POST   /hr-management/tenants/:tenantId/employees/:employeeId/official-photo
DELETE /hr-management/tenants/:tenantId/employees/:employeeId/official-photo
```

The upload endpoint accepts multipart file and returns the updated employee summary. The delete endpoint returns the updated employee summary with empty official photo fields.

- [ ] **Step 3: Implement orchestration**

Order for upload:

1. `assertEmployeeInTenant`.
2. `asset-service.UploadEmployeeOfficialPhoto`.
3. `hr-service.UpdateEmployeeOfficialPhoto`.
4. `asset-service.BindEmployeeOfficialPhoto`.
5. return updated employee summary.

If HR update fails, do not bind the asset. If Asset bind fails after HR update, return the HR-updated employee and log the bind failure for retry; do not roll back HR to account avatar or arbitrary URL.

- [ ] **Step 4: Verify API Gateway**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/hr-service/hr-management.service.spec.ts src/modules/hr-service/interface/http/controllers/hr-management.controller.spec.ts --runInBand
pnpm --filter api-gateway build
```

Expected: focused gateway tests and build pass.

---

### Task 4: Remove Account Avatar Fallback from Public Entry BusinessCard Upstream

**Files:**
- Modify: `src/services/system/public-entry-service/src/infrastructure/adapters/business-card-upstream.grpc.adapters.ts`
- Modify: `src/services/system/public-entry-service/src/application/ports/business-card.ports.ts`
- Test: `src/services/system/public-entry-service/test/l1/business-card-upstream.adapters.spec.ts`
- Test: `src/services/system/public-entry-service/test/l1/business-card.application.spec.ts`

- [ ] **Step 1: Write failing tests for no account avatar fallback**

Create an upstream adapter case where HR returns no official photo, Identity account returns `avatarUrl`, and expected BusinessCard employee summary is:

```ts
expect(result).toMatchObject({
  employeeId: 'employee-1',
  officialPhotoUrl: null
})
```

Also create a case where HR returns `officialPhotoUrl` and Identity account has a different `avatarUrl`; expected result uses HR:

```ts
expect(result?.officialPhotoUrl).toBe('https://assets.example.com/hr-official.webp')
```

- [ ] **Step 2: Map only HR official photo**

Replace:

```ts
officialPhotoUrl: normalizeOptional(accountProfile?.avatarUrl) ?? null
```

with:

```ts
officialPhotoUrl: normalizeOptional(employee.officialPhotoUrl) ?? null
```

Keep Identity account/profile reads for account enabled state and display name only.

- [ ] **Step 3: Verify Public Entry**

Run:

```bash
pnpm --filter public-entry-service test -- --runTestsByPath test/l1/business-card-upstream.adapters.spec.ts test/l1/business-card.application.spec.ts
pnpm --filter public-entry-service build
```

Expected: tests prove no account avatar fallback and build passes.

---

### Task 5: Implement Tenant-Web Admin Photo Setting and Placeholder Rendering

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/hr-management/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/hr-management/index.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/components/employee-business-card-display.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/employee-management-detail.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/employee-management-detail.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-business-card-section.vue`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-business-card-section.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/public/business-card-public.vue`
- Modify: `app/web/apps/tenant-web/src/views/public/business-card-public.spec.ts`

- [ ] **Step 1: Write failing tenant-web API tests**

Add tests for:

```ts
await uploadEmployeeOfficialPhotoApi('tenant-1', 'employee-1', file)
expect(request).toHaveBeenCalledWith(
  expect.objectContaining({
    url: '/hr-management/tenants/tenant-1/employees/employee-1/official-photo',
    method: 'POST'
  })
)

await removeEmployeeOfficialPhotoApi('tenant-1', 'employee-1')
expect(request).toHaveBeenCalledWith(
  expect.objectContaining({
    url: '/hr-management/tenants/tenant-1/employees/employee-1/official-photo',
    method: 'DELETE'
  })
)
```

- [ ] **Step 2: Redesign employee detail BusinessCard tab**

Layout requirements:

- left side: current electronic business card preview, compact and formal.
- right side: public display avatar setting, small and clear.
- copy: `该头像将用于员工数字名片和公开展示页面`.
- upload updates local preview immediately after API success.
- remove clears preview to formal placeholder.
- no account avatar is passed into this component.

Use stable dimensions:

```css
.employee-business-card-display__layout {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(220px, 280px);
  gap: 20px;
  align-items: start;
}
```

Keep mobile layout single-column under `768px`.

- [ ] **Step 3: Add formal placeholder component behavior**

The placeholder should render initials or a neutral official mark from employee name:

```ts
function buildOfficialPhotoPlaceholder(name?: string) {
  const normalized = name?.trim()
  return normalized ? normalized.slice(0, 1).toUpperCase() : '职'
}
```

Do not read account avatar from auth context in BusinessCard display components.

- [ ] **Step 4: Keep personal-center card refined and compact**

Requirements:

- business style, lighter colors, not full-width when one card is present.
- small QR code.
- larger official photo area than QR.
- actions in top-right dropdown.
- hover uses subtle elevation/translate, not strong dark panels.
- card displays `officialPhotoUrl` or formal placeholder only.

- [ ] **Step 5: Verify tenant-web focused tests and typecheck**

Run:

```bash
pnpm --dir app/web exec vitest run --dom apps/tenant-web/src/api/bff/hr-management/index.spec.ts apps/tenant-web/src/views/admin/employee-management-detail.spec.ts apps/tenant-web/src/views/_core/profile/components/personal-business-card-section.spec.ts apps/tenant-web/src/views/public/business-card-public.spec.ts
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected: focused tests pass and typecheck passes. The known Node engine warning is acceptable if tests pass.

---

### Task 6: Live Chain Verification and Regression Guards

**Files:**
- Modify: `src/services/system/public-entry-service/scripts/business-card-live-smoke.ts`
- Modify: `src/services/system/public-entry-service/test/live/business-card-live-smoke.live.spec.ts`
- Verify: browser route `http://localhost:5771/account/profile`
- Verify: browser route for one employee detail page under employee management

- [ ] **Step 1: Extend live smoke fixture expectations**

Live smoke should assert:

```ts
expect(publicRender.view?.person?.officialPhotoUrl).toBe(hrOfficialPhotoUrl)
expect(publicRender.view?.person?.officialPhotoUrl).not.toBe(accountAvatarUrl)
```

When HR official photo is removed:

```ts
expect(publicRender.view?.person?.officialPhotoUrl ?? '').toBe('')
```

- [ ] **Step 2: Run service and web verification**

Run:

```bash
pnpm --filter asset-service test
pnpm --filter hr-service test:l1
pnpm --filter public-entry-service test -- --runTestsByPath test/l1/business-card-upstream.adapters.spec.ts test/l1/business-card.application.spec.ts
pnpm --dir src/services/api-gateway exec jest src/modules/hr-service/hr-management.service.spec.ts src/modules/hr-service/interface/http/controllers/hr-management.controller.spec.ts --runInBand
pnpm --dir app/web exec vitest run --dom apps/tenant-web/src/api/bff/hr-management/index.spec.ts apps/tenant-web/src/views/admin/employee-management-detail.spec.ts apps/tenant-web/src/views/_core/profile/components/personal-business-card-section.spec.ts apps/tenant-web/src/views/public/business-card-public.spec.ts
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

- [ ] **Step 3: Browser QA**

Use the in-app browser to verify:

- employee detail BusinessCard tab shows left preview and right official photo setting.
- upload updates the preview after success.
- remove shows formal placeholder.
- personal center “我的名片” remains compact and polished.
- public BusinessCard page shows official photo or placeholder.
- account avatar remains visible only in account/profile UI, not as BusinessCard fallback.

---

## Self-Review Checklist

- Every avatar source is explicit: account avatar for account UI, HR official photo for BusinessCard UI.
- No task asks BusinessCard to persist display truth.
- No task asks HR to store file bytes.
- No task asks Asset to own employee profile truth.
- Tests include the negative case: HR photo empty + account avatar present still renders placeholder.
