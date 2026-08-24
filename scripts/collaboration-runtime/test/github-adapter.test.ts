import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GitHubRemoteAdapter,
  type CommandResult,
  type CommandRunner
} from '../src/github-adapter.ts'
import type { RemoteTruth } from '../src/types.ts'
import { remoteBinding } from './helpers.ts'

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
    if (command === 'git' && args[0] === 'status') return { stdout: '', stderr: '', exitCode: 0 }
    if (command === 'git' && args[0] === 'rev-parse' && args[1] === 'HEAD')
      return { stdout: `${this.candidate}\n`, stderr: '', exitCode: 0 }
    if (command === 'git' && args[0] === 'branch' && args[1] === '--show-current')
      return { stdout: 'codex/feature/runtime\n', stderr: '', exitCode: 0 }
    if (command === 'git' && args[0] === 'ls-remote') {
      const ref = args.at(-1)
      const sha = ref === 'refs/heads/main' ? this.main : this.candidate
      return { stdout: `${sha}\t${ref}\n`, stderr: '', exitCode: 0 }
    }
    if (command === 'git' && args[0] === 'fetch') return { stdout: '', stderr: '', exitCode: 0 }
    if (command === 'git' && args[0] === 'cat-file')
      return {
        stdout: `tree ${'a'.repeat(40)}\nparent ${'b'.repeat(40)}\n`,
        stderr: '',
        exitCode: 0
      }
    if (command === 'gh' && args[0] === 'api' && args.some((arg) => arg.includes('/pulls?'))) {
      const pulls = this.pullExists
        ? [
            {
              number: 12,
              state: 'open',
              draft: true,
              merged_at: null,
              merge_commit_sha: null,
              head: { ref: 'codex/feature/runtime', sha: this.candidate },
              base: { ref: 'main' }
            }
          ]
        : []
      return { stdout: JSON.stringify(pulls), stderr: '', exitCode: 0 }
    }
    if (command === 'gh' && args[0] === 'api' && args.includes('POST')) {
      this.pullExists = true
      return { stdout: JSON.stringify({ number: 12 }), stderr: '', exitCode: 0 }
    }
    if (command === 'gh' && args[0] === 'api' && args.some((arg) => arg.includes('/check-runs'))) {
      return { stdout: JSON.stringify({ check_runs: [] }), stderr: '', exitCode: 0 }
    }
    return { stdout: '', stderr: '', exitCode: 0 }
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
    mainParents: []
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
    mainParents: []
  }
  await assert.rejects(adapter.preflight(binding, truth), /LATEST_MAIN_DRIFT/)
})
