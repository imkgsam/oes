# OTP Persistence Hardening

Updated: 2026-03-23 23:00:29 +09:00

## Scope

- Harden the OTP repository boundary before continuing `AUTH-02` email OTP login
- Align Prisma OTP persistence behavior with the current domain model and schema constraints

## Changes

- Added `findByIdentifierAndUsage()` to `IOtpRepository`
- Exposed `getUsage()` and `getType()` on `OneTimeToken`
- Fixed Prisma OTP persistence to write `hashedValue` instead of a non-existent `code` field
- Persisted `lastSentAt` on OTP save to match the Prisma schema
- Changed OTP save behavior to replace prior records on the same `identifier + usage` unique key before creating a new token
- Updated `markUsed()` persistence to invalidate the OTP after successful consumption
- Replaced `OneTimeToken.fromPrisma()` usage with an infrastructure-level `OtpMapper` to align with the `permission-service` mapper pattern

## Validation

- `pnpm --filter auth-service build`

## Conclusion

- The OTP repository now matches the current Prisma schema more closely
- Re-sending OTP for the same identifier and usage no longer relies on unstable random-id upsert behavior
- OTP persistence mapping is now handled in infrastructure instead of leaking Prisma-shaped data conversion into the domain aggregate
- `AUTH-02` can continue on a cleaner OTP persistence foundation without changing external contracts yet
