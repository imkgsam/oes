import { spawnSync } from 'node:child_process'
import { fail } from './errors.ts'
import type { RemoteAdapter } from './remote-driver.ts'
import type {
  RemoteDriverBinding,
  RemoteReceipt,
  RemoteTruth,
  RemoteVerification,
  RequiredCheckTruth,
  PullRequestTruth
} from './types.ts'

export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface CommandRunner {
  run(command: string, args: string[], cwd: string): CommandResult
}

/** Executes one child process without a shell and preserves literal output. */
export class SpawnCommandRunner implements CommandRunner {
  run(command: string, args: string[], cwd: string): CommandResult {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.status ?? 1
    }
  }
}

/** Requires a command to succeed and returns its literal stdout. */
function checked(runner: CommandRunner, command: string, args: string[], cwd: string): string {
  const result = runner.run(command, args, cwd)
  if (result.exitCode !== 0)
    fail(
      'REMOTE_COMMAND_FAILED',
      `${command} ${args.join(' ')} [${result.exitCode}] ${result.stderr.trim()}`
    )
  return result.stdout
}

/** Parses one exact ls-remote branch result. */
function parseRemoteHead(output: string, ref: string): string | null {
  const lines = output.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return null
  if (lines.length !== 1) fail('REMOTE_REF_AMBIGUOUS', ref)
  const [sha, actualRef] = lines[0].split(/\s+/)
  if (actualRef !== ref || !/^[0-9a-f]{40}$/.test(sha)) fail('REMOTE_REF_INVALID', lines[0])
  return sha
}

/** Converts a GitHub REST pull response into bounded remote truth. */
function parsePull(value: Record<string, unknown>): PullRequestTruth {
  const head = value.head as Record<string, unknown>
  const base = value.base as Record<string, unknown>
  const merged = value.merged_at !== null && value.merged_at !== undefined
  return {
    number: Number(value.number),
    state: merged ? 'MERGED' : String(value.state).toLowerCase() === 'open' ? 'OPEN' : 'CLOSED',
    draft: value.draft === true,
    baseRef: String(base.ref),
    headRef: String(head.ref),
    headSha: String(head.sha),
    mergeCommitSha: value.merge_commit_sha ? String(value.merge_commit_sha) : null
  }
}

/** Implements exact Git/GitHub operations for the repository remote driver. */
export class GitHubRemoteAdapter implements RemoteAdapter {
  readonly runner: CommandRunner
  readonly git: string
  readonly gh: string

  constructor(runner: CommandRunner = new SpawnCommandRunner(), git = 'git', gh = 'gh') {
    this.runner = runner
    this.git = git
    this.gh = gh
  }

  /** Runs local and latest-main guards before any bound action. */
  async preflight(binding: RemoteDriverBinding, truth: RemoteTruth): Promise<void> {
    const cwd = binding.repositoryRoot
    const status = checked(this.runner, this.git, ['status', '--porcelain'], cwd).trim()
    if (status) fail('OWNER_WORKTREE_DIRTY', status)
    const head = checked(this.runner, this.git, ['rev-parse', 'HEAD'], cwd).trim()
    if (head !== binding.candidateSha && binding.action !== 'verify-main')
      fail('LOCAL_HEAD_MISMATCH', head)
    const branch = checked(this.runner, this.git, ['branch', '--show-current'], cwd).trim()
    if (binding.action !== 'verify-main' && branch !== binding.headRef)
      fail('LOCAL_BRANCH_MISMATCH', branch)
    if (
      ['preflight', 'publish-pr', 'verify-pr'].includes(binding.action) ||
      (binding.action === 'merge-pr' && binding.admission?.mode === 'serial-latest-main')
    ) {
      if (truth.mainHead !== binding.integrationBase)
        fail('LATEST_MAIN_DRIFT', `${truth.mainHead} != ${binding.integrationBase}`)
      checked(
        this.runner,
        this.git,
        ['merge-base', '--is-ancestor', binding.integrationBase, binding.candidateSha],
        cwd
      )
    }
    if (
      binding.action === 'merge-pr' &&
      binding.admission?.mode === 'merge-queue' &&
      binding.admission.mergeGroupSha
    ) {
      if (!truth.requiredChecks.length)
        fail('MERGE_GROUP_CHECKS_ABSENT', binding.admission.mergeGroupSha)
    }
    if (
      binding.action === 'publish-pr' &&
      truth.pullRequest &&
      truth.pullRequest.state !== 'OPEN'
    ) {
      fail('PULL_REQUEST_REF_REUSED', String(truth.pullRequest.number))
    }
    if (truth.branchHead && truth.branchHead !== binding.candidateSha)
      fail('REMOTE_OWNER_BRANCH_DIVERGED', truth.branchHead)
    if (
      binding.pullRequest.number !== null &&
      truth.pullRequest?.number !== binding.pullRequest.number
    ) {
      fail('PULL_REQUEST_NUMBER_MISMATCH', String(truth.pullRequest?.number))
    }
  }

