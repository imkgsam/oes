export interface NormalizedPublicReadFailure {
  statusCode: 400 | 404 | 503
  statusMessage: string
}

// normalizePublicReadFailure preserves public 400/404 responses while classifying network and Runtime 5xx failures as unavailable.
export function normalizePublicReadFailure(failure: unknown): NormalizedPublicReadFailure {
  const status = extractStatusCode(failure)
  if (status === 400) {
    return { statusCode: 400, statusMessage: 'Invalid public request' }
  }
  if (status === 404) {
    return { statusCode: 404, statusMessage: 'Public resource not found' }
  }
  return { statusCode: 503, statusMessage: 'Site Runtime is unavailable' }
}

// extractStatusCode reads the common H3/ofetch error shapes without coercing arbitrary public data.
function extractStatusCode(failure: unknown): number | undefined {
  if (!failure || typeof failure !== 'object') {
    return undefined
  }
  const record = failure as Record<string, unknown>
  if (typeof record.statusCode === 'number') {
    return record.statusCode
  }
  if (record.response && typeof record.response === 'object') {
    const response = record.response as Record<string, unknown>
    return typeof response.status === 'number' ? response.status : undefined
  }
  return undefined
}
