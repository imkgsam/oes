# Business Journey Feature Packet

## Binding

- Stage / feature: `global-runnability / business-journey`
- State: `R5_CANDIDATE_READY_FOR_FEATURE_RI`
- Human-visible Feature Lead: task `01a047c6-18ff-71e0-b2cc-b1bad08fd0e8`
- Parent and sole return target: Stage Lead task `01a036e1-7ca5-76c2-8183-64edd7e1d086`
- Feature branch: `codex/feature/business-journey-visible-recovery`
- Feature base: `49e5090b565985e42e63a378370edecc794881c2`
- Immutable rejected candidate and replacement parent:
  `1b4abcad40f2f305bfc981ead59a2e053029e464`
- Immutable first replacement and R2 parent:
  `6904b45ec9331fe3cf8ee2bb852f657de90cf50c`
- Immutable accepted and published R2 candidate / CI-remediation parent:
  `7b289c99fb72c004513ab6e81d376e5a96d3c07d`
- Immutable accepted R3 CI-remediation candidate / R4 parent:
  `af5ec4b740b33e58a61a5061cf907a871591f958`
- Immutable accepted and published R4 candidate / R5 parent:
  `9efa1da3cf65b36f3bfb153999c0aaa50bdcb9eb`
- Canonical `origin/main` observed at continuation: `51f78cc05db67d35f0129e678ad27a1034e22ad0`
- R5 candidate identity: the append-only commit containing this Packet; the exact SHA is emitted in
  the `R5_CANDIDATE_READY_FOR_FEATURE_RI` handoff.
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

### FL-8 — composed CI remediation

The accepted R2 candidate `7b289c99fb72c004513ab6e81d376e5a96d3c07d` remains immutable. Its
published Draft PR `#42` exposed two bounded classes of composed-test drift, now corrected without
changing the accepted Web/PDA or route-terminal behavior:

- Database lifecycle validation compares the generated Permission workload policies with the exact
  versioned profile and validates tuple registration, SYSTEM scope, exact audiences, policy
  version, unique INTERNAL Codes and fail-closed authority rules instead of a historical entry
  count.
- Gateway's two dynamic integration modules provide the existing trusted Permission metadata
  provider; Auth, CRM, Item Master and Permission test composition is aligned with the accepted
  declarations and runtime DI without weakening production authorization.
- Item Master keeps its exact audience-bound lazy runtime but binds both named guards through
  explicit factories, preserving runtime injection while allowing the L3 security matrix to supply
  deterministic verifier and workload-identity fixtures.

Fresh CI-remediation evidence:

- `13-pnpm-test-tooling.log`: exact tooling command passes 48/48, including versioned workload
  policy growth and weakening negatives.
- `14-runtime-profile-specs.log` and `15-local-trusted-runtime-check.log`: affected runtime/profile
  checks pass 16/16 and report `TRUSTED_RUNTIME_PROFILE_VALID services=21`.
- `12-pnpm-test-unit-final.log`: all eight composed packages pass, totaling 448 suites and 2031
  tests; the exact Gateway suites pass 144/144 and 739/739.
- `16-pnpm-test-risk-final.log`: the original required CI command passes end-to-end, including
  tooling 48/48, unit 448/2031, collaboration runtime 134/134 plus static checks, and foundation
  trusted-gRPC invariants 5/5.
- `17-affected-builds.log`: Common, Gateway, Auth, Item Master, Permission and CRM builds pass.

### FL-9 — existing Draft PR fast-forward remediation R4

The accepted R3 candidate `af5ec4b740b33e58a61a5061cf907a871591f958` remains immutable. R4
repairs the repository driver's bounded `publish-pr` profile defect without changing application
behavior or remote state:

- An existing owner branch is amendable only when its exact open Draft PR number (when bound), base,
  head ref, draft state and title match the binding, its pull head equals the observed branch head,
  and that head is a strict locally proven ancestor of the new candidate.
- A normal non-force push fast-forwards only the exact owner ref. An existing Draft PR is PATCHed by
  exact number only when its bound title or body differs; new-branch/new-PR publication remains
  unchanged.
- The postcondition requires the exact candidate branch and pull head, PR number, head/base refs,
  Draft state, title and body. Diverged or unknown heads and any mismatched PR identity fail closed.
