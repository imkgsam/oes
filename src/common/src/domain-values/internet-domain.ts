const COMMON_DISPLAY_PREFIX = 'www.'

/** InternetDomain represents normalized internet host text without owning business identity semantics. */
export class InternetDomain {
  /** Creates an immutable parsed domain result from raw and canonical host text. */
  private constructor(
    public readonly rawHost: string,
    public readonly canonicalHost: string,
    public readonly isValid: boolean
  ) {}

  /** Parses URL or hostname input into canonical host form without throwing on invalid values. */
  static parse(value: string | undefined | null): InternetDomain {
    const host = extractHost(value)

    if (!host || !isValidHostname(host)) {
      return new InternetDomain('', '', false)
    }

    const canonicalHost = host.startsWith(COMMON_DISPLAY_PREFIX)
      ? host.slice(COMMON_DISPLAY_PREFIX.length)
      : host

    return new InternetDomain(host, canonicalHost, true)
  }

  /** Returns the canonical host string for storage or comparison. */
  toString(): string {
    return this.canonicalHost
  }
}

/** Extracts a lowercase hostname from URL-like or host-like input. */
function extractHost(value: string | undefined | null): string {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return ''
  }

  const urlCandidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `http://${trimmedValue}`

  try {
    const hostname = new URL(urlCandidate).hostname.toLowerCase()
    return removeTrailingDot(hostname)
  } catch {
    return ''
  }
}

/** Removes the presentation-only root dot from a hostname. */
function removeTrailingDot(host: string): string {
  return host.endsWith('.') ? host.slice(0, -1) : host
}

/** Validates a normalized DNS hostname with conservative label rules. */
function isValidHostname(host: string): boolean {
  if (host.length > 253 || !host.includes('.') || host.includes('..')) {
    return false
  }

  return host.split('.').every((label) => {
    if (label.length === 0 || label.length > 63) {
      return false
    }

    return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  })
}
