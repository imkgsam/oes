// src/common/src/modules/moduleAuth/auth.context.base.ts
import { Injectable } from '@nestjs/common'
import { ModuleTokenProvider } from './module-token.provider'
import { RpcRequestMeta } from '../../interfaces/rpc.interface'

@Injectable()
export class AuthContextBase {
  constructor(protected readonly tokenProvider: ModuleTokenProvider) {}

  async createMeta(): Promise<Partial<RpcRequestMeta>> {
    return {
      caller: process.env.MODULE_NAME!,
      _authToken: await this.tokenProvider.getToken()
    }
  }
}
