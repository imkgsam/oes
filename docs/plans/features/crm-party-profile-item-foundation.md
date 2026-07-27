# CRM Party Profile Item Foundation

## 1. Feature Status

Current status: `implemented, verified`

Stable truth sources:

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)

## 2. Goal

Establish one clear profile item model across CRM and Party:

- CRM owns `CrmAccountProfileItem` for account-level sales profile data.
- Party owns `TenantPartyProfileItem` for formal tenant subject profile data.
- `TenantPartyIdentifier` remains reserved for strong official identifiers.
- `CrmContact` remains account-scoped person role data, not account profile data.

## 3. Scope

This feature updates:

- Party service truth source, registration/query contracts, schema, service inputs and repository behavior.
- CRM service truth source, account model, repository behavior and Lead to Prospect Customer conversion.
- CRM gRPC contract and generated TypeScript contract surface for account profile item inputs and responses.
- API Gateway CRM BFF and browser extension CRM workspace profile item mapping.
- Tenant-web customer management entry, list and detail UI for visible multi-value profile item input and display.
- Focused service-level, gateway and tenant-web tests proving profile item creation, query, duplicate-check, registration, conversion and UI mapping.

## 4. Non-goals

This feature does not implement:

- Tenant-owned domain DNS verification.
- Full CRM contact management UI.
- Party merge/unmerge or cross-tenant subject governance.
- Historical data cleanup beyond forward migration files.

## 5. Boundary Rules

- `TenantPartyIdentifier` excludes domain, website, email, phone, WhatsApp and social profile.
- `TenantPartyProfileItem` is the long-term Party model for tenant subject profile items.
- `CrmAccountProfileItem` stores account-level CRM profile items.
- `CrmContact` stores known person-role data under one CRM account.
- Personal CRM accounts do not need duplicate same-person contacts.
- If a personal Prospect Customer later becomes a company contact, create or select an organization `CrmAccount`, create a `CrmContact` under it, bind `personTenantPartyId` to the existing person `TenantParty`, and archive or retain the original personal account according to CRM policy.

## 6. Conversion Rules

When converting Lead to Prospect Customer:

- `CrmAccountProfileItem` with strong identifier type promotes to `TenantPartyIdentifier`.
- `CrmAccountProfileItem` with email, phone, WhatsApp, domain, website, social profile or marketplace store promotes to `TenantPartyProfileItem`.
- `CrmContact` fields are not promoted as account profile items.
- Lead single-value fields are compact list/display fields only; conversion evidence comes from explicit `CrmAccountProfileItem` records.

## 7. Verification

Verified on 2026-06-28:

- Party service L1/L2/L3 Jest suites passed:
  - `./node_modules/.bin/jest --config jest.config.js --runInBand test/l1`
  - `./node_modules/.bin/jest --config jest.config.js --runInBand test/l2`
  - `./node_modules/.bin/jest --config jest.config.js --runInBand test/l3`
- CRM service L1/L2/L3 Jest suites passed:
  - `./node_modules/.bin/jest --config jest.config.js --runInBand test/l1`
  - `./node_modules/.bin/jest --config jest.config.js --runInBand test/l2`
  - `./node_modules/.bin/jest --config jest.config.js --runInBand test/l3`
- Common contract generation and lint passed:
  - `PATH="$PWD/node_modules/.bin:$PATH" buf generate --template src/common/src/contracts/buf.gen.yaml src/common/src/contracts`
  - `buf lint src/common/src/contracts`
- Common, Party, CRM and API Gateway TypeScript builds passed:
  - `../../node_modules/.bin/tsc -b` from `src/common`
  - `./node_modules/.bin/tsc -b` from `src/services/system/party-service`
  - `./node_modules/.bin/tsc -b` from `src/services/business/crm-service`
  - `./node_modules/.bin/tsc -b` from `src/services/api-gateway`
- API Gateway CRM module Jest tests passed:
  - `./node_modules/.bin/jest --runInBand src/modules/crm-service`
- Tenant-web CRM BFF/list/detail specs and typecheck passed:
  - `./node_modules/.bin/vitest run apps/tenant-web/src/api/bff/customer-management/index.spec.ts apps/tenant-web/src/views/admin/customer-management.spec.ts apps/tenant-web/src/views/admin/customer-management-detail.spec.ts --dom`
  - `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck -p apps/tenant-web/tsconfig.json`

Note: the documented `pnpm --dir ...` service commands were not used for final evidence in this local run because pnpm attempted an install/status check and stopped on ignored build-script approval prompts. The commands above execute the same Jest, TypeScript, Vitest and proto toolchains directly from the already-installed workspace binaries.
