import { Module } from '@nestjs/common'
import { SiteServiceModule } from './modules/site-service.module'

/** AppModule is the root Nest module for the site-service gRPC microservice. */
@Module({
  imports: [SiteServiceModule]
})
export class AppModule {}
