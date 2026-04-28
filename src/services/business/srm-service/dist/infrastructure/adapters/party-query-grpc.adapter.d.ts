import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization';
import { TenantPartyLookupPort, TenantPartyLookupResult } from '../../application/ports/tenant-party-lookup.port';
/** PartyQueryGrpcAdapter validates tenantParty references against party-service before SRM binds them. */
export declare class PartyQueryGrpcAdapter implements TenantPartyLookupPort, OnModuleInit {
    private readonly partyClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private partyQueryService;
    constructor(partyClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    getTenantPartyById(tenantId: string, tenantPartyId: string): Promise<TenantPartyLookupResult | null>;
    /** buildMetadata forwards trace/request context while keeping party lookup on the internal-service boundary. */
    private buildMetadata;
}
