import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  claimOwnership,
  createTask,
  generatePrompt,
  listOwnersForPath,
  loadState,
  reportBlocker,
  reportFailure,
  submitCheckpoint,
  submitHandoff,
  syncTask,
} from './core.mjs';
import { runCli } from './cli.mjs';

// Creates an isolated Hub state file for each behavior test.
async function withStateFile(run) {
  const dir = await mkdtemp(path.join(tmpdir(), 'oes-hub-'));
  try {
    return await run(path.join(dir, 'state.json'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('creates and syncs a task with thread identity and boundaries', async () => {
  await withStateFile(async (stateFile) => {
    await createTask(stateFile, {
      id: 'design-browser-plugin-capability',
      type: 'design',
      parent: 'manage-customer-growth',
      returnTarget: ['manage-customer-growth', 'control-global-roadmap'],
      scope: 'Analyze browser plugin capability boundaries.',
      allowed: ['docs/plans/designs/browser-plugin-capability.md'],
      forbidden: ['src/**'],
    });

    const sync = await syncTask(stateFile, 'design-browser-plugin-capability');
    const state = await loadState(stateFile);

    assert.equal(sync.threadId, 'design-browser-plugin-capability');
    assert.equal(sync.type, 'design');
    assert.equal(sync.parent, 'manage-customer-growth');
    assert.deepEqual(sync.returnTarget, ['manage-customer-growth', 'control-global-roadmap']);
    assert.deepEqual(sync.allowed, ['docs/plans/designs/browser-plugin-capability.md']);
    assert.deepEqual(sync.forbidden, ['src/**']);
    assert.equal(state.tasks['design-browser-plugin-capability'].status, 'assigned');
    assert.equal(state.threads['design-browser-plugin-capability'].status, 'assigned');
  });
});

test('generates a short startup prompt that points the thread back to Hub', async () => {
  await withStateFile(async (stateFile) => {
    await createTask(stateFile, {
      id: 'impl-crm-customer-profile',
      type: 'implementation',
      parent: 'manage-customer-growth',
      returnTarget: ['manage-customer-growth'],
      scope: 'Implement CRM customer profile.',
      allowed: ['src/services/business/crm-service/**'],
      forbidden: ['src/common/**', 'docs/plans/oes-global-roadmap.md'],
    });

    const prompt = await generatePrompt(stateFile, { taskId: 'impl-crm-customer-profile' });

    assert.match(prompt, /sync --task impl-crm-customer-profile/);
    assert.match(prompt, /修改任何文件前必须先 claim/);
    assert.match(prompt, /handoff \/ blocker \/ failure/);
  });
});

test('rejects overlapping write ownership claims from another active thread', async () => {
  await withStateFile(async (stateFile) => {
    const first = await claimOwnership(stateFile, {
      threadId: 'impl-crm-customer-profile',
      write: ['src/services/business/crm-service/**'],
    });
    const second = await claimOwnership(stateFile, {
      threadId: 'impl-browser-plugin-crm',
      write: ['src/services/business/crm-service/customer.ts'],
    });
    const owners = await listOwnersForPath(stateFile, 'src/services/business/crm-service/customer.ts');

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, false);
    assert.equal(second.conflicts[0].owner, 'impl-crm-customer-profile');
    assert.equal(owners[0].threadId, 'impl-crm-customer-profile');
  });
});

test('records checkpoints, blockers, failures, and handoffs as thread events', async () => {
  await withStateFile(async (stateFile) => {
    await submitCheckpoint(stateFile, {
      threadId: 'impl-crm-customer-profile',
      summary: 'Domain skeleton complete.',
    });
    await reportBlocker(stateFile, {
      threadId: 'impl-browser-plugin-crm',
      summary: 'Needs CRM customer search contract.',
    });
    await reportFailure(stateFile, {
      threadId: 'integration-browser-plugin-crm',
      summary: 'Permission denied after integration merge.',
    });
    await submitHandoff(stateFile, {
      threadId: 'impl-crm-customer-profile',
      summary: 'Customer profile implementation returned.',
    });

    const state = await loadState(stateFile);

    assert.equal(state.threads['impl-crm-customer-profile'].status, 'returned');
    assert.equal(state.threads['impl-browser-plugin-crm'].status, 'blocked');
    assert.equal(state.threads['integration-browser-plugin-crm'].status, 'failed');
    assert.deepEqual(
      state.events.map((event) => event.type),
      ['checkpoint', 'blocker', 'failure', 'handoff'],
    );
  });
});

test('CLI accepts the pnpm script separator before a command', async () => {
  await withStateFile(async (stateFile) => {
    const output = await runCli(
      [
        '--',
        'task',
        'create',
        '--id',
        'impl-crm-customer-profile',
        '--type',
        'implementation',
        '--parent',
        'manage-customer-growth',
      ],
      { stateFile },
    );
    const state = await loadState(stateFile);

    assert.match(output, /impl-crm-customer-profile/);
    assert.equal(state.tasks['impl-crm-customer-profile'].type, 'implementation');

    const syncOutput = await runCli(['--', 'sync', '--task', 'impl-crm-customer-profile'], {
      stateFile,
    });
    const inboxOutput = await runCli(['--', 'inbox', '--thread', 'impl-crm-customer-profile'], {
      stateFile,
    });

    assert.match(syncOutput, /"threadId": "impl-crm-customer-profile"/);
    assert.equal(inboxOutput, '[]\n');
  });
});
