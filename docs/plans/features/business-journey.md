# Business Journey Feature Packet

## Binding

- Stage / feature: `global-runnability / business-journey`
- State: `CANDIDATE_READY_FOR_FEATURE_RI`
- Human-visible Feature Lead: task `01a047c6-18ff-71e0-b2cc-b1bad08fd0e8`
- Parent and sole return target: Stage Lead task `01a036e1-7ca5-76c2-8183-64edd7e1d086`
- Feature branch: `codex/feature/business-journey-visible-recovery`
- Candidate base and parent: `49e5090b565985e42e63a378370edecc794881c2`
- Canonical `origin/main` observed at continuation: `51f78cc05db67d35f0129e678ad27a1034e22ad0`
- Candidate identity: the commit containing this Packet; the exact SHA is emitted in the
  `CANDIDATE_READY_FOR_FEATURE_RI` handoff.
- The superseded hidden owner is frozen read-only and owns no runtime or candidate state.

## Scope and protected boundary

This feature proves the representative isolated business journey and its local trusted runtime.
The completed candidate keeps the accepted split:

- Web evidence covers the end-to-end business journey, event/downstream observation, audit, trace,
  denial, duplicate behavior and dependency outage/recovery.
- PDA evidence covers only managed-device login, device ownership and access decision,
  session/bootstrap, signed account/tenant/access summary and trace, security negatives,
  dependency outage/recovery and rollback.
- PDA Item access remains an expected `403` under Item's Web-only terminal contract.
- No PDA Task, Item, WMS, MES or other business capability is introduced.
- No stable Proto, database schema, public event or cross-service ownership contract changes.
- Docker is infrastructure-only; OES applications run through the task-owned host-native launcher.

## Candidate behavior

- The local runtime composes the Gateway's exact selector, SPIFFE identity, leaf/key/CA, target
  authority and workload-policy mappings for Auth, Permission, Terminal Device and Item.
- Gateway-to-Terminal Device uses a dedicated mandatory-mTLS channel. Machine source credentials
  carry exact request/trace correlation, and device calls preserve the full downstream source.
- Gateway performs the existing two-hop HUMAN delegation for Permission account access summary and
  navigation: Gateway self-audience execution followed by exact target-audience HUMAN OBO
  execution.
- PDA session context and bootstrap consume the Auth-validated signed session snapshot instead of
  invoking Web-only Identity or TenantOrg business reads.
- Auth rechecks the exact owner-bound `userId + accountId` pair, admits PDA on the explicitly
  declared logout path, and continues to reject undeclared terminal/method combinations.
- Permission admits only WEB and PDA HUMAN session terminals; other HUMAN terminals remain denied.
- Terminal Device maps domain credential failures into the standardized fail-closed gRPC envelope.
- Response trace resolution prefers a valid active OpenTelemetry trace and otherwise accepts only a
  canonical non-zero W3C trace identifier.

## Slices and acceptance evidence

### FL-1 — local trusted runtime and service topology

Freshly revalidated:

- `12-trusted-runtime-check.log`: `TRUSTED_RUNTIME_PROFILE_VALID services=21`.
- `13-trust-static.log`: 24/24 static invariants, including unique listeners, mandatory mTLS,
  workload-scoped certificates, exact selector/policy projection and wildcard/duplicate rejection.
- `17-trusted-runtime-up.log` and `18-trusted-runtime-status.log`: task-owned host-native service
  startup/status with Docker restricted to infrastructure.

### FL-2 — trust transport and rotation

Freshly revalidated:

- `14-trust-live-transport.log`: correct certificate accepted; wrong workload, missing/expired
  client certificate and rotated-certificate replay rejected; current rotated certificate accepted.
- `15-common-trust-focused.log`: 4 suites / 38 tests for mTLS identity, audience, token/cnf and
  trusted metadata verification.
- `16-terminal-trust-focused.log`: 3/3 device credential rotation, suspended and revoked
  fail-closed tests.

### FL-3 — existing Web journey, event and outage acceptance

The inherited 21-service, Web, event and outage evidence remains reusable only for unchanged
fingerprints. The accepted continuation evidence index has SHA-256
`1d5fc9ac08b4d65839866412291a5b8c98a3c21752df47cb9bbc3edf39c58589`.
Candidate-affected shared Gateway/Auth/Permission/Terminal paths were freshly covered by the focused
tests and builds below rather than mechanically rerunning unaffected suites.

### FL-4 — PDA foundation matrix

Fresh `128-pda-foundation-matrix.log` proves:

- real enrollment and ACTIVE DeviceAccessDecision;
- RS256 PDA session with exact account, tenant, session and terminal-device binding;
- session context, access summary, bootstrap and four signed trace results;
- fail-closed missing/wrong credential, inactive device, tenant mismatch and stale session/cnf;
- Terminal Device outage `500` with recovery `200`;
- expected Item `403`;
- logout followed by stale-session rejection;
- zero rows remaining in all six fixture tables and `scope=PDA_FOUNDATION_ONLY`.

### FL-5 — candidate-focused static and build gates

Freshly revalidated after formatting:

- `132-candidate-static-and-ci-inputs.log`: runtime/profile tests 10/10, Proto lint, Proto breaking
  against `origin/main`, and test-matrix configuration all pass.
- `141-post-format-gateway-focused.log`: Gateway typecheck, PDA login 6/6, eleven affected suites
  53/53 and Gateway build pass.
- `142-post-format-services-focused.log`: Auth typecheck, 46/46 tests and build; Permission 8/8
  tests and build; Terminal Device 1/1 filter test and build pass.
- `149-gateway-module-integration-pass.log`: Gateway module and Auth BFF request-level integration
  suites pass 25/25, followed by Gateway typecheck and build.
- `152-candidate-format-check-pass.log`: the complete tracked and newly added candidate file set
  passes the final formatting check.
- Final diff-check, secret scan, changed-file hashes, disk result and rollback are recorded in the
  candidate evidence manifest emitted with the exact candidate SHA.

## Review state and findings

- Feature Lead self-review, protected-scope check, diff check and secret scan: passed.
- Independent Feature RI: pending exact candidate.
- Candidate finding: repository ESLint configuration enables both `project` and `projectService`,
  so candidate-only lint stops before rule execution on all 39 changed TypeScript files. The
  config, package manifest and lockfile are byte-identical to the candidate base; evidence is in
  `153-final-candidate-eslint.log` and `154-final-eslint-baseline-classification.log`.
- Inherited finding: the full Gateway login suite has a pre-existing tenant-name hydration
  expectation failure outside the changed PDA path. The changed PDA tests, all affected neighboring
  suites, typecheck and build pass.

## Rollback and stop point

- Runtime rollback: `OES_TASK_KEY=tmp_31d7ce4d pnpm local:trusted-runtime:down`.
- Git rollback after any later integration: `git revert <candidate-sha>`.
- The PDA fixture rollback leaves zero rows; owner process verification leaves zero live
  task-owned application processes.
- Stop at exact candidate. No push, PR, `main` merge, cleanup or RI creation is part of this
  owner action.
