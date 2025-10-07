import { Module } from '@nestjs/common'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { ClientModule } from '@oes/common/modules/clients/client.module'

@Module({
  imports: [
    ClientModule.register([ServiceKeys.PERMISSION_TCP, ServiceKeys.AUTH_TCP, ServiceKeys.MES_TCP])
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
