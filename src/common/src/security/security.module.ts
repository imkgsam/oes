import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { authKeyConfig } from '../auth'
import {
  INTERNAL_SERVICE_AUTHENTICATOR,
  OPERATOR_PERMISSION_RESOLVER,
  OPERATOR_CONTEXT_SIGNER,
  OPERATOR_CONTEXT_VERIFIER
} from './constants'
import { AuthenticatedOperatorGuard, InternalServiceGuard, PermissionGuard } from './guards'
import {
  DenyAllOperatorPermissionResolver,
  DefaultInternalServiceAuthenticator,
  OperatorContextCryptoService
} from './services'

@Global()
@Module({
  imports: [ConfigModule.forFeature(authKeyConfig)],
  providers: [
    DefaultInternalServiceAuthenticator,
    DenyAllOperatorPermissionResolver,
    OperatorContextCryptoService,
    InternalServiceGuard,
    AuthenticatedOperatorGuard,
    PermissionGuard,
    {
      provide: INTERNAL_SERVICE_AUTHENTICATOR,
      useExisting: DefaultInternalServiceAuthenticator
    },
    {
      provide: OPERATOR_CONTEXT_SIGNER,
      useExisting: OperatorContextCryptoService
    },
    {
      provide: OPERATOR_CONTEXT_VERIFIER,
      useExisting: OperatorContextCryptoService
    },
    {
      provide: OPERATOR_PERMISSION_RESOLVER,
      useExisting: DenyAllOperatorPermissionResolver
    }
  ],
  exports: [
    InternalServiceGuard,
    AuthenticatedOperatorGuard,
    PermissionGuard,
    INTERNAL_SERVICE_AUTHENTICATOR,
    OPERATOR_PERMISSION_RESOLVER,
    OPERATOR_CONTEXT_SIGNER,
    OPERATOR_CONTEXT_VERIFIER
  ]
})
export class SecurityModule {}
