# Business Journey Feature Packet

## Recovery binding

- Stage: `global-runnability`
- Feature: `business-journey`
- Owner: exact legacy FL-6 task `01a038f3-e41c-78a0-9a62-8483db4a0694`
- Parent and return target: exact Stage Lead `01a036e1-7ca5-76c2-8183-64edd7e1d086`
- Recovery transition: `global-runnability:recover-fl6-after-acceptance-revision:3`
- Acceptance transition: `global-runnability:pda-foundation-acceptance-revision:2`
- Current truth and integration base: `4f22678908a1416e0b115a9a02514b2737da1dd3`
- Surviving dependency: `tests-ci@10213ad967ab5563c67e66e23709c3f5ac00dd25`
- Superseded provenance only: missing prior FL head `de606fb24919026ce9fe097a9815de124de260bf`; no ancestry or byte-recovery claim is made.

## Recovery lineage

The replacement lineage begins at current canonical main and merges the surviving dependency in this fixed order:

1. first parent: `4f22678908a1416e0b115a9a02514b2737da1dd3`;
2. second parent: `10213ad967ab5563c67e66e23709c3f5ac00dd25`;
3. recovery merge: `72824be4adc01c2c396c56b86fdd549458eb81e9`.

All earlier FL-6 code and evidence are invalidated because their Git objects and evidence root were lost. Only semantics retained in this Packet and exact canonical truth may guide later reconstruction.

## Scope and acceptance split

The feature remains the representative isolated business journey across login, tenant/org, Permission, Gateway/APISIX, business write/read, event/downstream observation, Web/PDA, audit and trace, including normal, denied, duplicate and outage/recovery behavior.

Acceptance is now split explicitly:

- Web proves the end-to-end business journey.
- PDA proves terminal foundation, session/bootstrap/device ownership and fail-closed negatives.
- PDA Item access returning `403` is expected under the current Web-only Item terminal contract.
- No PDA business capability is introduced or claimed.

Stable service/data ownership, internal gRPC, event transport, tenant/org/operator/trace/audit semantics and protected scope remain unchanged.

## Recovery state

State: `RESOURCE_RECOVERY_READY_PENDING_COMMIT`.

This recovery creates no candidate, review, RI, remote branch, PR, product merge or cleanup. Runtime containers referencing the recovered path are stopped and retained. The pre-recovery non-Git residue is preserved below the owner evidence root.

## Invalidated and unreconstructable material

The following prior material is unavailable as trusted bytes and must be reconstructed and freshly verified during later implementation:

- all product/config/test hunks unique to the missing FL-6 lineage through `de606fb2`;
- the former Feature Packet revisions and evidence manifest;
- prior live journey, outage, PDA, migration, security-negative and candidate-review logs;
- prior generated environment, selector, signer, database and container state.

No FL-1 through FL-5 resource is mutated. Their evidence may be reused later only when candidate, dependency, input, environment and command fingerprints remain valid.

## Next legal action

After Stage Lead accepts resource recovery, reconstruct the bounded FL-6 implementation append-only from canonical truth and this task's surviving history, then execute the affected acceptance matrix and normal feature gates. Remote publication, product main merge and cleanup remain gated.
