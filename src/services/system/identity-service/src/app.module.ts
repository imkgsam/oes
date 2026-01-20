import { Module } from '@nestjs/common'
import { TraceModule } from '@oes/common/tracing/trace.module'

@Module({
  imports: [
    // 链路追踪模块
    TraceModule
  ],
  providers: [],
  controllers: []
})
export class AppModule {}
