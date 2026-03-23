# Auth Identifier Normalization

Updated: 2026-03-24 00:28:22 +09:00

## Scope

- Start consolidating email and phone identifier normalization across the active human-auth paths
- Reduce divergence between password login, OTP login, OTP challenge issuance, and repository persistence

## Changes

- Added `AuthIdentifierNormalizer`
- Normalized email lookups to trimmed lowercase values
- Normalized phone lookups to digit-only format while preserving a leading `+` when present
- Updated login-method repository reads to support compatibility lookup against both raw and normalized identifiers
- Updated login-method repository writes to persist normalized identifiers
- Updated email/phone password login and email/phone OTP login flows to normalize identifiers before repository and OTP-throttle access

## Validation

- `pnpm --filter auth-service build`

## Conclusion

- The four P0 human-auth paths now follow a more consistent identifier-handling rule set
- Repository lookup keeps a compatibility window for pre-normalized stored identifiers instead of assuming all existing records are already clean
- A future data-cleanup/backfill slice is still needed if the team wants to fully remove compatibility lookup logic
