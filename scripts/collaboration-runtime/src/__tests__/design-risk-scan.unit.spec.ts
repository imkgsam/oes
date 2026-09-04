import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../canonical.ts'
import {
  DESIGN_RISK_SURFACES,
  createDesignRiskScan,
  validateDesignRiskScan,
  type DesignRiskScanInput,
  type DesignRiskSurfaceInput
} from '../design-risk-scan.ts'
import { validateJsonSchema } from '../schema-validation.ts'

const schema = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', 'schemas', 'design-risk-scan.schema.json'), 'utf8')
) as Record<string, unknown>

const surface = (id: (typeof DESIGN_RISK_SURFACES)[number]): DesignRiskSurfaceInput => ({
  surface: id,
  truthReferences: ['docs/governance/codex-execution-model.md'],
  conclusion: `${id} is already bounded by canonical execution truth.`,
  gap: null
})

const input = (): DesignRiskScanInput => ({
  featureKey: 'risk-tiered-evidence-validation',
  truthBaseline: '1'.repeat(40),
  scopeFingerprint: '2'.repeat(64),
  surfaces: DESIGN_RISK_SURFACES.map(surface)
})

test('the complete canonical risk matrix returns EXISTING_TRUTH_SUFFICIENT', () => {
  const result = createDesignRiskScan(input())
  assert.equal(result.result, 'EXISTING_TRUTH_SUFFICIENT')
  assert.deepEqual(result.gaps, [])
  assert.deepEqual(
    result.surfaces.map((entry) => entry.surface),
    DESIGN_RISK_SURFACES
  )
  assert.deepEqual(validateDesignRiskScan(result), result)
  assert.doesNotThrow(() => validateJsonSchema(schema, result))
})

test('one pinpointed surface gap returns DESIGN_GAP and preserves the exact detail', () => {
  const value = input()
  const eventSurface = value.surfaces.find(
    (entry) => entry.surface === 'EVENT_PUBLISHER_CONSUMER_DURABILITY_DLQ'
  )
  if (!eventSurface) throw new Error('missing event surface fixture')
  eventSurface.gap = 'No canonical DLQ ownership is defined for the proposed event.'
  eventSurface.conclusion = 'The proposed event adds an unowned failure path.'
  const result = createDesignRiskScan(value)
  assert.equal(result.result, 'DESIGN_GAP')
  assert.deepEqual(result.gaps, [
    {
      surface: 'EVENT_PUBLISHER_CONSUMER_DURABILITY_DLQ',
      detail: 'No canonical DLQ ownership is defined for the proposed event.'
    }
  ])
  assert.doesNotThrow(() => validateJsonSchema(schema, result))
})

test('missing, duplicate and unknown risk surfaces fail closed', () => {
  const missing = input()
  missing.surfaces.pop()
  assert.throws(() => createDesignRiskScan(missing), /DESIGN_RISK_SCAN_SURFACE_SET_INVALID/)

  const duplicate = input()
  duplicate.surfaces[1] = structuredClone(duplicate.surfaces[0])
  assert.throws(() => createDesignRiskScan(duplicate), /DESIGN_RISK_SCAN_SURFACE_DUPLICATE/)

  const unknown = input()
  unknown.surfaces[0].surface = 'UNBOUNDED_EXTRA_SURFACE' as never
  assert.throws(() => createDesignRiskScan(unknown), /DESIGN_RISK_SCAN_SURFACE_SET_INVALID/)
})

test('a sufficient conclusion requires canonical truth references', () => {
  const value = input()
  value.surfaces[0].truthReferences = []
  assert.throws(() => createDesignRiskScan(value), /DESIGN_RISK_SCAN_SUFFICIENT_WITHOUT_TRUTH/)
})

test('the executable schema also rejects a re-sealed sufficient surface without truth', () => {
  const result = createDesignRiskScan(input())
  result.surfaces[0].truthReferences = []
  result.scanFingerprint = objectFingerprint(
    result as unknown as Record<string, unknown>,
    'scanFingerprint'
  )
  assert.throws(() => validateDesignRiskScan(result), /DESIGN_RISK_SCAN_SUFFICIENT_WITHOUT_TRUTH/)
  assert.throws(() => validateJsonSchema(schema, result), /JSON_SCHEMA_VALIDATION_FAILED/)
})

test('runtime and schema reject absolute, traversal, empty-segment, and trailing truth paths', () => {
  for (const reference of [
    '/absolute/docs/governance.md',
    'docs/../secrets',
    'docs/./governance.md',
    'docs//governance.md',
    'docs/governance/',
    'scripts/collaboration-runtime/src/evidence.ts'
  ]) {
    const value = input()
    value.surfaces[0].truthReferences = [reference]
    assert.throws(
      () => createDesignRiskScan(value),
      /DESIGN_RISK_SCAN_TRUTH_REFERENCE_INVALID/,
      reference
    )
    const persisted = createDesignRiskScan(input())
    persisted.surfaces[0].truthReferences = [reference]
    persisted.scanFingerprint = objectFingerprint(
      persisted as unknown as Record<string, unknown>,
      'scanFingerprint'
    )
    assert.throws(
      () => validateJsonSchema(schema, persisted),
      /JSON_SCHEMA_VALIDATION_FAILED/,
      reference
    )
  }
})

test('runtime and schema require each of the seven distinct risk surface identities', () => {
  const result = createDesignRiskScan(input())
  result.surfaces[1].surface = result.surfaces[0].surface
  result.surfaces[1].conclusion = 'Distinct bytes cannot disguise a duplicate surface identity.'
  result.scanFingerprint = objectFingerprint(
    result as unknown as Record<string, unknown>,
    'scanFingerprint'
  )
  assert.throws(() => validateDesignRiskScan(result), /DESIGN_RISK_SCAN_SURFACE_DUPLICATE/)
  assert.throws(() => validateJsonSchema(schema, result), /JSON_SCHEMA_VALIDATION_FAILED/)
})

test('altered persisted scan results fail their self-hash check', () => {
  const result = createDesignRiskScan(input())
  result.result = 'DESIGN_GAP'
  assert.throws(() => validateDesignRiskScan(result), /DESIGN_RISK_SCAN_FINGERPRINT_MISMATCH/)
})

test('the executable schema rejects any third result value', () => {
  const result = createDesignRiskScan(input()) as unknown as Record<string, unknown>
  result.result = 'UNKNOWN_RESULT'
  assert.throws(() => validateJsonSchema(schema, result), /enum/)
})
