import { Module } from '@nestjs/common';
import { IdentityServiceService } from './identity-service.service';
import { AdminController } from './controllers/admin.controller';
import { ClientModule } from '@oes/common/modules/clients/client.module';
import { ServiceKeys } from '@oes/common/modules/clients/service-map';

@Module({
  imports: [ClientModule.register([ServiceKeys.IDENTITY_TCP])],
  providers: [IdentityServiceService],
  controllers: [AdminController]
})
export class IdentityServiceModule { }
