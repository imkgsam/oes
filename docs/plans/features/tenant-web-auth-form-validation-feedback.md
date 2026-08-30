# Tenant Web Auth Form Validation Feedback

featureKey: TENANT-WEB-AUTH-FORM-VALIDATION-FEEDBACK
truthCommit: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
baseSha: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
integrationBranch: codex/tenant-web-auth-form-validation-feedback
worktreeKey: 0027
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Close the tenant-web public Login and CodeLogin client-side validation and feedback contract as one atomic authentication-form deliverable.

## Slices

### AUTH-FORM-VALIDATION-FEEDBACK

state: CANDIDATE_READY
candidate: f0daac92faf6d856c25027413d9e60654adc691d
review: feature-ri

- Scope:
  - `app/web/apps/tenant-web/src/views/_core/authentication/login.vue` and its focused specs.
  - `app/web/apps/tenant-web/src/views/_core/authentication/code-login.vue` and its focused specs.
  - Directly required common-ui authentication form behavior/specs when the defect is owned by the shared form contract.
  - `app/web/packages/@core/ui-kit/form-ui/src/form-api.ts` validation logging behavior and its focused spec.
- Protected scope:
  - Authentication backend contracts, session hydration, account selection, MFA, password recovery, and registration.
  - Successful login and verification-code request semantics beyond preserving existing behavior.
  - Other tenant-web routes and unrelated common-ui components.
- Dependencies:
  - W0 Chrome evidence bound to `main` at the truth commit.
  - Existing phone/email code-login modes and existing successful login paths remain authoritative.
- Acceptance:
  - Empty and malformed values prevent login, send-code, and code-login network calls.
  - Validation feedback is visible, accessible, and bound to the relevant field.
  - Phone/email mode switching preserves the correct schema and feedback behavior.
  - Expected validation failures do not emit console errors.
  - Rendering and validation do not emit Vue reactive-component warnings.
  - Valid submit and send-code paths continue to call their existing handlers.

## Feature acceptance

Focused component/browser tests cover empty and malformed input, phone/email switching, send-code and submit, network-not-called assertions, console cleanliness, and successful-path preservation. A real Chrome replay confirms both public pages expose field-bound feedback with no expected-validation console errors or Vue reactive-component warnings.
