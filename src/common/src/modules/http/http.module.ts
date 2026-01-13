import { Module, Global } from '@nestjs/common'
import { HttpServiceFactory } from './http.service'

@Global() // 允许全局使用（可选）
@Module({
  providers: [HttpServiceFactory],
  exports: [HttpServiceFactory]
})
export class HttpModule {}
