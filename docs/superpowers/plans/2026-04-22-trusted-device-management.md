# Trusted Device Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build tenant-scoped trusted-device management for personal account security, including explicit trust opt-in during `NEW_DEVICE_LOGIN` MFA and a new `账号安全 > 受信设备` tab.

**Architecture:** Extend the existing `auth-service` trusted-device model from a login-only recognition helper into a full self-service lifecycle boundary with expiry and revocation. Expose the new capability through thin `auth-bff` self-security contracts and render it in `tenant-web` using security-center-aligned card UI plus a lightweight trust checkbox inside the login MFA scene.

**Tech Stack:** NestJS, Prisma, gRPC/proto contracts, Ant Design Vue, Pinia, Vitest/Jest, Vue 3

---

## File Structure

### Existing files to modify

- `src/services/system/auth-service/prisma/schema.prisma`
  - Extend `TrustedDevice` persistence truth with expiry / revocation / browser / platform fields needed by the management page.
- `src/services/system/auth-service/src/domain/repositories/trusted-device.repository.ts`
  - Expand the repository boundary from simple lookup/save into list/revoke/self-service lifecycle operations.
- `src/services/system/auth-service/src/application/services/trusted-device.service.ts`
  - Centralize normalization, recognition, remember/refresh, and revoke/list behavior.
- `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.ts`
  - Implement the expanded repository contract against Prisma.
- `src/services/system/auth-service/src/application/services/account-session-establishment.service.ts`
  - Write trusted-device records only when the login flow explicitly opted in.
- `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts`
  - Pass through the `trustCurrentDevice` decision from the login MFA completion flow.
- `src/common/src/contracts/auth_service/auth.proto`
  - Add self-service trusted-device RPCs plus the login MFA completion flag.
- `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
  - Map new trusted-device RPCs and extended MFA completion payloads.
- `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
  - Add downstream adapter methods for trusted-device list / revoke operations and the new MFA completion field.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
  - Add self-service trusted-device use cases beside the existing session self-service operations.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
  - Add revoke payload DTOs and extend MFA completion DTOs as needed.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`
  - Add trusted-device list/mutation view models.
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
  - Expose self-service trusted-device endpoints.
- `app/web/apps/tenant-web/src/api/core/auth.ts`
  - Extend login MFA completion params with `trustCurrentDevice`.
- `app/web/apps/tenant-web/src/api/bff/security/index.ts`
  - Add trusted-device list/revoke API helpers.
- `app/web/apps/tenant-web/src/store/auth.ts`
  - Track the pending “trust current device” choice for login MFA.
- `app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue`
  - Render the trust checkbox only for the `NEW_DEVICE_LOGIN` scenario.
- `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
  - Add the `受信设备` tab, load data, and wire revoke actions.
- `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.ts`
  - Add formatting helpers for trusted-device card rendering.

### New files to create

- `src/services/system/auth-service/src/application/queries/self-security/list-trusted-devices.query.ts`
- `src/services/system/auth-service/src/application/queries/self-security/list-trusted-devices.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/revoke-trusted-device.command.ts`
- `src/services/system/auth-service/src/application/commands/auth/revoke-trusted-device.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/revoke-other-trusted-devices.command.ts`
- `src/services/system/auth-service/src/application/commands/auth/revoke-other-trusted-devices.handler.ts`
- `src/services/system/auth-service/src/application/services/trusted-device.service.spec.ts`
  - Expand the current test file with expiry, revoke, and list coverage.
- `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.spec.ts`
  - Add Prisma-level lifecycle tests.
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts`
  - Extend with trusted-device use case coverage.
- `app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.vue`
  - Focused card component aligned with security-center styling.
- `app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.spec.ts`

## Task 1: Expand Auth-Service Trusted-Device Truth

**Files:**
- Modify: `src/services/system/auth-service/prisma/schema.prisma`
- Modify: `src/services/system/auth-service/src/domain/repositories/trusted-device.repository.ts`
- Modify: `src/services/system/auth-service/src/application/services/trusted-device.service.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.ts`
- Test: `src/services/system/auth-service/src/application/services/trusted-device.service.spec.ts`
- Test: `src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.spec.ts`

- [ ] **Step 1: Write the failing service-level tests for expiry, list, and revoke**

```ts
it('returns false when a trusted device is expired or revoked', async () => {
  const repository = {
    findByUserTenantDevice: jest.fn().mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      expiresAt: new Date('2026-04-01T00:00:00Z'),
      revokedAt: null,
    }),
  };

  const service = new TrustedDeviceService(repository as any);

  await expect(
    service.isTrustedTenantDevice({
      userId: 'user-1',
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      now: new Date('2026-05-01T00:00:00Z'),
    }),
  ).resolves.toBe(false);
});

