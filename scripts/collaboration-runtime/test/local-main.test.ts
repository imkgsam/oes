import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { objectFingerprint } from '../src/canonical.ts'
import { SpawnCommandRunner } from '../src/github-adapter.ts'
import {
  LocalMainController,
  evaluateLocalMainObservation,
  type LocalMainObservation,
  type LocalMainSyncBinding
} from '../src/local-main.ts'

/** Runs one fixture Git command and returns its trimmed output. */
function git(cwd: string, ...args: string[]): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${String(result.stderr).trim()}`)
  return String(result.stdout).trim()
}

/** Seals one exact local-main binding after all Human-bound fields are present. */
function seal(binding: Omit<LocalMainSyncBinding, 'bindingFingerprint'>): LocalMainSyncBinding {
  const value = { ...binding, bindingFingerprint: '' } as LocalMainSyncBinding
  value.bindingFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return value
}

test('dirty, diverged, non-main, or active-operation checkout never exposes a sync card', () => {
  const base: LocalMainObservation = {
    repositoryRoot: '/fixture',
    branch: 'main',
    clean: true,
    operationMarkers: [],
    remoteUrl: '/fixture/remote.git',
    localMainSha: 'a'.repeat(40),
    remoteMainSha: 'b'.repeat(40),
    ahead: 0,
    behind: 1
  }
  assert.equal(
    evaluateLocalMainObservation(base, base.remoteMainSha, base.remoteUrl).status,
    'SYNC_ELIGIBLE'
  )
  for (const changed of [
    { ...base, branch: 'codex/feature/other' },
    { ...base, clean: false },
    { ...base, operationMarkers: ['MERGE_HEAD'] },
    { ...base, remoteUrl: '/fixture/changed.git' },
    { ...base, ahead: 1, behind: 1 }
  ])
    assert.equal(
      evaluateLocalMainObservation(changed, base.remoteMainSha, base.remoteUrl).status,
      'PRESERVE_NO_CARD'
    )
})

test('confirmed ff-only sync updates only designated main and preserves another FL worktree', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-local-main-test-'))
  const remote = join(root, 'remote.git')
  const seed = join(root, 'seed')
  const project = join(root, 'project')
  const publisher = join(root, 'publisher')
  const feature = join(root, 'feature-worktree')
  git(root, 'init', '--bare', remote)
  git(root, 'init', '--initial-branch=main', seed)
  git(seed, 'config', 'user.email', 'fixture@example.test')
  git(seed, 'config', 'user.name', 'Fixture')
  writeFileSync(join(seed, 'value.txt'), 'one\n')
  git(seed, 'add', 'value.txt')
  git(seed, 'commit', '-m', 'initial')
  git(seed, 'remote', 'add', 'origin', remote)
  git(seed, 'push', '-u', 'origin', 'main')
  git(root, 'clone', '--branch', 'main', remote, project)
  git(project, 'worktree', 'add', '-b', 'codex/feature/other', feature, 'HEAD')
  const featureHead = git(feature, 'rev-parse', 'HEAD')

  git(root, 'clone', '--branch', 'main', remote, publisher)
  git(publisher, 'config', 'user.email', 'fixture@example.test')
  git(publisher, 'config', 'user.name', 'Fixture')
  writeFileSync(join(publisher, 'value.txt'), 'two\n')
  git(publisher, 'add', 'value.txt')
  git(publisher, 'commit', '-m', 'remote advance')
  git(publisher, 'push', 'origin', 'main')
  git(project, 'fetch', '--no-tags', 'origin', 'main')
  const remoteMainSha = git(project, 'rev-parse', 'refs/remotes/origin/main')

  const controller = new LocalMainController(new SpawnCommandRunner())
  const inspect = seal({
    schemaVersion: 1,
    kind: 'OES_LOCAL_MAIN_SYNC_BINDING',
    action: 'inspect',
    repositoryRoot: project,
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl: git(project, 'remote', 'get-url', 'origin'),
    expectedRemoteMainSha: remoteMainSha,
    humanConfirmationFingerprint: null
  })
  assert.equal(controller.inspect(inspect).status, 'SYNC_ELIGIBLE')

  const sync = seal({
    ...inspect,
    action: 'sync',
    humanConfirmationFingerprint: 'f'.repeat(64)
  })
  const result = controller.sync(sync)
  assert.equal(result.status, 'SYNCED')
  assert.equal(git(project, 'rev-parse', 'HEAD'), remoteMainSha)
  assert.equal(git(project, 'status', '--porcelain'), '')
  assert.equal(git(feature, 'rev-parse', 'HEAD'), featureHead)
  assert.equal(git(feature, 'branch', '--show-current'), 'codex/feature/other')
})
