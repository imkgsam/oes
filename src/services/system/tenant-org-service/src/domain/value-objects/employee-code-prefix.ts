import { BadRequestException } from '@nestjs/common'

const EMPLOYEE_CODE_PREFIX_PATTERN = /^[0-9A-F]{3}$/

/** normalizeEmployeeCodePrefix validates the tenant-owned three digit hexadecimal employee code prefix. */
export function normalizeEmployeeCodePrefix(value: string | undefined, fieldName = 'employeeCodePrefix'): string {
  const normalized = value?.trim().toUpperCase()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  if (!EMPLOYEE_CODE_PREFIX_PATTERN.test(normalized)) {
    throw new BadRequestException(`${fieldName} must be a 3 digit uppercase hexadecimal value`)
  }
  return normalized
}
