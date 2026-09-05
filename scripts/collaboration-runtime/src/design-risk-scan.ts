import { canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'

const SHA1_PATTERN = /^[0-9a-f]{40}$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const DELIVERY_KEY_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export const DESIGN_RISK_SURFACES = [
  'CROSS_SERVICE_FACT_OWNERSHIP',
  'PRE_LOGIN_IDENTITY_AND_ACTOR_KIND',
  'PERMISSION_ROLE_GRANT_PROVISIONING',
  'TENANT_ORG_OPERATOR_TRACE_AUDIT',
  'EVENT_PUBLISHER_CONSUMER_DURABILITY_DLQ',
  'MIGRATION_OWNERSHIP',
  'DEPENDENCY_CYCLES'
] as const
export type DesignRiskSurface = (typeof DESIGN_RISK_SURFACES)[number]

/** Supplies one bounded conclusion for one canonical design risk surface. */
export interface DesignRiskSurfaceInput {
  surface: DesignRiskSurface
  truthReferences: string[]
  conclusion: string
  gap: string | null
}

/** Supplies the complete bounded risk matrix for one delivery. */
export interface DesignRiskScanInput {
  deliveryKey: string
  truthBaseline: string
  scopeFingerprint: string
  surfaces: DesignRiskSurfaceInput[]
}

/** Records one exact canonical design gap. */
export interface DesignRiskGap {
  surface: DesignRiskSurface
  detail: string
}

/** Persists the only two permitted Design Risk Scan results. */
export interface DesignRiskScanResult {
  schemaVersion: 1
  kind: 'OES_DESIGN_RISK_SCAN_RESULT'
  deliveryKey: string
  truthBaseline: string
  scopeFingerprint: string
  result: 'EXISTING_TRUTH_SUFFICIENT' | 'DESIGN_GAP'
  surfaces: DesignRiskSurfaceInput[]
  gaps: DesignRiskGap[]
  scanFingerprint: string
}

/** Requires one canonical non-empty text field. */
function requireText(value: string, field: string): void {
  if (value.length === 0 || value.trim() !== value) fail('DESIGN_RISK_SCAN_TEXT_INVALID', field)
}

/** Requires one canonical repository-relative truth reference. */
function requireTruthReference(path: string): void {
  const segments = path.split('/')
  if (
    !path.startsWith('docs/') ||
    path.startsWith('/') ||
    path.endsWith('/') ||
    segments.some((segment) => segment === '' || segment === '.' || segment === '..')
  )
    fail('DESIGN_RISK_SCAN_TRUTH_REFERENCE_INVALID', path)
}

/** Creates a deterministic two-result Design Risk Scan from every canonical surface. */
export function createDesignRiskScan(input: DesignRiskScanInput): DesignRiskScanResult {
  if (!DELIVERY_KEY_PATTERN.test(input.deliveryKey))
    fail('DESIGN_RISK_SCAN_DELIVERY_KEY_INVALID', input.deliveryKey)
  if (!SHA1_PATTERN.test(input.truthBaseline))
    fail('DESIGN_RISK_SCAN_TRUTH_BASELINE_INVALID', input.truthBaseline)
  if (!SHA256_PATTERN.test(input.scopeFingerprint))
    fail('DESIGN_RISK_SCAN_SCOPE_FINGERPRINT_INVALID', input.scopeFingerprint)
  const duplicates = input.surfaces.filter(
    (entry, index) => input.surfaces.findIndex((item) => item.surface === entry.surface) !== index
  )
  if (duplicates.length > 0) fail('DESIGN_RISK_SCAN_SURFACE_DUPLICATE', duplicates[0].surface)
  const actualSurfaces = input.surfaces.map((entry) => entry.surface).sort()
  const expectedSurfaces = [...DESIGN_RISK_SURFACES].sort()
  if (canonicalJson(actualSurfaces) !== canonicalJson(expectedSurfaces))
    fail('DESIGN_RISK_SCAN_SURFACE_SET_INVALID', actualSurfaces.join(','))
  const surfaces = input.surfaces
    .map((entry) => {
      if (!DESIGN_RISK_SURFACES.includes(entry.surface))
        fail('DESIGN_RISK_SCAN_SURFACE_INVALID', entry.surface)
      requireText(entry.conclusion, `${entry.surface}.conclusion`)
      if (!Array.isArray(entry.truthReferences))
        fail('DESIGN_RISK_SCAN_TRUTH_REFERENCES_INVALID', entry.surface)
      const truthReferences = [...new Set(entry.truthReferences)].sort()
      truthReferences.forEach(requireTruthReference)
      if (entry.gap === null && truthReferences.length === 0)
        fail('DESIGN_RISK_SCAN_SUFFICIENT_WITHOUT_TRUTH', entry.surface)
      if (entry.gap !== null) requireText(entry.gap, `${entry.surface}.gap`)
      return {
        surface: entry.surface,
        truthReferences,
        conclusion: entry.conclusion,
        gap: entry.gap
      }
    })
    .sort(
      (left, right) =>
        DESIGN_RISK_SURFACES.indexOf(left.surface) - DESIGN_RISK_SURFACES.indexOf(right.surface)
    )
  const gaps = surfaces
    .filter((entry): entry is typeof entry & { gap: string } => entry.gap !== null)
    .map((entry) => ({ surface: entry.surface, detail: entry.gap }))
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_DESIGN_RISK_SCAN_RESULT' as const,
    deliveryKey: input.deliveryKey,
    truthBaseline: input.truthBaseline,
    scopeFingerprint: input.scopeFingerprint,
    result: gaps.length === 0 ? ('EXISTING_TRUTH_SUFFICIENT' as const) : ('DESIGN_GAP' as const),
    surfaces,
    gaps
  }
  return {
    ...base,
    scanFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Verifies one persisted Design Risk Scan result has not been altered. */
export function validateDesignRiskScan(result: DesignRiskScanResult): DesignRiskScanResult {
  const recreated = createDesignRiskScan({
    deliveryKey: result.deliveryKey,
    truthBaseline: result.truthBaseline,
    scopeFingerprint: result.scopeFingerprint,
    surfaces: result.surfaces
  })
  if (canonicalJson(recreated) !== canonicalJson(result))
    fail('DESIGN_RISK_SCAN_FINGERPRINT_MISMATCH', recreated.scanFingerprint)
  return recreated
}
