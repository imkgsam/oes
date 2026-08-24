#!/usr/bin/env node
import {
  loadRemoteBinding,
  loadTrustedStageChildCleanupAuthorization,
  loadTrustedStageCleanupAuthorization
} from './binding.ts'
import { canonicalJson, readJson, writeJsonAtomic } from './canonical.ts'
import {
  planChildSelfCleanup,
  verifyChildCleanupResults,
  verifyCleanupOnlyDeletion
} from './cleanup.ts'
import { assessDrift, createEvidenceKey } from './evidence.ts'
import { RuntimeContractError, fail } from './errors.ts'
import { GitHubRemoteAdapter } from './github-adapter.ts'
import {
  SystemPreflightProbeAdapter,
  loadRemoteTrustRootsFromProfileReport,
  runEffectiveProfilePreflight,
  verifyEffectiveProfileReport,
  type PreflightRequest,
  type SystemProbeOptions
} from './profile-preflight.ts'
import { validateJsonSchema } from './schema-validation.ts'
import { RemoteDriver } from './remote-driver.ts'
import type {
  CleanupDiffEntry,
  CleanupResourceDecision,
  CompletedCleanupResource,
  DriftAssessmentInput,
  EffectiveProfileReport,
  EvidenceKeyInput,
  ObservedCleanupResource
} from './types.ts'

/** Returns the value following one required command-line flag. */
function flag(args: string[], name: string): string {
  const index = args.indexOf(name)
  if (index < 0 || index + 1 >= args.length) fail('CLI_ARGUMENT_REQUIRED', name)
  return args[index + 1]
}

/** Emits one deterministic JSON value for machine consumption. */
function emit(value: unknown): void {
  process.stdout.write(`${canonicalJson(value)}\n`)
}

/** Runs one collaboration-runtime subcommand. */
async function main(args: string[]): Promise<void> {
  const command = args[0]
  if (command === 'validate-binding') {
    const profileReport = verifyEffectiveProfileReport(
      readJson<EffectiveProfileReport>(flag(args, '--profile-report'))
    )
    const trust = loadRemoteTrustRootsFromProfileReport(profileReport)
    const binding = loadRemoteBinding(flag(args, '--binding'), trust)
    emit({
      status: 'BINDING_VALID',
      bindingFingerprint: binding.bindingFingerprint,
      action: binding.action
    })
    return
  }
  if (command === 'remote') {
    const profileReport = verifyEffectiveProfileReport(
      readJson<EffectiveProfileReport>(flag(args, '--profile-report'))
    )
    const trust = loadRemoteTrustRootsFromProfileReport(profileReport)
    const binding = loadRemoteBinding(flag(args, '--binding'), trust)
    emit(await new RemoteDriver(new GitHubRemoteAdapter(), trust).run(binding))
    return
  }
  if (command === 'profile-preflight') {
    const input = readJson<{ request: PreflightRequest; systemProbe: SystemProbeOptions }>(
      flag(args, '--input')
    )
    emit(
      await runEffectiveProfilePreflight(
        input.request,
        new SystemPreflightProbeAdapter(input.systemProbe)
      )
    )
    return
  }
  if (command === 'schema-validate') {
    const schema = readJson<Record<string, unknown>>(flag(args, '--schema'))
    const value = readJson<unknown>(flag(args, '--input'))
    validateJsonSchema(schema, value)
    emit({ status: 'SCHEMA_VALID' })
    return
  }
  if (command === 'profile-verify') {
    const report = verifyEffectiveProfileReport(
      readJson<EffectiveProfileReport>(flag(args, '--report'))
    )
    emit({
      status: 'PROFILE_VERIFIED',
      ownerTaskId: report.ownerTaskId,
      normalPermissionPromptCount: 0
    })
    return
  }
  if (command === 'evidence-key') {
    const key = createEvidenceKey(readJson<EvidenceKeyInput>(flag(args, '--input')))
    const output = flag(args, '--output')
    writeJsonAtomic(output, key)
    emit(key)
    return
  }
  if (command === 'affected-tests') {
    const assessment = assessDrift(readJson<DriftAssessmentInput>(flag(args, '--input')))
    const output = flag(args, '--output')
    writeJsonAtomic(output, assessment)
    emit(assessment)
    return
  }
  if (command === 'cleanup-plan') {
    const profileReport = verifyEffectiveProfileReport(
      readJson<EffectiveProfileReport>(flag(args, '--profile-report'))
    )
    const trust = loadRemoteTrustRootsFromProfileReport(profileReport)
    const { root: authorization, child } = loadTrustedStageChildCleanupAuthorization(
      flag(args, '--authorization'),
      flag(args, '--child-authorization'),
      trust
    )
    const observations = readJson<ObservedCleanupResource[]>(flag(args, '--observed'))
    const output = flag(args, '--output')
    const completedPath = args.includes('--completed') ? flag(args, '--completed') : null
    const completed = completedPath ? readJson<CompletedCleanupResource[]>(completedPath) : []
    const plan = planChildSelfCleanup(authorization, child.ownerTaskId, observations, completed)
    writeJsonAtomic(output, plan)
    emit(plan)
    return
  }
  if (command === 'cleanup-verify') {
    const profileReport = verifyEffectiveProfileReport(
      readJson<EffectiveProfileReport>(flag(args, '--profile-report'))
    )
    const trust = loadRemoteTrustRootsFromProfileReport(profileReport)
    const authorization = loadTrustedStageCleanupAuthorization(flag(args, '--authorization'), trust)
    if (authorization.stageOwnerTaskId !== trust.ownerTaskId)
      fail('STAGE_CLEANUP_VERIFIER_OWNER_MISMATCH', trust.ownerTaskId)
    const diff = readJson<CleanupDiffEntry[]>(flag(args, '--diff'))
    const childResults = readJson<Record<string, CleanupResourceDecision[]>>(
      flag(args, '--child-results')
    )
    verifyCleanupOnlyDeletion(authorization, diff)
    verifyChildCleanupResults(authorization, childResults)
    emit({ status: 'STAGE_CLEANUP_VERIFIED', stageKey: authorization.stageKey })
    return
  }
  fail('CLI_COMMAND_UNKNOWN', command ?? 'NONE')
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = error instanceof RuntimeContractError ? 2 : 1
})
