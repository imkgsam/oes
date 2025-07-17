import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { RuntimeException } from '../exceptions/runtime.exception'
import { RawException, RpcExceptionPayload } from '../interfaces/exceptions.interface'
import { buildGlobalErrorCode } from '../helpers/exception.helper'
import { EXCEPTION_TYPE_PREFIX } from '../constants/res-codes/module.codes'

const moduleNameFromEnv = process.env.MODULE_NAME || 'UNKNOWN_MODULE'

export function createBusinessException(input: RawException | RpcExceptionPayload, details?: any) {
  return createException(EXCEPTION_TYPE_PREFIX.BUSINESS, input, details)
}

export function createSystemException(input: RawException | RpcExceptionPayload, details?: any) {
  return createException(EXCEPTION_TYPE_PREFIX.SYSTEM, input, details)
}

export function createRuntimeException(raw: RawException | RpcExceptionPayload, details?: any) {
  return createException(EXCEPTION_TYPE_PREFIX.RUNTIME, raw, details)
}

function createException(etype: EXCEPTION_TYPE_PREFIX, input: RawException | RpcExceptionPayload, details?: any) {
  console.log(`in createException: type ${etype}\n input: ${input}\n detail:${details} \n`)
  const isRaw = (input as RawException).subCode !== undefined
  let code: string
  if (moduleNameFromEnv === 'UNKNOWN_MODULE')
    throw new Error('MODULE_NAME environment variable is not set. Please set it to the current module name.')
  if (isRaw)
    code = buildGlobalErrorCode(etype, moduleNameFromEnv, (input as RawException).subCode)
  else
    code = (input as RpcExceptionPayload).code
  let k: SystemException | BusinessException | RuntimeException
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
  }
  return k
}