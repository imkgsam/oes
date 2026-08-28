# Business Journey Feature Packet

## Binding

- Stage / feature: `global-runnability / business-journey`
- State: `REPLACEMENT_CANDIDATE_R2_READY_FOR_FEATURE_RI`
- Human-visible Feature Lead: task `01a047c6-18ff-71e0-b2cc-b1bad08fd0e8`
- Parent and sole return target: Stage Lead task `01a036e1-7ca5-76c2-8183-64edd7e1d086`
- Feature branch: `codex/feature/business-journey-visible-recovery`
- Feature base: `49e5090b565985e42e63a378370edecc794881c2`
- Immutable rejected candidate and replacement parent:
  `1b4abcad40f2f305bfc981ead59a2e053029e464`
- Immutable first replacement and R2 parent:
  `6904b45ec9331fe3cf8ee2bb852f657de90cf50c`
- Canonical `origin/main` observed at continuation: `51f78cc05db67d35f0129e678ad27a1034e22ad0`
- R2 replacement candidate identity: the append-only commit containing this Packet; the exact SHA
  is emitted in the `REPLACEMENT_CANDIDATE_R2_READY_FOR_FEATURE_RI` handoff.
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
- Auth keeps every BUSINESS RPC `HUMAN, WEB` through exact method declarations, admits PDA only on
  the authenticated-session Logout path, and rejects PDA on representative audit, MFA and session
  administration methods.
- Permission keeps BUSINESS management RPCs WEB-only and admits PDA only on the two exact INTERNAL
  foundation routes for account access summary and navigation resolution.
- Gateway requires the opaque Terminal Device credential during employee-code preflight before
  invoking Auth. Exact route metadata keeps protected Item routes Web-only before any Permission
  BUSINESS RPC while admitting canonical Web and Browser Extension sessions on extension CRM
  routes.
- Gateway-to-Terminal Device requires an exact deployment-projected peer SPIFFE ID and fails closed
  for absent, malformed, wildcard or mismatched identities without a trust-domain fallback.
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

Replacement live evidence `44-pda-foundation-remediation-live.log` revalidates only the affected
subset after the RI remediation:

- missing preflight credential is denied locally before Auth, a wrong credential is rejected by
  Terminal Device, and a correct credential reaches the existing Auth policy stop;
- managed-device login, access summary, bootstrap and signed trace remain valid;
- Item is rejected with HTTP `403` at the Gateway Web-only boundary before Permission;
- dependency outage/recovery is `500 -> 200`, logout makes the session stale, and all six fixture
  tables return to zero rows.

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

### FL-6 — independent RI remediation

The rejected candidate `1b4abcad40f2f305bfc981ead59a2e053029e464` remains immutable. The
append-only replacement closes the five independent RI findings:

1. Auth global terminal widening is removed; BUSINESS RPCs are exact WEB-only declarations and
   only Logout admits PDA.
2. Permission global PDA admission is removed; only the two accepted INTERNAL foundation routes
   admit PDA, while representative Permission/Role/Navigation/Terminal-policy BUSINESS methods
   have PDA-negative coverage.
3. Employee-code preflight forwards the opaque Terminal Device credential controller -> use case
   -> owner proto field and stops before Auth for missing or invalid credentials.
4. Runtime policy validation parses the generated policy semantics rather than matching source
   formatting.
5. Terminal Device peer identity is deployment-projected and exact, with local/non-local positive
   cases and absent/malformed/wildcard/mismatch negatives.

Fresh replacement evidence after final formatting:

- `49-final-prettier-check-corrected.log`: all 16 remediation source/test files formatted.
- `50-final-post-format-security-focused.log`: runtime/profile 10/10, Common mTLS 3/3, Gateway
  57/57, Auth 8/8 and Permission 11/11.
- `51-final-affected-typecheck-build.log`: Common, Gateway and Auth typechecks plus Common, Gateway,
  Auth and Permission builds all pass.
- `52-final-ci-inputs.log`: trusted-runtime profile, Proto lint/breaking and both test-matrix checks
  pass.
- `44-pda-foundation-remediation-live.log`: affected PDA live matrix passes with Item `403`,
  outage/recovery, logout/stale-session and zero fixture residue.
- `45-post-live-runtime-down.log` and `59-final-zero-residue-corrected.log`: launcher shutdown succeeds,
  PID files are absent and all application listeners settle closed.

### FL-7 — route-scoped terminal remediation R2

The first replacement `6904b45ec9331fe3cf8ee2bb852f657de90cf50c` remains immutable. R2 removes
its global Web-only pre-Permission assumption and adds the smallest typed route-terminal declaration:

- Item management declares exactly `WEB`, so PDA Item stops at the Gateway edge before metadata
  creation or Permission RPC.
- Extension CRM declares exactly `WEB, BROWSER_EXTENSION`, so both canonical clients reach
  Permission for the existing `crm.account.create`, `crm.account.claim` and read Codes while PDA
  stops at the Gateway edge.
- A protected route without this exact metadata has no new global terminal allowlist; the existing
  authenticated-session guard and downstream target policy retain ownership.
- Missing or malformed session terminal values on a route that declares terminals fail closed.

Fresh R2 evidence after final formatting:

- `03-r2-final-format.log`: all ten R2 source/test files pass Prettier and `git diff --check`.
- `04-r2-post-format-validation.log`: Common decorator tests pass 2/2; the Gateway guard and exact
  Item/extension controller tests pass 44/44; Common and Gateway typechecks/builds all pass.
- `05-r2-final-gates.log`: changed-scope, protected-path, high-confidence secret, diff, formatting,
  runtime-zero and disk-floor gates pass for the staged R2 delta.
- The R2 manifest, patch, bundle, literal verification record and executable rollback are emitted
  with the exact append-only candidate identity.

## Review state and findings

- Feature Lead self-review, protected-scope check, diff check and secret scan: passed for the
  replacement delta.
- Independent Feature RI: all five findings against immutable candidate `1b4abcad` are closed on
  immutable first replacement `6904b45e`. Its one bounded route-scope regression is corrected by
  the append-only R2 candidate and awaits re-review by the same visible RI task.
- Candidate finding: repository ESLint configuration enables both `project` and `projectService`,
  so candidate-only lint stops before rule execution on all 39 changed TypeScript files. The
  config, package manifest and lockfile are byte-identical to the candidate base; evidence is in
  `153-final-candidate-eslint.log` and `154-final-eslint-baseline-classification.log`.

## Rollback and stop point

- Runtime rollback: `OES_TASK_KEY=tmp_31d7ce4d pnpm local:trusted-runtime:down`.
- The PDA fixture rollback leaves zero rows; owner process verification leaves zero live
  task-owned application processes.
- Git rollback of only the R2 route-scope correction: `git revert <r2-candidate-sha>`; this restores
  immutable first-replacement tree `55ffeac5f8e3579e03f19b58bbcfc6d8f1ff2381`.
- Stop at the exact R2 replacement candidate. No push, PR, `main` merge, cleanup or RI creation is
  part of this owner action.
