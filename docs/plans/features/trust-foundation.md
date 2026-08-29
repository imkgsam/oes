# Trust And Foundation Runtime

```text
featureKey: trust-foundation
truthCommit: 40c11d19b4fe8e33a1e7bae9ab855280ab3088b2
baseSha: 40c11d19b4fe8e33a1e7bae9ab855280ab3088b2
dependencySha: 7a5df0a61315667e8966b4161f08b8fa71c7bd0c
integrationBranch: codex/feature/trust-foundation
worktreeKey: trust-foundation
pullRequest: 27
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_REFRESHED
```

## Objective

Make the frozen trusted-gRPC model operationally reproducible for the Gateway and all 21 gRPC services: complete workload and port inventory, mTLS-only listeners and clients, certificate-bound ExecutionToken admission, trusted tenant/org/operator/trace/audit propagation, and one-command foundation verification.

Stable service boundaries, data ownership, internal gRPC, event transport, and tenant/org/operator/trace/audit semantics remain unchanged.

## Slices

### TF-1 — Executable inventory and state truth table

```text
state: CANDIDATE_READY
candidate: 605d0ca1165461207ea9a7f4cd7e73582e664479
review: self
```

- Scope: inventory Gateway plus 21 service workloads, listener/client wiring, configured ports, trust assets, method declarations, and runnable verification surfaces.
- Protected scope: no production/shared data, new secret, host privilege, cross-owner write, main merge, or cleanup.
- Dependencies: `reproducible-build@7a5df0a61315667e8966b4161f08b8fa71c7bd0c`.
- Acceptance: executable inventory reports the exact 21-service set, detects missing/duplicate workloads and ports, and emits a state truth table locating plaintext listeners and target mismatches.

### TF-2 — Workload registry, ports, and trust bootstrap

```text
state: CANDIDATE_READY
candidate: 605d0ca1165461207ea9a7f4cd7e73582e664479
review: self
```

- Scope: complete local trust workload registry and deterministic certificate/bootstrap assets; align service listener ports and Gateway targets, including `crm-service=50060` and `srm-service=50061`.
- Protected scope: Compose changes are limited to exact trust realization and SRM port alignment; no Dockerfile, package/workspace, environment-file, database, migration, seed, healthcheck, service-inventory, lifecycle, or rollback edits.
- Dependencies: TF-1.
- Acceptance: Gateway plus all 21 services have unique registered workload identities, ports match code and Gateway targets, bootstrap is idempotent, and task-owned material remains local/ignored.

### TF-3 — mTLS-only listener and client runtime

```text
state: CANDIDATE_READY
candidate: 605d0ca1165461207ea9a7f4cd7e73582e664479
review: local-ri
```

- Scope: replace remaining plaintext production-like listeners/clients with the shared verified mTLS runtime and wire focused module/adapter tests.
- Protected scope: stable service boundaries and protocol semantics remain unchanged; no plaintext fallback when trust material is absent or invalid.
- Dependencies: TF-2.
- Acceptance: 21/21 service listeners require trusted client certificates; internal clients authenticate the target and present the exact workload identity; missing, expired, rotated, or wrong-workload certificates fail closed.

### TF-4 — ExecutionToken and trusted context propagation

```text
state: CANDIDATE_READY
candidate: 605d0ca1165461207ea9a7f4cd7e73582e664479
review: local-ri
```

- Scope: verify/fix target-audience ExecutionToken exchange and private propagation of applicable tenantId, orgId, operator, trace, and audit context across Gateway and representative multi-hop service callers.
- Protected scope: no new authority source, fallback header/body trust, business Code ownership, or service-owned audit truth.
- Dependencies: TF-3.
- Acceptance: valid calls preserve verified context; missing/forged/expired token, wrong audience/workload/certificate/tenant, and metadata/body override attempts are rejected with distinct safe errors.

### TF-5 — Foundation atomic verification driver

```text
state: CANDIDATE_READY
candidate: 605d0ca1165461207ea9a7f4cd7e73582e664479
review: self
```

