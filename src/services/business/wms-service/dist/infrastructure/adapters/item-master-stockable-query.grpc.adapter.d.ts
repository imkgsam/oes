import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization';
import { StockableItemLookupPort, StockableItemLookupResult } from '../../application/ports/stockable-item-lookup.port';
/** ItemMasterStockableQueryGrpcAdapter validates WMS receipt items through item-master-service query truth. */
export declare class ItemMasterStockableQueryGrpcAdapter implements StockableItemLookupPort, OnModuleInit {
    private readonly itemMasterClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private itemMasterQueryService;
    constructor(itemMasterClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    getItemById(tenantId: string, itemId: string): Promise<StockableItemLookupResult | null>;
    /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
    private buildMetadata;
}
