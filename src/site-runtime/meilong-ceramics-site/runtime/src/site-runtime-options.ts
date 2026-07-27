import type { OesSiteRuntimeModuleOptions } from '@oes/site-runtime-kit'

import { MEILONG_SITE_CAPABILITY_MANIFEST } from './site-capability-manifest'

// MEILONG_RUNTIME_MODULE_OPTIONS binds the complete Meilong capability manifest to Runtime Kit startup registration.
export const MEILONG_RUNTIME_MODULE_OPTIONS = {
  capabilityManifest: MEILONG_SITE_CAPABILITY_MANIFEST,
  pullIntervalMs: parseOptionalInteger(process.env.OES_SITE_PULL_INTERVAL_MS)
} satisfies OesSiteRuntimeModuleOptions

// parseOptionalInteger keeps deployment knobs local without changing Runtime Kit contracts.
function parseOptionalInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}
