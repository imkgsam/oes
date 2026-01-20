// src/common/tracing/trace.module.ts
import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TraceInterceptor } from './trace.interceptor'

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor
    }
  ],
  exports: []
})
export class TraceModule {}
