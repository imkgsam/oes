import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'

export class GrpcClientPool {
  private pool = new Map<string, ClientGrpc>()

  getOrCreate(serviceName: string, ip: string, port: number): ClientGrpc {
    const key = `${serviceName}-${ip}:${port}`

    if (this.pool.has(key)) {
      return this.pool.get(key)!
    }

    const client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        url: `${ip}:${port}`,
        package: serviceName,
        protoPath: `protos/${serviceName}.proto`
      }
    }) as ClientGrpc

    this.pool.set(key, client)
    return client
  }
}
