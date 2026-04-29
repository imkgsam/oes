import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { BatchGetItemsHandler } from '../../application/queries/batch-get-items.handler'
import { GetItemCompositionHandler } from '../../application/queries/get-item-composition.handler'
import { GetItemHandler } from '../../application/queries/get-item.handler'
import { ListItemCategoriesHandler } from '../../application/queries/list-item-categories.handler'
import { ListSupplierItemMappingsByItemHandler } from '../../application/queries/list-supplier-item-mappings-by-item.handler'
import { ResolveSupplierItemMappingHandler } from '../../application/queries/resolve-supplier-item-mapping.handler'
import { SearchItemsHandler } from '../../application/queries/search-items.handler'
import { PrismaItemCategoryRepository } from '../../infrastructure/repositories/prisma/prisma-item-category.repository'
import { PrismaItemCompositionRepository } from '../../infrastructure/repositories/prisma/prisma-item-composition.repository'
import { PrismaItemRepository } from '../../infrastructure/repositories/prisma/prisma-item.repository'
import { PrismaSupplierItemMappingRepository } from '../../infrastructure/repositories/prisma/prisma-supplier-item-mapping.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { ItemMasterQueryGrpcController } from '../../interfaces/grpc/item-master-query.grpc.controller'
import { ItemMasterRpcContextGuard } from '../../interfaces/grpc/item-master-rpc-context.guard'

/** ItemMasterQueryModule wires the phase 1 query controllers, handlers, and Prisma repositories. */
@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: TOKENS.ITEM_REPOSITORY,
      useClass: PrismaItemRepository
    },
    {
      provide: TOKENS.ITEM_CATEGORY_REPOSITORY,
      useClass: PrismaItemCategoryRepository
    },
    {
      provide: TOKENS.ITEM_COMPOSITION_REPOSITORY,
      useClass: PrismaItemCompositionRepository
    },
    {
      provide: TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY,
      useClass: PrismaSupplierItemMappingRepository
    },
    ValidatingQueryBus,
    ItemMasterRpcContextGuard,
    GetItemHandler,
    BatchGetItemsHandler,
    SearchItemsHandler,
    ListItemCategoriesHandler,
    GetItemCompositionHandler,
    ListSupplierItemMappingsByItemHandler,
    ResolveSupplierItemMappingHandler
  ],
  controllers: [ItemMasterQueryGrpcController]
})
export class ItemMasterQueryModule {}
