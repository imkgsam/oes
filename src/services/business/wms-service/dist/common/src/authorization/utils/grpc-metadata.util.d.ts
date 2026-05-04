import { Metadata } from '@grpc/grpc-js';
import { AuthenticatedGrpcRequestContext, OperatorContextPayload } from '../types';
export declare function getGrpcMetadataValue(metadata: Metadata | undefined, key: string): string | undefined;
export declare function attachOperatorContext(rpcData: unknown, payload: OperatorContextPayload): AuthenticatedGrpcRequestContext | undefined;
export declare function attachInternalService(rpcData: unknown, serviceName: string): AuthenticatedGrpcRequestContext | undefined;
export declare function getAuthenticatedGrpcRequestContext(rpcData: unknown): AuthenticatedGrpcRequestContext | undefined;
