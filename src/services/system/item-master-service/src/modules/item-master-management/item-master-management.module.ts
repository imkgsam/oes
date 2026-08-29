import { Module } from '@nestjs/common'
import { ItemMasterTrustedExecutionModule } from '../item-master-trusted-execution.module'
import { TOKENS } from '../../common/constants/tokens'
import { ItemMasterManagementV2Service } from '../../application/item-master-v2.service'
import { ItemMasterAuditService } from '../../application/services/item-master-audit.service'
import { PrismaItemMasterAuditRepository } from '../../infrastructure/repositories/prisma/prisma-item-master-audit.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { ItemMasterManagementGrpcController } from '../../interfaces/grpc/item-master-management.grpc.controller'
import { ItemMasterVerifiedTenantContextGuard } from '../../interfaces/grpc/item-master-rpc-context.guard'

/** ItemMasterManagementModule wires Contract V2 command RPCs to the V2 application command service. */
@Module({
  imports: [PrismaModule, ItemMasterTrustedExecutionModule],
  providers: [
    {
      provide: TOKENS.ITEM_MASTER_AUDIT_WRITER,
      useClass: PrismaItemMasterAuditRepository
    },
    {
      provide: TOKENS.ITEM_MASTER_TRANSACTION_RUNNER,
      useExisting: PrismaService
    },
    ItemMasterVerifiedTenantContextGuard,
    ItemMasterAuditService,
    ItemMasterManagementV2Service
  ],
  controllers: [ItemMasterManagementGrpcController]
})
export class ItemMasterManagementModule {}
