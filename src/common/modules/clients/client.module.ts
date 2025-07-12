// common/clients/client.module.ts
import { DynamicModule, Logger, Module, Provider } from '@nestjs/common'
import { SERVICE_ENDPOINTS_CONFIG, SERVICE_CLIENT_TOKENS } from './service-map'
import { getOrCreateClient } from './client-registry'
import { ClientConnectionLifecycle } from './lifecycle.hook'

@Module({})
export class ClientModule {
  static register(clientKeys: string[]): DynamicModule {
    const logger = new Logger(ClientModule.name)
    logger.log(`ClientModule.register() 初始化客户端: ${clientKeys.join(', ')}`)
    const uniqueClientKeys = Array.from(new Set(clientKeys))
    const validClientKeys = uniqueClientKeys.filter((k) =>
      Object.prototype.hasOwnProperty.call(SERVICE_ENDPOINTS_CONFIG, k),
    )

    const unknownKeys = uniqueClientKeys.filter(
      (k) => !validClientKeys.includes(k),
    )
    if (unknownKeys.length) {
      logger.warn(
        `ClientModule.register() 忽略了未知 client: ${unknownKeys.join(', ')}`,
      )
    }

    const providers: Provider[] = validClientKeys.map((key) => ({
      provide: SERVICE_CLIENT_TOKENS[key],
      useValue: getOrCreateClient(key, SERVICE_ENDPOINTS_CONFIG[key]),
    }))

    logger.log(
      'ClientModule initialized with endpoints: ' +
        Object.keys(SERVICE_ENDPOINTS_CONFIG).length,
    )

    return {
      module: ClientModule,
      providers: [...providers, ClientConnectionLifecycle],
      exports: providers,
    }
  }
}