  /** Reads exact branch, pull, check and main state without mutating it. */
  async readTruth(binding: RemoteDriverBinding): Promise<RemoteTruth> {
    const cwd = binding.repositoryRoot
    const branchRef = `refs/heads/${binding.headRef}`
    const branchHead = parseRemoteHead(
      checked(this.runner, this.git, ['ls-remote', '--heads', 'origin', branchRef], cwd),
      branchRef
    )
    const mainHead = parseRemoteHead(
      checked(this.runner, this.git, ['ls-remote', '--heads', 'origin', 'refs/heads/main'], cwd),
      'refs/heads/main'
    )
    if (!mainHead) fail('REMOTE_MAIN_ABSENT', binding.repositorySlug)
    const pullRequest = this.readPull(binding)
    const mergeQueueEntry = this.readMergeQueueEntry(binding)
    const checkSha =
      binding.action === 'verify-main'
        ? mainHead
        : (binding.admission?.mergeGroupSha ?? pullRequest?.headSha ?? branchHead)
    const requiredChecks = checkSha ? this.readChecks(binding, checkSha) : []
    checked(this.runner, this.git, ['fetch', 'origin', 'main'], cwd)
    const commit = checked(this.runner, this.git, ['cat-file', '-p', 'origin/main'], cwd)
    const mainParents = commit
      .split('\n')
      .filter((line) => line.startsWith('parent '))
      .map((line) => line.slice('parent '.length))
    return { branchHead, mergeQueueEntry, mainHead, pullRequest, requiredChecks, mainParents }
  }

  /** Applies only the single mutation named by the binding. */
  async mutate(binding: RemoteDriverBinding, truth: RemoteTruth): Promise<RemoteReceipt> {
    const cwd = binding.repositoryRoot
    if (binding.action === 'publish-pr') {
      if (truth.branchHead === null) {
        checked(
          this.runner,
          this.git,
          ['push', 'origin', `${binding.candidateSha}:refs/heads/${binding.headRef}`],
          cwd
        )
      } else if (truth.branchHead !== binding.candidateSha) {
        fail('REMOTE_OWNER_BRANCH_DIVERGED', truth.branchHead)
      }
      const currentPull = this.readPull(binding)
      if (!currentPull) {
        checked(
          this.runner,
          this.gh,
          [
            'api',
            '--method',
            'POST',
            `repos/${binding.repositorySlug}/pulls`,
            '-f',
            `title=${binding.pullRequest.title}`,
            '-f',
            `body=${binding.pullRequest.body}`,
            '-f',
            `head=${binding.headRef}`,
            '-f',
            'base=main',
            '-F',
            'draft=true'
          ],
          cwd
        )
      }
    } else if (binding.action === 'merge-pr') {
      if (!this.requiredChecksPass(binding, truth.requiredChecks))
        fail('REQUIRED_CHECKS_NOT_PASSED', binding.candidateSha)
      if (truth.mainHead !== binding.integrationBase) fail('LATEST_MAIN_DRIFT', truth.mainHead)
      if (binding.admission?.mode === 'merge-queue') {
        checked(
          this.runner,
          this.gh,
          [
            'pr',
            'merge',
            String(binding.pullRequest.number),
            '--repo',
            binding.repositorySlug,
            '--merge',
            '--match-head-commit',
            binding.candidateSha
          ],
          cwd
        )
      } else {
        checked(
          this.runner,
          this.gh,
          [
            'api',
            '--method',
            'PUT',
            `repos/${binding.repositorySlug}/pulls/${binding.pullRequest.number}/merge`,
            '-f',
            'merge_method=merge',
            '-f',
            `sha=${binding.candidateSha}`
          ],
          cwd
        )
      }
    } else if (binding.action === 'cleanup') {
      if (truth.branchHead !== null && truth.branchHead !== binding.candidateSha) {
        fail('CLEANUP_REMOTE_SHA_MISMATCH', truth.branchHead)
      }
      if (truth.branchHead !== null)
        checked(this.runner, this.git, ['push', 'origin', `:refs/heads/${binding.headRef}`], cwd)
    } else {
      fail('READ_ONLY_ACTION_MUTATION_REQUESTED', binding.action)
    }
    const after = await this.readTruth(binding)
    return {
      action: binding.action,
      mutationPerformed: true,
      recoveredFromRemoteTruth: false,
      branchHead: after.branchHead,
      pullRequestNumber: after.pullRequest?.number ?? null,
      mergeCommitSha: after.pullRequest?.mergeCommitSha ?? null,
      cleanupResources: binding.cleanupResources
    }
  }

