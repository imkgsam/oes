# MfaBinding Mapper Alignment

Updated: 2026-03-23 23:09:24 +09:00

## Scope

- Align `MfaBinding` persistence mapping with the same repository/mapper pattern already used in `permission-service`
- Remove Prisma-shaped conversion responsibilities from the MFA binding aggregate

## Changes

- Added `MfaBindingMapper` under `src/infrastructure/mappers`
- Removed `MfaBindingEntity.fromPrisma()` from the domain aggregate
- Updated `PrismaMfaBindingRepository` to use mapper-based `toDomain` and `toPersistence`

## Validation

- `pnpm --filter auth-service build`
- Verified there are no remaining `MfaBindingEntity.fromPrisma`, `LoginMethod.fromPrisma`, `Credential.fromPrisma`, or `OneTimeToken.fromPrisma` references in `auth-service`

## Conclusion

- The active auth persistence layer now follows a more consistent infrastructure-mapper pattern
- Domain aggregates/entities in the active auth path are less coupled to Prisma-generated record shapes
- `MfaBinding` still remains behind a temporary Prisma service compatibility seam because the schema model itself is not yet formally restored
