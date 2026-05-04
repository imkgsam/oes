"use strict";
/**
 * @file Weighted round-robin load balancing strategy
 * @module transport/loadbalancer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightedRoundRobinStrategy = void 0;
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
class WeightedRoundRobinStrategy {
    /**
     * Per-service state tracking for smooth weighted round-robin.
     * Maps serviceName → array of current weights (one per endpoint).
     */
    state = new Map();
    select(serviceName, endpoints) {
        const healthy = endpoints.filter((e) => e.healthy !== false);
        if (healthy.length === 0) {
            throw new Error(`[LoadBalancer] No healthy endpoints available for "${serviceName}"`);
        }
        // If only one endpoint, short-circuit
        if (healthy.length === 1) {
            return healthy[0];
        }
        const keys = healthy.map((e) => `${e.ip}:${e.port}`);
        const weights = healthy.map((e) => e.weight ?? 1);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        // Get or initialize state
        let svcState = this.state.get(serviceName);
        if (!svcState || !this.keysMatch(svcState.endpoints, keys)) {
            svcState = {
                endpoints: keys,
                currentWeights: new Array(healthy.length).fill(0)
            };
            this.state.set(serviceName, svcState);
        }
        // Smooth weighted round-robin (Nginx algorithm):
        // 1. Add effective weight to current weight for each endpoint
        // 2. Select the endpoint with the highest current weight
        // 3. Subtract total weight from the selected endpoint's current weight
        let maxIdx = 0;
        for (let i = 0; i < healthy.length; i++) {
            svcState.currentWeights[i] += weights[i];
            if (svcState.currentWeights[i] > svcState.currentWeights[maxIdx]) {
                maxIdx = i;
            }
        }
        svcState.currentWeights[maxIdx] -= totalWeight;
        return healthy[maxIdx];
    }
    reset(serviceName) {
        this.state.delete(serviceName);
    }
    /**
     * Check if the endpoint keys match (detect instance list changes).
     */
    keysMatch(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
}
exports.WeightedRoundRobinStrategy = WeightedRoundRobinStrategy;
//# sourceMappingURL=weighted-round-robin.strategy.js.map