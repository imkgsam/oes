import { Metadata } from '@grpc/grpc-js';
import { GrpcMetadataPropagationFactory, InternalCallMetadataInput, OperatorContextSigner, OperatorScopedMetadataInput } from '../types';
export declare class DefaultGrpcMetadataPropagationFactory implements GrpcMetadataPropagationFactory {
    private readonly signer;
    constructor(signer: OperatorContextSigner);
    createInternalCallMetadata(input: InternalCallMetadataInput): Metadata;
    createOperatorScopedMetadata(input: OperatorScopedMetadataInput): Metadata;
    private buildPayload;
    private requireServiceName;
    private requireOperatorId;
    private requireOperatorType;
    private normalizeOptional;
    private normalizeStringArray;
}
