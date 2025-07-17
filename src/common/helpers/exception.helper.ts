import { RpcException } from '@nestjs/microservices'
import { EXCEPTION_TYPE_PREFIX, MODULES } from '../constants/res-codes/module.codes'
import { ErrorContext, RawException, RpcError, RpcExceptionPayload } from '../interfaces/exceptions.interface'
import { ModuleDetails } from '../interfaces/module.interface'
import { v4 as uuidv4 } from 'uuid'


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
  typePrefix: EXCEPTION_TYPE_PREFIX = EXCEPTION_TYPE_PREFIX.RUNTIME,
  moduleName: string,
  subCode: string,
): string {
  const foundModule: ModuleDetails = MODULES[moduleName]
  console.log(`Building global error code: ${typePrefix}${foundModule.code}${subCode}`)
  if (!foundModule) throw new Error(`Module ${moduleName} not existed`)
  const moduleCode = foundModule.code
  return `${typePrefix}${moduleCode}${subCode}`
}

export function isRpcError(obj: any): obj is RpcError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    'context' in obj &&
    typeof obj.error?.code === 'string'
  )
}