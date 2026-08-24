#!/usr/bin/env node
import {
  loadRemoteBinding,
  validateRemoteBinding,
  validateStageCleanupAuthorization
} from './binding.ts'
import { canonicalJson, objectFingerprint, readJson, writeJsonAtomic } from './canonical.ts'
import {
  planChildSelfCleanup,
  verifyChildCleanupResults,
  verifyCleanupOnlyDeletion
} from './cleanup.ts'
import { assessDrift, createEvidenceKey } from './evidence.ts'
import { RuntimeContractError, fail } from './errors.ts'
import { GitHubRemoteAdapter } from './github-adapter.ts'
import { verifyEffectiveProfileReport } from './profile-preflight.ts'
import { RemoteDriver } from './remote-driver.ts'
import type {
  RemoteDriverBinding,
  CleanupResourceDecision,
  DriftAssessmentInput,
  EffectiveProfileReport,
  EvidenceKeyInput,
  ObservedCleanupResource,
  StageCleanupAuthorization
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

/** Validates an in-memory binding produced by the fingerprint command. */
function loadRemoteBindingFromValue(binding: RemoteDriverBinding): RemoteDriverBinding {
  const computed = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  if (computed !== binding.bindingFingerprint) fail('BINDING_FINGERPRINT_MISMATCH', computed)
  return validateRemoteBinding(binding)
}

/** Runs one collaboration-runtime subcommand. */
async function main(args: string[]): Promise<void> {
  const command = args[0]
  if (command === 'binding-fingerprint') {
    const binding = readJson<RemoteDriverBinding>(flag(args, '--input'))
    binding.bindingFingerprint = objectFingerprint(
      binding as unknown as Record<string, unknown>,
      'bindingFingerprint'
    )
    const validated = loadRemoteBindingFromValue(binding)
    writeJsonAtomic(flag(args, '--output'), validated)
    emit(validated)
    return
  }
  if (command === 'cleanup-fingerprint') {
    const authorization = readJson<StageCleanupAuthorization>(flag(args, '--input'))
    authorization.authorizationFingerprint = objectFingerprint(
      authorization as unknown as Record<string, unknown>,
      'authorizationFingerprint'
    )
    const validated = validateStageCleanupAuthorization(authorization)
    writeJsonAtomic(flag(args, '--output'), validated)
    emit(validated)
    return
  }
  if (command === 'validate-binding') {
    const binding = loadRemoteBinding(flag(args, '--binding'))
    emit({
      status: 'BINDING_VALID',
      bindingFingerprint: binding.bindingFingerprint,
      action: binding.action
    })
    return
  }
  if (command === 'remote') {
    const binding = loadRemoteBinding(flag(args, '--binding'))
    emit(await new RemoteDriver(new GitHubRemoteAdapter()).run(binding))
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
    const authorization = readJson<StageCleanupAuthorization>(flag(args, '--authorization'))
    const observations = readJson<ObservedCleanupResource[]>(flag(args, '--observed'))
    const owner = flag(args, '--owner')
    const output = flag(args, '--output')
    const completedPath = args.includes('--completed') ? flag(args, '--completed') : null
    const completed = completedPath ? readJson<string[]>(completedPath) : []
    const plan = planChildSelfCleanup(authorization, owner, observations, completed)
    writeJsonAtomic(output, plan)
    emit(plan)
    return
  }
  if (command === 'cleanup-verify') {
    const authorization = readJson<StageCleanupAuthorization>(flag(args, '--authorization'))
    validateStageCleanupAuthorization(authorization)
    const deleted = readJson<string[]>(flag(args, '--deleted-paths'))
    const childResults = readJson<Record<string, CleanupResourceDecision[]>>(
      flag(args, '--child-results')
    )
    verifyCleanupOnlyDeletion(authorization, deleted)
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
