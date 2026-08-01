import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY, RequirePermissionsMetadata } from '@oes/common/authorization'
import { EXTERNAL_API_ROUTE_METADATA_KEY } from './external-api-route.decorator'

/** Denies external bearer access unless the route has explicit exposure and matching existing permission metadata. */
@Injectable()
export class ExternalApiAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request: any = context.switchToHttp().getRequest(); const external = request?.externalApiContext
    if (!external) return true
    if (!this.config.get<boolean>('gateway.externalApi.externalOpening', false)) return false
    const handler = context.getHandler()
    const metadata = this.reflector.get<RequirePermissionsMetadata>(REQUIRE_PERMISSIONS_METADATA_KEY, handler)
    const required = metadata ? ('all' in metadata ? metadata.all : metadata.any) : undefined
    if (!this.reflector.get(EXTERNAL_API_ROUTE_METADATA_KEY, handler) || !required?.length) return false
    return 'all' in metadata! ? required.every((code) => external.scope.includes(code)) : required.some((code) => external.scope.includes(code))
  }
}
