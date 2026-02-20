import { ServiceInstance } from './discovery.interface';

export class RoundRobinLoadBalancer {
  private counters = new Map<string, number>();

  select(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    if (!instances.length) {
      throw new Error(`No available instances for ${serviceName}`);
    }

    const count = this.counters.get(serviceName) ?? 0;
    const index = count % instances.length;

    this.counters.set(serviceName, count + 1);

    return instances[index];
  }
}