// src/utils/safe-rpc-call.ts
import { RpcException } from '@nestjs/microservices'
import { firstValueFrom, isObservable, Observable } from 'rxjs'
import {
  createSystemException,
  createBusinessException,
  createRuntimeException,
} from './exception.factory'
import { GLOBAL_RUNTIME_ERRORS } from '../constants/res-codes/runtime.errors'
import { RpcError } from '../interfaces/exceptions.interface'

export async function safeRpcCall<T>(
  rpcCall: Promise<T> | Observable<T>,
): Promise<T> {
  try {
    return (isObservable(rpcCall)
      ? await firstValueFrom(rpcCall)
      : await rpcCall)
  } catch (error) {
    if (error instanceof RpcException) {
      const payload = error.getError?.()

      if (payload?.error && payload?.context) {
        const rpcError = payload as RpcError
        const typePrefix = rpcError.error.code.slice(0, 3)
        const moduleName = rpcError.context.module || 'UNKNOWN_MODULE'

        switch (typePrefix) {
          case 'BUS':
            throw createBusinessException(rpcError.error)
          case 'SYS':
            throw createSystemException(rpcError.error)
          case 'RT':
            throw createRuntimeException(rpcError.error, rpcError.error.details)
          default:
            throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR, rpcError.error.details)
        }
      }

      throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR, payload)
    }

    throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR, error)
  }
}
