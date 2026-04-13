import { Module, Global } from '@nestjs/common'
import { RegistryModule } from './registry/registry.module'
import { AuthorizationModule } from './authorization/authorization.module'

@Global()
@Module({
  imports: [RegistryModule, AuthorizationModule],
  exports: [RegistryModule, AuthorizationModule]
})
export class CommonModule {}
