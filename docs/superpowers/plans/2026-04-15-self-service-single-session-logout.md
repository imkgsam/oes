# Self-Service Single Session Logout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the signed-in user revoke one other active session from the account security page, while keeping current-session logout, logout-other-devices, and logout-all semantics clearly separated.

**Architecture:** Add one new self-service session mutation through the existing `auth-bff -> auth-service` chain. Keep the self-service boundary account-scoped, explicitly reject targeting the current session through the new endpoint, and refresh the front-end session list from `GET /auth/sessions` after each successful mutation.

**Tech Stack:** NestJS, CQRS, gRPC proto contracts, Redis-backed auth-service session repository, Vue tenant-web, Ant Design Vue.

---

### Task 1: Freeze contract and feature truth for the new self-service mutation

**Files:**
- Modify: `docs/contracts/api-gateway/auth-bff-self-service.md`
- Modify: `docs/contracts/auth-service/session.md`
- Reference: `docs/plans/features/self-service-single-session-logout.md`

- [ ] **Step 1: Document the new BFF endpoint**

Add a new self-service endpoint entry under the `Sessions` section in `docs/contracts/api-gateway/auth-bff-self-service.md`:

```md
- `POST /auth/sessions/:sessionId/logout`
  - Purpose: revoke one other active session in the current authenticated account.
  - Downstream: `LogoutSession`
```

- [ ] **Step 2: Document the self-service boundary rules**

Extend the `Session Semantics` section so it explicitly states:

```md
- `POST /auth/sessions/:sessionId/logout` is interpreted against the current account resolved from the current session.
- The endpoint must reject targeting the current authenticated session; current-session logout continues to use `POST /auth/logout`.
- End-user session management keeps “active sessions” and “login history” separated; a successful single-session logout removes the target from the active-session view.
```

- [ ] **Step 3: Document the downstream auth-service capability**

Add a new self-service entry to `docs/contracts/auth-service/session.md`:

```md
### `LogoutSession`

- 作用：退出当前账号下的指定其他活动会话
- 使用场景：
  - 用户识别异常登录后，精确退出某一个其他设备会话
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `current_session_id`
  - `target_session_id`
- 响应关键字段：
  - `success`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖 self-bound 自助语义与 `current_session_id` 解析出的当前 `account` 上下文
- tenant / org 要求：
  - 只能操作当前账号上下文下的其他活动会话
- 副作用：
  - 删除目标 session
  - 产生自助安全操作审计事件
```

- [ ] **Step 4: Document the stable error semantics**

Append a short rule block in `docs/contracts/auth-service/session.md` and `docs/contracts/api-gateway/auth-bff-self-service.md`:

```md
- 当目标会话不存在、已失效或已不再属于当前账号可见范围时：
  - 返回稳定“目标会话不可操作”语义，调用方不应依赖内部异常细节
- 当调用方试图通过该能力退出当前正在使用的会话时：
  - 返回稳定“当前会话不允许通过该接口退出”语义
```

- [ ] **Step 5: Sanity check the docs**

Run:

```bash
git diff --check -- docs/contracts/api-gateway/auth-bff-self-service.md docs/contracts/auth-service/session.md
```

Expected: no output.

### Task 2: Add the new auth-service self-service logout command

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/logout-session.command.ts`
- Create: `src/services/system/auth-service/src/application/commands/auth/logout-session.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/index.ts`
- Modify: `src/services/system/auth-service/src/domain/repositories/user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/application/services/auth-audit.service.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/logout-session.handler.spec.ts`
- Test: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts`

- [ ] **Step 1: Add the proto RPC and request/response messages**

Update `src/common/src/contracts/auth_service/auth.proto`:

```proto
  rpc LogoutSession(LogoutSessionRequest) returns (LogoutSessionResponse);
```

Add messages near the other self-service session mutations:

```proto
message LogoutSessionRequest {
  string user_id = 1;
  string current_session_id = 2;
  string target_session_id = 3;
}

message LogoutSessionResponse {
  bool success = 1;
}
```

- [ ] **Step 2: Add the failing auth-service command handler test**

Create `src/services/system/auth-service/src/application/commands/auth/logout-session.handler.spec.ts` with cases for:

```ts
it('removes one other active session from the current account', async () => {})
it('rejects targeting the current session id', async () => {})
it('rejects sessions outside the current account scope', async () => {})
```

Use repository doubles that:
- load the current session by `currentSessionId`
- load the target session by `targetSessionId`
- assert delete is called only for the allowed target session