- Scope: one versioned driver covers trust bootstrap, inventory, listener/client transport, critical Gateway/Foundation chain, certificate rotation, and failure cases with literal evidence.
- Protected scope: task-owned local processes and trust material only; no shared or production dependencies.
- Dependencies: TF-2, TF-3, TF-4.
- Acceptance: a clean task-owned run is deterministic, fail-fast, leaves no bearer/private material in evidence, and records exact commands, inputs, outputs, statuses, and dependency fingerprint.

### TF-6 — Feature Review and frozen candidate

```text
state: CANDIDATE_READY
candidate: 605d0ca1165461207ea9a7f4cd7e73582e664479
review: global-ri
```

- Scope: map every feature acceptance criterion to reproducible static, focused unit, component, and task-local integration evidence; freeze one complete candidate and independent review bundle.
- Protected scope: no remote mutation before exact parent-issued trusted authorization; no merge or cleanup.
- Dependencies: TF-1 through TF-5.
- Acceptance: Global RI accepts the exact candidate; required CI succeeds on an independent Draft PR; Stage Review bundle names dependency assumptions and exact combination commands.

## Feature acceptance

- Gateway plus exactly 21 gRPC services are inventoried; workload entries are complete and ports are unique and aligned with code and Gateway targets.
- Every service listener is mTLS protected by default with no production-like plaintext fallback.
- Internal calls use target-audience, certificate-bound ExecutionToken and preserve applicable trusted tenant/org/operator/trace/audit context without trusting payload copies.
- The foundation atomic group proves successful flow plus missing token, forged token/context, wrong workload/tenant, expired certificate, rotation, and dependency outage paths.
- Stable architecture and service ownership remain unchanged; implementation evidence is bound to the dependency candidate and the final feature candidate.

## Candidate review evidence

```text
implementationCandidate: f017f8efb5d55bc69d6b8b2fd7ef8b6c6749893d
previousAcceptedCandidate: ee959bce07d7430291b676df587ca774039f6f0b
invalidatedCandidate: cbef33939d7205dbc43d077a65eb24b8d18cb0eb
resolvedFinding: RI-TF-001
collaborationL1: 10 suites / 35 tests / exit 0
foundationAtomic: FOUNDATION_TRUSTED_RUNTIME_ACCEPTED / exit 0
featureReview: PASS
globalReview: pending refreshed exact canonical RI
```

RI-TF-001 exposed a hermetic Collaboration module test that instantiated the new fail-closed client credential factories without a task-owned trust fixture. The focused test now substitutes only the credential boundary and the unrelated request guard, exercises both production async client-provider factories, and asserts two mandatory credential constructions. Production credential creation remains unchanged and fail-closed.

## Moving-main affected matrix

The feature was append-only merged with `40c11d19b4fe8e33a1e7bae9ab855280ab3088b2`. FL-1 build/environment inputs and FL-2 Compose/database inputs changed; previously accepted trust implementation evidence remains reusable where source fingerprints did not change.

| Changed input | Trust intersection | Evidence |
| --- | --- | --- |
| FL-1 workspace/build bootstrap | all generated clients and 21 listener builds | workspace check PASS; backend build PASS |
| FL-2 Gateway plus 21 runtime Compose services | certificate paths, SPIFFE identity, read-only trust volume | fail-closed baseline reproduced 22 missing trust realizations; remediated inventory 3/3 PASS; resolved Compose 22/22 PASS |
| FL-2 service-owned database URLs | Collaboration hermetic L1 environment | database lifecycle 13/13 PASS; Collaboration L1 35/35 PASS |
| FL-2 SRM Compose listener | source registry and Gateway target | CRM 50060 / SRM 50061 exact; source, Compose, expose, and Gateway target aligned |
| unchanged trusted runtime implementation | ExecutionToken, tenant/org/operator/trace/audit, certificate rotation/failure | foundation atomic 153 focused Common tests plus live valid/wrong/missing/expired/rotation matrix PASS |

The Compose realization uses the existing task-owned `grpc_trust_runtime` volume and bootstrap workload. It adds no secret, database, healthcheck, service inventory, image, or lifecycle semantics.
