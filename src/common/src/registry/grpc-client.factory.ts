import { Injectable } from '@nestjs/common'
import { NacosDiscoveryService } from './nacos.discovery.service'
import { RoundRobinLoadBalancer } from './loadbalancer'
import { GrpcClientPool } from './grpc-client-pool'

@Injectable()
export class GrpcClientFactory {
  private lb = new RoundRobinLoadBalancer()
  private pool = new GrpcClientPool()

  constructor(private readonly discovery: NacosDiscoveryService) {}

  async getClient(serviceName: string) {
    const instances = this.discovery.getInstances(serviceName)

    const selected = this.lb.select(serviceName, instances)

    return this.pool.getOrCreate(serviceName, selected.ip, selected.port)
  }
}
