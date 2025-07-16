import { AsyncLocalStorage } from 'async_hooks';
interface TraceStore {
    traceId: string;
}
export declare const traceStorage: AsyncLocalStorage<TraceStore>;
export declare function setTraceId(traceId: string): void;
export declare function getTraceId(): string | undefined;
export {};
