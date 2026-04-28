import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization';
import { ItemReferenceLookupPort, ItemReferenceLookupResult } from '../../application/ports/item-reference-lookup.port';
/** ItemMasterQueryGrpcAdapter validates standard-item identity and purchasable capability through item-master-service query truth. */
export declare class ItemMasterQueryGrpcAdapter implements ItemReferenceLookupPort, OnModuleInit {
    private readonly itemMasterClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private itemMasterQueryService;
    constructor(itemMasterClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    getItemById(tenantId: string, itemId: string): Promise<ItemReferenceLookupResult | null>;
    /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
    private buildMetadata;
}
