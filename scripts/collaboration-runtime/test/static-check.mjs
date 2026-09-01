import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const base = new URL('..', import.meta.url)
const repo = new URL('../../..', import.meta.url)
const workflow = readFileSync(new URL('.github/workflows/ci.yml', repo), 'utf8')
const shadowWorkflow = readFileSync(
  new URL('.github/workflows/ci-optimized-shadow.yml', repo),
  'utf8'
)
const packageJson = JSON.parse(readFileSync(new URL('package.json', repo), 'utf8'))
assert.match(workflow, /merge_group:/)
assert.match(workflow, /name: Baseline Checks/)
assert.match(workflow, /^concurrency:\n/m)
assert.match(workflow, /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/)
assert.match(workflow, /--mode LEGACY_CONTROL/)
assert.match(workflow, /actions\/upload-artifact@v7/)
assert.match(workflow, /^  static-risk:\n/m)
assert.match(workflow, /^  l2-runtime:\n/m)
assert.match(workflow, /^  baseline:\n/m)
assert.match(workflow, /^    if: \$\{\{ always\(\) \}\}$/m)
assert.match(workflow, /^    needs: \[static-risk, l2-runtime\]$/m)
assert.match(
  workflow,
  /OES_CI_TASK_KEY: ci_\$\{\{ github\.run_id \}\}_\$\{\{ github\.run_attempt \}\}_static/
)
assert.match(
  workflow,
  /OES_CI_TASK_KEY: ci_\$\{\{ github\.run_id \}\}_\$\{\{ github\.run_attempt \}\}_l2/
)
assert.match(workflow, /^\s*run: pnpm env:ensure -- --task-key="\$\{OES_CI_TASK_KEY\}"$/m)
assert.match(workflow, /^\s*run: pnpm generated:all$/m)
assert.match(workflow, /^\s*run: pnpm build:prepared$/m)
assert.match(workflow, /^\s*run: pnpm test:risk$/m)
assert.match(workflow, /^\s*run: pnpm test:l2$/m)
assert.match(workflow, /test "\$\{STATIC_RISK_RESULT\}" = "success"/)
assert.match(workflow, /test "\$\{L2_RUNTIME_RESULT\}" = "success"/)
assert.equal((workflow.match(/^\s*run: pnpm generated:all$/gm) ?? []).length, 1)
assert.equal((workflow.match(/^\s*run: pnpm test:risk$/gm) ?? []).length, 1)
assert.equal((workflow.match(/^\s*run: pnpm test:l2$/gm) ?? []).length, 1)
assert.match(shadowWorkflow, /^name: CI Optimized Shadow$/m)
assert.match(shadowWorkflow, /name: Optimized Shadow \(non-required\)/)
assert.doesNotMatch(shadowWorkflow, /name: Baseline Checks/)
assert.match(shadowWorkflow, /--mode OPTIMIZED_SHADOW/)
assert.match(shadowWorkflow, /--parallel-shards 2/)
assert.match(shadowWorkflow, /--parallel-shards 3/)
assert.match(shadowWorkflow, /--prepared/)
assert.match(shadowWorkflow, /actions\/upload-artifact@v7/)
assert.match(shadowWorkflow, /actions\/download-artifact@v8/)
assert.equal(
  (shadowWorkflow.match(/name: optimized-shadow-prepare-\$\{\{ github\.run_id \}\}/g) ?? []).length,
  4
)
assert.doesNotMatch(
  shadowWorkflow,
  /name: optimized-shadow-prepare-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/
)
assert.match(
  shadowWorkflow,
  /name: optimized-shadow-prepare-\$\{\{ github\.run_id \}\}\n\s+path:[\s\S]*?overwrite: true/
)
assert.match(shadowWorkflow, /const name = `optimized-shadow-prepare-\$\{run\.id\}`/)
assert.match(shadowWorkflow, /tar --sort=name --mtime='UTC 1970-01-01'/)
assert.match(shadowWorkflow, /\*\/prisma\/generated\/prisma/)
assert.match(shadowWorkflow, /ci-prepared-artifact\.mjs stage/)
assert.match(shadowWorkflow, /ci-prepared-artifact\.mjs restore/)
assert.match(shadowWorkflow, /--exclude='\*\/prisma\/generated\/prisma\/libquery_engine-\*'/)
assert.match(shadowWorkflow, /OES_PREPARED_ARTIFACT_DIGEST/)
assert.ok((shadowWorkflow.match(/actions\/download-artifact@v8/g) ?? []).length >= 3)
assert.match(shadowWorkflow, /actions\/github-script@v9/)
assert.match(shadowWorkflow, /ci-main-equivalence\.mjs/)
assert.match(shadowWorkflow, /Run fail-closed full fallback when equivalence is absent/)
assert.match(shadowWorkflow, /shadow_risk/)
assert.match(shadowWorkflow, /shadow_unit/)
assert.doesNotMatch(shadowWorkflow, /matrix\.shard/)
assert.ok((shadowWorkflow.match(/pnpm env:ensure -- --task-key/g) ?? []).length >= 3)
assert.match(
  shadowWorkflow,
  /if: \$\{\{ always\(\) \}\}\n    needs: \[prepare, risk-core, unit-shards, l2-shards, main-equivalence-smoke\]/
)
assert.match(packageJson.scripts['build:prepared'], /tsc -b tsconfig\.json/)
assert.doesNotMatch(packageJson.scripts['build:prepared'], /generated:all/)
assert.match(packageJson.scripts['test:risk'], /pnpm collaboration-runtime:check/)
assert.match(
  packageJson.scripts['test:risk'],
  /node --test scripts\/local\/foundation-trusted-grpc-atomic-group\.spec\.mjs/
)
const l2Runner = readFileSync(new URL('scripts/local/l2-test-runner.mjs', repo), 'utf8')
assert.match(l2Runner, /\['db:up', '--', '--profile', 'l2'\]/)
assert.match(l2Runner, /\['db:migrate', '--', '--services'/)
assert.match(l2Runner, /L2_JEST_TIMEOUT_MS = 30_000/)
const databaseLifecycle = readFileSync(
  new URL('scripts/local/database-lifecycle.mjs', repo),
  'utf8'
)
assert.match(databaseLifecycle, /longRunningServices: Object\.freeze\(\['postgres', 'nats'\]\)/)
assert.match(databaseLifecycle, /DATABASE_SERVICE_UNKNOWN/)
const mainEquivalence = readFileSync(new URL('scripts/local/ci-main-equivalence.mjs', repo), 'utf8')
assert.match(mainEquivalence, /CI_MAIN_MERGE_PARENT_COUNT/)
assert.match(mainEquivalence, /CI_MAIN_ARTIFACT_EVIDENCE_MISMATCH/)
const preparedArtifact = readFileSync(
  new URL('scripts/local/ci-prepared-artifact.mjs', repo),
  'utf8'
)
assert.match(preparedArtifact, /CI_PREPARED_ENGINE_DIGEST_MISMATCH/)
assert.match(preparedArtifact, /CI_PREPARED_ENGINE_MANIFEST_INVALID/)
const entry = readFileSync(new URL('bin/oes-remote-driver', base), 'utf8')
assert.match(entry, /^#!\/bin\/sh\nset -eu\n/)
assert.match(entry, /exec node --experimental-strip-types/)
assert.doesNotMatch(entry, /git |gh |curl /)
const profile = readFileSync(new URL('profile/oes-project-owner.config.toml', base), 'utf8')
assert.match(profile, /approval_policy = "on-request"/)
assert.match(profile, /approvals_reviewer = "auto_review"/)
assert.match(profile, /allow_local_binding = true/)
assert.match(profile, /"\*\*\/\.env" = "deny"/)
assert.match(profile, /trusted_authorization_root = "{{TRUSTED_AUTHORIZATION_ROOT}}"/)
assert.match(profile, /owner_task_id = "{{OWNER_TASK_ID}}"/)
assert.match(profile, /transition_id = "{{TRANSITION_ID}}"/)
assert.match(profile, /"{{TRUSTED_AUTHORIZATION_ROOT}}" = "read"/)
assert.doesNotMatch(profile, /OES_REMOTE_AUTHORIZATION_ROOT|OES_REMOTE_ADMISSION_ROOT/)
assert.match(profile, /"{{OWNER_GIT_DIRECTORY}}" = "write"/)
assert.doesNotMatch(profile, /GIT_COMMON_DIRECTORY.*write/)
const cli = readFileSync(new URL('src/cli.ts', base), 'utf8')
assert.match(cli, /profile-preflight/)
assert.match(cli, /schema-validate/)
assert.match(cli, /ud-queue-view/)
assert.match(cli, /ci-recovery-decision/)
assert.match(cli, /local-main/)
assert.match(cli, /stage-merge-plan/)
assert.match(cli, /stage-merge-candidate-readback/)
assert.match(cli, /stage-merge-revision/)
assert.match(cli, /stage-lifecycle-plan/)
assert.match(cli, /--profile-report/)
assert.match(cli, /--child-authorization/)
assert.match(readFileSync(new URL('src/binding.ts', base), 'utf8'), /current-stage-cleanup\.json/)
assert.doesNotMatch(cli, /flag\(args, '--owner'\)/)
assert.doesNotMatch(cli, /OES_REMOTE_AUTHORIZATION_ROOT|OES_REMOTE_ADMISSION_ROOT/)
assert.doesNotMatch(cli, /binding-fingerprint|cleanup-fingerprint/)
const proposalQueue = readFileSync(new URL('src/proposal-queue.ts', base), 'utf8')
assert.match(proposalQueue, /PROPOSAL_FIFO_ADMISSION_VIOLATION/)
assert.match(proposalQueue, /PROPOSAL_TERMINAL_EXACT_RETURN_UNPROVEN/)
assert.doesNotMatch(proposalQueue, /writeFile|setInterval|setTimeout/)
const retryPolicy = readFileSync(new URL('src/retry-policy.ts', base), 'utf8')
assert.match(retryPolicy, /maxRetries: 3/)
assert.match(retryPolicy, /EXTERNAL_PERMISSION_BLOCKER/)
const localMain = readFileSync(new URL('src/local-main.ts', base), 'utf8')
assert.match(localMain, /\['merge', '--ff-only'/)
assert.match(localMain, /\['fetch', '--no-tags', binding\.remote, binding\.branch\]/)
assert.doesNotMatch(localMain, /\['(?:reset|stash|rebase|checkout)'|setInterval|setTimeout/)
const stageMerge = readFileSync(new URL('src/stage-merge.ts', base), 'utf8')
assert.match(stageMerge, /STOP_SAME_STAGE_SUFFIX_ON_FAILURE/)
assert.match(stageMerge, /git\/commits\/\$\{result\.mergeSha\}/)
assert.match(stageMerge, /Baseline Checks/)
assert.match(stageMerge, /ls-remote/)
assert.match(stageMerge, /commit\.parents\[0\]\?\.sha !== expectedFirstParent/)
assert.match(stageMerge, /STAGE_MERGE_REFRESH_NOT_FAST_FORWARD/)
assert.match(stageMerge, /verifyTechnicalRevisionEquivalence/)
assert.doesNotMatch(stageMerge, /setInterval|setTimeout|writeFile/)
const stageLifecycle = readFileSync(new URL('src/stage-lifecycle.ts', base), 'utf8')
assert.match(stageLifecycle, /EXCLUDE_GLOBAL_UD/)
assert.match(stageLifecycle, /TASK_NATIVE_CREATION_RECEIPTS/)
assert.match(stageLifecycle, /CODEX_TASK_NATIVE/)
assert.match(stageLifecycle, /verifyTrustedReference/)
assert.match(stageLifecycle, /STAGE_LIFECYCLE_TRUSTED_AUTHORITY_REQUIRED/)
assert.doesNotMatch(stageLifecycle, /setInterval|setTimeout|writeFile/)
const ciPerformanceGate = readFileSync(
  new URL('scripts/local/ci-performance-gate.mjs', repo),
  'utf8'
)
assert.match(ciPerformanceGate, /CI_PERFORMANCE_TRUSTED_SAMPLE_REQUIRED/)
assert.match(ciPerformanceGate, /GITHUB_ACTIONS_READBACK/)
assert.match(l2Runner, /\['collaboration-service', 'notification-service'\]/)
const schemaValidator = readFileSync(new URL('src/schema-validation.ts', base), 'utf8')
assert.match(schemaValidator, /JSON_SCHEMA_VALIDATION_FAILED/)
assert.match(schemaValidator, /JSON_SCHEMA_KEYWORD_UNSUPPORTED/)
assert.match(schemaValidator, /schema\.not/)
for (const file of readdirSync(new URL('schemas', base)))
  JSON.parse(readFileSync(new URL(`schemas/${file}`, base), 'utf8'))
console.log('collaboration-runtime static checks: PASS')
