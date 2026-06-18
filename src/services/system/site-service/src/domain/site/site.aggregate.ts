import { SiteLocaleStatus, SiteStatus } from './site.enums'
import { SiteDomainError } from './site.errors'

export interface SiteLocaleRecord {
  locale: string
  status: SiteLocaleStatus
  isDefault: boolean
}

export interface CreateDraftSiteInput {
  siteId: string
  tenantId: string
  siteCode: string
  siteName: string
  siteType: string
  defaultLocale: string
  operatorId: string
}

/** SiteAggregate enforces site lifecycle and locale invariants without framework dependencies. */
export class SiteAggregate {
  private constructor(
    readonly siteId: string,
    readonly tenantId: string,
    readonly siteCode: string,
    readonly siteName: string,
    readonly siteType: string,
    readonly status: SiteStatus,
    readonly defaultLocale: string,
    readonly locales: SiteLocaleRecord[]
  ) {}

  /** createDraft creates one draft site with exactly one active default locale. */
  static createDraft(input: CreateDraftSiteInput): SiteAggregate {
    assertNonBlank(input.siteId, 'siteId')
    assertNonBlank(input.tenantId, 'tenantId')
    assertNonBlank(input.siteCode, 'siteCode')
    assertNonBlank(input.siteName, 'siteName')
    assertNonBlank(input.siteType, 'siteType')
    assertNonBlank(input.defaultLocale, 'defaultLocale')
    assertNonBlank(input.operatorId, 'operatorId')

    return new SiteAggregate(
      input.siteId.trim(),
      input.tenantId.trim(),
      input.siteCode.trim(),
      input.siteName.trim(),
      input.siteType.trim(),
      SiteStatus.DRAFT,
      input.defaultLocale.trim(),
      [
        {
          locale: input.defaultLocale.trim(),
          status: SiteLocaleStatus.ACTIVE,
          isDefault: true
        }
      ]
    )
  }

  /** disableLocale disables one non-default locale and rejects default-locale disable attempts. */
  disableLocale(locale: string): SiteAggregate {
    const normalized = locale.trim()
    if (normalized === this.defaultLocale) {
      throw new SiteDomainError('default locale cannot be disabled')
    }

    const target = this.locales.find((siteLocale) => siteLocale.locale === normalized)
    if (!target) {
      throw new SiteDomainError('locale does not exist')
    }

    return new SiteAggregate(
      this.siteId,
      this.tenantId,
      this.siteCode,
      this.siteName,
      this.siteType,
      this.status,
      this.defaultLocale,
      this.locales.map((siteLocale) =>
        siteLocale.locale === normalized
          ? { ...siteLocale, status: SiteLocaleStatus.DISABLED }
          : siteLocale
      )
    )
  }
}

/** assertNonBlank rejects missing string values at the domain boundary. */
function assertNonBlank(value: string, fieldName: string): void {
  if (!value?.trim()) {
    throw new SiteDomainError(`${fieldName} is required`)
  }
}
