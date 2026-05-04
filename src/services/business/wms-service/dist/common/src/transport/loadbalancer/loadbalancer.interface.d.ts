/**
 * @file Load balancer interfaces
 * @module transport/loadbalancer
 */
/**
 * Represents a single service instance endpoint.
 */
export interface ServiceEndpoint {
    /** IP address or hostname */
    ip: string;
    /** Port number */
    port: number;
    /** Current weight for weighted load balancing (default: 1) */
    weight?: number;
    /** Whether this endpoint is considered healthy */
    healthy?: boolean;
    /** Optional metadata from service registry */
    metadata?: Record<string, string>;
}
/**
 * Load balancer strategy interface.
 *
 * Implementations select one endpoint from a list of available endpoints
 * based on a specific algorithm (round-robin, weighted, random, etc.).
 */
export interface LoadBalancer {
    /**
     * Select an endpoint from the available list.
     *
     * @param serviceName - The service name (used for per-service state tracking)
     * @param endpoints - List of available endpoints
     * @returns The selected endpoint
     * @throws Error if no endpoints are available
     */
    select(serviceName: string, endpoints: ServiceEndpoint[]): ServiceEndpoint;
    /**
     * Reset internal state for a specific service.
     * Called when the instance list changes significantly.
     */
    reset(serviceName: string): void;
}
