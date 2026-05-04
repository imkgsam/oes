/**
 * @file Service discovery interfaces
 * @module registry
 */
/**
 * Represents a single service instance registered in the service registry.
 */
export interface ServiceInstance {
    /** IP address or hostname */
    ip: string;
    /** Port number */
    port: number;
    /** Optional metadata attached to the instance */
    metadata?: Record<string, string>;
}
/**
 * Service discovery contract.
 *
 * Implementations subscribe to service instance changes and maintain
 * a local cache of healthy instances for fast lookups.
 */
export interface ServiceDiscovery {
    /**
     * Subscribe to instance changes for a service.
     * After subscribing, `getInstances()` will return cached healthy instances.
     */
    subscribe(serviceName: string): Promise<void>;
    /**
     * Get the current list of healthy instances for a service.
     * Returns an empty array if no instances are available or not yet subscribed.
     */
    getInstances(serviceName: string): ServiceInstance[];
}