- A failed push leaves the PR untouched. A failed PR PATCH leaves the successfully advanced branch
  recoverable: the same binding retries only the missing PATCH, while a completely satisfied retry
  performs no mutation.

Fresh R4 evidence:

- `05-r4-final-driver-validation.log`: post-format focused GitHub adapter scenarios pass 12/12;
  typecheck, 140/140 complete Collaboration Runtime tests and static checks also pass.
- `06-r4-final-test-risk.log`: post-format exact required risk gate passes with tooling 48/48, unit
  packages 8 / suites 448 / tests 2031, Collaboration Runtime 140/140 plus static checks, and
  foundation invariants 5/5.

### FL-10 — database lifecycle rollback ownership remediation R5

The accepted and published R4 candidate `9efa1da3cf65b36f3bfb153999c0aaa50bdcb9eb`
remains immutable. R5 corrects the required-CI cleanup boundary without changing application or
database contracts:

- The lifecycle resource fingerprint binds only `docker-compose.infra.yml`, its exact 13 started
  services, eight volumes and one network; application Compose and main-only resources are not
  rollback inputs.
- Rollback renders and downs only the infra Compose model, omits orphan deletion, and therefore
  requires no application runtime selector projection.
- Existing state/task/project/fingerprint CAS and owner/project label checks remain mandatory.
  Owner-labeled containers, volumes or networks outside the exact lifecycle set fail closed before
  deletion, leaving main-only resources untouched.
- Post-down verification requires zero owner-labeled containers, volumes and networks before the
  lifecycle state directory is removed.

Fresh R5 evidence:

- `01-r5-focused-lifecycle.log`: 15/15 focused lifecycle tests pass, including infra-only rollback
  args, missing selector rendering, wrong owner/fingerprint and same-owner main-only residue.
- `02-r5-real-l2-rollback.log`: isolated task-owned infra up/health, all 21 database migrations,
  Item Master L2 1/1, exact infra rollback, state removal and zero container/volume/network residue
  pass end-to-end.
- `03-r5-test-tooling.log`: exact `pnpm test:tooling` passes 50/50 tests.
- `04-r5-test-risk.log`: exact `pnpm test:risk` passes tooling 50/50, workspace unit packages
  448 suites / 2031 tests, Collaboration Runtime 140/140 plus static checks, and foundation
  invariants 5/5.
- `05-r5-final-build-format-scans.log`: syntax/affected build, formatter, diff, changed-file,
  high-confidence secret, protected-scope, host-runtime-down, isolated-owner-zero-residue and
  20-GiB disk-floor gates pass.

## Review state and findings

- Feature Lead self-review, protected-scope check, diff check and secret scan: passed for the
  replacement delta.
- Independent Feature RI: all five findings against immutable candidate `1b4abcad` are closed on
  immutable first replacement `6904b45e`; its bounded route-scope regression is closed and R2
  candidate `7b289c99` is accepted with no open P0/P1/P2 findings. R3 `af5ec4b7` closes the composed
  CI drift, and R4 `9efa1da3` closes the repository-driver amendment. Only the changed lifecycle and
  Packet scope in R5 returns to the same visible RI task.
- Candidate finding: repository ESLint configuration enables both `project` and `projectService`,
  so candidate-only lint stops before rule execution on all 39 changed TypeScript files. The
  config, package manifest and lockfile are byte-identical to the candidate base; evidence is in
  `153-final-candidate-eslint.log` and `154-final-eslint-baseline-classification.log`.

## Rollback and stop point

- Runtime rollback: `OES_TASK_KEY=tmp_31d7ce4d pnpm local:trusted-runtime:down`.
- The PDA fixture rollback leaves zero rows; owner process verification leaves zero live
  task-owned application processes.
- Git rollback of only the R5 lifecycle repair: `git revert <r5-candidate-sha>`; this restores
  immutable accepted R4 candidate `9efa1da3cf65b36f3bfb153999c0aaa50bdcb9eb`.
- Stop at the exact append-only R5 candidate for the same visible RI. Draft PR `#42` remains at
  `9efa1da3`; no new remote mutation, `main` merge or Stage cleanup is part of this owner action.
