const EMPLOYEE_CODE_PATTERN = /^EMP-([0-9A-F]{3})-([0-9A-F]{4})$/;
const OES_EMPLOYEE_SCAN_PREFIX = 'OES:EMPLOYEE:';

export type ParsedEmployeeCode = {
  employeeCode: string;
  employeeNumberHex: string;
  tenantCodeHex: string;
};

/** parseEmployeeCodeStrict accepts only the frozen EMP-tenant-sequence employee code format. */
export function parseEmployeeCodeStrict(input: string): ParsedEmployeeCode | null {
  const value = input.trim().toUpperCase();
  const match = value.match(EMPLOYEE_CODE_PATTERN);
  if (!match || match[2] === '0000') {
    return null;
  }

  return {
    employeeCode: value,
    employeeNumberHex: match[2],
    tenantCodeHex: match[1],
  };
}

/** parseEmployeeCodeScanInput unwraps the optional OES employee barcode envelope and rejects legacy codes. */
export function parseEmployeeCodeScanInput(input: string): string {
  const value = input.trim();
  const payload = value.toUpperCase().startsWith(OES_EMPLOYEE_SCAN_PREFIX)
    ? value.slice(OES_EMPLOYEE_SCAN_PREFIX.length)
    : value;
  return parseEmployeeCodeStrict(payload)?.employeeCode ?? '';
}

/** normalizeEmployeeCodeInput normalizes manual input while keeping the same strict employee code shape. */
export function normalizeEmployeeCodeInput(input: string): string {
  return parseEmployeeCodeStrict(input)?.employeeCode ?? '';
}
