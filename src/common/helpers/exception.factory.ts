import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { RuntimeException } from '../exceptions/runtime.exception'
import { RawException } from '../interfaces/exceptions.interface'

export function createBusinessException(raw: RawException) {
  return new BusinessException(raw)
}

export function createSystemException(raw: RawException) {
  return new SystemException(raw)
}

export function createRuntimeException(raw: RawException, details?: any) {
  return new RuntimeException(raw, details)
}
