import { Module } from '@nestjs/common'
import { ItemMasterQueryV2Service } from '../../application/item-master-v2.service'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { ItemMasterQueryGrpcController } from '../../interfaces/grpc/item-master-query.grpc.controller'
import { ItemMasterRpcContextGuard } from '../../interfaces/grpc/item-master-rpc-context.guard'

/** ItemMasterQueryModule wires Contract V2 query RPCs to the V2 application read service. */
@Module({
  imports: [PrismaModule],
  providers: [ItemMasterQueryV2Service, ItemMasterRpcContextGuard],
  controllers: [ItemMasterQueryGrpcController]
})
export class ItemMasterQueryModule {}
