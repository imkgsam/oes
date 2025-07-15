// src/common/utils/safe-rpc-call.ts
import { RpcException } from '@nestjs/microservices'
import { firstValueFrom, Observable } from 'rxjs'
import { GLOBAL_SYSTEM_ERRORS } from '../constants/res-codes/system.errors'
import { createSystemException, createBusinessException } from './exception.factory'
import { BusinessException } from '../exceptions/business.exception'
import { SystemException } from '../exceptions/system.exception'
import { ExceptionObject } from '../interfaces/exception-object.interface'

export async function safeRpcCall<T>(
  rpcCall: Promise<T> | Observable<T>,
  moduleName = 'UNKNOWN_MODULE',
): Promise<T> {
  try {
    return await firstValueFrom(rpcCall)
  } catch (error) {
    // 来自 RpcException
    if (error instanceof RpcException) {
      const payload = error.getError?.()

      if (payload?.prefixCode?.startsWith('SYS')) {
        let t = payload as ExceptionObject
        throw createSystemException( t, t?.details)
      }

      if (payload?.prefixCode?.startsWith('BUS')) {
        throw createBusinessException( payload as ExceptionObject)
      }

      // fallback: RpcException 但结构不明
      throw createSystemException( GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR, payload)
    }

    // 非 RpcException
    throw createSystemException( GLOBAL_SYSTEM_ERRORS.UNKNOWN_ERROR, error)
  }
}