it('lists only active trusted devices for the current user and tenant', async () => {
  const repository = {
    listActiveByUserTenant: jest.fn().mockResolvedValue([
      {
        id: 'trusted-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        deviceId: 'device-1',
        deviceName: 'MacBook Pro',
        browser: 'Firefox',
        platform: 'macOS',
        trustedAt: new Date('2026-04-01T00:00:00Z'),
        lastSeenAt: new Date('2026-04-22T00:00:00Z'),
        expiresAt: new Date('2026-05-01T00:00:00Z'),
        revokedAt: null,
      },
    ]),
  };

  const service = new TrustedDeviceService(repository as any);

  await expect(
    service.listTrustedDevices({ userId: 'user-1', tenantId: 'tenant-1' }),
  ).resolves.toHaveLength(1);
});
```

- [ ] **Step 2: Run auth-service trusted-device tests to verify they fail**

Run:

```bash
pnpm --filter auth-service exec jest src/application/services/trusted-device.service.spec.ts src/infrastructure/repositories/prisma/prisma.trusted-device.repository.spec.ts --runInBand
```

Expected:

```text
FAIL ... TrustedDeviceService
Property 'listActiveByUserTenant' does not exist on type 'TrustedDeviceRepository'
```

- [ ] **Step 3: Extend the Prisma schema and repository contract**

```prisma
model TrustedDevice {
  id            String    @id @default(uuid())
  userId        String
  tenantId      String
  deviceId      String
  deviceName    String?
  browser       String?
  platform      String?
  userAgent     String?
  lastIpAddress String?
  trustedAt     DateTime  @default(now())
  lastSeenAt    DateTime  @default(now())
  expiresAt     DateTime
  revokedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, tenantId, deviceId])
  @@index([tenantId, userId, revokedAt])
}
```

```ts
export interface TrustedDeviceRecord {
  id?: string;
  userId: string;
  tenantId: string;
  deviceId: string;
  deviceName?: string;
  browser?: string;
  platform?: string;
  userAgent?: string;
  lastIpAddress?: string;
  trustedAt?: Date;
  lastSeenAt?: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
}

export interface TrustedDeviceRepository {
  findByUserTenantDevice(input: {
    deviceId: string;
    tenantId: string;
    userId: string;
  }): Promise<null | TrustedDeviceRecord>;

  listActiveByUserTenant(input: {
    userId: string;
    tenantId: string;
  }): Promise<TrustedDeviceRecord[]>;

  revokeById(input: {
    id: string;
    userId: string;
    tenantId: string;
  }): Promise<boolean>;

  revokeOtherDevices(input: {
    currentDeviceId?: string;
    tenantId: string;
    userId: string;
  }): Promise<number>;

  saveTrustedDevice(device: TrustedDeviceRecord): Promise<void>;
}
```

- [ ] **Step 4: Implement the trusted-device service and Prisma repository changes**

```ts
const TRUST_DURATION_DAYS = 30;

async rememberTrustedTenantDevice(input: TrustedTenantDeviceInput): Promise<void> {
  const tenantId = normalizeOptional(input.tenantId);
  const deviceId = normalizeDeviceId(input.deviceId);

  if (!tenantId || !deviceId) {
    return;
  }

  await this.trustedDeviceRepository.saveTrustedDevice({
    userId: input.userId,
    tenantId,
    deviceId,
    deviceName: normalizeOptional(input.deviceName),
    browser: normalizeOptional(input.browser),
    platform: normalizeOptional(input.platform),
    userAgent: normalizeOptional(input.userAgent),
    lastIpAddress: normalizeOptional(input.ipAddress),
    expiresAt: addDays(input.now ?? new Date(), TRUST_DURATION_DAYS),
    revokedAt: null,
  });
}

async listTrustedDevices(input: { userId: string; tenantId: string }) {
  return this.trustedDeviceRepository.listActiveByUserTenant(input);
}

