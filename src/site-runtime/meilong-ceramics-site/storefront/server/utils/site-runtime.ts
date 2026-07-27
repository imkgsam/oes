import type { H3Event } from 'h3'
import { normalizePublicReadFailure } from '../../types/public-read-error'

// fetchSiteRuntime calls the internal Site Runtime API from Nuxt server code only.
export async function fetchSiteRuntime<T>(
  event: H3Event,
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const config = useRuntimeConfig(event)
  try {
    return (await $fetch<T>(`${config.siteRuntimeBaseUrl}${path}`, { query })) as T
  } catch (failure) {
    throw createError(normalizePublicReadFailure(failure))
  }
}
