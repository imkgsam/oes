# SESS-05 Rename Session Device

Updated: 2026-03-25 12:00 +08:00

## Scope

- Extend `SESS-05` with minimal device rename support
- Keep the current session model unchanged
- Do not add admin-side device management in this slice

## Result

- Added `RenameSessionDevice` gRPC contract
- Added `RenameSessionDeviceCommand / Handler`
- Added ownership validation before rename
- Added audit event `SESSION_DEVICE_RENAMED`

## Validation

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
