export interface ServiceInstance {
  ip: string
  port: number
  metadata?: Record<string, string>
}

export interface ServiceDiscovery {
  subscribe(serviceName: string): Promise<void>
  getInstances(serviceName: string): ServiceInstance[]
}