async revokeTrustedDevice(input: { id: string; userId: string; tenantId: string }) {
  return this.trustedDeviceRepository.revokeById(input);
}
```

```ts
async listActiveByUserTenant(input: { userId: string; tenantId: string }) {
  const records = await this.prisma.trustedDevice.findMany({
    where: {
      userId: input.userId,
      tenantId: input.tenantId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: [{ lastSeenAt: 'desc' }, { trustedAt: 'desc' }],
  });

  return records.map(toTrustedDeviceRecord);
}

async revokeOtherDevices(input: {
  currentDeviceId?: string;
  tenantId: string;
  userId: string;
}) {
  const result = await this.prisma.trustedDevice.updateMany({
    where: {
      userId: input.userId,
      tenantId: input.tenantId,
      revokedAt: null,
      ...(input.currentDeviceId
        ? { deviceId: { not: input.currentDeviceId } }
        : {}),
    },
    data: { revokedAt: new Date() },
  });

  return result.count;
}
```

- [ ] **Step 5: Run generate/push and the focused auth-service tests**

Run:

```bash
pnpm --filter auth-service prisma:generate
pnpm --filter auth-service prisma:push
pnpm --filter auth-service exec jest src/application/services/trusted-device.service.spec.ts src/infrastructure/repositories/prisma/prisma.trusted-device.repository.spec.ts --runInBand
```

Expected:

```text
PASS ... trusted-device.service.spec.ts
PASS ... prisma.trusted-device.repository.spec.ts
```

- [ ] **Step 6: Commit the trusted-device truth changes**

```bash
git add src/services/system/auth-service/prisma/schema.prisma \
  src/services/system/auth-service/src/domain/repositories/trusted-device.repository.ts \
  src/services/system/auth-service/src/application/services/trusted-device.service.ts \
  src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.ts \
  src/services/system/auth-service/src/application/services/trusted-device.service.spec.ts \
  src/services/system/auth-service/src/infrastructure/repositories/prisma/prisma.trusted-device.repository.spec.ts
git commit -m "feat: expand trusted device lifecycle"
```

## Task 2: Add Auth-Service Trusted-Device Commands, Queries, and gRPC Contract

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Modify: `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- Create: `src/services/system/auth-service/src/application/queries/self-security/list-trusted-devices.query.ts`
- Create: `src/services/system/auth-service/src/application/queries/self-security/list-trusted-devices.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/revoke-trusted-device.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/revoke-trusted-device.handler.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/revoke-other-trusted-devices.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/revoke-other-trusted-devices.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts`
- Modify: `src/services/system/auth-service/src/application/services/account-session-establishment.service.ts`
- Test: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.spec.ts`

- [ ] **Step 1: Write the failing controller and handler tests**

```ts
it('lists trusted devices for the authenticated user and tenant', async () => {
  queryBus.execute = jest.fn().mockResolvedValue({
    devices: [{ id: 'trusted-1', deviceName: 'MacBook Pro' }],
  });

  await expect(
    controller.listTrustedDevices({ userId: 'user-1', tenantId: 'tenant-1' } as any),
  ).resolves.toEqual({
    devices: [{ id: 'trusted-1', deviceName: 'MacBook Pro' }],
  });
});

it('remembers the current device only when trustCurrentDevice is true', async () => {
  const trustedDeviceService = { rememberTrustedTenantDevice: jest.fn() };
  const service = new AccountSessionEstablishmentService(..., trustedDeviceService as any);

  await service.establishAuthenticatedAccountSession({
    userId: 'user-1',
    tenantId: 'tenant-1',
    deviceId: 'device-1',
    trustCurrentDevice: false,
  } as any);

  expect(trustedDeviceService.rememberTrustedTenantDevice).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused auth-service test suite to verify failure**

Run:

```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts src/application/commands/auth/submit-mfa-challenge.handler.spec.ts src/application/services/account-session-establishment.service.spec.ts --runInBand
```

Expected:

```text
FAIL ... auth.grpc.controller.spec.ts
Property 'listTrustedDevices' does not exist
```

- [ ] **Step 3: Extend the proto and request payloads**

```proto
message CompleteMfaChallengeRequest {
  string challenge_id = 1;
  MfaFactor factor = 2;
  string code = 3;
  optional string factor_challenge_id = 4;
  string login_method = 5;
  optional bool trust_current_device = 6;
}

message TrustedDevice {
  string id = 1;
  string device_id = 2;
  optional string device_name = 3;
  optional string browser = 4;
  optional string platform = 5;
  string trusted_at = 6;
  string last_active_at = 7;
  string expires_at = 8;
  bool is_current_device = 9;
}

message ListTrustedDevicesRequest {
  string user_id = 1;
  string tenant_id = 2;
  optional string current_device_id = 3;
}

message ListTrustedDevicesResponse {
  repeated TrustedDevice devices = 1;
}
```

- [ ] **Step 4: Implement auth-service commands, queries, and remember-only-when-opted-in logic**

```ts
export class ListTrustedDevicesHandler
  implements IQueryHandler<ListTrustedDevicesQuery, ListTrustedDevicesResult>
{
  constructor(private readonly trustedDeviceService: TrustedDeviceService) {}

  async execute(query: ListTrustedDevicesQuery): Promise<ListTrustedDevicesResult> {
    const devices = await this.trustedDeviceService.listTrustedDevices({
      userId: query.userId,
      tenantId: query.tenantId,
    });

    return { devices };
  }
}
```

```ts
if (input.trustCurrentDevice) {
  await this.trustedDeviceService.rememberTrustedTenantDevice({
    userId: input.userId,
    tenantId: input.tenantId,
    deviceId: input.deviceId,
    deviceName: input.deviceName,
    browser: input.browser,
    platform: input.platform,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });
}
```

- [ ] **Step 5: Run the focused auth-service contract tests**

Run:

```bash
pnpm --filter auth-service exec jest src/interfaces/grpc/auth.grpc.controller.spec.ts src/application/commands/auth/submit-mfa-challenge.handler.spec.ts src/application/services/account-session-establishment.service.spec.ts --runInBand
```

Expected:

```text
PASS ... auth.grpc.controller.spec.ts
PASS ... submit-mfa-challenge.handler.spec.ts
PASS ... account-session-establishment.service.spec.ts
```

- [ ] **Step 6: Commit the auth-service contract slice**

```bash
git add src/common/src/contracts/auth_service/auth.proto \
  src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts \
  src/services/system/auth-service/src/modules/auth/auth.module.ts \
  src/services/system/auth-service/src/application/queries/self-security \
  src/services/system/auth-service/src/application/commands/auth/revoke-trusted-device.command.ts \
  src/services/system/auth-service/src/application/commands/auth/revoke-trusted-device.handler.ts \
  src/services/system/auth-service/src/application/commands/auth/revoke-other-trusted-devices.command.ts \
  src/services/system/auth-service/src/application/commands/auth/revoke-other-trusted-devices.handler.ts \
  src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.ts \
  src/services/system/auth-service/src/application/services/account-session-establishment.service.ts \
  src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts \
  src/services/system/auth-service/src/application/commands/auth/submit-mfa-challenge.handler.spec.ts
git commit -m "feat: expose trusted device self-service contract"
```

## Task 3: Expose Trusted-Device Self-Security APIs Through Auth-BFF

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`

- [ ] **Step 1: Write the failing BFF tests**

```ts
it('maps trusted-device list responses into self-security view models', async () => {
  authAdapter.listTrustedDevices = jest.fn().mockResolvedValue({
    devices: [{ id: 'trusted-1', deviceName: 'MacBook Pro', isCurrentDevice: true }],
  });

  await expect(useCase.listTrustedDevices(source)).resolves.toEqual({
    devices: [{ id: 'trusted-1', deviceName: 'MacBook Pro', isCurrentDevice: true }],
  });
});

it('posts revoke-other-devices through the self-security controller', async () => {
  useCase.revokeOtherTrustedDevices = jest.fn().mockResolvedValue({ success: true, deviceCount: 2 });

  await expect(controller.revokeOtherTrustedDevices(req as any)).resolves.toEqual({
    success: true,
    deviceCount: 2,
  });
});
```

- [ ] **Step 2: Run the focused BFF tests to verify failure**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected:

```text
FAIL ... session-self-service.use-case.spec.ts
Property 'listTrustedDevices' does not exist on type 'SessionSelfServiceUseCase'
```

- [ ] **Step 3: Add DTOs, view models, and adapter methods**

```ts
export class TrustedDeviceViewModel {
  @ApiProperty() id!: string;
  @ApiProperty() deviceId!: string;
  @ApiPropertyOptional() deviceName?: string;
  @ApiPropertyOptional() browser?: string;
  @ApiPropertyOptional() platform?: string;
  @ApiProperty() trustedAt!: string;
  @ApiProperty() lastActiveAt!: string;
  @ApiProperty() expiresAt!: string;
  @ApiProperty() isCurrentDevice!: boolean;
}

export class TrustedDeviceListViewModel {
  @ApiProperty({ type: TrustedDeviceViewModel, isArray: true })
  devices!: TrustedDeviceViewModel[];
}

export class TrustedDeviceMutationViewModel {
  @ApiProperty() success!: boolean;
  @ApiPropertyOptional() deviceCount?: number;
}
```

```ts
async listTrustedDevices(source: DownstreamRequestSource): Promise<TrustedDeviceListViewModel> {
  const self = getAuthenticatedSelfContext(source);
  const result = await this.authAdapter.listTrustedDevices(
    self.userId,
    self.tenantId,
    source.device?.deviceId,
    source,
  );

  return {
    devices: (result.devices ?? []).map((device) => ({
      id: device.id ?? '',
      deviceId: device.deviceId ?? '',
      deviceName: device.deviceName ?? undefined,
      browser: device.browser ?? undefined,
      platform: device.platform ?? undefined,
      trustedAt: device.trustedAt ?? '',
      lastActiveAt: device.lastActiveAt ?? '',
      expiresAt: device.expiresAt ?? '',
      isCurrentDevice: Boolean(device.isCurrentDevice),
    })),
  };
}
```

- [ ] **Step 4: Add controller routes**

```ts
@Get('/security/trusted-devices')
async listTrustedDevices(@Req() req: FastifyRequest) {
  return this.sessionSelfServiceUseCase.listTrustedDevices(buildDownstreamRequestSource(req));
}

@Delete('/security/trusted-devices/:trustedDeviceId')
async revokeTrustedDevice(@Param('trustedDeviceId') trustedDeviceId: string, @Req() req: FastifyRequest) {
  return this.sessionSelfServiceUseCase.revokeTrustedDevice(trustedDeviceId, buildDownstreamRequestSource(req));
}

@Post('/security/trusted-devices/revoke-others')
async revokeOtherTrustedDevices(@Req() req: FastifyRequest) {
  return this.sessionSelfServiceUseCase.revokeOtherTrustedDevices(buildDownstreamRequestSource(req));
}
```

- [ ] **Step 5: Run the focused BFF test suite**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand
```

Expected:

```text
PASS ... session-self-service.use-case.spec.ts
PASS ... auth.controller.spec.ts
```

- [ ] **Step 6: Commit the BFF self-security slice**

```bash
git add src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts \
  src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/self-security.dto.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts \
  src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts
git commit -m "feat: add trusted device self-security endpoints"
```

## Task 4: Add Explicit Trust Choice To Login MFA

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/core/auth.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue`
- Test: `app/web/apps/tenant-web/src/views/_core/authentication/mfa.spec.ts`
- Test: `app/web/apps/tenant-web/src/store/auth.spec.ts`

- [ ] **Step 1: Write the failing frontend tests**

```ts
it('shows the trust-current-device checkbox only for NEW_DEVICE_LOGIN', async () => {
  authStoreMock.pendingChallengeScenario = 'NEW_DEVICE_LOGIN';
  const screen = render(MfaPage);

  expect(screen.getByLabelText('信任当前设备')).toBeInTheDocument();
});

it('submits trustCurrentDevice=true when the checkbox is selected', async () => {
  authStoreMock.pendingChallengeScenario = 'NEW_DEVICE_LOGIN';
  authStoreMock.completeMfa.mockResolvedValue({ userInfo: null });

  const screen = render(MfaPage);
  await userEvent.click(screen.getByLabelText('信任当前设备'));
  await screen.getByRole('button', { name: '验证并继续' }).click();

  expect(authStoreMock.completeMfa).toHaveBeenCalledWith('123456', {
    trustCurrentDevice: true,
  });
});
```

- [ ] **Step 2: Run the focused tenant-web tests to verify failure**

Run:

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/views/_core/authentication/mfa.spec.ts apps/tenant-web/src/store/auth.spec.ts
```

Expected:

```text
FAIL ... mfa.spec.ts
Unable to find a label with the text of: 信任当前设备
```

- [ ] **Step 3: Extend the API params and auth store**

```ts
export interface CompleteMfaParams {
  challengeId: string;
  factor: MfaFactor;
  code: string;
  factorChallengeId?: string;
  loginMethod: LoginMethod;
  trustCurrentDevice?: boolean;
}
```

```ts
const pendingTrustCurrentDevice = ref(false);

async function completeMfa(
  code: string,
  options?: { trustCurrentDevice?: boolean },
) {
  const result = await completeMfaApi({
    challengeId: pendingChallengeId.value,
    factor: pendingMfaFactor.value!,
    code: code.trim(),
    factorChallengeId: pendingMfaFactorChallengeId.value || undefined,
    loginMethod: pendingLoginMethod.value!,
    trustCurrentDevice: options?.trustCurrentDevice,
  });

  return handleMfaResult(result);
}
```

- [ ] **Step 4: Render the trust checkbox only for the new-device scene**

```vue
<a-checkbox
  v-if="authStore.pendingChallengeScenario === 'NEW_DEVICE_LOGIN'"
  v-model:checked="trustCurrentDevice"
>
  信任当前设备
  <a-tooltip title="信任后，此设备在 30 天内登录该租户时不再触发新设备验证">
    <span class="mfa-page__trust-hint">?</span>
  </a-tooltip>
</a-checkbox>
```

```ts
async function handleSubmit(code: string) {
  await authStore.completeMfa(code, {
    trustCurrentDevice:
      authStore.pendingChallengeScenario === 'NEW_DEVICE_LOGIN'
        ? trustCurrentDevice.value
        : undefined,
  });
}
```

- [ ] **Step 5: Run the focused frontend tests**

Run:

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/views/_core/authentication/mfa.spec.ts apps/tenant-web/src/store/auth.spec.ts
pnpm --dir app/web exec vue-tsc --noEmit -p apps/tenant-web/tsconfig.json
```

Expected:

```text
PASS ... mfa.spec.ts
PASS ... auth.spec.ts
Found 0 errors
```

- [ ] **Step 6: Commit the login MFA trust opt-in slice**

```bash
git add app/web/apps/tenant-web/src/api/core/auth.ts \
  app/web/apps/tenant-web/src/store/auth.ts \
  app/web/apps/tenant-web/src/views/_core/authentication/mfa.vue \
  app/web/apps/tenant-web/src/views/_core/authentication/mfa.spec.ts \
  app/web/apps/tenant-web/src/store/auth.spec.ts
git commit -m "feat: add trust current device option to login mfa"
```

## Task 5: Build The Security-Center Trusted-Devices Tab

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- Create: `app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.vue`
- Create: `app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.spec.ts`
- Test: `app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts`

- [ ] **Step 1: Write the failing trusted-device UI tests**

```ts
it('renders the trusted-device tab and lists the current device first', async () => {
  server.use(
    http.get('/api/auth/security/trusted-devices', () =>
      HttpResponse.json({
        devices: [
          { id: 'trusted-1', deviceName: 'MacBook Pro', isCurrentDevice: true },
        ],
      }),
    ),
  );

  const screen = render(SecurityCenter);

  await userEvent.click(screen.getByRole('tab', { name: '受信设备' }));
  expect(await screen.findByText('MacBook Pro')).toBeInTheDocument();
  expect(screen.getByText('当前设备')).toBeInTheDocument();
});

it('calls revokeOtherTrustedDevicesApi from the header action', async () => {
  const api = vi.spyOn(securityApi, 'revokeOtherTrustedDevicesApi').mockResolvedValue({
    success: true,
    deviceCount: 2,
  });

  const screen = render(SecurityCenter);
  await userEvent.click(screen.getByRole('button', { name: '撤销其他所有受信设备' }));

  expect(api).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the focused security-center tests to verify failure**

Run:

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.spec.ts
```

Expected:

```text
FAIL ... security-trusted-device-card.spec.ts
Cannot find module './security-trusted-device-card.vue'
```

- [ ] **Step 3: Add the self-security frontend API and the trusted-device card component**

```ts
export async function listTrustedDevicesApi() {
  return requestClient.get<{ devices: SelfSecurityApi.TrustedDevice[] }>(
    '/auth/security/trusted-devices',
  );
}

export async function revokeTrustedDeviceApi(trustedDeviceId: string) {
  return requestClient.delete<{ success: boolean; deviceCount?: number }>(
    `/auth/security/trusted-devices/${trustedDeviceId}`,
  );
}

export async function revokeOtherTrustedDevicesApi() {
  return requestClient.post<{ success: boolean; deviceCount?: number }>(
    '/auth/security/trusted-devices/revoke-others',
  );
}
```

```vue
<template>
  <Card class="security-trusted-device-card" size="small">
    <div class="security-trusted-device-card__header">
      <Space>
        <span class="security-trusted-device-card__name">{{ device.deviceName || '未命名设备' }}</span>
        <Tag v-if="device.isCurrentDevice" color="processing">当前设备</Tag>
      </Space>
      <Button danger type="link" @click="$emit('revoke', device.id)">撤销信任</Button>
    </div>
    <div class="security-trusted-device-card__meta">
      <span>{{ device.browser || '未知浏览器' }} / {{ device.platform || '未知平台' }}</span>
      <span>首次信任：{{ formatDateTime(device.trustedAt) }}</span>
      <span>最近活跃：{{ formatDateTime(device.lastActiveAt) }}</span>
      <span>到期时间：{{ formatDateTime(device.expiresAt) }}</span>
    </div>
  </Card>
</template>
```

- [ ] **Step 4: Integrate the new tab into security-center**

```ts
const trustedDevices = ref<SelfSecurityApi.TrustedDevice[]>([]);
const trustedDevicesLoading = ref(false);
const trustedDeviceMutationLoading = ref(false);

async function loadTrustedDevices() {
  trustedDevicesLoading.value = true;
  try {
    const result = await listTrustedDevicesApi();
    trustedDevices.value = result.devices ?? [];
  } finally {
    trustedDevicesLoading.value = false;
  }
}
```

```vue
<TabPane key="trusted-devices" tab="受信设备">
  <div class="security-center__section-header">
    <div>
      <h3>受信设备</h3>
    </div>
    <Button
      danger
      :loading="trustedDeviceMutationLoading"
      @click="handleRevokeOtherTrustedDevices"
    >
      撤销其他所有受信设备
    </Button>
  </div>
  <Empty v-if="!trustedDevicesLoading && trustedDevices.length === 0" description="当前没有受信设备" />
  <Space v-else direction="vertical" size="middle" class="w-full">
    <SecurityTrustedDeviceCard
      v-for="device in trustedDevices"
      :key="device.id"
      :device="device"
      @revoke="handleRevokeTrustedDevice"
    />
  </Space>
</TabPane>
```

- [ ] **Step 5: Run the focused frontend verification**

Run:

```bash
pnpm --dir app/web exec vitest run \
  apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts \
  apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.spec.ts
pnpm --dir app/web exec eslint app/web/apps/tenant-web/src/views/_core/profile/security-center.vue app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.vue
pnpm --dir app/web exec vue-tsc --noEmit -p apps/tenant-web/tsconfig.json
```

Expected:

```text
PASS ... security-center.helpers.spec.ts
PASS ... security-trusted-device-card.spec.ts
Found 0 errors
```

- [ ] **Step 6: Commit the security-center trusted-device tab**

```bash
git add app/web/apps/tenant-web/src/api/bff/security/index.ts \
  app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.ts \
  app/web/apps/tenant-web/src/views/_core/profile/security-center.vue \
  app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.vue \
  app/web/apps/tenant-web/src/views/_core/profile/components/security-trusted-device-card.spec.ts \
  app/web/apps/tenant-web/src/views/_core/profile/security-center.helpers.spec.ts
git commit -m "feat: add trusted device tab to security center"
```

## Plan Self-Review

### Spec coverage

- `受信设备` vs `在线会话` separation:
  - covered by Task 1 service/repository semantics and Task 5 UI tab separation
- tenant-policy-driven `NEW_DEVICE_LOGIN`:
  - preserved by Task 2 and Task 4 using the existing MFA path plus explicit trust opt-in
- explicit `信任当前设备` choice:
  - implemented by Task 4
- trusted-device self-service list and revoke operations:
  - implemented by Tasks 2, 3, and 5
- 30-day expiry:
  - implemented by Task 1
- Web/PDA phase-1 UI aligned with security-center:
  - implemented by Task 5

No uncovered spec items remain for phase 1.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Every code-bearing step includes concrete snippets and concrete commands.

### Type consistency

- The plan uses `trustCurrentDevice` consistently from frontend API through auth-service command handling.
- The plan uses `TrustedDeviceViewModel` / `TrustedDeviceListViewModel` consistently across BFF and frontend.
- The plan keeps `revokeTrustedDevice` and `revokeOtherTrustedDevices` distinct from session logout semantics.
