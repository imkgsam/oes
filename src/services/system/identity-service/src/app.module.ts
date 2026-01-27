import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging/logging.module'

@Module({
  imports: [
    // 链路追踪模块
    LoggingModule
  ],
  providers: [],
  controllers: []
})
export class AppModule {}
