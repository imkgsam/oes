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
  validateJsonSchema(schema('remote-binding.schema.json'), remoteBinding())
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
