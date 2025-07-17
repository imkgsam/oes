import { Module } from '@nestjs/common'
import { CommonModule } from '@oes/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Module({
  imports: [
    CommonModule,
    ClientModule.register([ServiceKeys.PERMI_TCP, ServiceKeys.AUTH_TCP, ServiceKeys.MES_TCP]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
