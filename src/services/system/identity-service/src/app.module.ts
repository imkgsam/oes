import { Module } from '@nestjs/common'
import { TraceModule } from '@oes/common/modules/trace/trace.module'

@Module({
  imports: [
    // 链路追踪模块
    TraceModule.forRpc()
  ],
  providers: [],
  controllers: []
})
export class AppModule {}
