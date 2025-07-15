// src/common/helpers/exception.factory.ts

import { RpcException } from '@nestjs/microservices'
import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { genBusinessExceptionObject, genSystemExceptionObject } from './exception.helper'
import { ExceptionObject } from '../interfaces/exception-object.interface'

import { ConfigService } from '@nestjs/config'

let configService: ConfigService

// ⚠️ 初始化 ConfigService，建议在 main.ts 或 AppModule 初始化时注入
export function initExceptionFactory(_configService: ConfigService) {
  configService = _configService
}

function getCurrentModuleName(): string {
  if (!configService) throw new Error('ConfigService not initialized for ExceptionFactory')
  return configService.get<string>('MODULE_NAME') || 'UNKNOWN_MODULE'
}

/**
 * 抛出 RPC BusinessException
 */
export const throwBusinessRpcException = (raw: ExceptionObject): never => {
  const moduleName = getCurrentModuleName()
  throw new RpcException(
    new BusinessException(genBusinessExceptionObject(moduleName, raw))
  )
}

/**
 * 抛出 RPC SystemException
 */
export const throwSystemRpcException = (
  raw: ExceptionObject,
  details?: any,
): never => {
  const moduleName = getCurrentModuleName()
  throw new RpcException(
    new SystemException(genSystemExceptionObject(moduleName, raw), details)
  )
}

/**
 * 构造本地 BusinessException
 */
export const createBusinessException = (raw: ExceptionObject) => {
  const moduleName = getCurrentModuleName()
  return new BusinessException(genBusinessExceptionObject(moduleName, raw))
}

/**
 * 构造本地 SystemException
 */
export const createSystemException = (raw: ExceptionObject, details?: any) => {
  const moduleName = getCurrentModuleName()
  return new SystemException(genSystemExceptionObject(moduleName, raw), details)
}
