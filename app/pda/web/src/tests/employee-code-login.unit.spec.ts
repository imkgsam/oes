import { describe, expect, it } from 'vitest';
import { normalizeEmployeeCodeInput, parseEmployeeCodeScanInput } from '@/services/employee-code-login';

describe('employee code login input normalization', () => {
  it('keeps manually entered new-format employee codes as the submitted employee code', () => {
    expect(normalizeEmployeeCodeInput(' emp-0af-0001 ')).toBe('EMP-0AF-0001');
  });

  it('extracts employee code from OES employee barcode payloads', () => {
    expect(parseEmployeeCodeScanInput(' OES:EMPLOYEE:EMP-0AF-0001 ')).toBe('EMP-0AF-0001');
  });

  it('accepts plain new-format employee barcodes without a typed wrapper', () => {
    expect(parseEmployeeCodeScanInput('EMP-0AF-0001')).toBe('EMP-0AF-0001');
  });

  it('does not accept plain business barcodes as employee barcode payloads', () => {
    expect(parseEmployeeCodeScanInput('PB202605210001')).toBe('');
  });

  it('does not accept legacy employee codes after the migration to the frozen format', () => {
    expect(parseEmployeeCodeScanInput('ML-001')).toBe('');
    expect(normalizeEmployeeCodeInput('EMP-0001')).toBe('');
  });

  it('does not accept reserved zero employee sequence', () => {
    expect(parseEmployeeCodeScanInput('EMP-0AF-0000')).toBe('');
  });

  it('does not accept non-employee OES barcode payloads as employee codes', () => {
    expect(parseEmployeeCodeScanInput('OES:DEVICE:EMP001')).toBe('');
  });
});
