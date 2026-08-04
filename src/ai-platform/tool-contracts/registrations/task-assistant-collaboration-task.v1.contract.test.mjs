// This contract test verifies the frozen disabled Task Assistant registration and its two-path implementation lease.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_SHA = '7500bd66d3e11b7a39bb0de052141efe4bfa0d09';
const MANIFEST_PATH =
  'src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.json';
const TEST_PATH =
  'src/ai-platform/tool-contracts/registrations/task-assistant-collaboration-task.v1.contract.test.mjs';
const LEASED_PATHS = [MANIFEST_PATH, TEST_PATH].sort();
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const manifestAbsolutePath = join(REPOSITORY_ROOT, MANIFEST_PATH);
const manifest = existsSync(manifestAbsolutePath)
  ? JSON.parse(readFileSync(manifestAbsolutePath, 'utf8'))
  : null;

const TOP_LEVEL_KEYS = [
  'kind',
  'toolContractId',
  'version',
  'registrationState',
  'immutable',
  'runtimeExecutionEnabled',
  'mutationExecutionEnabled',
  'publicExposureEnabled',
  'operations',
];
const OPERATION_KEYS = [
  'operationKey',
  'mode',
  'ownerContract',
  'ownerOperation',
  'ownerRiskClass',
  'riskSource',
  'businessEffect',
  'runtimeEnabled',
];
const EXPECTED_OPERATIONS = [
  {
    operationKey: 'collaboration.task.list.v1',
    mode: 'READ',
    ownerContract: 'docs/contracts/collaboration-service/task-query.md',
    ownerOperation: 'ListTasks',
    ownerRiskClass: 'DELEGATION_ALLOWED',
    riskSource: 'docs/plans/features/delegated-task-action-grant.md',
    businessEffect: 'READ_ONLY',
    runtimeEnabled: false,
  },
  {
    operationKey: 'collaboration.task.get.v1',
    mode: 'READ',
    ownerContract: 'docs/contracts/collaboration-service/task-query.md',
    ownerOperation: 'GetTask',
    ownerRiskClass: 'DELEGATION_ALLOWED',
    riskSource: 'docs/plans/features/delegated-task-action-grant.md',
    businessEffect: 'READ_ONLY',
    runtimeEnabled: false,
  },
  {
    operationKey: 'oes.ai.task-assistant.draft-task-create.v1',
    mode: 'DRAFT_ONLY',
    ownerContract: null,
    ownerOperation: null,
    ownerRiskClass: null,
    riskSource: null,
    businessEffect: 'PROPOSAL_ONLY',
    runtimeEnabled: false,
  },
  {
    operationKey: 'collaboration.task.create-self.v1',
    mode: 'MUTATION',
    ownerContract: 'docs/contracts/collaboration-service/task-command.md',
    ownerOperation: 'CreateTask',
    ownerRiskClass: 'DELEGATION_ALLOWED',
    riskSource: 'docs/plans/features/delegated-task-action-grant.md',
    businessEffect: 'TASK_CREATE',
    runtimeEnabled: false,
  },
  {
    operationKey: 'collaboration.task.create-assigned.v1',
    mode: 'MUTATION',
    ownerContract: 'docs/contracts/collaboration-service/task-command.md',
    ownerOperation: 'CreateTask',
    ownerRiskClass: 'ACTION_GRANT_REQUIRED',
    riskSource: 'docs/plans/features/delegated-task-action-grant.md',
    businessEffect: 'TASK_CREATE',
    runtimeEnabled: false,
  },
];

test('preserves the exact registration identity, state, shape, and operation mapping', () => {
  assert.notEqual(manifest, null, `${MANIFEST_PATH} must exist`);
  assert.deepEqual(Object.keys(manifest), TOP_LEVEL_KEYS);
  assert.equal(manifest.kind, 'OesAiToolContractRegistration');
  assert.equal(manifest.toolContractId, 'oes.ai.task-assistant.collaboration-task');
  assert.equal(manifest.version, '1.0.0');
  assert.equal(manifest.registrationState, 'REGISTERED_DISABLED');
  assert.equal(manifest.immutable, true);
  assert.deepEqual(manifest.operations, EXPECTED_OPERATIONS);
  assert.equal(
    new Set(manifest.operations.map(({ operationKey }) => operationKey)).size,
    EXPECTED_OPERATIONS.length,
  );
  for (const operation of manifest.operations) {
    assert.deepEqual(Object.keys(operation), OPERATION_KEYS);
  }
});

test('keeps every execution and exposure switch disabled', () => {
  assert.notEqual(manifest, null, `${MANIFEST_PATH} must exist`);
  assert.equal(manifest.runtimeExecutionEnabled, false);
  assert.equal(manifest.mutationExecutionEnabled, false);
  assert.equal(manifest.publicExposureEnabled, false);
  for (const operation of manifest.operations) {
    assert.equal(operation.runtimeEnabled, false);
  }
});

test('keeps the draft ownerless and every forbidden Task command unregistered', () => {
  assert.notEqual(manifest, null, `${MANIFEST_PATH} must exist`);
  const draft = manifest.operations[2];
  assert.equal(draft.ownerContract, null);
  assert.equal(draft.ownerOperation, null);
  assert.equal(draft.ownerRiskClass, null);
  assert.equal(draft.riskSource, null);

  const serializedManifest = JSON.stringify(manifest);
  for (const forbiddenCommand of [
    'UpdateTask',
    'StartTask',
    'CompleteTask',
    'CancelTask',
    'ReopenTask',
    'ArchiveTask',
    'UnarchiveTask',
  ]) {
    assert.equal(serializedManifest.includes(forbiddenCommand), false);
  }
});

test('limits the registration candidate to the exact two-file implementation lease', () => {
  const introductionCommit = execFileSync(
    'git',
    ['log', '--diff-filter=A', '-1', '--format=%H', '--', MANIFEST_PATH],
    { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
  ).trim();
  const trackedPaths = introductionCommit
    ? execFileSync(
        'git',
        ['diff-tree', '--no-commit-id', '--name-only', '-r', introductionCommit],
        { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
      )
    : execFileSync('git', ['diff', '--name-only', BASE_SHA, '--'], {
        cwd: REPOSITORY_ROOT,
        encoding: 'utf8',
      });
  const untrackedPaths = introductionCommit
    ? ''
    : execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
        cwd: REPOSITORY_ROOT,
        encoding: 'utf8',
      });
  const changedPaths = [...new Set(`${trackedPaths}\n${untrackedPaths}`.trim().split(/\r?\n/))]
    .filter(Boolean)
    .sort();

  assert.deepEqual(changedPaths, LEASED_PATHS);
});

test('has no production source path that imports, loads, or executes the manifest', () => {
  const sourceExtensions = new Set(['.cjs', '.js', '.json', '.mjs', '.ts', '.tsx']);
  const forbiddenReferences = [
    MANIFEST_PATH,
    basename(MANIFEST_PATH),
    'tool-contracts/registrations',
    'oes.ai.task-assistant.collaboration-task',
  ];
  const stack = [join(REPOSITORY_ROOT, 'src')];
  const violations = [];

  while (stack.length > 0) {
    const directory = stack.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      const repositoryPath = relative(REPOSITORY_ROOT, absolutePath);
      if (
        LEASED_PATHS.includes(repositoryPath) ||
        !sourceExtensions.has(extname(entry.name))
      ) {
        continue;
      }

      const source = readFileSync(absolutePath, 'utf8');
      if (forbiddenReferences.some((reference) => source.includes(reference))) {
        violations.push(repositoryPath);
      }
    }
  }

  assert.deepEqual(violations, []);
});
