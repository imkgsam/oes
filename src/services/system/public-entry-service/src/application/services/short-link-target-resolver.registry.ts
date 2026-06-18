import {
  ResolvedTargetResult,
  ShortLinkTargetResolver,
  TargetResolverRequest
} from '../../domain/types/short-link.types'

// ShortLinkTargetResolverRegistry dispatches INTERNAL_REF resolution to registered target owner modules.
export class ShortLinkTargetResolverRegistry {
  private readonly resolvers = new Map<string, ShortLinkTargetResolver>()

  register(targetType: string, resolver: ShortLinkTargetResolver): void {
    const normalized = targetType.trim()
    if (!normalized) {
      throw new Error('targetType is required')
    }
    this.resolvers.set(normalized, resolver)
  }

  async resolve(request: TargetResolverRequest): Promise<ResolvedTargetResult> {
    const resolver = this.resolvers.get(request.targetType)
    if (!resolver) {
      return { result: 'UNAVAILABLE', resultTarget: 'resolver:unsupported-target-type' }
    }

    try {
      const result = await resolver.resolve(request)
      if (result.result === 'REDIRECT' && !this.isSafeRedirectUrl(result.redirectUrl)) {
        return { result: 'UNAVAILABLE', resultTarget: 'resolver:invalid-result' }
      }
      return result
    } catch {
      return { result: 'UNAVAILABLE', resultTarget: 'resolver:error' }
    }
  }

  private isSafeRedirectUrl(value: string | undefined): value is string {
    if (!value) return false
    try {
      const url = new URL(value)
      return url.protocol === 'https:' || isLocalDevelopmentHttpUrl(url)
    } catch {
      return false
    }
  }
}

// isLocalDevelopmentHttpUrl permits loopback HTTP redirects for local frontend integration only.
function isLocalDevelopmentHttpUrl(url: URL): boolean {
  if (url.protocol !== 'http:' || process.env.NODE_ENV === 'production') return false
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
}
