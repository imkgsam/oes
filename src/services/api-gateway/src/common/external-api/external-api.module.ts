import { Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { ExternalApiRouteScanner } from './external-api-route.scanner'
import { ExternalApiAccessGuard } from './external-api-access.guard'
import { ExternalAuthExchangeController } from './external-auth-exchange.controller'
import { AuthBffModule } from '../../modules/auth-bff/auth-bff.module'

/** Composes the disabled-by-default external entry foundation without enabling business routes. */
@Module({ imports: [DiscoveryModule, AuthBffModule], controllers: [ExternalAuthExchangeController], providers: [ExternalApiRouteScanner, ExternalApiAccessGuard], exports: [ExternalApiAccessGuard] })
export class ExternalApiModule {}
