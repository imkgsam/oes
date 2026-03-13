import { Module } from '@nestjs/common'
import { LoggingModule } from '@oes/common/logging'

@Module({
  imports: [
    // 閾捐矾杩借釜妯″潡
    LoggingModule
  ],
  providers: [],
  controllers: []
})
export class AppModule {}
