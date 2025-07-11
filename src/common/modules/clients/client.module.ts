// common/clients/client.module.ts
import { DynamicModule, Logger, Module, Provider } from '@nestjs/common'
import { SERVICE_ENDPOINTS_CONFIG, SERVICE_CLIENT_TOKENS } from './service-map'
import { getOrCreateClient } from './client-registry'
import { ClientConnectionLifecycle } from './lifecycle.hook'

@Module({})
export class ClientModule {
  static register(): DynamicModule {
    const providers: Provider[] = Object.entries(SERVICE_ENDPOINTS_CONFIG).map(
      ([key, endpoint]) => ({
        provide: SERVICE_CLIENT_TOKENS[key],
        useValue: getOrCreateClient(key, endpoint),
      }),
    )

    const logger = new Logger(ClientModule.name)
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
