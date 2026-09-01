# Tenant Web Email Password Failure Boundary

featureKey: tenant-web-email-password-failure-boundary
truthCommit: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
baseSha: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
integrationBranch: codex/tenant-web-email-password-failure-boundary
worktreeKey: 90e0
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Keep email/phone password credential failures inside the Auth-owned `LoginMethod` route so a failed credential never invokes legacy Identity BUSINESS lookup or replaces the uniform invalid-credentials response with an infrastructure error.

## Slices

### password-failure-boundary
state: CANDIDATE_READY
candidate: 2755791104d36fa5233a051e7339c2ad129496ce
review: local-ri

- Scope:
  - Auth email/phone password strategy result and handlers.
  - Focused Auth and Gateway contract/error-shape tests.
  - Localhost regression handoff for tenant-web `EMAIL_PASSWORD`.
- Protected scope:
  - No changes to canonical architecture/contracts, proto/OpenAPI, Identity generic query behavior, permission catalogue, database schema, tenant-web UX copy, or successful account-selection semantics.
  - No credential, identifier, user/account existence, secret, or internal audit reference may enter the external response.
- Dependencies:
  - Auth-owned `LoginMethod` repository and password verifier.
  - On successful credential authentication only, the frozen Auth-only Identity/TenantOrg owner-fact routes used for account candidates and lifecycle filtering.
- Acceptance:
  - Unknown email/phone identifier, wrong password, missing/disabled password credential, and disabled/unverified login method return the same `AUTH_INVALID_CREDENTIALS` code/message/details shape.
  - Failed credentials record the optional audit `userId` only when it was already obtained from the Auth-owned `LoginMethod`; no failure path calls Identity `GetUserByEmail` or `GetUserByPhone`.
  - Risk-throttle lock remains enforced before credential lookup and retains its existing stable error.
  - Auth repository/hash dependency failures and post-auth owner dependency failures remain fail closed and are not converted to credential success or fallback.
  - Successful credentials still enter the Auth-only account-candidate and tenant lifecycle route.
  - Focused unit, typecheck/build, affected Gateway error mapping, and localhost regression are reproducible.

## Feature acceptance

- Candidate is a single reviewable branch whose changed paths stay inside this Packet plus Auth/Gateway tests and the password-login implementation.
- Independent Feature RI approves the exact candidate before remote publication.
- A Draft PR is created without merging or directly pushing `main`.
