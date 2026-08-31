import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { canonicalJson, objectFingerprint, sha256 } from '../src/canonical.ts'
import { SpawnCommandRunner } from '../src/github-adapter.ts'
import {
  LocalMainController,
  evaluateLocalMainObservation,
  type LocalCommandRunner,
  type LocalMainObservation,
  type LocalMainSyncBinding,
  type LocalMainSyncConfirmation
} from '../src/local-main.ts'
import type { RemoteTrustRoots, TrustedAuthorizationReference } from '../src/types.ts'

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

/** Writes one trusted exact Human confirmation fixture and returns its immutable reference. */
function confirmationFixture(
  trust: RemoteTrustRoots,
  repositoryRoot: string,
  expectedRemoteUrl: string,
  expectedRemoteMainSha: string
): { confirmation: LocalMainSyncConfirmation; reference: TrustedAuthorizationReference } {
  const confirmation: LocalMainSyncConfirmation = {
    schemaVersion: 1,
    kind: 'OES_LOCAL_MAIN_SYNC_CONFIRMATION',
    confirmationFingerprint: '',
    status: 'ISSUED',
    ownerTaskId: trust.ownerTaskId,
    transitionId: 'local-main-sync:1',
    action: 'sync',
    repositoryRoot: realpathSync(repositoryRoot),
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl,
    expectedRemoteMainSha,
    singleUseNonce: 'd'.repeat(64)
  }
  confirmation.confirmationFingerprint = objectFingerprint(
    confirmation as unknown as Record<string, unknown>,
    'confirmationFingerprint'
  )
  const path = join(trust.authorizationRoot, 'local-main-confirmation.json')
  writeFileSync(path, `${canonicalJson(confirmation)}\n`)
  return {
    confirmation,
    reference: {
      path,
      sha256: sha256(readFileSync(path)),
      fingerprint: confirmation.confirmationFingerprint
    }
  }
}

/** Creates one profile-derived trust context for local-main unit fixtures. */
function trustFixture(root: string): RemoteTrustRoots {
  const authorizationRoot = join(root, 'trusted')
  const admissionRoot = join(root, 'admission')
  mkdirSync(authorizationRoot, { recursive: true })
  mkdirSync(admissionRoot, { recursive: true })
  return {
    authorizationRoot,
    admissionRoot,
    profilePath: join(root, 'profile.toml'),
    profileSha256: 'a'.repeat(64),
    ownerTaskId: '/root/fl/local-main',
    profileExpectedState: 'DELIVERY_ACTIVE'
  }
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
    repositoryRoot: realpathSync(project),
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl: git(project, 'remote', 'get-url', 'origin'),
    expectedRemoteMainSha: remoteMainSha,
    humanConfirmationFingerprint: null,
    confirmation: null
  })
  assert.equal(controller.inspect(inspect).status, 'SYNC_ELIGIBLE')

  const trust = trustFixture(join(root, 'runtime-trust'))
  const proof = confirmationFixture(
    trust,
    project,
    inspect.expectedRemoteUrl,
    inspect.expectedRemoteMainSha
  )
  const sync = seal({
    ...inspect,
    action: 'sync',
    humanConfirmationFingerprint: proof.confirmation.confirmationFingerprint,
    confirmation: proof.reference
  })
  const result = controller.sync(sync, trust)
  assert.equal(result.status, 'SYNCED')
  assert.equal(git(project, 'rev-parse', 'HEAD'), remoteMainSha)
  assert.equal(git(project, 'status', '--porcelain'), '')
  assert.equal(git(feature, 'rev-parse', 'HEAD'), featureHead)
  assert.equal(git(feature, 'branch', '--show-current'), 'codex/feature/other')

  const replay = controller.sync(sync, trust)
  assert.equal(replay.status, 'SYNCED')
  assert.equal(replay.after.localMainSha, remoteMainSha)
})

test('caller-minted or drifted local-main confirmation fails before any Git command', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-local-main-trust-'))
  const project = join(root, 'project')
  git(root, 'init', '--initial-branch=main', project)
  git(project, 'config', 'user.email', 'fixture@example.test')
  git(project, 'config', 'user.name', 'Fixture')
  writeFileSync(join(project, 'value.txt'), 'one\n')
  git(project, 'add', 'value.txt')
  git(project, 'commit', '-m', 'initial')
  git(project, 'remote', 'add', 'origin', join(root, 'remote.git'))
  git(root, 'init', '--bare', join(root, 'remote.git'))
  git(project, 'push', '-u', 'origin', 'main')
  const sha = git(project, 'rev-parse', 'HEAD')
  const remoteUrl = git(project, 'remote', 'get-url', 'origin')
  const trust = trustFixture(join(root, 'runtime-trust'))
  const proof = confirmationFixture(trust, project, remoteUrl, sha)
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_LOCAL_MAIN_SYNC_BINDING' as const,
    action: 'sync' as const,
    repositoryRoot: realpathSync(project),
    remote: 'origin' as const,
    branch: 'main' as const,
    expectedRemoteUrl: remoteUrl,
    expectedRemoteMainSha: sha,
    humanConfirmationFingerprint: proof.confirmation.confirmationFingerprint,
    confirmation: proof.reference
  }

  class RecordingRunner implements LocalCommandRunner {
    calls: string[] = []
    run(
      command: string,
      args: string[],
      _cwd: string
    ): { stdout: string; stderr: string; exitCode: number } {
      this.calls.push(`${command} ${args.join(' ')}`)
      return { stdout: '', stderr: '', exitCode: 0 }
    }
  }

  for (const changed of [
    { ...base, expectedRemoteUrl: `${remoteUrl}.changed` },
    { ...base, expectedRemoteMainSha: 'b'.repeat(40) },
    { ...base, humanConfirmationFingerprint: 'f'.repeat(64) }
  ]) {
    const runner = new RecordingRunner()
    assert.throws(() => new LocalMainController(runner).sync(seal(changed), trust))
    assert.deepEqual(runner.calls, [])
  }

  const alias = join(root, 'project-alias')
  symlinkSync(project, alias)
  const runner = new RecordingRunner()
  assert.throws(
    () => new LocalMainController(runner).sync(seal({ ...base, repositoryRoot: alias }), trust),
    /LOCAL_MAIN_CONFIRMATION_BINDING_MISMATCH/
  )
  assert.deepEqual(runner.calls, [])

  const callerMinted = seal({
    ...base,
    repositoryRoot: '/tmp/caller-selected-repository',
    expectedRemoteUrl: '/tmp/caller-selected-remote.git',
    expectedRemoteMainSha: 'a'.repeat(40),
    humanConfirmationFingerprint: 'f'.repeat(64),
    confirmation: {
      path: '/tmp/caller-minted-confirmation.json',
      sha256: 'e'.repeat(64),
      fingerprint: 'f'.repeat(64)
    }
  })
  const forgedRunner = new RecordingRunner()
  assert.throws(() => new LocalMainController(forgedRunner).sync(callerMinted, trust))
  assert.deepEqual(forgedRunner.calls, [])
})
