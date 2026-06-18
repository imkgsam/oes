import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { SiteRuntimeGrpcAdapter } from './infrastructure/downstream/site-runtime-grpc.adapter'
import { SiteRuntimeController } from './interface/http/controllers/site-runtime.controller'
import { SITE_RUNTIME_DOWNSTREAM, SiteRuntimeService } from './site-runtime.service'

/** SiteRuntimeBffModule wires signed Site Runtime API routes to site-service. */
@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.SITE])],
  controllers: [SiteRuntimeController],
  providers: [
    SiteRuntimeGrpcAdapter,
    { provide: SITE_RUNTIME_DOWNSTREAM, useExisting: SiteRuntimeGrpcAdapter },
    SiteRuntimeService
  ]
})
export class SiteRuntimeBffModule {}
