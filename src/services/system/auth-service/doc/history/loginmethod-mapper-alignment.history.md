# LoginMethod Mapper Alignment

Updated: 2026-03-23 23:04:36 +09:00

## Scope

- Align `LoginMethod` and `Credential` persistence mapping with the `permission-service` repository/mapper pattern
- Remove Prisma-shaped conversion responsibilities from auth domain objects used by the active login path

## Changes

- Added `LoginMethodMapper` under `src/infrastructure/mappers`
- Removed `LoginMethod.fromPrisma()` from the domain aggregate
- Removed `Credential.fromPrisma()` from the domain entity
- Updated `PrismaUserRepository` to use `LoginMethodMapper` for `toDomain` and `toPersistence`
- Updated repository interface examples so the domain no longer documents Prisma-based construction as the normal flow

## Validation

- `pnpm --filter auth-service build`
- Verified there are no remaining `LoginMethod.fromPrisma` or `Credential.fromPrisma` references in `auth-service`

## Conclusion

- The active login path now follows the same mapper-based repository pattern as `permission-service`
- `LoginMethod` and `Credential` are less coupled to Prisma-generated types
- Similar cleanup still remains in other auth aggregates such as MFA-related persistence
