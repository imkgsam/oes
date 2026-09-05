# OES Collaboration Framework V2

## 1. Purpose and authority

This is the canonical repository-wide role, routing, ownership, delivery, review, moving-main, and lifecycle contract. It deliberately minimizes owners and transitions while retaining independent design and candidate verification. Product architecture files remain authoritative for product behavior.

## 2. Roles

### 2.1 DA — Discussion & Architecture

DA owns continuing read-only product and architecture discussion for a coherent subject. It reads current truth, separates open questions from decisions, and after Human confirmation emits one bounded Proposal with problem, decisions, alternatives, protected scope, migration, affected truth sources, validation, rollback, and stop points. One DA can continue across related questions. DA does not write canonical design or product code.

### 2.2 UD — Unified Design

UD independently audits an exact DA Proposal for repository-wide consistency, durable boundaries, migration impact, naming, and canonical placement. UD is the sole canonical design writer. Its queue is derived from native Proposal/receipt history, FIFO, and single-flight; it is not a registry or scheduler. UD returns an exact accepted/revision-required/rejected result to the originating DA. Design PR merge remains a separate Human decision.

### 2.3 DO — Delivery Owner

DO owns one cohesive delivery from confirmed activation through implementation, focused self-test, exact candidate, PR publication when applicable, candidate maintenance, and terminal disposal. DO may use bounded helpers but remains owner of all results and scope. One DO produces one candidate and one PR.

### 2.4 CO — Coordination Owner

CO is used only when at least two workstreams are independently ownable and real parallelism or cross-delivery integration exists. It freezes decomposition, write sets, dependency order, acceptance, and integration behavior; each workstream has one DO. After scoped RV, CO integrates exact candidates in dependency order and normally creates one aggregate candidate and one aggregate PR. An explicit Human-confirmed exception may choose independent DO PRs only when every delivery is independently releasable. Merge Queue is an admission mechanism, not a substitute for integration ownership.

### 2.5 RV — Review & Verification

RV is independent of the candidate owner and reviews an exact SHA. It verifies DA/UD design conformance, correctness, maintainability, simplicity, efficiency, robustness, security, and risk-selected tests. RV reports bounded findings and does not redesign architecture after implementation. Each CO-owned DO candidate gets scoped RV; the integrated candidate gets aggregate RV.

Human chooses direction and confirms state transitions but is not a task role. Adding a role requires proof that the responsibility cannot be held by one of these roles and removal of equivalent complexity.

## 3. Routing

Read-only discussion creates no delivery resources. Before stateful work, classify stable-design impact, cohesive acceptance, write-set coupling, dependencies, risk, and genuine parallelism, then show one exact recommendation:

- Design-changing: DA → confirmed Proposal → UD → confirmed delivery activation.
- One cohesive/atomic/already-designed change: one DO, regardless of size or helper count.
- Several independently ownable deliveries needing coordination: one CO plus two or more DOs.

Initial execution, Proposal submission, delivery activation, merge, abandonment, and cleanup are separate confirmation boundaries. A changed scope invalidates the earlier confirmation card and requires a refreshed card bound to the new state.

## 4. Identity, visibility, and ownership

DA, UD, DO, CO, and RV are Human-visible project tasks with role-first titles and exact parent/subject binding. Bounded helpers may use hidden transport. A work item and artifact have exactly one current owner. Notification is not ownership transfer. Replacement follows verified termination of the old owner; it never duplicates owners.

Repository deliveries use an owner-exclusive clone/ref plus durable artifact root and task-local scratch. Host-local operations get no Git resources unless they modify the repository. Owner profile, task, repository, transition, credentials, permissions, and resource binding are read back before role-owned writes. Drift repairs the same owner.

## 5. Design flow

1. DA discusses against latest canonical truth without writes.
2. Human confirms an exact Proposal preview.
3. DA emits the immutable Proposal to exact UD.
4. UD audits and, when accepted, writes canonical truth and a Design PR.
5. Human separately decides Design merge.
6. After successful merge/baseline, Human confirms delivery activation; exact originating context receives the result.
7. A delivery-discovered design gap pauses only the affected work, returns through DA/UD, preserves current delivery resources, and resumes the same owner after truth merge.

## 6. Delivery and PR topology

A DO records objective, base SHA, write/protected scope, dependencies, acceptance, candidate SHA, self-test evidence, RV result, PR/CI state, remaining risk, and rollback. Bounded helpers return typed results; they never become owners.

