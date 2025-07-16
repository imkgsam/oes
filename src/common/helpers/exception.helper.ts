import { RpcException } from '@nestjs/microservices'
import { EXCEPTION_TYPE_PREFIX, MODULES } from '../constants/res-codes/module.codes'
import { ErrorContext, RawException, RpcError, RpcExceptionPayload } from '../interfaces/exceptions.interface'
import { ModuleDetails } from '../interfaces/module.interface'
import { v4 as uuidv4 } from 'uuid'

const genRpcPayload = (exceptionType: EXCEPTION_TYPE_PREFIX, moduleName: string, exception: RawException): RpcExceptionPayload => {
  const foundModule: ModuleDetails = MODULES[moduleName]
  if (!foundModule) throw new Error(`Module ${moduleName} not existed`)

  return {
    code: `${EXCEPTION_TYPE_PREFIX[exceptionType]}${foundModule.code}${exception.code}`,
    module: foundModule.name,
    message: exception.message,
    messageKey: exception.messageKey,
    timestamp: new Date().toISOString(),
    httpStatus: exception.httpStatus
  } as RpcExceptionPayload
}

export const genSystemExceptionObject = (moduleName: string, exception: RawException): RpcExceptionPayload => {
  return genRpcPayload(EXCEPTION_TYPE_PREFIX.SYSTEM, moduleName, exception)
}

export const genBusinessExceptionObject = (moduleName: string, exception: RawException): RpcExceptionPayload => {
  return genRpcPayload(EXCEPTION_TYPE_PREFIX.BUSINESS, moduleName, exception)
}

export function toRpcException(error: RpcExceptionPayload, partialContext: Partial<ErrorContext>): RpcException {
  const context: ErrorContext = {
    module: partialContext.module ?? process.env.MODULE_NAME ?? 'UNKNOWN_MODULE',
    callStack: partialContext.callStack ?? [],
    traceId: partialContext.traceId ?? uuidv4(),
    timestamp: partialContext.timestamp ?? new Date().toISOString(),
    spanId: partialContext.spanId,
    isPropagated: partialContext.isPropagated ?? false,
  }

  return new RpcException({ error, context } as RpcError)
}

/**
 * @param typePrefix 错误类型前缀，如 SYS / BUS / RT
 * @param moduleName 模块名，如 'ERP_SERVICE'
 * @param subCode 模块内错误码，如 '1001'
 * @returns 全局唯一错误码，如 SYS2011001
 */
export function buildGlobalErrorCode(
  typePrefix: EXCEPTION_TYPE_PREFIX,
  moduleName: string,
  subCode: string,
): string {
  const foundModule: ModuleDetails = MODULES[moduleName]
  if (!foundModule) throw new Error(`Module ${moduleName} not existed`)
  const moduleCode = foundModule.code
  return `${typePrefix}${moduleCode}${subCode}`
}