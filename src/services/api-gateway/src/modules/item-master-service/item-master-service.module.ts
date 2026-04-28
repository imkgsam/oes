import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { ItemMasterManagementGrpcAdapter } from './adapters/item-master-management-grpc.adapter'
import { ItemMasterQueryGrpcAdapter } from './adapters/item-master-query-grpc.adapter'
import { ItemManagementController } from './interface/http/controllers/item-management.controller'
import { ItemManagementService } from './item-management.service'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.ITEM_MASTER])
  ],
  controllers: [ItemManagementController],
  providers: [
    ItemMasterQueryGrpcAdapter,
    ItemMasterManagementGrpcAdapter,
    ItemManagementService
  ]
})
// ItemMasterServiceProxyModule wires the thin tenant item-management BFF proxy into api-gateway.
export class ItemMasterServiceProxyModule {}
