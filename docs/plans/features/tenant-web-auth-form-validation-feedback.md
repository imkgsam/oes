# Tenant Web Auth Form Validation Feedback

featureKey: TENANT-WEB-AUTH-FORM-VALIDATION-FEEDBACK
truthCommit: dbe4af9bcb359b120271ff54f31d324294f48856
baseSha: dbe4af9bcb359b120271ff54f31d324294f48856
integrationBranch: codex/tenant-web-console-warning-followup
worktreeKey: 0027
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: ACCEPTED

## Objective

Close the tenant-web public Login and CodeLogin client-side validation and feedback contract, then remove the two deterministic full-77 console warnings as an accepted follow-up on the same owner.

## Prior merged delivery

- Integration branch: `codex/tenant-web-auth-form-validation-feedback`
- Pull request: https://github.com/imkgsam/oes/pull/53
- Candidate: `5a19da97a5005d1cef0ce44477edbafd50043617`
- Merge commit: `53522f3f9e1008fe229b6359600c779302bcc7a3`
- State: `MERGED_VERIFIED`

## Slices

### AUTH-FORM-VALIDATION-FEEDBACK

state: ACCEPTED
candidate: 2611e874fb3ea3fb97534af4be20487e5bf1a810
review: feature-ri

- Scope:
  - `app/web/apps/tenant-web/src/views/_core/authentication/login.vue` and its focused specs.
  - `app/web/apps/tenant-web/src/views/_core/authentication/code-login.vue` and its focused specs.
  - `app/web/apps/tenant-web/src/views/_core/authentication/phone-number-input.vue` and its focused accessibility spec.
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

### DETERMINISTIC-CONSOLE-WARNING-FOLLOWUP

state: ACCEPTED
candidate: 8cffaa98b8c6fe83d62bee57551eca85f46cae88
review: feature-ri `01a052cd-6258-7dc3-af74-4ba95ee8789f` PASS

- Scope:
  - Remove PAGE-022 Role Management's fragment-root runtime-directive warning without changing the create-role permission predicate.
  - Replace PAGE-048 ItemModel Create's merged `onUpdate:value` listener array with one value-update handler per Select.
  - Add focused warning regressions and align the stale role-permission test selector to the production checkbox contract.
- Protected scope:
  - Authentication, permission, role, ItemModel, navigation, tenant, and API contracts.
  - Existing valid create-role and ItemModel submit behavior.
  - Other tenant-web pages and shared UI components.
- Dependencies:
  - Exact latest main `dbe4af9bcb359b120271ff54f31d324294f48856`.
  - Original product commit `f9f18bc25b6044db8487aaf6042274e84be1e2f7`; moving-main integration is append-only and the five-file product delta remains byte-identical.
- Acceptance:
  - PAGE-022 and PAGE-048 preserve exact direct and refresh paths/titles.
  - Their primary requests remain 200 and console warning/error/pageerror count is zero.
  - Focused component tests, tenant-web typecheck/build, changed-scope lint, rollback, and reapply pass.
  - Same Feature RI reviews the exact latest-main candidate with no findings.
- Evidence:
  - Task-local `.tmp/tenant-web-console-warning-followup/verification-record.md`.
  - Task-local `.tmp/tenant-web-console-warning-followup/latest-rebound-direct-refresh.json`.
  - Task-local `.tmp/tenant-web-console-warning-followup/latest-rebound-rollback-readback.txt`.

## Feature acceptance

Focused component/browser tests cover empty and malformed input, phone/email switching, send-code and submit, network-not-called assertions, console cleanliness, and successful-path preservation. Browser replays confirm the public authentication forms expose field-bound feedback and the PAGE-022/PAGE-048 direct-refresh follow-up retains its primary requests and renders with zero console warnings or errors.
