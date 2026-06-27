import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { BrowserActivityGrpcAdapter } from './adapters/browser-activity-grpc.adapter'
import { BROWSER_ACTIVITY_CLIENT, BrowserActivityBffService } from './browser-activity-bff.service'
import { BrowserActivityController } from './interfaces/http/controllers/browser-activity.controller'
import { ExtensionBrowserActivityController } from './interfaces/http/controllers/extension-browser-activity.controller'
import { PermissionServiceProxyModule } from '../permission-service/permission-service.module'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.BROWSER_ACTIVITY]),
    PermissionServiceProxyModule
  ],
  controllers: [BrowserActivityController, ExtensionBrowserActivityController],
  providers: [
    BrowserActivityGrpcAdapter,
    BrowserActivityBffService,
    {
      provide: BROWSER_ACTIVITY_CLIENT,
      useExisting: BrowserActivityGrpcAdapter
    }
  ]
})
// BrowserActivityBffModule wires extension ingest and tenant-web audit workbench endpoints.
export class BrowserActivityBffModule {}
