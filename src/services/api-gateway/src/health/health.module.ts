import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import {
  GATEWAY_READINESS_CONNECTOR,
  GATEWAY_READINESS_OPTIONS,
  GatewayReadinessService,
  connectGatewayReadinessTarget,
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
      useValue: connectGatewayReadinessTarget
    },
    GatewayReadinessService
  ]
})
export class HealthModule {}
