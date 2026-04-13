# SESS-02 Device Context Boundary History

## 2026-03-27

### Scope

- clarify how device context should enter `auth-service` session creation without changing shared platform semantics

### Findings

- current shared authenticated gRPC context only carries:
  - internal service metadata
  - operator context
  - request / trace metadata
- `api-gateway` downstream metadata factory does not currently define device-context metadata
- extending `src/common/src/authorization/**` for device context would no longer be a single-service change

### Decision

- freeze current phase on explicit `SelectAccountRequest` fields:
  - `deviceId`
  - `deviceName`
  - `userAgent`
  - `ipAddress`
- keep `auth-service` implementation work inside this boundary
- defer any shared metadata propagation design to a cross-module / architecture thread

### Impact

- `auth-service` can continue improving session creation and session views safely
- upstream automatic device-context injection is explicitly deferred
