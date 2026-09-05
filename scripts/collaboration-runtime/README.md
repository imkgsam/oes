# OES Collaboration Framework V2 runtime

This directory implements the repository-owned DA/UD/DO/CO/RV routing, delivery, verification, remote-action, and lifecycle contracts.

## Core modules

- `src/routing.ts`: chooses read-only discussion, DA→UD, one DO, or CO plus multiple DOs and records PR topology and the next Human gate.
- `src/assignment-runtime.ts`: direct event-driven DO/CO child assignments, bounded-helper/RV typed results, WIP ceilings, and delivery-topology decisions.
- `src/coordination-integration.ts`: dependency-ordered CO integration, scoped-RV prerequisites, aggregate-PR default, explicit independent-PR exception, and healthy-prefix preservation.
- `src/verification-topology.ts`: exact-candidate self-test/RV/CI coverage and exceptional FULL disclosure/confirmation state.
- `src/evidence.ts`, `src/validation-plan.ts`, and `src/design-risk-scan.ts`: evidence identity, risk-selected reuse/invalidation, and canonical design-gap checks.
- `src/profile-policy.ts`, `src/profile-preflight.ts`, `src/resource-topology.ts`: exact-owner profile and owner-exclusive resource binding.
- `src/remote-driver.ts` and `src/github-adapter.ts`: authenticated Draft PR, verification, merge, and main readback. The remote action set has no cleanup command.
- `src/cleanup-binding.ts`, `src/cleanup.ts`, `src/cleanup-cli.ts`: isolated exact disposal and zero-repository-diff validation.
- `src/coordination-lifecycle.ts`: task-native roster closure and deepest-child-first archive planning.
- `schemas/`: V2 executable contracts.

## Entrypoints

```bash
pnpm collaboration-runtime:check

node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  route --input ROUTING_INPUT.json
node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  verification-plan --input VERIFICATION_INPUT.json
node --experimental-strip-types scripts/collaboration-runtime/src/cli.ts \
  coordination-integration-plan \
  --authorization CO_AUTHORIZATION.json --results RESULTS.json

scripts/collaboration-runtime/bin/oes-remote-driver \
  --profile-report EFFECTIVE_PROFILE.json --binding ACTION_BINDING.json

scripts/collaboration-runtime/bin/oes-lifecycle-cleanup \
  cleanup-plan --profile-report EFFECTIVE_PROFILE.json \
  --authorization CLEANUP.json --child-authorization CHILD.json \
  --observed OBSERVED.json --output PLAN.json
```

`src/cli.ts` and `oes-remote-driver` contain delivery/remote behavior but no cleanup route. `oes-lifecycle-cleanup` contains disposal planning and verification but imports no routing, delivery creation, GitHub adapter, PR, merge, CI, or product-writing module.

All repository PRs target `main`, begin Draft, and use `Baseline Checks`. A DO has one candidate/PR. CO defaults to one aggregate candidate/PR after scoped RV; independent DO PRs require a confirmed exception and independent releasability. PR-triggered FULL is held until its disclosed cost is explicitly confirmed.

Cleanup binds terminal state and exact owner resources, permits no branch creation or repository-content diff, disposes children before owners, preserves ambiguous resources, and replays only failed exact identities.
