/**
 * @file Round-robin load balancing strategy
 * @module transport/loadbalancer
 */
import { LoadBalancer, ServiceEndpoint } from './loadbalancer.interface';
/**
 * Simple round-robin load balancer.
 *
 * Cycles through available endpoints sequentially, distributing
 * requests evenly across all healthy instances.
 *
 * @example
 * ```typescript
 * const lb = new RoundRobinStrategy()
 * const endpoint = lb.select('auth-service', endpoints)
 * ```
 */
export declare class RoundRobinStrategy implements LoadBalancer {
    private counters;
    select(serviceName: string, endpoints: ServiceEndpoint[]): ServiceEndpoint;
    reset(serviceName: string): void;
}
