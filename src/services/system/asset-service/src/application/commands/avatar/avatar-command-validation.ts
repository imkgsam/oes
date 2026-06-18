import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { ExceptionFactory } from '@oes/common/exceptions'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

// validateAvatarFile enforces the shared image constraints for controlled avatar-like assets.
export function validateAvatarFile(input: { contentType: string; file: Buffer }): void {
  if (!ALLOWED_MIME_TYPES.has(input.contentType)) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: [`contentType: unsupported avatar content type ${input.contentType}`]
    })
  }

  if (!input.file?.length) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['file: avatar file is required']
    })
  }

  if (input.file.length > MAX_AVATAR_SIZE_BYTES) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: [`file: avatar file exceeds ${MAX_AVATAR_SIZE_BYTES} bytes`]
    })
  }
}

// validateAccountAvatarScope ensures account avatar ownership matches the requested asset scope.
export function validateAccountAvatarScope(scopeLevel: 'SYSTEM' | 'TENANT', tenantId?: string): void {
  if (scopeLevel === 'TENANT' && !tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId: tenant-scoped avatar assets require tenantId']
    })
  }

  if (scopeLevel === 'SYSTEM' && tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId: system-scoped avatar assets must not carry tenantId']
    })
  }
}

// validateEmployeeOfficialPhotoScope restricts employee official photos to tenant-owned employee contexts.
export function validateEmployeeOfficialPhotoScope(input: {
  employeeId: string
  operatorId: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
}): string {
  if (input.scopeLevel !== 'TENANT') {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['scopeLevel: employee official photos require TENANT scope']
    })
  }

  const tenantId = input.tenantId?.trim()
  if (!tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId is required']
    })
  }

  if (!input.employeeId.trim()) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['employeeId is required']
    })
  }

  if (!input.operatorId.trim()) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['operatorId is required']
    })
  }

  return tenantId
}
