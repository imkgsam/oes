import { RpcException } from "@nestjs/microservices"
import { Observable, isObservable, firstValueFrom } from "rxjs"
import { GLOBAL_RUNTIME_ERRORS } from "../constants/res-codes/runtime.errors"
import { createRuntimeException } from "./exception.factory"
import { isRpcError } from "./exception.helper"

export async function safeRpcCall<T>(
  rpcCall: Promise<T> | Observable<T>
): Promise<T> {
  console.log("[safeRpcCall] Executing RPC call...")
  try {
    const result = isObservable(rpcCall)
      ? await firstValueFrom(rpcCall)
      : await rpcCall
    return result
  } catch (error) {
    if (error instanceof RpcException) {
      const payload = error.getError?.()

      if (isRpcError(payload)) {
        // ✅ 正确用法：直接抛出，保留 context
        throw error
      }
      // ❌ 结构不合法，封装 Runtime 异常
      throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.INVALID_RPC_STRUCTURE, payload)
    }
    // ❌ 非 RpcException
    throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR, error)
  }
}
