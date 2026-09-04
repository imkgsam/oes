# Collaboration Runtime Validation and Evidence Runbook

This runbook executes the risk-tiered validation semantics frozen in `docs/governance/codex-execution-model.md`. It does not redefine delivery ownership, review gates or remote-mutation authority.

## 1. Evidence identity

Create an evidence key only after the command has completed and its literal output and exit status are persisted. The key binds all of the following:

- candidate commit and candidate tree;
- sorted exact dependency candidates, each with commit and tree;
- dependency, lockfile, toolchain, test-config and environment fingerprints;
- literal command inputs and effective execution-profile fingerprint;
- command fingerprint and explicit command version;
- literal result fingerprint and exit status;
- sorted bounded coverage ids.

Use Git object ids directly:

```bash
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'
```

Use SHA-256 for persisted files or canonical JSON inputs:

```bash
shasum -a 256 pnpm-lock.yaml
node -e "const c=require('node:crypto');let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(c.createHash('sha256').update(s).digest('hex')))"
```

`createEvidenceKey` sorts dependency candidates and coverage ids, rejects duplicates and malformed identities, and seals the result with `evidenceFingerprint`. `validateEvidenceKey` reopens the complete record, reconstructs its canonical form and rejects any changed or missing field.

## 2. Reuse and invalidation truth table

| Observed change                                                                                                                                              | Decision           | Required action                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------- |
| Every complete key field is identical and no repository path changed                                                                                         | `REUSE_EXACT`      | Reuse the exact evidence record.                                                                    |
| Candidate commit/tree advanced only through paths outside the command coverage                                                                               | `REFRESH_BASELINE` | Seal a refreshed candidate-bound key with the unchanged literal result; do not rerun the command.   |
| Changed paths intersect one command coverage                                                                                                                 | `FOCUSED`          | Rerun that command; reuse or baseline-refresh independent command evidence.                         |
| Contract/dependency, lockfile, toolchain, test config, environment, literal input/result, profile, command/version, exit status or coverage identity changed | `FULL`             | Invalidate the prior command evidence and run every command required at the current lifecycle tier. |
| Frozen semantics conflict                                                                                                                                    | `DESIGN_GAP`       | Stop execution planning and route the exact gap through the existing-delivery design flow.          |

A changed candidate or moving `main` is not by itself full invalidation. The exact changed paths and bound risk coverage decide whether prior results remain valid. Governance-only drift must not schedule product builds, database checks or journeys whose coverage does not intersect that drift.

Changed-path proof is evidence, not free-form metadata. Both direct drift assessment and plan creation reject absolute paths, empty segments, trailing separators and `.` / `..` traversal aliases before any reuse decision.

## 3. Three lifecycle tiers

Each call to `createValidationPlan` handles exactly one tier. Every command in the request must declare that same tier.

1. `FOCUSED_DEVELOPMENT`
   - Changed collaboration-runtime unit/type/static checks only.
   - `gateContext` is `NONE`.
2. `CANDIDATE_AFFECTED`
   - Dependency, contract, Integration and journey commands selected by the candidate affected matrix.
   - `gateContext` is `NONE`.
3. `FULL_GATE`
   - One Feature PR or Stage-composition gate.
   - `gateContext` is exactly `FEATURE` or `STAGE`.
   - An exact unchanged successful full-gate key produces a reuse action and no run action.

The plan returns every command in exactly one of `runActions` or `reuseActions`, lists every invalidated and reusable evidence fingerprint, and seals the complete decision with `planFingerprint`. `validateValidationPlan` rechecks the complete shape, tier/context, action partition, candidate/evidence binding and canonical fingerprint lists; recomputing `planFingerprint` never legitimizes an invalid plan. A semantic conflict instead returns `DESIGN_GAP` with no runnable or reusable actions.

## 4. Bounded Design Risk Scan

`createDesignRiskScan` requires exactly these canonical surfaces:

1. `CROSS_SERVICE_FACT_OWNERSHIP`
2. `PRE_LOGIN_IDENTITY_AND_ACTOR_KIND`
3. `PERMISSION_ROLE_GRANT_PROVISIONING`
4. `TENANT_ORG_OPERATOR_TRACE_AUDIT`
5. `EVENT_PUBLISHER_CONSUMER_DURABILITY_DLQ`
6. `MIGRATION_OWNERSHIP`
7. `DEPENDENCY_CYCLES`

Each sufficient surface includes at least one repository-relative canonical truth reference and a conclusion. A truth reference starts beneath `docs/`, has no absolute prefix, empty segment, `.`/`..` traversal segment, or trailing separator. Runtime and executable schema enforce that path contract and the exact seven distinct surface identities identically. A gap includes the exact surface and one non-empty pinpointed detail. Missing, duplicate or unknown surfaces fail closed. The only result values are:

- `EXISTING_TRUTH_SUFFICIENT`
- `DESIGN_GAP`

The scan does not create new stable semantics and does not replace Design Owner / Unified Design review.

## 5. Focused verification

Run direct unit and schema coverage while developing:

```bash
node --experimental-strip-types --test \
  scripts/collaboration-runtime/src/__tests__/evidence.unit.spec.ts \
  scripts/collaboration-runtime/src/__tests__/validation-plan.unit.spec.ts \
  scripts/collaboration-runtime/src/__tests__/design-risk-scan.unit.spec.ts
pnpm collaboration-runtime:typecheck
node --test scripts/collaboration-runtime/test/static/ci.static.check.mjs
```

Before candidate freeze, form the affected matrix from the exact changed paths and evidence inputs. Run only the invalidated commands. At the Feature or Stage full-gate point, run the repository gate once unless an unchanged complete full-gate key already proves the same candidate, dependencies, inputs, environment, command/version, literal result and coverage:

```bash
pnpm collaboration-runtime:check
```

Persist command text, tool version, literal output, exit status, coverage ids, candidate commit/tree and the resulting evidence fingerprint in the current evidence manifest.

## 6. Failure routing

- Invalid/tampered evidence, plan or scan artifacts: reject the artifact and regenerate from literal inputs; do not claim reuse.
- Missing evidence: schedule the required command at the current tier.
- Implementation failure: return to the owning Feature Lead and append a fix candidate.
- Frozen semantic conflict: return `DESIGN_GAP` with the exact surface/coverage and preserve the existing delivery owner and resources.
- Candidate or dependency movement: create a new affected matrix; reuse only evidence whose complete identity remains valid.
