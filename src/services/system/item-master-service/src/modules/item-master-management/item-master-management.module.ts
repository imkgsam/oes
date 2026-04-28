import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ChangeItemStatusHandler } from '../../application/commands/change-item-status.handler'
import { CreateItemHandler } from '../../application/commands/create-item.handler'
import { SetItemCapabilitiesHandler } from '../../application/commands/set-item-capabilities.handler'
import { SetItemCompositionHandler } from '../../application/commands/set-item-composition.handler'
import { UpdateItemBasicsHandler } from '../../application/commands/update-item-basics.handler'
import { UpsertSupplierItemMappingHandler } from '../../application/commands/upsert-supplier-item-mapping.handler'
import { ItemMasterAuditService } from '../../application/services/item-master-audit.service'
import { PrismaItemCompositionRepository } from '../../infrastructure/repositories/prisma/prisma-item-composition.repository'
import { PrismaItemRepository } from '../../infrastructure/repositories/prisma/prisma-item.repository'
import { PrismaItemMasterAuditRepository } from '../../infrastructure/repositories/prisma/prisma-item-master-audit.repository'
import { PrismaSupplierItemMappingRepository } from '../../infrastructure/repositories/prisma/prisma-supplier-item-mapping.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { ItemMasterManagementGrpcController } from '../../interfaces/grpc/item-master-management.grpc.controller'
import { ItemMasterRpcContextGuard } from '../../interfaces/grpc/item-master-rpc-context.guard'

/** ItemMasterManagementModule wires the phase 1 command controllers, handlers, Prisma repositories, and audit. */
@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: TOKENS.ITEM_REPOSITORY,
      useClass: PrismaItemRepository
    },
    {
      provide: TOKENS.ITEM_COMPOSITION_REPOSITORY,
      useClass: PrismaItemCompositionRepository
    },
    {
      provide: TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY,
      useClass: PrismaSupplierItemMappingRepository
    },
    {
      provide: TOKENS.ITEM_MASTER_AUDIT_WRITER,
      useClass: PrismaItemMasterAuditRepository
    },
    {
      provide: TOKENS.ITEM_MASTER_TRANSACTION_RUNNER,
      useExisting: PrismaService
    },
    ValidatingCommandBus,
    ItemMasterRpcContextGuard,
    ItemMasterAuditService,
    CreateItemHandler,
    UpdateItemBasicsHandler,
    SetItemCapabilitiesHandler,
    SetItemCompositionHandler,
    UpsertSupplierItemMappingHandler,
    ChangeItemStatusHandler
  ],
  controllers: [ItemMasterManagementGrpcController]
})
export class ItemMasterManagementModule {}
