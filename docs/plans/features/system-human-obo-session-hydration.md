# SYSTEM HUMAN OBO Session Hydration

featureKey: system-human-obo-session-hydration
truthCommit: a912abb73e64f8065044f5a278d02439c473d171
baseSha: bdbe73970f452716ba4b2026592b9657ea445436
integrationBranch: codex/system-human-obo-session-hydration
worktreeKey: 917a
pullRequest: https://github.com/imkgsam/oes/pull/55
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Adopt the frozen scope-aware HUMAN OBO invariant atomically in Auth subject verification,
signing admission, durable audit attribution, and the certificate-bound token-cache key so a
SYSTEM session stays tenantless while TENANT preserves one exact tenant.

## Slices

### scope-aware-human-obo

state: CANDIDATE_READY
candidate: b12769942e87098cf71a758ddccc2206aa8f5ed0
review: local-ri moving-main bounded rebind pending

- Scope: Auth HUMAN OBO subject verifier and signing gate; OBO audit subject-scope attribution;
  Common certificate-bound cache subject-scope separation; focused SYSTEM/TENANT/negative tests.
- Protected scope: Gateway/Permission wire; Proto/JWT claims; roles, grants, Permission Codes,
  wildcards and fallbacks; PDA semantics; Tenant Session Owner-Fact Hydration candidate/PR #48.
- Dependencies: canonical Design Merge Commit `a912abb73e64f8065044f5a278d02439c473d171`;
  runtime replay/rebind PASS on exact `ca9e4c92fce8d4d23d2f568feed7c12e231fb57f`, owned by
  `[FL] Full Local Runtime Validation`.
- Acceptance: the verifier and signer consume the same scope/tenant truth table; audit records the
  derived scope and optional tenant before return; cache keys cannot alias SYSTEM and TENANT; all
  negative cases fail before Permission/signing as applicable.

## Scope / tenant truth table

| Subject scope | Signed `tenant_id`                        | Result                          |
| ------------- | ----------------------------------------- | ------------------------------- |
| `SYSTEM`      | absent                                    | accept and preserve absence     |
| `SYSTEM`      | present, blank, wildcard, or exact tenant | reject                          |
| `TENANT`      | one exact non-wildcard tenant             | accept and preserve exact value |
| `TENANT`      | absent, blank, or wildcard                | reject                          |

## Negative matrix

- Missing/blank/wildcard tenant and scope/tenant mismatch.
- Wrong subject audience, target audience, exchanger workload or certificate binding.
- Caller/prior-hop actor injection and registry/Identity actor mismatch.
- Permission decision scope/tenant, requested/granted Code, target or workload mismatch.
- Missing correlation before actor/Permission resolution and missing durable audit before return.
- Cache separation for SYSTEM/TENANT, different tenants, actor, source credential reference,
  permission scope, audience and certificate.

## Feature acceptance

1. Current-main reproduction preserves literal SYSTEM account-selection/context/access-summary and
   correlated Auth failure evidence without touching the runtime owner's stack.
2. Focused verifier and signing tests prove SYSTEM success, TENANT compatibility and the full
   fail-closed matrix with no signer invocation on invalid input.
3. Audit/cache tests prove explicit subject scope plus optional tenant separation, exact tenantless
   SYSTEM MACHINE actor attribution, decision-reference binding, durable append-before-return and
   bearer exclusion.
4. Auth/Common focused tests, typecheck/build/static gates, Proto lint/generation/breaking checks and
   changed-path validation pass on one exact candidate.
5. Independent Feature RI accepts the exact candidate before the first remote write; one Draft PR
   is opened without merge or cleanup.
6. Runtime owner replays SYSTEM login/select/context/access-summary and TENANT exact/missing/wrong
   tenant behavior from the frozen candidate; expected SYSTEM result is context 200 and
   `system.admin` access-summary 200 with 74 actions.
