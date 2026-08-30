# Tenant Web Account Selection Pending Context Guard

featureKey: tenant-web-account-selection-pending-context-guard
truthCommit: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
baseSha: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
integrationBranch: codex/tenant-web-account-selection-pending-context-guard
worktreeKey: tenant-web-account-selection-pending-context-guard
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Make `/auth/account-selection` deterministically reject missing, expired, reloaded, backed-to, or consumed pending-selection state before an empty account-selection shell can render, while preserving valid selection and `MFA_FACTOR_UNAVAILABLE` behavior.

## Slices

### account-selection-route-guard
state: CANDIDATE_READY
candidate: 266a6723fcd399c793a640d8b90c07a1f80ab5f9
review: local-ri

- Scope: Tenant Web router/auth-store/account-selection view and focused specifications needed to guard real pending account-selection state at route entry.
- Protected scope: Valid official-fixture SYSTEM/TENANT option rendering, option hydration, downstream selection submission semantics, backend auth contracts, and unrelated authentication routes.
- Dependencies: Existing Tenant Web auth-store state and canonical login/account-selection contracts at `0c8adcaf382c09fb56d9790b44a02de783a63ea8`.
- Acceptance: Empty, reload, back-navigation, expired, and consumed paths immediately produce a controlled redirect or bounded feedback without an empty shell; valid options remain selectable; `MFA_FACTOR_UNAVAILABLE` remains visible; failures are not swallowed; focused component/router coverage and a real Chrome replay show no console error.

## Feature acceptance

- The guard is based on actual pending-selection state rather than fabricated route/query context.
- Direct navigation without pending state never renders the account-selection page shell.
- Valid pending state and the existing MFA-unavailable boundary retain their current user-visible behavior.
- Focused, affected, and browser replay evidence map to the acceptance paths above.
