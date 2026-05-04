/**
 * @file Weighted round-robin load balancing strategy
 * @module transport/loadbalancer
 */
import { LoadBalancer, ServiceEndpoint } from './loadbalancer.interface';
/**
 * Weighted round-robin load balancer.
 *
 * Distributes requests proportionally based on endpoint weights.
 * Endpoints with higher weights receive more requests.
 * Unhealthy endpoints are automatically excluded.
 *
 * Uses the smooth weighted round-robin algorithm (Nginx-style)
 * to avoid burst traffic to high-weight endpoints.
 *
 * @example
 * ```typescript
 * const lb = new WeightedRoundRobinStrategy()
 * // endpoint A (weight=3) gets ~3x more traffic than B (weight=1)
 * const endpoint = lb.select('auth-service', [
 *   { ip: '10.0.0.1', port: 50051, weight: 3, healthy: true },
 *   { ip: '10.0.0.2', port: 50051, weight: 1, healthy: true },
 * ])
 * ```
 */
export declare class WeightedRoundRobinStrategy implements LoadBalancer {
    /**
     * Per-service state tracking for smooth weighted round-robin.
     * Maps serviceName → array of current weights (one per endpoint).
     */
    private state;
    select(serviceName: string, endpoints: ServiceEndpoint[]): ServiceEndpoint;
    reset(serviceName: string): void;
    /**
     * Check if the endpoint keys match (detect instance list changes).
     */
    private keysMatch;
}
