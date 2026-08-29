import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import {
  GATEWAY_READINESS_CONNECTOR,
  GATEWAY_READINESS_OPTIONS,
  GatewayReadinessService,
  createGatewayReadinessConnector,
  loadGatewayReadinessOptions
} from './gateway-readiness.service'

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: GATEWAY_READINESS_OPTIONS,
      useFactory: () => loadGatewayReadinessOptions(process.env)
    },
    {
      provide: GATEWAY_READINESS_CONNECTOR,
      useFactory: () => createGatewayReadinessConnector(process.env)
    },
    GatewayReadinessService
  ]
})
export class HealthModule {}
