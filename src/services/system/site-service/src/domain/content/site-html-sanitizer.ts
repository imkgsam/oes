const TRUSTED_IFRAME_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'player.vimeo.com'])

/** sanitizeSiteHtml removes active content from site-managed rich text before public view generation. */
export function sanitizeSiteHtml(html: string): string {
  let sanitized = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s+javascript:[^"'\s>]*/gi, '')

  sanitized = sanitized.replace(/<iframe\b[^>]*><\/iframe>/gi, (iframe) => {
    const src = extractAttribute(iframe, 'src')
    if (!src || !isTrustedIframeSrc(src)) {
      return ''
    }
    return `<iframe src="${escapeAttribute(src)}"></iframe>`
  })

  return sanitized
    .replace(/>\s+</g, '><')
    .trim()
}

/** extractAttribute reads one quoted HTML attribute from a small sanitized tag fragment. */
function extractAttribute(tag: string, attributeName: string): string | null {
  const match = tag.match(new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return match?.[1] ?? null
}

/** isTrustedIframeSrc allows only known video embed hosts in public HTML. */
function isTrustedIframeSrc(src: string): boolean {
  try {
    const parsed = new URL(src)
    return parsed.protocol === 'https:' && TRUSTED_IFRAME_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

/** escapeAttribute encodes characters that would break an HTML attribute value. */
function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
