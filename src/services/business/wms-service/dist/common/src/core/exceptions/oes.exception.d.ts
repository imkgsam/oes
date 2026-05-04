import { status } from '@grpc/grpc-js';
import { ExceptionDefinition, HttpExceptionPayload, RpcExceptionPayload } from './exception.interface';
import { RpcMappableException, HttpMappableException } from './exception.interface';
export declare abstract class OESExceptionBase extends Error implements RpcMappableException, HttpMappableException {
    readonly definition: ExceptionDefinition;
    readonly additionalDetails: any;
    constructor(def: ExceptionDefinition, additionalDetails?: any);
    toRpcPayload(): RpcExceptionPayload;
    toHttpPayload(): HttpExceptionPayload;
    getHttpStatus(): number;
    getRpcStatus(): status;
    getCode(): string;
    getI18nKey(): string;
    private normalizeDetails;
}
export declare class DomainException extends OESExceptionBase {
}
export declare class InfrastructureException extends OESExceptionBase {
}
export declare class ApplicationException extends OESExceptionBase {
}
