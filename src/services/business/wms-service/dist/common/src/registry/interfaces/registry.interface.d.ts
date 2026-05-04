/**
 * @file Service registry interfaces
 * @module registry
 */
/**
 * Service registry contract.
 *
 * Implementations register and deregister the current service instance
 * with a service registry (e.g., Nacos, Consul, etcd).
 */
export interface ServiceRegistry {
    /** Register the current service instance */
    register(): Promise<void>;
    /** Deregister the current service instance */
    deregister(): Promise<void>;
}
