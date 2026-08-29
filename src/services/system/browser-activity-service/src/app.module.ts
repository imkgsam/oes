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
import { BrowserActivityTrustedExecutionGuard } from './interfaces/grpc/browser-activity-trusted-execution.guard'

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
    BrowserActivityTrustedExecutionGuard,
    {
      provide: BROWSER_ACTIVITY_APPLICATION,
      useExisting: PrismaBrowserActivityApplication
    }
  ]
})
// AppModule wires browser-activity-service infrastructure and exposes the browser activity audit boundary.
export class AppModule {}
