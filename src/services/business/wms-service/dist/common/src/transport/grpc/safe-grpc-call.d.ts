import { Observable } from 'rxjs';
export interface SafeGrpcCallOptions {
    timeoutMs?: number;
    caller?: string;
    method?: string;
}
/**
 * 安全执行 gRPC 调用。
 *
 * 处理策略：
 * 1. 超时 → 包装为 InfrastructureException
 * 2. 标准下游业务异常（RpcExceptionPayload）→ 直接透传
 * 3. 下游基础设施异常（UNAVAILABLE 等）→ 包装为 InfrastructureException
 * 4. 非标准 RpcException、原生 gRPC error、未知异常 → 包装为 InfrastructureException
 */
export declare function safeGrpcCall<T>(call$: Observable<T>, options?: SafeGrpcCallOptions): Promise<T>;
