import { DynamicModule, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ServiceKey, SERVICE_ENDPOINTS_CONFIG } from './service-map'

@Module({})
export class ClientModule {
  static register(serviceKeys: readonly ServiceKey[]): DynamicModule {
    return {
      module: ClientModule,
      imports: [
        ClientsModule.register(
          serviceKeys.map((serviceKey) => {
            const endpoint = SERVICE_ENDPOINTS_CONFIG[serviceKey]

            return {
              name: serviceKey,
              transport: Transport.TCP,
              options: {
                host: endpoint.host,
                port: endpoint.port
              }
            }
          })
        )
      ],
      exports: [ClientsModule]
    }
  }
}
