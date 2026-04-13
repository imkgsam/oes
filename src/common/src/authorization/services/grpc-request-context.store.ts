import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'
import { GrpcAuthenticatedRequestContext } from '../types'

@Injectable()
export class GrpcRequestContextStore {
  private readonly storage = new AsyncLocalStorage<GrpcAuthenticatedRequestContext>()

  run<T>(context: GrpcAuthenticatedRequestContext, callback: () => T): T {
    return this.storage.run(context, callback)
  }

  getContext(): GrpcAuthenticatedRequestContext | undefined {
    return this.storage.getStore()
  }
}
