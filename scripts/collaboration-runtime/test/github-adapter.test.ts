import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GitHubRemoteAdapter,
  type CommandResult,
  type CommandRunner
} from '../src/github-adapter.ts'
import type { RemoteTruth } from '../src/types.ts'
import { remoteBinding } from './helpers.ts'

const emptyGate = {
  annotations: 0,
  issueComments: 0,
  reviewComments: 0,
  blockingReviews: 0,
  unresolvedThreads: 0
}

class ScenarioRunner implements CommandRunner {
  readonly commands: string[] = []
  readonly candidate: string
  readonly main: string
  pullExists = false

  constructor(candidate: string, main: string) {
    this.candidate = candidate
    this.main = main
  }

  run(command: string, args: string[]): CommandResult {
    this.commands.push(`${command} ${args.join(' ')}`)
    if (command === 'git' && args[0] === 'status') return ok('')
    if (command === 'git' && args[0] === 'remote') return ok('https://github.com/example/oes.git\n')
    if (command === 'git' && args[0] === 'rev-parse' && args[1] === 'HEAD')
      return ok(`${this.candidate}\n`)
    if (command === 'git' && args[0] === 'branch') return ok('codex/feature/runtime\n')
    if (command === 'git' && args[0] === 'ls-remote') {
      const ref = args.at(-1)
      const sha = ref === 'refs/heads/main' ? this.main : this.candidate
      return ok(`${sha}\t${ref}\n`)
    }
    if (command === 'git' && ['fetch', 'merge-base'].includes(args[0])) return ok('')
    if (command === 'git' && args[0] === 'cat-file')
      return ok(`tree ${'a'.repeat(40)}\nparent ${'b'.repeat(40)}\n`)
    if (command === 'gh' && args[0] === 'api') {
      const endpoint = args.find((arg) => arg.startsWith('repos/')) ?? ''
      if (endpoint.includes('/pulls?')) {
        const pulls = this.pullExists
          ? [
              {
                number: 12,
                state: 'open',
                draft: true,
                merged_at: null,
                merge_commit_sha: null,
                title: 'Runtime',
                body: 'Exact candidate',
                head: { ref: 'codex/feature/runtime', sha: this.candidate },
                base: { ref: 'main' }
              }
            ]
          : []
        return ok(JSON.stringify(pulls))
      }
      if (args.includes('--method') && args.includes('POST')) {
        this.pullExists = true
        return ok(JSON.stringify({ number: 12 }))
      }
      if (endpoint.endsWith('/actions/permissions/workflow'))
        return ok(
          JSON.stringify({
            default_workflow_permissions: 'read',
            can_approve_pull_request_reviews: false
          })
        )
      if (endpoint.includes('/rulesets/7')) return ok(JSON.stringify(rulesetDetail()))
      if (endpoint.includes('/rulesets?'))
        return ok(
          JSON.stringify([{ id: 7, name: 'protect-main', target: 'branch', enforcement: 'active' }])
        )
      if (endpoint === 'repos/example/oes')
        return ok(
          JSON.stringify({
            default_branch: 'main',
            delete_branch_on_merge: false,
            allow_merge_commit: true,
            allow_squash_merge: false,
            allow_rebase_merge: false,
            allow_auto_merge: false
          })
        )
      if (endpoint.includes('/check-runs/') && endpoint.includes('/annotations')) return ok('[]')
      if (endpoint.includes('/check-runs')) return ok(JSON.stringify({ check_runs: [] }))
      if (endpoint.includes('/comments?') || endpoint.includes('/reviews?')) return ok('[]')
      if (args.includes('graphql'))
        return ok(
          JSON.stringify({
            data: {
              repository: {
                pullRequest: { reviewThreads: { pageInfo: { hasNextPage: false }, nodes: [] } }
              }
            }
          })
        )
    }
    return ok('')
  }
}

function ok(stdout: string): CommandResult {
  return { stdout, stderr: '', exitCode: 0 }
}
function rulesetDetail(): Record<string, unknown> {
  return {
    bypass_actors: [],
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 0,
          required_review_thread_resolution: true,
          allowed_merge_methods: ['merge']
        }
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [{ context: 'Baseline Checks' }]
        }
      }
    ]
  }
}

