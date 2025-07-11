import { Module } from '@nestjs/common'
import { CommonModule } from '@oes/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'

@Module({
  imports: [CommonModule, ClientModule.register()],
  controllers: [],
  providers: [],
})
export class AppModule {}
