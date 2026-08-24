import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { RemoteDriver, type RemoteAdapter } from '../src/remote-driver.ts'
import type {
  RemoteDriverBinding,
  RemoteReceipt,
  RemoteTruth,
  RemoteVerification
} from '../src/types.ts'
import { remoteBinding } from './helpers.ts'

class FakeRemote implements RemoteAdapter {
  truth: RemoteTruth
  mutationCount = 0
  preflightCount = 0
  verificationPassed = true

  constructor(binding: RemoteDriverBinding) {
    this.truth = {
      branchHead: null,
      mergeQueueEntry: null,
      mainHead: binding.integrationBase,
      pullRequest: null,
      requiredChecks: [
        {
          sha: binding.candidateSha,
          name: 'Baseline Checks',
          status: 'completed',
          conclusion: 'success'
        }
      ],
      mainParents: [],
      pullMergeParents: [],
      reviewGate: {
        annotations: 0,
        issueComments: 0,
        reviewComments: 0,
        blockingReviews: 0,
        unresolvedThreads: 0
      }
    }
  }

  async preflight(): Promise<void> {
    this.preflightCount += 1
  }

  async readTruth(): Promise<RemoteTruth> {
    return structuredClone(this.truth)
  }

  async mutate(binding: RemoteDriverBinding): Promise<RemoteReceipt> {
    this.mutationCount += 1
    this.truth.branchHead = binding.candidateSha
    this.truth.pullRequest = {
      number: 12,
      state: 'OPEN',
      draft: true,
      baseRef: 'main',
      headRef: binding.headRef,
      headSha: binding.candidateSha,
      mergeCommitSha: null,
      title: binding.pullRequest.title,
      body: binding.pullRequest.body
    }
    return {
      action: binding.action,
      mutationPerformed: true,
      recoveredFromRemoteTruth: false,
      branchHead: binding.candidateSha,
      pullRequestNumber: 12,
      mergeCommitSha: null
    }
  }

  async verify(): Promise<RemoteVerification> {
    return {
      passed: this.verificationPassed,
      status: this.verificationPassed ? 'PR_READY' : 'PENDING',
      literalResult: this.truth.pullRequest
    }
  }
}

test('remote mutation success followed by process loss resumes from truth without repeating mutation', async () => {
  const binding = remoteBinding()
  const remote = new FakeRemote(binding)
  const first = new RemoteDriver(remote, {
    afterRemoteMutation: () => {
      throw new Error('simulated process loss after remote success')
    }
  })
  await assert.rejects(first.run(binding), /simulated process loss/)
  assert.equal(remote.mutationCount, 1)
  assert.equal(existsSync(binding.resultPath), false)

  const resumed = await new RemoteDriver(remote).run(binding)
  assert.equal(resumed.status, 'REMOTE_VERIFIED')
  assert.equal(resumed.receipt.recoveredFromRemoteTruth, true)
  assert.equal(resumed.receipt.mutationPerformed, false)
  assert.equal(remote.mutationCount, 1)
  assert.equal(remote.preflightCount, 1)

  const idempotent = await new RemoteDriver(remote).run(binding)
  assert.deepEqual(idempotent, resumed)
  assert.equal(remote.mutationCount, 1)
})

test('verification pending resumes only verification and preserves the mutation receipt', async () => {
  const binding = remoteBinding()
  const remote = new FakeRemote(binding)
  remote.verificationPassed = false
  const pending = await new RemoteDriver(remote).run(binding)
  assert.equal(pending.status, 'REMOTE_VERIFICATION_PENDING')
  assert.equal(remote.mutationCount, 1)
  remote.verificationPassed = true
  const verified = await new RemoteDriver(remote).run(binding)
  assert.equal(verified.status, 'REMOTE_VERIFIED')
  assert.equal(remote.mutationCount, 1)
})

test('terminal checkpoint reconstructs a missing result from exact remote truth', async () => {
  const binding = remoteBinding()
  const remote = new FakeRemote(binding)
  const interrupted = new RemoteDriver(remote, {
    afterVerifiedCheckpoint: () => {
      throw new Error('simulated result-write loss')
    }
  })
  await assert.rejects(interrupted.run(binding), /simulated result-write loss/)
  assert.equal(existsSync(binding.resultPath), false)
  const resumed = await new RemoteDriver(remote).run(binding)
  assert.equal(resumed.status, 'REMOTE_VERIFIED')
  assert.equal(remote.mutationCount, 1)
})