test('partial publish recovery creates the missing Draft PR without repeating a matched branch push', async () => {
  const binding = remoteBinding()
  const runner = new ScenarioRunner(binding.candidateSha, binding.integrationBase)
  const adapter = new GitHubRemoteAdapter(runner)
  const truth: RemoteTruth = {
    branchHead: binding.candidateSha,
    mergeQueueEntry: null,
    mainHead: binding.integrationBase,
    pullRequest: null,
    requiredChecks: [],
    mainParents: [],
    pullMergeParents: [],
    reviewGate: emptyGate
  }
  const receipt = await adapter.mutate(binding, truth)
  assert.equal(receipt.pullRequestNumber, 12)
  assert.equal(
    runner.commands.some((command) => command.startsWith('git push ')),
    false
  )
  assert.equal(runner.commands.filter((command) => command.includes(' --method POST ')).length, 1)
})

test('preflight rejects latest-main drift before merge or publication', async () => {
  const binding = remoteBinding()
  const runner = new ScenarioRunner(binding.candidateSha, '9'.repeat(40))
  const adapter = new GitHubRemoteAdapter(runner)
  const truth: RemoteTruth = {
    branchHead: null,
    mergeQueueEntry: null,
    mainHead: '9'.repeat(40),
    pullRequest: null,
    requiredChecks: [],
    mainParents: [],
    pullMergeParents: [],
    reviewGate: emptyGate
  }
  await assert.rejects(adapter.preflight(binding, truth), /LATEST_MAIN_DRIFT/)
})

test('main verification rejects a merge whose second parent is not the confirmed PR head', async () => {
  const mergeSha = '8'.repeat(40)
  const binding = remoteBinding({
    action: 'verify-main',
    expectedMergeSha: mergeSha,
    pullRequest: {
      baseRef: 'main',
      draft: false,
      number: 12,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: 'Exact candidate'
    }
  })
  const adapter = new GitHubRemoteAdapter(new ScenarioRunner(binding.candidateSha, mergeSha))
  const truth: RemoteTruth = {
    branchHead: binding.candidateSha,
    mergeQueueEntry: null,
    mainHead: mergeSha,
    pullRequest: {
      number: 12,
      state: 'MERGED',
      draft: false,
      baseRef: 'main',
      headRef: binding.headRef,
      headSha: binding.candidateSha,
      mergeCommitSha: mergeSha,
      title: binding.pullRequest.title,
      body: binding.pullRequest.body
    },
    requiredChecks: [
      { id: 1, sha: mergeSha, name: 'Baseline Checks', status: 'completed', conclusion: 'success' }
    ],
    mainParents: ['4'.repeat(40), '9'.repeat(40)],
    pullMergeParents: ['4'.repeat(40), binding.candidateSha],
    reviewGate: emptyGate
  }
  const result = await adapter.verify(binding, truth, {
    action: 'verify-main',
    mutationPerformed: false,
    recoveredFromRemoteTruth: false,
    branchHead: binding.candidateSha,
    pullRequestNumber: 12,
    mergeCommitSha: mergeSha
  })
  assert.equal(result.passed, false)
})

test('a newer failing duplicate required check blocks an older success', async () => {
  const binding = remoteBinding({
    action: 'verify-pr',
    pullRequest: {
      baseRef: 'main',
      draft: true,
      number: 12,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: 'Exact candidate'
    }
  })
  const adapter = new GitHubRemoteAdapter(new ScenarioRunner(binding.candidateSha, '8'.repeat(40)))
  const pull = {
    number: 12,
    state: 'OPEN' as const,
    draft: true,
    baseRef: 'main',
    headRef: binding.headRef,
    headSha: binding.candidateSha,
    mergeCommitSha: null,
    title: binding.pullRequest.title,
    body: binding.pullRequest.body
  }
  const result = await adapter.verify(
    binding,
    {
      branchHead: binding.candidateSha,
      mergeQueueEntry: null,
      mainHead: binding.integrationBase,
      pullRequest: pull,
      requiredChecks: [
        {
          id: 10,
          sha: binding.candidateSha,
          name: 'Baseline Checks',
          status: 'completed',
          conclusion: 'success'
        },
        {
          id: 11,
          sha: binding.candidateSha,
          name: 'Baseline Checks',
          status: 'completed',
          conclusion: 'failure'
        }
      ],
      mainParents: [],
      pullMergeParents: [],
      reviewGate: emptyGate
    },
    {
      action: 'verify-pr',
      mutationPerformed: false,
      recoveredFromRemoteTruth: false,
      branchHead: binding.candidateSha,
      pullRequestNumber: 12,
      mergeCommitSha: null
    }
  )
  assert.equal(result.passed, false)
  assert.equal(result.status, 'PR_CI_PENDING')
})
