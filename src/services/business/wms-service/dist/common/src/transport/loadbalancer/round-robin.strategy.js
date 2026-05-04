"use strict";
/**
 * @file Round-robin load balancing strategy
 * @module transport/loadbalancer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundRobinStrategy = void 0;
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
class RoundRobinStrategy {
    counters = new Map();
    select(serviceName, endpoints) {
        const healthy = endpoints.filter((e) => e.healthy !== false);
        if (healthy.length === 0) {
            throw new Error(`[LoadBalancer] No healthy endpoints available for "${serviceName}"`);
        }
        const current = this.counters.get(serviceName) ?? 0;
        const index = current % healthy.length;
        this.counters.set(serviceName, current + 1);
        return healthy[index];
    }
    reset(serviceName) {
        this.counters.delete(serviceName);
    }
}
exports.RoundRobinStrategy = RoundRobinStrategy;
//# sourceMappingURL=round-robin.strategy.js.map