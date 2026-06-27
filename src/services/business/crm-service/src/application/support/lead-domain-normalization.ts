import { InternetDomain } from '@oes/common'

/** normalizeLeadDomainEvidence canonicalizes valid lead domain evidence while preserving invalid nonblank legacy text. */
export function normalizeLeadDomainEvidence(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return null
  }

  const domain = InternetDomain.parse(trimmedValue)
  if (!domain.isValid) {
    return trimmedValue
  }

  return domain.canonicalHost
}
