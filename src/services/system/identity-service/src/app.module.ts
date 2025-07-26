import { Module } from '@nestjs/common'
import { TraceModule } from '@oes/common/modules/trace/trace.module'

@Module({
  imports: [
    TraceModule.forRpc()
  ],
  providers: [],
  controllers: [],
})
export class AppModule { }
