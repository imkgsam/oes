import { ClientProxy } from '@nestjs/microservices'
import { Observable, firstValueFrom } from 'rxjs'

export interface SafeRpcCallOptions {
  traceId?: string
}

export const safeRpcCall = async <T>(source$: Observable<T>): Promise<T> => firstValueFrom(source$)

export const safeRpcCall2 = async <TRequest, TResponse>(
  client: ClientProxy,
  pattern: string,
  payload: TRequest,
  _options?: SafeRpcCallOptions
): Promise<TResponse> => safeRpcCall<TResponse>(client.send(pattern, payload))
