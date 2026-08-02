import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DiscoveryService, Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY, RequirePermissionsMetadata } from '@oes/common/authorization'
import { EXTERNAL_API_ROUTE_METADATA_KEY } from './external-api-route.decorator'

/** Fails startup when an externally marked Gateway route lacks one valid existing BUSINESS permission declaration. */
@Injectable()
export class ExternalApiRouteScanner implements OnModuleInit {
  constructor(private readonly discovery: DiscoveryService, private readonly reflector: Reflector, private readonly config: ConfigService) {}
  onModuleInit(): void {
    for (const wrapper of this.discovery.getControllers()) {
      const prototype = wrapper.instance && Object.getPrototypeOf(wrapper.instance)
      if (!prototype) continue
      for (const name of Object.getOwnPropertyNames(prototype)) {
        const handler = prototype[name]
        if (typeof handler !== 'function' || !this.reflector.get<boolean>(EXTERNAL_API_ROUTE_METADATA_KEY, handler)) continue
        if (!this.config.get<boolean>('gateway.externalApi.externalOpening', false)) throw new Error(`External API opening disabled for route: ${name}`)
        const metadata = this.reflector.get<RequirePermissionsMetadata>(REQUIRE_PERMISSIONS_METADATA_KEY, handler)
        const codes = metadata ? ('all' in metadata ? metadata.all : metadata.any) : undefined
        if (!codes?.length || codes.some((code) => code.includes('.internal.') || !code.trim())) throw new Error(`Invalid external API route declaration: ${name}`)
      }
    }
  }
}
