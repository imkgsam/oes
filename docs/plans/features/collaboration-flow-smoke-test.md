# Collaboration Flow Smoke Test

featureKey: COLLAB-FLOW-SMOKE-TEST
truthCommit: f6bf9cff56fdaa6e8d310db62e046bb79a7b6fc4
state: RUNNING

> This is a temporary execution artifact. It validates the GitHub collaboration path but does not freeze role permissions or responsibilities. Human confirmation is required before cleanup or stable-governance writeback.

## Objective

- Validate one complete branch → push → pull request → required CI → merge → post-merge verification path against the protected default branch.
- Prove that the test runs in an isolated worktree without changing or cleaning any pre-existing dirty worktree.
- Retain exact commits, commands, results, rollback information, and temporary Git resources until Human confirms cleanup.

## Slices

### git-isolation

state: CANDIDATE_READY
candidate: pending
review: self

- Scope: create the dedicated `codex/collaboration-flow-smoke-test` branch and worktree from the exact remote default-branch baseline.
- Protected scope: the existing `/Users/acehood/Documents/GitHub/oes` worktree, all of its tracked and untracked changes, every pre-existing worktree, and every unrelated local or remote branch.
- Dependencies: `origin/main` at `f6bf9cff56fdaa6e8d310db62e046bb79a7b6fc4`.
- Acceptance: the isolated worktree is clean before this packet is added; the protected worktree status and SHA-256 evidence are captured outside the repository; no reset, clean, delete, prune, force-push, or branch rewrite is used.

### protected-pull-request

state: RUNNING
candidate: pending
review: self

- Scope: push only the test branch, open one pull request targeting `main`, observe the required `Baseline Checks`, and expose only the repository-approved merge-commit path.
- Protected scope: direct updates to `main`, branch deletion, force push, bypass changes, Actions permission changes, and unrelated repository settings.
- Dependencies: active `protect-main` ruleset and the existing `.github/workflows/ci.yml` workflow.
- Acceptance: the pull request targets `main`; `Baseline Checks` is required and succeeds; the branch is current with `main`; all conversations are resolved; the available merge method is Merge; no bypass is used.

### merge-and-post-merge-verification

state: READY
candidate: pending
review: self

- Scope: merge only after Human confirmation, fetch the resulting `main`, and verify exact ancestry and repository behavior.
- Protected scope: the Human-owned local `main` worktree and all temporary resources pending cleanup confirmation.
- Dependencies: accepted `protected-pull-request` slice.
- Acceptance: the GitHub merge is a merge commit; the tested candidate is an ancestor of the remote merge result; the remote workflow succeeds on the merged `main`; the original dirty-worktree evidence remains unchanged.

## Feature acceptance

- Report the test branch, isolated worktree, base SHA, candidate SHA, pull-request URL, merge SHA, and exact CI result.
- Record baseline and post-merge verification commands with their literal outputs and exit statuses.
- Preserve a runnable rollback/cleanup script outside the repository; execute it only after explicit Human cleanup confirmation.
- Leave this packet and all temporary Git resources in `COMPLETE_AWAITING_CLEANUP` until Human confirms the stable-governance writeback and cleanup boundary.
