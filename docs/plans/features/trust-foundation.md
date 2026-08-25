# Trust And Foundation Runtime

```text
featureKey: trust-foundation
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
baseSha: 7a5df0a61315667e8966b4161f08b8fa71c7bd0c
integrationBranch: codex/feature/trust-foundation
worktreeKey: trust-foundation
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: RUNNING
```

## Objective

Make the frozen trusted-gRPC model operationally reproducible for the Gateway and all 21 gRPC services: complete workload and port inventory, mTLS-only listeners and clients, certificate-bound ExecutionToken admission, trusted tenant/org/operator/trace/audit propagation, and one-command foundation verification.

Stable service boundaries, data ownership, internal gRPC, event transport, and tenant/org/operator/trace/audit semantics remain unchanged.

## Slices

### TF-1 — Executable inventory and state truth table

```text
state: RUNNING
candidate: pending
review: self
```

- Scope: inventory Gateway plus 21 service workloads, listener/client wiring, configured ports, trust assets, method declarations, and runnable verification surfaces.
- Protected scope: no production/shared data, new secret, host privilege, cross-owner write, main merge, or cleanup.
- Dependencies: `reproducible-build@7a5df0a61315667e8966b4161f08b8fa71c7bd0c`.
- Acceptance: executable inventory reports the exact 21-service set, detects missing/duplicate workloads and ports, and emits a state truth table locating plaintext listeners and target mismatches.

### TF-2 — Workload registry, ports, and trust bootstrap

```text
state: READY
candidate: pending
review: self
```

- Scope: complete local trust workload registry and deterministic certificate/bootstrap assets; align service listener ports and Gateway targets, including `crm-service=50060` and `srm-service=50061`.
- Protected scope: no Compose, Dockerfile, package/workspace, environment-file, database, migration, seed, or rollback edits.
- Dependencies: TF-1.
- Acceptance: Gateway plus all 21 services have unique registered workload identities, ports match code and Gateway targets, bootstrap is idempotent, and task-owned material remains local/ignored.

### TF-3 — mTLS-only listener and client runtime

```text
state: READY
candidate: pending
review: local-ri
```

- Scope: replace remaining plaintext production-like listeners/clients with the shared verified mTLS runtime and wire focused module/adapter tests.
- Protected scope: stable service boundaries and protocol semantics remain unchanged; no plaintext fallback when trust material is absent or invalid.
- Dependencies: TF-2.
- Acceptance: 21/21 service listeners require trusted client certificates; internal clients authenticate the target and present the exact workload identity; missing, expired, rotated, or wrong-workload certificates fail closed.

### TF-4 — ExecutionToken and trusted context propagation

```text
state: READY
candidate: pending
review: local-ri
```

- Scope: verify/fix target-audience ExecutionToken exchange and private propagation of applicable tenantId, orgId, operator, trace, and audit context across Gateway and representative multi-hop service callers.
- Protected scope: no new authority source, fallback header/body trust, business Code ownership, or service-owned audit truth.
- Dependencies: TF-3.
- Acceptance: valid calls preserve verified context; missing/forged/expired token, wrong audience/workload/certificate/tenant, and metadata/body override attempts are rejected with distinct safe errors.

### TF-5 — Foundation atomic verification driver

```text
state: READY
candidate: pending
review: self
```

- Scope: one versioned driver covers trust bootstrap, inventory, listener/client transport, critical Gateway/Foundation chain, certificate rotation, and failure cases with literal evidence.
- Protected scope: task-owned local processes and trust material only; no shared or production dependencies.
- Dependencies: TF-2, TF-3, TF-4.
- Acceptance: a clean task-owned run is deterministic, fail-fast, leaves no bearer/private material in evidence, and records exact commands, inputs, outputs, statuses, and dependency fingerprint.

### TF-6 — Feature Review and frozen candidate

```text
state: READY
candidate: pending
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
