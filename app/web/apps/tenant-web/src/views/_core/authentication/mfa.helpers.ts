// Masks MFA delivery targets defensively so the UI never relies on downstream services to hide raw email or phone values.
export function maskMfaDestination(destination?: string) {
  const trimmed = destination?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('@')) {
    const [localPart, domain = ''] = trimmed.split('@');
    const safeLocalPart = localPart ? `${localPart.slice(0, 1)}***` : '***';
    return `${safeLocalPart}@${domain}`;
  }

  const digits = trimmed.replace(/\s+/g, '');
  if (digits.length >= 7) {
    const prefix = digits.startsWith('+')
      ? digits.slice(0, Math.min(3, digits.length - 4))
      : digits.slice(0, Math.min(3, digits.length - 4));
    return `${prefix}****${digits.slice(-4)}`;
  }

  return trimmed;
}
