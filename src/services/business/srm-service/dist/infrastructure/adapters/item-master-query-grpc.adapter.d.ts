import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization';
import { ItemLookupPort, ItemLookupResult } from '../../application/ports/item-lookup.port';
/** ItemMasterQueryGrpcAdapter validates item identity and purchasable capability through item-master-service query truth. */
export declare class ItemMasterQueryGrpcAdapter implements ItemLookupPort, OnModuleInit {
    private readonly itemMasterClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private itemMasterQueryService;
    constructor(itemMasterClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    getItemById(tenantId: string, itemId: string): Promise<ItemLookupResult | null>;
    /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
    private buildMetadata;
}
