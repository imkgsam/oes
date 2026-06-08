import { randomUUID } from 'crypto'
import { ShortLinkRepository } from '../../domain/repositories/short-link.repository'
import {
  DetectedChannel,
  DeviceType,
  ShortLinkRecord,
  VisitResultStatus
} from '../../domain/types/short-link.types'
import { validateHttpsUrl } from './short-link-application.service'
import { ShortLinkTargetResolverRegistry } from './short-link-target-resolver.registry'

type PublicRedirectInput = {
  shortCode: string
  now?: Date
  requestContext: {
    userAgent?: string
    ipAddress?: string
    acceptLanguage?: string
    referrer?: string
    traceId?: string
  }
}

type PublicRedirectResult =
  | { type: 'REDIRECT'; location: string }
  | { type: 'UNAVAILABLE' }
  | { type: 'NOT_FOUND' }

const MAX_USER_AGENT_LENGTH = 512
const MAX_REFERRER_LENGTH = 512

// PublicRedirectService resolves anonymous ShortLink visits into redirects or generic unavailable responses.
export class PublicRedirectService {
  constructor(
    private readonly repository: ShortLinkRepository,
    private readonly resolverRegistry: ShortLinkTargetResolverRegistry
  ) {}

  async resolveVisit(input: PublicRedirectInput): Promise<PublicRedirectResult> {
    const shortLink = await this.repository.findByShortCode(input.shortCode)
    if (!shortLink) {
      return { type: 'NOT_FOUND' }
    }

    const environment = this.detectEnvironment(input.requestContext)
    const resolved = await this.resolveExistingShortLink(shortLink, input.now ?? new Date(), {
      ...environment,
      traceId: input.requestContext.traceId
    })

    await this.recordVisitBestEffort(shortLink, input, environment, resolved.resultStatus)
    return resolved.publicResult
  }

  private async resolveExistingShortLink(
    shortLink: ShortLinkRecord,
    now: Date,
    requestContext: {
      userAgent: string
      detectedChannel: DetectedChannel
      deviceType: DeviceType
      locale: string
      referrer: string
      traceId?: string
    }
  ): Promise<{ publicResult: PublicRedirectResult; resultStatus: VisitResultStatus }> {
    if (shortLink.status === 'DISABLED') {
      return { publicResult: { type: 'UNAVAILABLE' }, resultStatus: 'DISABLED' }
    }
    if (shortLink.status === 'ARCHIVED') {
      return { publicResult: { type: 'UNAVAILABLE' }, resultStatus: 'ARCHIVED' }
    }
    if (shortLink.expiresAt && shortLink.expiresAt <= now) {
      return { publicResult: { type: 'UNAVAILABLE' }, resultStatus: 'EXPIRED' }
    }

    if (shortLink.targetKind === 'EXTERNAL_URL') {
      try {
        return {
          publicResult: { type: 'REDIRECT', location: validateHttpsUrl(shortLink.targetUrl ?? '') },
          resultStatus: 'REDIRECTED'
        }
      } catch {
        return { publicResult: { type: 'UNAVAILABLE' }, resultStatus: 'INVALID_TARGET' }
      }
    }

    const resolved = await this.resolverRegistry.resolve({
      tenantId: shortLink.tenantId,
      targetType: shortLink.targetType ?? '',
      targetResourceId: shortLink.targetResourceId ?? '',
      requestContext
    })
    if (resolved.result === 'REDIRECT') {
      return {
        publicResult: { type: 'REDIRECT', location: resolved.redirectUrl },
        resultStatus: 'REDIRECTED'
      }
    }
    return { publicResult: { type: 'UNAVAILABLE' }, resultStatus: 'INVALID_TARGET' }
  }

  private async recordVisitBestEffort(
    shortLink: ShortLinkRecord,
    input: PublicRedirectInput,
    environment: {
      userAgent: string
      detectedChannel: DetectedChannel
      deviceType: DeviceType
      locale: string
      referrer: string
    },
    resultStatus: VisitResultStatus
  ): Promise<void> {
    try {
      await this.repository.recordVisit({
        id: randomUUID(),
        tenantId: shortLink.tenantId,
        shortLinkId: shortLink.id,
        visitedAt: input.now ?? new Date(),
        userAgent: truncate(environment.userAgent, MAX_USER_AGENT_LENGTH),
        ipAddress: truncate(input.requestContext.ipAddress ?? '', 128),
        detectedChannel: environment.detectedChannel,
        deviceType: environment.deviceType,
        locale: environment.locale,
        referrer: truncate(environment.referrer, MAX_REFERRER_LENGTH),
        resultStatus
      })
    } catch {
      // VisitEvent is best-effort by contract and must never block public redirect behavior.
    }
  }

  private detectEnvironment(context: PublicRedirectInput['requestContext']) {
    const userAgent = context.userAgent ?? ''
    return {
      userAgent,
      detectedChannel: detectChannel(userAgent),
      deviceType: detectDeviceType(userAgent),
      locale: detectLocale(context.acceptLanguage),
      referrer: context.referrer ?? ''
    }
  }
}

// detectChannel derives a lightweight source channel for VisitEvent statistics.
function detectChannel(userAgent: string): DetectedChannel {
  if (/micromessenger/i.test(userAgent)) return 'WECHAT'
  if (userAgent.trim()) return 'BROWSER'
  return 'UNKNOWN'
}

// detectDeviceType derives a broad device class from user agent hints.
function detectDeviceType(userAgent: string): DeviceType {
  if (/ipad|tablet/i.test(userAgent)) return 'TABLET'
  if (/mobile|iphone|android/i.test(userAgent)) return 'MOBILE'
  if (userAgent.trim()) return 'DESKTOP'
  return 'UNKNOWN'
}

// detectLocale stores the primary Accept-Language tag when available.
function detectLocale(acceptLanguage?: string): string {
  return acceptLanguage?.split(',')[0]?.trim() || 'UNKNOWN'
}

// truncate bounds public request metadata before persistence.
function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value
}