  /** Verifies the postcondition for the exact action. */
  async verify(binding: RemoteDriverBinding, truth: RemoteTruth): Promise<RemoteVerification> {
    if (binding.action === 'preflight')
      return {
        passed: truth.mainHead === binding.integrationBase,
        status: 'PREFLIGHT',
        literalResult: truth
      }
    if (binding.action === 'publish-pr') {
      const passed =
        truth.branchHead === binding.candidateSha &&
        truth.pullRequest?.state === 'OPEN' &&
        truth.pullRequest.draft &&
        truth.pullRequest.headSha === binding.candidateSha &&
        truth.pullRequest.baseRef === 'main'
      return {
        passed: Boolean(passed),
        status: passed ? 'PR_READY' : 'PR_NOT_READY',
        literalResult: truth.pullRequest
      }
    }
    if (binding.action === 'verify-pr') {
      const passed =
        truth.pullRequest?.headSha === binding.candidateSha &&
        this.requiredChecksPass(binding, truth.requiredChecks)
      return {
        passed: Boolean(passed),
        status: passed ? 'PR_CI_PASSED' : 'PR_CI_PENDING',
        literalResult: truth.requiredChecks
      }
    }
    if (binding.action === 'merge-pr') {
      const passed =
        truth.pullRequest?.state === 'MERGED' && truth.pullRequest.headSha === binding.candidateSha
      return {
        passed: Boolean(passed),
        status: passed ? 'MERGED' : 'MERGE_NOT_OBSERVED',
        literalResult: truth.pullRequest
      }
    }
    if (binding.action === 'verify-main') {
      const passed =
        truth.mainHead === binding.candidateSha &&
        truth.mainParents.length === 2 &&
        this.requiredChecksPass(binding, truth.requiredChecks)
      return {
        passed,
        status: passed ? 'MAIN_CI_PASSED' : 'MAIN_VERIFICATION_PENDING',
        literalResult: truth
      }
    }
    const passed = truth.branchHead === null
    return {
      passed,
      status: passed ? 'CLEANUP_VERIFIED' : 'CLEANUP_PENDING',
      literalResult: truth.branchHead
    }
  }

  /** Finds at most one pull request for the exact head/base pair. */
  private readPull(binding: RemoteDriverBinding): PullRequestTruth | null {
    const [owner] = binding.repositorySlug.split('/')
    const query = `repos/${binding.repositorySlug}/pulls?state=all&head=${encodeURIComponent(`${owner}:${binding.headRef}`)}&base=main&per_page=20`
    const raw = checked(this.runner, this.gh, ['api', query], binding.repositoryRoot)
    const pulls = JSON.parse(raw) as Record<string, unknown>[]
    const matches = pulls
      .map(parsePull)
      .filter(
        (pull) => binding.pullRequest.number === null || pull.number === binding.pullRequest.number
      )
    if (matches.length > 1) fail('PULL_REQUEST_AMBIGUOUS', binding.headRef)
    return matches[0] ?? null
  }

  /** Reads native merge-queue membership for the exact bound pull request. */
  private readMergeQueueEntry(
    binding: RemoteDriverBinding
  ): { id: string; position: number | null } | null {
    if (binding.admission?.mode !== 'merge-queue' || binding.pullRequest.number === null)
      return null
    const [owner, name] = binding.repositorySlug.split('/')
    const query =
      'query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){mergeQueueEntry{id position}}}}'
    const raw = checked(
      this.runner,
      this.gh,
      [
        'api',
        'graphql',
        '-f',
        `query=${query}`,
        '-f',
        `owner=${owner}`,
        '-f',
        `name=${name}`,
        '-F',
        `number=${binding.pullRequest.number}`
      ],
      binding.repositoryRoot
    )
    const response = JSON.parse(raw) as {
      data?: {
        repository?: {
          pullRequest?: { mergeQueueEntry?: { id: string; position?: number | null } | null }
        }
      }
    }
    const entry = response.data?.repository?.pullRequest?.mergeQueueEntry
    return entry ? { id: entry.id, position: entry.position ?? null } : null
  }

  /** Reads check runs for one exact commit without changing repository state. */
  private readChecks(binding: RemoteDriverBinding, sha: string): RequiredCheckTruth[] {
    const raw = checked(
      this.runner,
      this.gh,
      ['api', `repos/${binding.repositorySlug}/commits/${sha}/check-runs`],
      binding.repositoryRoot
    )
    const response = JSON.parse(raw) as { check_runs?: Array<Record<string, unknown>> }
    return (response.check_runs ?? []).map((check) => ({
      name: String(check.name),
      status: String(check.status),
      conclusion: check.conclusion === null ? null : String(check.conclusion)
    }))
  }

  /** Requires every bound check name to have one successful completed run. */
  private requiredChecksPass(binding: RemoteDriverBinding, checks: RequiredCheckTruth[]): boolean {
    return binding.pullRequest.requiredChecks.every((name) =>
      checks.some(
        (check) =>
          check.name === name && check.status === 'completed' && check.conclusion === 'success'
      )
    )
  }
}
