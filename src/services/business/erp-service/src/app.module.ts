import { Module } from '@nestjs/common'
import { CommonModule } from '@oes/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'

@Module({
  imports: [
    CommonModule,
    ClientModule.register(['PERMI_TCP', 'AUTH_TCP', 'MES_-TCP']),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
