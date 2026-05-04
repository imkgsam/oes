import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization';
import { ReceivingExpectationLookupPort, ReceivingExpectationLookupResult } from '../../application/ports/receiving-expectation-lookup.port';
/** ProcurementReceivingExpectationGrpcAdapter validates referenced receiving expectations through procurement-service query truth. */
export declare class ProcurementReceivingExpectationGrpcAdapter implements ReceivingExpectationLookupPort, OnModuleInit {
    private readonly procurementClient;
    private readonly metadataFactory;
    private readonly requestContextStore;
    private receivingExpectationQueryService;
    constructor(procurementClient: ClientGrpc, metadataFactory: GrpcMetadataPropagationFactory, requestContextStore: GrpcRequestContextStore);
    onModuleInit(): void;
    getReceivingExpectationById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationLookupResult | null>;
    /** buildMetadata forwards trace/request context while keeping procurement lookup on the internal-service boundary. */
    private buildMetadata;
}
