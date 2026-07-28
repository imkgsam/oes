# OES Framework v2 Operationalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operationalize the frozen OES v2 Lite collaboration model with one routed Global Command checker and remove historically tracked dependency links without deleting retained Git workspaces.

**Architecture:** Keep repository governance as the durable policy and keep live routing state in Codex personal state. The checker observes only the currently registered child thread status/revision and wakes its direct parent on change; it never consumes handoff content. Repository hygiene is fixed once by removing tracked `node_modules` entries from Git while preserving local dependency files, followed by a read-only cleanup manifest for historical worktrees.

**Tech Stack:** Markdown governance, Codex heartbeat automation, JSON runtime registry, Git worktrees/index, pnpm.

---

### Task 1: Freeze the checker routing contract

**Files:**

- Modify: `AGENTS.md`
- Modify: `docs/governance/oes-capability-collaboration-framework.md`
- Modify: `docs/governance/codex-global-command-model.md`
- Modify outside repository: `/Users/acehood/.codex/skills/oes-capability-collaboration/SKILL.md`

- [ ] Add the four routing fields `commandThreadId`, `currentObservedThreadId`, `lastObservedRevision`, and `lastNotifiedApprovalRevision` to the Global Command registry contract.
- [ ] State that the checker observes only `currentObservedThreadId`, wakes only `commandThreadId`, and stores no handoff/result body.
- [ ] Verify the four sources use the same field names and prohibit blind wake-all polling.

### Task 2: Install the single checker control plane

**Files:**

- Create outside repository: `/Users/acehood/.codex/oes-collaboration/global-command-registry.json`
- Delete through Codex automation API: legacy per-command heartbeat records
- Create through Codex automation API: one Global Command heartbeat

- [ ] Seed all nine registered Capability Commands with stable state and no current observed child.
- [ ] Delete the two paused legacy per-command automations.
- [ ] Create one five-minute Global Command heartbeat in `PAUSED` state because no capability currently has an active child.
- [ ] Read back the registry and automation record; verify the heartbeat targets Global Command thread `019f7325-177e-77a1-9189-b36a10d94c3c`.

### Task 3: Remove tracked dependency pollution

**Files:**

- Modify: `.gitignore`
- Remove from Git index: every tracked path matching `*/node_modules/*`
- Preserve on disk: all local dependency files and symlinks

- [ ] Record the pre-fix tracked count and file modes.
- [ ] Make the root ignore rule cover `node_modules` at every package depth.
- [ ] Remove only those tracked paths from the index, retaining working-tree files.
- [ ] Run the repository frozen install in the maintenance worktree.
- [ ] Verify `git ls-files | rg '/node_modules/'` returns no paths and install does not recreate tracked dependency noise.

### Task 4: Produce the historical cleanup manifest

**Files:**

- Create: `docs/plans/features/oes-framework-v2-git-cleanup-manifest.md`

- [ ] Inventory every linked worktree with path, branch or detached state, HEAD, dirty state, and ancestry to `origin/main`.
- [ ] Infer the associated capability from canonical branch/path naming where possible.
- [ ] Mark each resource `SAFE_TO_REMOVE_AFTER_USER_APPROVAL`, `REVIEW_REQUIRED`, or `KEEP`; do not remove any worktree or branch.

### Task 5: Verify and deliver once

**Files:**

- Verify only the files and tracked deletions above.

- [ ] Run formatting checks for changed Markdown and JSON.
- [ ] Run `git diff --check`, governance invariant searches, zero-tracked-node_modules proof, and clean-root proof.
- [ ] Commit the maintenance candidate locally and verify the exact candidate SHA.
- [ ] Fast-forward local `main`, run final root checks, and push `main` once.
- [ ] Retain the maintenance branch/worktree in `MERGED_WAITING_FOR_USER_CLEANUP` until the user explicitly approves deletion.
