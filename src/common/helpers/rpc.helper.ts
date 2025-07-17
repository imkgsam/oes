import { Observable, isObservable, firstValueFrom } from "rxjs"
import { GLOBAL_RUNTIME_ERRORS } from "../constants/res-codes/runtime.errors"
import { createRuntimeException } from "./exception.factory"
import { isRpcError, toRpcException } from "./exception.helper"
import { RpcException } from "@nestjs/microservices"

export async function safeRpcCall<T>(
  rpcCall: Promise<T> | Observable<T>
): Promise<T> {
  console.log("[safeRpcCall] Executing RPC call...")
  try {
    const result = isObservable(rpcCall)
      ? await firstValueFrom(rpcCall)
      : await rpcCall
    return result
  } catch (exception) {
    console.error(`[safeRpcCall] Error occurred: type: ${typeof exception} \n`, exception)
    const errorObject = exception?.getError?.() ?? exception?.error ?? exception
    if (isRpcError(errorObject)) {
      const { error, context } = errorObject
      console.error("[safeRpcCall] Caught RpcError:", error)
      throw toRpcException(error, context)
    } else {
      console.error("[safeRpcCall] Caught INVALID_RPC_STRUCTURE error, throwing RuntimeException", exception)
      throw createRuntimeException(GLOBAL_RUNTIME_ERRORS.INVALID_RPC_STRUCTURE, errorObject)
    }
  }
}
