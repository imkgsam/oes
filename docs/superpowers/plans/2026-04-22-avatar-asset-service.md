# Avatar Asset Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a minimal production-grade `asset-service` avatar slice, move personal-center avatar editing from arbitrary URL input to controlled file upload, and bind current-account profile writes to `avatarAssetId` instead of raw external URLs.

**Architecture:** `asset-service` becomes the controlled owner of avatar asset metadata and object-storage orchestration, `identity-service` owns `UserAccount.avatarAssetId` plus current-account display-profile fields, and `auth-bff` exposes the external upload/profile orchestration without leaking storage or internal field names to the frontend read model.

**Tech Stack:** NestJS, Prisma, gRPC, Postgres, S3-compatible object storage, MinIO for local development, Vue 3, Ant Design Vue, Vitest

---

### Task 1: Freeze the service and contract baseline before coding

**Files:**
- Create: `docs/architecture/services/asset-service.md`
- Create: `docs/contracts/asset-service/README.md`
- Create: `docs/contracts/asset-service/avatar.md`
- Modify: `docs/contracts/index.md`
- Modify: `docs/contracts/api-gateway/auth-bff-login.md`
- Modify: `docs/plans/features/personal-center.md`

- [ ] **Step 1: Review the frozen boundary docs and confirm they describe the final avatar flow**

Check that the docs clearly freeze:

- `asset-service` owns asset metadata and storage orchestration
- `identity-service` owns `avatarAssetId`
- `auth-bff` exposes avatar upload plus account-profile save orchestration
- `tenant-web` no longer accepts arbitrary avatar URL input

- [ ] **Step 2: Update the BFF and personal-center contracts**

Freeze:

- `POST /auth/personal-center/avatar`
- `PATCH /auth/personal-center/account-profile` now accepts `avatarAssetId`
- personal-center read model still returns `accountContext.avatar` as display URL

### Task 2: Scaffold the minimal `asset-service` with mature-service structure

**Files:**
- Create: `src/services/system/asset-service/**`
- Create: `src/services/system/asset-service/prisma/schema.prisma`
- Create: `src/services/system/asset-service/package.json`
- Create: `src/services/system/asset-service/tsconfig*.json`
- Create: `src/services/system/asset-service/nest-cli.json`

- [ ] **Step 1: Add the service skeleton aligned to mature system services**

Required structure:

- `application/`
- `domain/`
- `infrastructure/`
- `interfaces/`
- `modules/`

- [ ] **Step 2: Add the minimal avatar asset model and repository abstractions**

Freeze the minimum domain:

- `Asset`
- `AssetRepository`
- `ObjectStoragePort`
- `UploadAccountAvatarHandler`
- `BindAccountAvatarHandler`
- `ResolveAssetPublicUrlHandler`

### Task 3: Add S3-compatible storage and local MinIO support

**Files:**
- Modify: `docker-compose.infra.yml`
- Create or modify: local env examples under the service
- Create: storage adapter files under `src/services/system/asset-service/src/infrastructure/adaptors/**`

- [ ] **Step 1: Add a MinIO-backed local development dependency**

Expected local runtime:

- MinIO container
- bucket bootstrap
- service env for endpoint, region, access key, secret, bucket, public base URL

- [ ] **Step 2: Implement the S3-compatible storage adapter**

Support at minimum:

- `putObject`
- `deleteObject`
- `buildPublicUrl`

### Task 4: Connect `identity-service` to `avatarAssetId`

**Files:**
- Modify: `src/services/system/identity-service/prisma/schema.prisma`
- Modify: `src/services/system/identity-service/src/application/commands/account/**`
- Modify: `src/services/system/identity-service/src/domain/**`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/**`
- Modify: `src/services/system/identity-service/test/**`

- [ ] **Step 1: Write the failing tests for the new account-profile write model**

Expected change:

- `UpdateAccountProfile` accepts `avatarAssetId`
- arbitrary avatar URL writes are removed from the self-service write path

- [ ] **Step 2: Implement `avatarAssetId` persistence and query mapping**

Requirements:

- current-account profile still returns a resolved `avatar` display URL through the BFF read model
- `identity-service` owns only the reference, not object-storage details

### Task 5: Add `asset-service` orchestration to `auth-bff`

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/**`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/**`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/**`
- Modify: `src/services/api-gateway/test/**`

- [ ] **Step 1: Add the failing tests for avatar upload and profile save orchestration**

Cover:

- upload endpoint validates authenticated current-account context
- profile save forwards `avatarAssetId`
- avatar replacement finalization only happens after identity update succeeds

- [ ] **Step 2: Implement `POST /auth/personal-center/avatar`**

Expected response:

```json
{
  "avatarAsset": {
    "assetId": "ast_01J...",
    "publicUrl": "https://assets.example.com/avatar/tenant-1/account-1/abc.webp",
    "mimeType": "image/webp",
    "size": 183421,
    "status": "PENDING_BIND"
  }
}
```

- [ ] **Step 3: Update `PATCH /auth/personal-center/account-profile`**

Expected request shape:

```json
{
  "avatarAssetId": "ast_01J...",
  "displayName": "陈双鹏",
  "bio": "负责美隆陶瓷的外贸协同与重点客户经营。"
}
```

### Task 6: Replace the personal-center avatar URL input with production upload UX

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`
- Modify: `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/**.spec.ts`

- [ ] **Step 1: Write the failing tests for avatar upload UX**

Cover:

- URL input removed
- file upload entry added
- successful upload fills `avatarAssetId` and preview
- save payload sends `avatarAssetId`

- [ ] **Step 2: Implement the new upload interaction**

Requirements:

- align UI with the existing profile page framework language
- show current avatar and upload CTA
- show upload failure / validation feedback
- do not enable “保存” while upload is in-flight

### Task 7: Run end-to-end verification for the slice

**Files:**
- Verify only

- [ ] **Step 1: Run focused service and web tests**

Run the new targeted suites for:

- `asset-service`
- `identity-service`
- `api-gateway`
- `tenant-web`

- [ ] **Step 2: Run typecheck and local integration verification**

Expected:

- service typechecks pass
- tenant-web typecheck passes
- local MinIO-backed upload flow works end-to-end
