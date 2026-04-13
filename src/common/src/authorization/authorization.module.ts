import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { authKeyConfig } from '../auth'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  INTERNAL_SERVICE_AUTHENTICATOR,
  OPERATOR_PERMISSION_RESOLVER,
  OPERATOR_CONTEXT_SIGNER,
  OPERATOR_CONTEXT_VERIFIER
} from './constants'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  PermissionGuard
} from './guards'
import { GrpcRequestContextInterceptor } from './interceptors'
import {
  DefaultGrpcMetadataPropagationFactory,
  DenyAllOperatorPermissionResolver,
  DefaultInternalServiceAuthenticator,
  GrpcRequestContextStore,
  OperatorContextCryptoService
} from './services'

@Global()
@Module({
  imports: [ConfigModule.forFeature(authKeyConfig)],
  providers: [
    DefaultInternalServiceAuthenticator,
    DenyAllOperatorPermissionResolver,
    DefaultGrpcMetadataPropagationFactory,
    GrpcRequestContextStore,
    GrpcRequestContextInterceptor,
    OperatorContextCryptoService,
    InternalServiceGuard,
    AuthenticatedOperatorGuard,
    PermissionGuard,
    {
      provide: INTERNAL_SERVICE_AUTHENTICATOR,
      useExisting: DefaultInternalServiceAuthenticator
    },
    {
      provide: GRPC_METADATA_PROPAGATION_FACTORY,
      useExisting: DefaultGrpcMetadataPropagationFactory
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
    OperatorContextCryptoService,
    DefaultGrpcMetadataPropagationFactory,
    GrpcRequestContextStore,
    GrpcRequestContextInterceptor,
    InternalServiceGuard,
    AuthenticatedOperatorGuard,
    PermissionGuard,
    GRPC_METADATA_PROPAGATION_FACTORY,
    INTERNAL_SERVICE_AUTHENTICATOR,
    OPERATOR_PERMISSION_RESOLVER,
    OPERATOR_CONTEXT_SIGNER,
    OPERATOR_CONTEXT_VERIFIER
  ]
})
export class AuthorizationModule {}
