// src/common/helpers/exception.factory.ts

import { RpcException } from '@nestjs/microservices'
import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { genBusinessExceptionObject, genSystemExceptionObject } from './exception.helper'
import { RawException } from '../interfaces/exceptions.interface'





/**
 * 抛出 RPC BusinessException
 */
export const throwBusinessRpcException = (moduleName:string, raw: RawException): never => {
  throw new RpcException(
    new BusinessException(genBusinessExceptionObject(moduleName, raw))
  )
}

/**
 * 抛出 RPC SystemException
 */
export const throwSystemRpcException = (
  moduleName:string,
  raw: RawException,
  details?: any,
): never => {
  throw new RpcException(
    new SystemException(genSystemExceptionObject(moduleName, raw), details)
  )
}

/**
 * 构造本地 BusinessException
 */
export const createBusinessException = (raw: RawException) => {
  const moduleName = getCurrentModuleName()
  return new BusinessException(genBusinessExceptionObject(moduleName, raw))
}

/**
 * 构造本地 SystemException
 */
export const createSystemException = (raw: RawException, details?: any) => {
  const moduleName = getCurrentModuleName()
  return new SystemException(genSystemExceptionObject(moduleName, raw), details)
}
