import {EXCEPTION_TYPE_PREFIX,MODULES} from '../constants/res-codes/module.codes'
import { RawException, RpcExceptionPayload } from '../interfaces/exceptions.interface'
import { ModuleDetails } from '../interfaces/module.interface'

const genRpcPayload = (exceptionType:  EXCEPTION_TYPE_PREFIX, moduleName: string, exception: RawException): RpcExceptionPayload => {
const foundModule: ModuleDetails = MODULES[moduleName]
  if (!foundModule) {
    throw new Error(`Module ${moduleName} not existed`)
  }
  return {
    code: `${EXCEPTION_TYPE_PREFIX[exceptionType]}${foundModule.code}${exception.code}`,
    module: foundModule.name,
    message: exception.message,
    messageKey: exception.messageKey,
    timestamp: new Date().toISOString(),
    httpStatus: exception.httpStatus
  } as RpcExceptionPayload
}

export const genSystemExceptionObject = (moduleName: string,exception: RawException): RpcExceptionPayload => {
  return genRpcPayload(EXCEPTION_TYPE_PREFIX.SYSTEM, moduleName, exception)
}

export const genBusinessExceptionObject = (moduleName: string,exception: RawException): RpcExceptionPayload => {
  return genRpcPayload(EXCEPTION_TYPE_PREFIX.BUSINESS, moduleName, exception)
}