# Codex Command Hub MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local CLI version of OES Codex Command Hub for task sync, ownership claim, blocker/failure/handoff reporting, and startup prompt generation.

**Architecture:** The MVP is a Node.js CLI backed by a JSON state file. The CLI exposes deterministic commands that Codex threads can call at startup, before edits, during checkpoints, and before stopping. The implementation stays outside service code and does not introduce HTTP, database, or dashboard concerns yet.

**Tech Stack:** Node.js ESM, built-in `node:test`, built-in `fs/path/os/child_process`, JSON state storage.

---

## File Structure

- Create `scripts/oes-hub/store.mjs`
  - Loads, saves, and normalizes the JSON Hub state.
- Create `scripts/oes-hub/core.mjs`
  - Implements task creation, thread sync, ownership claim, conflict detection, event records, and prompt generation.
- Create `scripts/oes-hub/cli.mjs`
  - Parses command-line arguments and prints human-readable output.
- Create `scripts/oes-hub.mjs`
  - Thin executable entry point.
- Create `scripts/oes-hub/oes-hub.spec.mjs`
  - Covers task sync, ownership conflict, blocker, handoff, and prompt behavior.
- Modify `package.json`
  - Add `oes:hub` and `oes:hub:test` scripts.

## Task 1: State Store

**Files:**
- Create: `scripts/oes-hub/store.mjs`
- Test: `scripts/oes-hub/oes-hub.spec.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createTask, loadState } from './core.mjs';

test('creates a task in an empty hub state', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'oes-hub-'));
  const stateFile = path.join(dir, 'state.json');
  try {
    const task = await createTask(stateFile, {
      id: 'design-browser-plugin-capability',
      type: 'design',
      parent: 'manage-customer-growth',
      returnTarget: ['manage-customer-growth', 'control-global-roadmap'],
      scope: 'Analyze browser plugin capability boundaries.',
      allowed: ['docs/plans/designs/browser-plugin-capability.md'],
      forbidden: ['src/**'],
    });
    const state = await loadState(stateFile);
    assert.equal(task.id, 'design-browser-plugin-capability');
    assert.equal(state.tasks['design-browser-plugin-capability'].status, 'assigned');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: FAIL because `scripts/oes-hub/core.mjs` does not exist.

- [ ] **Step 3: Implement state store and task creation**

Create `store.mjs` with `loadState`, `saveState`, `normalizeState`.

Create `core.mjs` with `createTask` re-exporting `loadState`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: PASS for task creation.

## Task 2: Sync and Prompt

**Files:**
- Modify: `scripts/oes-hub/core.mjs`
- Modify: `scripts/oes-hub/oes-hub.spec.mjs`

- [ ] **Step 1: Write failing tests**

Add tests for:

```js
const sync = await syncTask(stateFile, 'design-browser-plugin-capability');
assert.equal(sync.threadId, 'design-browser-plugin-capability');
assert.equal(sync.parent, 'manage-customer-growth');
assert.deepEqual(sync.returnTarget, ['manage-customer-growth', 'control-global-roadmap']);

const prompt = await generatePrompt(stateFile, { taskId: 'design-browser-plugin-capability' });
assert.match(prompt, /sync --task design-browser-plugin-capability/);
assert.match(prompt, /修改任何文件前必须先 claim/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: FAIL because `syncTask` and `generatePrompt` do not exist.

- [ ] **Step 3: Implement sync and prompt generation**

Add `syncTask`, `syncThread`, and `generatePrompt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: PASS.

## Task 3: Ownership Claim and Conflict Detection

**Files:**
- Modify: `scripts/oes-hub/core.mjs`
- Modify: `scripts/oes-hub/oes-hub.spec.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that:

```js
const first = await claimOwnership(stateFile, {
  threadId: 'impl-crm-customer-profile',
  write: ['src/services/business/crm-service/**'],
});
assert.equal(first.allowed, true);

const second = await claimOwnership(stateFile, {
  threadId: 'impl-browser-plugin-crm',
  write: ['src/services/business/crm-service/customer.ts'],
});
assert.equal(second.allowed, false);
assert.equal(second.conflicts[0].owner, 'impl-crm-customer-profile');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: FAIL because `claimOwnership` does not exist.

- [ ] **Step 3: Implement ownership claim**

Add glob prefix matching for `/**` and exact path detection. Store successful claims in `state.ownerships`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: PASS.

## Task 4: Blocker, Failure, Handoff, and CLI

**Files:**
- Modify: `scripts/oes-hub/core.mjs`
- Create: `scripts/oes-hub/cli.mjs`
- Create: `scripts/oes-hub.mjs`
- Modify: `scripts/oes-hub/oes-hub.spec.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Add tests for:

```js
await reportBlocker(stateFile, {
  threadId: 'impl-browser-plugin-crm',
  summary: 'Needs CRM customer search contract.',
});
assert.equal((await loadState(stateFile)).threads['impl-browser-plugin-crm'].status, 'blocked');

await submitHandoff(stateFile, {
  threadId: 'impl-crm-customer-profile',
  summary: 'Customer profile implementation returned.',
});
assert.equal((await loadState(stateFile)).threads['impl-crm-customer-profile'].status, 'returned');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/oes-hub/oes-hub.spec.mjs`

Expected: FAIL because reporting functions do not exist.

- [ ] **Step 3: Implement reporting and CLI**

Add reporting functions, CLI command parsing, and package scripts:

```json
"oes:hub": "node scripts/oes-hub.mjs",
"oes:hub:test": "node --test scripts/oes-hub/*.spec.mjs"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm oes:hub:test`

Expected: PASS.

## Self-Review

- Spec coverage: Covers Hub MVP task, sync, ownership, blocker, failure, handoff, and prompt requirements.
- Placeholder scan: No TBD/TODO placeholders remain.
- Type consistency: All function names are defined before CLI usage in the plan.
