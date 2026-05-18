const PDA_ENROLLMENT_SCHEME = 'oes-pda-enrollment://';

/** Normalizes scanned or manually typed PDA enrollment input into the one-time code submitted to the BFF. */
export function normalizeEnrollmentCodeInput(input: string): string {
  const value = input.trim();
  if (!value.toLowerCase().startsWith(PDA_ENROLLMENT_SCHEME)) {
    return value;
  }

  const payload = value.slice(PDA_ENROLLMENT_SCHEME.length);
  const segments = payload
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.length > 0 ? segments[segments.length - 1] : '';
}
