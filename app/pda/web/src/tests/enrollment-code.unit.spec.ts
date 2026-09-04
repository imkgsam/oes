import { describe, expect, it } from 'vitest';
import { normalizeEnrollmentCodeInput } from '@/services/enrollment-code';

describe('enrollment code input normalization', () => {
  it('extracts the one-time enrollment code from a PDA enrollment QR payload', () => {
    expect(normalizeEnrollmentCodeInput(' oes-pda-enrollment://ENR-123456 ')).toBe('ENR-123456');
  });

  it('keeps manually entered enrollment codes unchanged', () => {
    expect(normalizeEnrollmentCodeInput(' ENR-654321 ')).toBe('ENR-654321');
  });

  it('does not treat tenant path segments as the enrollment code', () => {
    expect(normalizeEnrollmentCodeInput('oes-pda-enrollment://tenant-001/ENR-EXPIRED')).toBe('ENR-EXPIRED');
  });
});
