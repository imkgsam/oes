# Superseded: Org People UX Data Hardening

This historical execution plan was superseded by the tenant-scoped `TenantParty` model frozen in:

- `docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md`
- `docs/architecture/services/party-service.md`
- `docs/architecture/services/hr-service.md`
- `docs/architecture/services/tenant-org-service.md`
- `docs/plans/designs/org-people-ux-data-hardening.md`

Do not use the former system-wide Party plan as an implementation source. Current runtime and local seed data must use:

- `TenantParty`
- `tenantPartyId`
- `organizationTenantPartyId`
- `displayName`