test('binding drift fails before any remote action', async () => {
  const binding = remoteBinding()
  binding.stateVersion += 1
  const remote = new FakeRemote(binding)
  await assert.rejects(new RemoteDriver(remote).run(binding), /BINDING_FINGERPRINT_MISMATCH/)
  assert.equal(remote.preflightCount, 0)
  assert.equal(remote.mutationCount, 0)
})

class QueueRemote implements RemoteAdapter {
  truth: RemoteTruth
  mutationCount = 0

  constructor(binding: RemoteDriverBinding) {
    this.truth = {
      branchHead: binding.candidateSha,
      mergeQueueEntry: null,
      mainHead: binding.integrationBase,
      pullRequest: {
        number: 77,
        state: 'OPEN',
        draft: false,
        baseRef: 'main',
        headRef: binding.headRef,
        headSha: binding.candidateSha,
        mergeCommitSha: null,
        title: binding.pullRequest.title,
        body: binding.pullRequest.body
      },
      requiredChecks: [
        {
          sha: binding.candidateSha,
          name: 'Baseline Checks',
          status: 'completed',
          conclusion: 'success'
        }
      ],
      mainParents: [],
      pullMergeParents: [],
      reviewGate: {
        annotations: 0,
        issueComments: 0,
        reviewComments: 0,
        blockingReviews: 0,
        unresolvedThreads: 0
      }
    }
  }

  async preflight(): Promise<void> {}
  async readTruth(): Promise<RemoteTruth> {
    return structuredClone(this.truth)
  }
  async mutate(binding: RemoteDriverBinding): Promise<RemoteReceipt> {
    this.mutationCount += 1
    this.truth.mergeQueueEntry = {
      id: 'queue-entry-1',
      position: 1,
      state: 'AWAITING_CHECKS',
      baseSha: binding.integrationBase,
      headSha: '7'.repeat(40)
    }
    return {
      action: binding.action,
      mutationPerformed: true,
      recoveredFromRemoteTruth: false,
      branchHead: binding.candidateSha,
      pullRequestNumber: 77,
      mergeCommitSha: null
    }
  }
  async verify(): Promise<RemoteVerification> {
    const passed = this.truth.pullRequest?.state === 'MERGED'
    return {
      passed,
      status: passed ? 'MERGED' : 'QUEUED',
      literalResult: this.truth.mergeQueueEntry
    }
  }
}

test('native queue admission is recovered from queue truth without enqueueing twice', async () => {
  const base = remoteBinding({
    action: 'merge-pr',
    pullRequest: {
      baseRef: 'main',
      draft: false,
      number: 77,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: ''
    },
    mergeAuthorizationFingerprint: 'f'.repeat(64),
    admission: { mode: 'merge-queue', lockPath: null, mergeGroupSha: null, mergeGroupBaseSha: null }
  })
  const binding = base
  binding.bindingFingerprint = (await import('../src/canonical.ts')).objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  const remote = new QueueRemote(binding)
  await assert.rejects(
    new RemoteDriver(remote, {
      afterRemoteMutation: () => {
        throw new Error('queue process loss')
      }
    }).run(binding),
    /queue process loss/
  )
  const pending = await new RemoteDriver(remote).run(binding)
  assert.equal(pending.status, 'REMOTE_VERIFICATION_PENDING')
  assert.equal(pending.receipt.recoveredFromRemoteTruth, true)
  assert.equal(remote.mutationCount, 1)
  if (!remote.truth.pullRequest) throw new Error('test pull absent')
  remote.truth.pullRequest.state = 'MERGED'
  remote.truth.pullRequest.mergeCommitSha = '8'.repeat(40)
  remote.truth.mergeQueueEntry = null
  const verified = await new RemoteDriver(remote).run(binding)
  assert.equal(verified.status, 'REMOTE_VERIFIED')
  assert.equal(remote.mutationCount, 1)
})

test('serial latest-main preflight failure releases an uncheckpointed lock for refreshed admission', async () => {
  const binding = remoteBinding({
    action: 'merge-pr',
    pullRequest: {
      baseRef: 'main',
      draft: false,
      number: 9,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: 'Exact candidate'
    },
    mergeAuthorizationFingerprint: 'f'.repeat(64),
    admission: {
      mode: 'serial-latest-main',
      lockPath: '/pending',
      mergeGroupSha: null,
      mergeGroupBaseSha: null
    }
  })
  const remote = new FakeRemote(binding)
  remote.preflight = async () => {
    throw new Error('LATEST_MAIN_DRIFT')
  }
  await assert.rejects(new RemoteDriver(remote).run(binding), /LATEST_MAIN_DRIFT/)
  assert.equal(existsSync(binding.admission?.lockPath ?? ''), false)
})
