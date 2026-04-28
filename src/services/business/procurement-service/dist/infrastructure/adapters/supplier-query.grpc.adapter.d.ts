import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization';
import { SupplierOfferingReferenceLookupResult, SupplierReferenceLookupPort, SupplierReferenceLookupResult } from '../../application/ports/supplier-reference-lookup.port';
/** SupplierQueryGrpcAdapter validates supplier activity and standard-item offerability through srm-service query truth. */
export declare class SupplierQueryGrpcAdapter implements SupplierReferenceLookupPort, OnModuleInit {
    private readonly supplierClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private supplierQueryService;
    constructor(supplierClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    getSupplierById(tenantId: string, supplierId: string): Promise<SupplierReferenceLookupResult | null>;
    getActiveSupplierOffering(tenantId: string, supplierId: string, itemId: string): Promise<SupplierOfferingReferenceLookupResult | null>;
    /** buildMetadata forwards trace/request context while keeping supplier lookups on the internal-service boundary. */
    private buildMetadata;
    /** buildGetSupplierRequest mirrors the srm-service explicit query context contract for downstream lookups. */
    private buildGetSupplierRequest;
    /** buildListOfferingsRequest mirrors the srm-service explicit query context contract for downstream offerability checks. */
    private buildListOfferingsRequest;
}
