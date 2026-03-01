import { Global, Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { NacosConfigService } from './nacos.config.service'

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [NacosConfigService],
  exports: [NacosConfigService]
})
export class NacosConfigModule {}