- [ ] **Step 3: Run the focused auth-service test and confirm it fails**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/logout-session.handler.spec.ts --runInBand
```

Expected: FAIL because the command/handler does not exist yet.

- [ ] **Step 4: Add repository support for target-session validation**

Prefer reusing existing methods first:
- `findById(currentSessionId)` to load the current session
- `findById(targetSessionId)` to load the target session
- `delete(targetSessionId)` to remove the target session

Do **not** add a broader multi-session repository API unless the handler cannot stay focused without it.

If needed, add one narrow helper to `IUserSessionRepository`, for example:

```ts
findVisibleSelfSessionTarget(
  currentSessionId: string,
  targetSessionId: string,
): Promise<{ current: Session; target: Session | null }>
```

Only add this helper if the existing primitives would otherwise force duplicated repository logic.

- [ ] **Step 5: Implement the command and handler**

Create `logout-session.command.ts`:

```ts
export class LogoutSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly currentSessionId: string,
    public readonly targetSessionId: string,
  ) {}
}
```

Create `logout-session.handler.ts` with logic that:
- loads the current session
- rejects when `targetSessionId === currentSessionId`
- loads the target session
- rejects when the target is missing, revoked, or belongs to a different account than the current session
- deletes only the allowed target session
- emits one self-service audit event
- returns `{ success: true }`

- [ ] **Step 6: Expose the RPC through the gRPC controller**

Add a new method in `auth.grpc.controller.ts` mirroring the existing session mutations:

```ts
async logoutSession(request: LogoutSessionRequest): Promise<LogoutSessionResponse> {
  const result = await this.commandBus.execute(
    new LogoutSessionCommand(
      request.userId,
      request.currentSessionId,
      request.targetSessionId,
    ),
  )
  return { success: result.success }
}
```

- [ ] **Step 7: Add the focused gRPC controller spec**

Extend `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts` with one test asserting the new request is mapped into `LogoutSessionCommand`.

- [ ] **Step 8: Run the focused auth-service tests**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest \
  src/application/commands/auth/logout-session.handler.spec.ts \
  src/interfaces/grpc/auth.grpc.controller.spec.ts \
  --runInBand
```

Expected: PASS.

- [ ] **Step 9: Build auth-service**

Run:

```bash
pnpm --dir src/services/system/auth-service build
```

Expected: build succeeds.

### Task 3: Add the auth-bff endpoint and use-case wiring

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts`

- [ ] **Step 1: Add the failing BFF use-case test**

Extend `session-self-service.use-case.spec.ts` with cases for:

```ts
it('forwards the current user, current session, and target session when logging out one other session', async () => {})
it('rejects the mutation when the JWT does not carry a current session id', async () => {})
```

- [ ] **Step 2: Run the focused BFF use-case test and confirm it fails**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest \
  src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts \
  --runInBand
```

Expected: FAIL because the new method does not exist yet.

- [ ] **Step 3: Add one adapter method**

Update `auth-grpc.adapter.ts` with:

```ts
  logoutSession(
    userId: string,
    currentSessionId: string,
    targetSessionId: string,
    source: DownstreamRequestSource,
  ): Promise<LogoutSessionResponse> {
    return this.call(
      'logoutSession',
      this.svc.logoutSession({ userId, currentSessionId, targetSessionId }, this.metadata(source)),
    )
  }
```

- [ ] **Step 4: Add one use-case method**

Update `SessionSelfServiceUseCase` with:

```ts
  async logoutSession(
    targetSessionId: string,
    source: DownstreamRequestSource,
  ): Promise<SessionMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    if (!self.sessionId) {
      throw new UnauthorizedException('authenticated session context is missing session id')
    }
    const result = await this.authAdapter.logoutSession(
      self.userId,
      self.sessionId,
      targetSessionId,
      source,
    )
    return { success: Boolean(result.success) }
  }
```

- [ ] **Step 5: Add the HTTP endpoint**

Update `auth.controller.ts` with a new route near the other self-service session mutations:

```ts
  @Post('sessions/:sessionId/logout')
  @ApiOperation({
    summary: 'Logout one other active session',
    description:
      'Revokes one other active session in the current authenticated account. The current session must continue to use POST /auth/logout.',
  })
  @ApiParam({ name: 'sessionId', description: 'Target active session identifier.' })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel,
    description: 'Returns whether the target session was successfully revoked.',
  })
  async logoutSession(
    @Param('sessionId') sessionId: string,
    @DownstreamSource() source: DownstreamRequestSource,
  ): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logoutSession(sessionId, source)
  }
```

- [ ] **Step 6: Keep the response model minimal**

Do not add a new view model class. Reuse `SessionMutationViewModel` because this mutation targets one session and only needs `success`.

- [ ] **Step 7: Add controller and integration tests**

Add tests covering:
- the controller calling the use-case with `sessionId`
- an integration path for `POST /api/v1/auth/sessions/:sessionId/logout`
- the endpoint remaining authenticated and self-service only

