import { GrpcAuthenticatedRequestContext } from '../types';
export declare class GrpcRequestContextStore {
    private readonly storage;
    run<T>(context: GrpcAuthenticatedRequestContext, callback: () => T): T;
    getContext(): GrpcAuthenticatedRequestContext | undefined;
}
