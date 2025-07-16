// src/common/trace/trace.module.ts

import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { HttpTraceInterceptor } from './http-trace.interceptor'
import { RpcTraceInterceptor } from './rpc-trace.interceptor'

// 标记为全局模块（可选，如果你希望自动生效）
@Global()
@Module({})
export class TraceModule {
  static forHttp(): DynamicModule {
    return {
      module: TraceModule,
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: HttpTraceInterceptor,
        },
      ],
      exports: [],
    }
  }

  static forRpc(): DynamicModule {
    return {
      module: TraceModule,
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: RpcTraceInterceptor,
        },
      ],
      exports: [],
    }
  }
}