A CO records independently ownable workstreams, dependency order, frozen integration contracts, scoped RV results, and aggregate acceptance. It integrates exact candidate SHAs without rewriting accepted history. Default output is one `codex/coordination/<key>` aggregate branch, candidate, and Draft PR. Independent PR mode is a confirmed exception, not the default.

All repository PRs target `main`, begin Draft, prohibit direct pushes to `main`, and use merge commits through current repository admission. Merge and cleanup remain separate decisions.

## 7. Verification and CI

Verification has three non-substitutable layers:

1. **DO/CO self-test:** fastest changed-scope feedback.
2. **RV:** independent review and risk-based local verification on the exact candidate SHA.
3. **CI:** authoritative reproducible remote verification on PR and merge-group candidates.

After a PR candidate exists, RV and CI run in parallel. Applicable classes are static, unit, component, contract, integration, and critical business journey; risk determines selection. Evidence reuse requires identical candidate, inputs, dependencies, toolchain, environment, command, and still-applicable coverage.

`CI / Baseline Checks` is the stable required status. Change planning selects `DOCS`, `SCOPED`, or `FULL`. A PR-triggered `FULL_REQUIRED` result blocks expensive execution until the Human sees exact reason/scope/estimated phases and cost and explicitly confirms. Scheduled FULL may run silently at its cadence; manual/release FULL is already explicitly invoked.

RV findings and failed CI are routed to the candidate owner. Infrastructure-only retry is bounded and tied to the same run/job/SHA. Product failures change the candidate and invalidate affected evidence.

## 8. Moving main

`origin/main` is canonical. Owner creation fetches/prunes but never automatically fast-forwards a shared local `main` checkout. Existing owner work retains its bound base. Peer merges do not rewrite it. Rebase/update happens only for an actual conflict, changed dependency contract, or admission requirement; only affected verification is repeated. Merge Queue validates the synthetic current-main merge group. Local-main fast-forward is an explicit safe convergence action requiring a clean checkout and no active dependency on its current position.

## 9. Lifecycle disposal

Cleanup is disposal, not delivery or defect discovery. Its executable is isolated from routing, task creation, product writes, PR publication, merge, and CI. The authorization binds terminal state and each exact owner ref/clone/worktree/scratch resource. It permits no cleanup branch and no repository-content diff.

For CO work, dispose deepest children first: bounded helpers/RV, then DOs, then aggregate RV, then CO. A task archives only after every created child is terminal and removed/archived and all exact resources are verified absent. Unknown, shared, active, dirty, missing-observation, or SHA-mismatched resources are preserved and reported. A partially completed retry skips exact verified results and retries only failed identities. Paused design is checkpointed and retained.

## 10. Commands and confirmation contract

<!-- BEGIN OES_COLLAB_COMMANDS_V2 -->

Read-only examples:

- “Discuss the account-context boundary.”
- “Show the current delivery/RV/CI status.”
- “Pause this owner and preserve its resources.”

State-changing intent produces exactly one concise confirmation card before execution:

```text
Confirmation: <initial | proposal | delivery activation | merge | cleanup | abandonment>
Objective: <human-readable objective>
Owner topology: <DA→UD | one DO | CO + N DOs>
Scope / protected scope: <bounded summary>
Risk / design impact / coupling: <summary>
PR topology: <none | one DO PR | one aggregate CO PR | confirmed independent exception>
Verification: <self-test + exact-candidate RV + Baseline Checks; FULL disclosure if applicable>
Stop point: <exact next boundary>
Confirm this exact card? <yes/no>
```

Internal binding retains task IDs, refs, worktrees, full SHAs, Proposal/candidate/finding IDs, state version, transition, and confirmation fingerprint; the Human does not repeat them. Immediately before execution, reopen the binding and refresh the card if truth changed.

Merge cards bind exact PR head(s), order/topology, required CI, RV result, and latest-main admission. Cleanup cards bind the terminal roster and exact resources and explicitly assert zero new task/PR/merge/CI/product-fix/repository-diff capability.

<!-- END OES_COLLAB_COMMANDS_V2 -->

## 11. Completion

A delivery candidate is stable when scope and design conformance are exact, focused self-test passes, Draft PR exists, remote CI state is known, modified artifact/patch/verification/rollback are reopened, remaining risks are explicit, and independent RV is requested. Merge and cleanup happen only at their later confirmed boundaries.
