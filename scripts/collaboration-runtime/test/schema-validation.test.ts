import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateJsonSchema } from '../src/schema-validation.ts'
import { cleanupAuthorization, remoteBinding } from './helpers.ts'

const schema = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', name), 'utf8')) as Record<
    string,
    unknown
  >

test('executable schemas accept representative runtime bindings and Stage authorizations', () => {
  const binding = remoteBinding()
  const authority = JSON.parse(readFileSync(binding.authorization.path, 'utf8')) as {
    rootAuthorization: { path: string }
  }
  const rootAuthorization = JSON.parse(
    readFileSync(authority.rootAuthorization.path, 'utf8')
  ) as Record<string, unknown>
  validateJsonSchema(schema('remote-binding.schema.json'), binding)
  validateJsonSchema(schema('remote-authorization.schema.json'), authority)
  validateJsonSchema(schema('remote-authorization-root.schema.json'), rootAuthorization)
  validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), cleanupAuthorization())
})

test('executable Stage schema and runtime both reject an empty batch', () => {
  const value = cleanupAuthorization()
  value.terminalFeatures = []
  value.allowedDeletedFeaturePackets = []
  assert.throws(
    () => validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), value),
    /minItems/
  )
})

test('effective-profile schema rejects duplicate declarations and open nested credential fields', () => {
  const value = {
    schemaVersion: 1,
    kind: 'OES_EFFECTIVE_PROFILE_REPORT',
    ownerTaskId: '/root/fl',
    transitionId: 't',
    expectedState: 'HANDOFF_PENDING',
    declaredCapabilities: ['filesystemWrite', 'filesystemWrite'],
    profile: { name: 'p', permission: 'owner', path: '/tmp/p', sha256: 'a'.repeat(64) },
    observations: [
      {
        name: 'filesystemWrite',
        command: 'probe',
        literalOutput: 'PASS',
        exitCode: 0,
        result: 'PASS',
        evidencePath: '/tmp/e',
        evidenceSha256: 'b'.repeat(64)
      }
    ],
    credentialReference: {
      reference: 'git',
      keys: ['username', 'password'],
      secretValuesRecorded: false,
      passwordValue: 'secret'
    },
    telemetry: {
      eventSource: '/tmp/t',
      eventSourceSha256: 'c'.repeat(64),
      approvalPolicy: 'on-request',
      approvalsReviewer: 'auto_review',
      approvalEventCount: 0,
      normalPermissionPromptCount: 0
    }
  }
  assert.throws(
    () => validateJsonSchema(schema('effective-profile-report.schema.json'), value),
    /uniqueItems|additionalProperties/
  )
})

test('remote binding schema and runtime both reject main as the owner head', () => {
  const value = remoteBinding({ headRef: 'main' })
  assert.throws(() => validateJsonSchema(schema('remote-binding.schema.json'), value), /not/)
})

test('executable schema validation fails closed on unknown keywords', () => {
  assert.throws(
    () => validateJsonSchema({ type: 'string', format: 'uri' }, 'https://example.test'),
    /JSON_SCHEMA_KEYWORD_UNSUPPORTED/
  )
})
