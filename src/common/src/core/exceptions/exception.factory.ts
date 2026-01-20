import { BusinessException } from './business.exception'
import { SystemException } from './system.exception'
import { RuntimeException } from './runtime.exception'
import { RawError } from '../interfaces/exceptions.interface'
import { buildGlobalErrorCode } from '../helpers/exception.helper'
import { EXCEPTION_TYPE_PREFIX } from '../../constants/exceptions/module.codes'
import { OESException } from './oes.exception'
import { IntegrationException } from './integration.exception'
import { SecurityException } from './security.exception'
import { ValidationException } from './validation.exception'
/**
 * 异常工厂
 * 根据异常类型创建异常
 * 异常类型：
 * 1. 业务异常
 * 2. 系统异常
 * 3. 运行时异常
 */
const moduleNameFromEnv = process.env.MODULE_NAME || 'UNKNOWN_MODULE'
// 创建业务异常
export function createBusinessException(input: RawError, details?: any) {
  return createTException(EXCEPTION_TYPE_PREFIX.BUSINESS, input, details)
}

// 创建系统异常
export function createSystemException(input: RawError, details?: any) {
  return createTException(EXCEPTION_TYPE_PREFIX.SYSTEM, input, details)
}

// 创建运行时异常
export function createRuntimeException(input: RawError, details?: any) {
  return createTException(EXCEPTION_TYPE_PREFIX.RUNTIME, input, details)
}

// 创建集成异常
export function createIntegrationException(input: RawError, details?: any) {
  return createTException(EXCEPTION_TYPE_PREFIX.INTEGRATION, input, details)
}
// 创建安全异常
export function createSecurityException(input: RawError, details?: any) {
  return createTException(EXCEPTION_TYPE_PREFIX.SECURITY, input, details)
}
// 创建验证异常
export function createValidationException(input: RawError, details?: any) {
  return createTException(EXCEPTION_TYPE_PREFIX.VALIDATION, input, details)
}

function createTException(etype: EXCEPTION_TYPE_PREFIX, input: RawError, details?: any) {
  const code: string = buildGlobalErrorCode(etype, moduleNameFromEnv, input.subCode)
  let k: OESException
  switch (etype) {
    case EXCEPTION_TYPE_PREFIX.BUSINESS:
      k = new BusinessException(code, input.message, input.messageKey, input.httpStatus, details)
      break
    case EXCEPTION_TYPE_PREFIX.SYSTEM:
      k = new SystemException(code, input.message, input.messageKey, input.httpStatus, details)
      break
    case EXCEPTION_TYPE_PREFIX.RUNTIME:
      k = new RuntimeException(code, input.message, input.messageKey, input.httpStatus, details)
      break
    case EXCEPTION_TYPE_PREFIX.INTEGRATION:
      k = new IntegrationException(code, input.message, input.messageKey, input.httpStatus, details)
      break
    case EXCEPTION_TYPE_PREFIX.SECURITY:
      k = new SecurityException(code, input.message, input.messageKey, input.httpStatus, details)
      break
    case EXCEPTION_TYPE_PREFIX.VALIDATION:
      k = new ValidationException(code, input.message, input.messageKey, input.httpStatus, details)
      break
  }
  return k
}
