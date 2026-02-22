/**
 * @file Round-robin load balancing strategy
 * @module transport/loadbalancer
 */

import { LoadBalancer, ServiceEndpoint } from './loadbalancer.interface'

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
export class RoundRobinStrategy implements LoadBalancer {
  private counters = new Map<string, number>()

  select(serviceName: string, endpoints: ServiceEndpoint[]): ServiceEndpoint {
    const healthy = endpoints.filter((e) => e.healthy !== false)

    if (healthy.length === 0) {
      throw new Error(`[LoadBalancer] No healthy endpoints available for "${serviceName}"`)
    }

    const current = this.counters.get(serviceName) ?? 0
    const index = current % healthy.length
    this.counters.set(serviceName, current + 1)

    return healthy[index]
  }

  reset(serviceName: string): void {
    this.counters.delete(serviceName)
  }
}
