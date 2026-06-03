import { BadRequestException } from '@nestjs/common'

const EMPLOYEE_CODE_PATTERN = /^EMP-([0-9A-F]{3})-([0-9A-F]{4})$/
const EMPLOYEE_CODE_SUFFIX_PATTERN = /^[0-9A-F]{4}$/

export type ParsedEmployeeCode = {
  employeeCode: string
  employeeNumber: number
  employeeNumberHex: string
  tenantCodePrefix: string
}

/** parseEmployeeCodeStrict accepts only the frozen tenant-prefixed hexadecimal employee code format. */
export function parseEmployeeCodeStrict(value: string): ParsedEmployeeCode {
  const normalized = value.trim().toUpperCase()
  const match = normalized.match(EMPLOYEE_CODE_PATTERN)
  if (!match || match[2] === '0000') {
    throw new BadRequestException('employeeCode must match EMP-XXX-YYYY and use sequence 0001-FFFF')
  }
  return {
    employeeCode: normalized,
    employeeNumber: Number.parseInt(match[2], 16),
    employeeNumberHex: match[2],
    tenantCodePrefix: match[1]
  }
}

/** formatEmployeeCode builds the canonical employee code from tenant prefix and one-based sequence. */
export function formatEmployeeCode(tenantCodePrefix: string, sequence: number): string {
  const normalizedPrefix = tenantCodePrefix.trim().toUpperCase()
  if (!/^[0-9A-F]{3}$/.test(normalizedPrefix)) {
    throw new BadRequestException('tenant employee code prefix must be a 3 digit hexadecimal value')
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 0xffff) {
    throw new BadRequestException('employee code sequence must be between 0001 and FFFF')
  }
  return `EMP-${normalizedPrefix}-${sequence.toString(16).toUpperCase().padStart(4, '0')}`
}

/** formatEmployeeCodeFromSuffix builds the display barcode from tenant prefix and stored employee suffix. */
export function formatEmployeeCodeFromSuffix(tenantCodePrefix: string, employeeCodeSuffix: string): string {
  const normalizedPrefix = tenantCodePrefix.trim().toUpperCase()
  const normalizedSuffix = parseEmployeeCodeSuffixStrict(employeeCodeSuffix)
  if (!/^[0-9A-F]{3}$/.test(normalizedPrefix)) {
    throw new BadRequestException('tenant employee code prefix must be a 3 digit hexadecimal value')
  }
  return `EMP-${normalizedPrefix}-${normalizedSuffix}`
}

/** parseEmployeeCodeSuffixStrict accepts only the HR-owned four digit hexadecimal employee sequence. */
export function parseEmployeeCodeSuffixStrict(value: string): string {
  const normalized = value.trim().toUpperCase()
  if (!EMPLOYEE_CODE_SUFFIX_PATTERN.test(normalized) || normalized === '0000') {
    throw new BadRequestException('employeeCodeSuffix must match YYYY and use sequence 0001-FFFF')
  }
  return normalized
}

/** formatEmployeeCodeSuffix builds the HR-owned employee sequence suffix. */
export function formatEmployeeCodeSuffix(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 0xffff) {
    throw new BadRequestException('employee code sequence must be between 0001 and FFFF')
  }
  return sequence.toString(16).toUpperCase().padStart(4, '0')
}
