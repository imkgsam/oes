// GATEWAY_GLOBAL_PREFIX_EXCLUDES keeps root-level operational and public edge endpoints outside /api/v1.
export const GATEWAY_GLOBAL_PREFIX_EXCLUDES = [
  'health',
  'health/ready',
  'docs',
  'docs-json',
  'c/:shortCode'
]
