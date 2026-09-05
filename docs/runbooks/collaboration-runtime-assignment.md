# V2 Assignment Runtime Runbook

This library persists direct, event-driven assignments for the exact active role set **DA / UD / DO / CO / RV**. A bounded helper is a child mechanism, not a role or owner. The runtime creates no task, owner, branch, PR, merge, CI run, or background watcher.

## Owner topology

- A DO may dispatch bounded helpers and one scoped RV for its delivery.
- A CO may dispatch independently owned DOs. It is valid only for at least two independently ownable deliveries.
- Each delivery key has at most one active DO under the same CO.
- A child returns its typed result only to its exact direct parent.

Canonical ceilings are:

```text
active DOs under one CO                 <= 3
active bounded helpers per delivery    <= 3
active RVs per delivery                 <= 1
```

## Initialize and persist

Create `AssignmentRuntimeStore` with one task-local SQLite path and initialize it with an exact `owner.role` of `DO` or `CO`, parent task, coordination/delivery keys, transition, scope fingerprint, ceiling, and next action. Reinitialization is idempotent only when all bindings compare exactly.

Dispatch a child with `childKind` equal to `DO`, `BOUNDED_HELPER`, or `RV`. The request binds child task, exact direct parent, delivery, transition, dispatch state version, expected typed result, narrower scope fingerprint, canonical artifact root and its physical directory identity, plus the next action. Persist `WAITING_ON_CHILD`, send the assignment, and end the turn; do not poll.

## Consume exact typed results

The child writes an `OES_ASSIGNMENT_RESULT_ARTIFACT` strictly below the bound artifact root, then sends an `OES_ASSIGNMENT_RESULT` envelope to the direct parent. The parent:

1. reopens the exact root without following aliases;
2. verifies path, device, inode, file type, containment, bytes, SHA-256, schema, and artifact fingerprint;
3. compares assignment, parent, child, transition, dispatch version, typed result, and scope;
4. commits the matching result tombstone and receipt once;
5. recomputes WIP and selects `WAITING_ON_CHILD` or `ACTIVE`.

Missing, changed, aliased, wrong-root, misrouted, stale, or conflicting results leave state and WIP unchanged. Exact replay after restart returns the original receipt.

## Delivery topology decision

When one DO discovers proposed independent siblings, use `createDeliveryTopologySibling`, `createCoordinationWipAuthorityBinding`, `createDeliveryTopologyRequest`, and `decideDeliveryTopology`. The request binds:

- exact CO/DO tasks, state, scope, root authorization, topology, and ceiling;
- retained write set and proposed disjoint sibling write sets;
- current owner ref/clone/task-temp/delivery-record resources;
- completed slices and evidence;
- independent candidate, RV, PR, and safe-main-merge proofs.

`DELIVERY_TOPOLOGY_REQUIRED` is returned only when every sibling is independently deliverable, all write sets are disjoint, and the CO ceiling remains valid. Otherwise the existing cohesive delivery continues atomically with bounded helpers. Any owner, parent, key, state, scope, authority, topology, sibling, evidence, or resource change invalidates the decision.

## Restart and verification

Reopen the same SQLite store and bound resources, call `load()`, and follow only `nextLegalAction`. SQLite rolls back incomplete transactions; no scan, watcher, or custom lock cleanup is used.

```bash
pnpm collaboration-runtime:typecheck
node --experimental-strip-types --test \
  scripts/collaboration-runtime/src/__tests__/assignment-runtime.unit.spec.ts
```

Candidate-level verification uses `pnpm collaboration-runtime:check` when selected by the change planner.