- [ ] **Step 8: Run the focused BFF tests**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest \
  src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts \
  --runInBand
```

Expected: PASS.

- [ ] **Step 9: Build api-gateway**

Run:

```bash
pnpm --dir src/services/api-gateway build
```

Expected: build succeeds.

### Task 4: Add the tenant-web single-session action and confirmation UX

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- Test if present; otherwise verify with typecheck/build

- [ ] **Step 1: Add one API client function**

Update `app/web/apps/tenant-web/src/api/bff/security/index.ts`:

```ts
export async function logoutSelfSessionApi(sessionId: string) {
  return requestClient.post<SelfSecurityApi.SessionMutationResult>(
    `/auth/sessions/${encodeURIComponent(sessionId)}/logout`,
  );
}
```

- [ ] **Step 2: Update the page to use friendly session labels**

Keep the current account-scoped list behavior. Do not reintroduce `context-switch` as a primary visible user label. Reuse the current `loginMethodLabel` map unless this feature explicitly needs a wording adjustment.

- [ ] **Step 3: Add the new confirmation flow**

In `security-center.vue`, add a `confirmLogoutSession(session)` helper that:
- rejects or hides the action when `session.isCurrent` or `session.isRevoked`
- shows a confirmation modal
- calls `logoutSelfSessionApi(session.sessionId)`
- shows `message.success('会话已退出')`
- calls `await loadSecuritySnapshot()`

Use confirmation copy equivalent to:

```ts
title: '确认退出该会话？',
content: '该设备需要重新登录后才能继续访问当前账号。',
okText: '退出此会话',
okType: 'danger',
```

- [ ] **Step 4: Add action buttons only for other active sessions**

In the session list item actions:
- do not render the button for `item.isCurrent`
- do not render the button for `item.isRevoked`
- render one danger or default action button labeled `退出此会话` for the remaining items

- [ ] **Step 5: Add confirmation to the existing “退出其他设备” and “全部退出” actions**

Keep the current modals, but ensure the copy stays aligned with the feature packet:
- `退出其他设备`: explicitly says the current browser remains signed in
- `全部退出`: explicitly says the current browser is included

If the current copy already matches this behavior, keep it as-is and only touch code where needed to align the button/action layout.

- [ ] **Step 6: Verify the page refresh behavior**

After successful single-session logout or logout-other-devices:
- do not hand-delete local rows without refresh
- always reload through `loadSecuritySnapshot()`

After successful logout-all:
- keep the current `authStore.logout(false)` redirect path

- [ ] **Step 7: Run tenant-web verification**

Run:

```bash
pnpm --dir app/web --filter @oes/tenant-web typecheck
pnpm --dir app/web --filter @oes/tenant-web build
```

Expected: both commands succeed.

### Task 5: Final regression verification and closure

**Files:**
- Reference only; no required new files unless fixes are needed

- [ ] **Step 1: Run the focused cross-service verification set**

Run:

```bash
pnpm --dir src/services/system/auth-service exec jest \
  src/application/commands/auth/logout-session.handler.spec.ts \
  src/interfaces/grpc/auth.grpc.controller.spec.ts \
  --runInBand

pnpm --dir src/services/api-gateway exec jest \
  src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts \
  src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts \
  --runInBand

pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 2: Perform one manual behavior check**

Verify the following in the running UI or test environment:
- current session row shows `当前设备` and no `退出此会话` button
- another active row shows `退出此会话`
- confirming the action removes the target row after refresh
- `退出其他设备` keeps the current session
- `全部退出` logs out the current browser

- [ ] **Step 3: Update the feature packet status**

After implementation and verification, update:

`docs/plans/features/self-service-single-session-logout.md`

Add:
- completed implementation status
- exact verification commands
- any remaining follow-up items if discovered during implementation

- [ ] **Step 4: Commit**

```bash
git add \
  docs/contracts/api-gateway/auth-bff-self-service.md \
  docs/contracts/auth-service/session.md \
  src/common/src/contracts/auth_service/auth.proto \
  src/services/system/auth-service/src/application/commands/auth/logout-session.command.ts \
  src/services/system/auth-service/src/application/commands/auth/logout-session.handler.ts \
  src/services/system/auth-service/src/application/commands/auth/logout-session.handler.spec.ts \
  src/services/system/auth-service/src/application/commands/auth/index.ts \
  src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts \
  src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.spec.ts \
  src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts \
  src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts \
  src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts \
  src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts \
  app/web/apps/tenant-web/src/api/bff/security/index.ts \
  app/web/apps/tenant-web/src/views/_core/profile/security-center.vue \
  docs/plans/features/self-service-single-session-logout.md
git commit -m "feat: add self-service single session logout"
```
