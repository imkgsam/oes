import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NacosConfigModule } from '@oes/common/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import {
  BROWSER_ACTIVITY_APPLICATION,
  BrowserActivityGrpcController
} from './interfaces/grpc/browser-activity.grpc.controller'
import { PrismaBrowserActivityApplication } from './infrastructure/prisma/prisma-browser-activity-application'
import { PrismaService } from './infrastructure/prisma/prisma.service'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const BROWSER_ACTIVITY_AUDIENCE = 'urn:oes:service:browser-activity-service'
const trustedExecutionRuntime = createLazyTrustedExecutionRuntime(BROWSER_ACTIVITY_AUDIENCE)

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    LoggingModule.forRoot({ serviceName: 'browser-activity-service' }),
    RegistryModule,
    NacosConfigModule
  ],
  controllers: [BrowserActivityGrpcController],
  providers: [
    PrismaService,
    PrismaBrowserActivityApplication,
    {
      provide: TrustedExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new TrustedExecutionGuard(
          reflector,
          trustedExecutionRuntime.verifier,
          trustedExecutionRuntime.workloadIdentityProvider,
          BROWSER_ACTIVITY_AUDIENCE
        ),
      inject: [Reflector]
    },
    {
      provide: BROWSER_ACTIVITY_APPLICATION,
      useExisting: PrismaBrowserActivityApplication
    }
  ]
})
// AppModule wires browser-activity-service infrastructure and exposes the browser activity audit boundary.
export class AppModule {}
