import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY
} from '../../domain/repositories'
import {
  AUTH_LOGIN_BOOTSTRAP_PORT,
  IDENTITY_EMPLOYEE_BINDING_PORT,
  IDENTITY_ACCOUNT_PROVISIONING_PORT,
  PERMISSION_ONBOARDING_GRANT_PORT
} from '../../application/ports'
import { HrOnboardingAccessService } from '../../application/services'
import {
  AUTH_GRPC_CLIENT,
  AuthLoginBootstrapGrpcAdapter
} from '../../infrastructure/adapters/auth-login-bootstrap-grpc.adapter'
import { IdentityAccountProvisioningGrpcAdapter } from '../../infrastructure/adapters/identity-account-provisioning-grpc.adapter'
import {
  IDENTITY_GRPC_CLIENT,
  IdentityEmployeeBindingGrpcAdapter
} from '../../infrastructure/adapters/identity-employee-binding-grpc.adapter'
import {
  PERMISSION_GRPC_CLIENT,
  PermissionOnboardingGrantGrpcAdapter
} from '../../infrastructure/adapters/permission-onboarding-grant-grpc.adapter'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaEmployeeRepository } from '../../infrastructure/repositories/prisma-employee.repository'
import { PrismaEmploymentRepository } from '../../infrastructure/repositories/prisma-employment.repository'
import { PrismaOnboardingAccessRepository } from '../../infrastructure/repositories/prisma-onboarding-access.repository'

/** resolveDownstreamGrpcUrl resolves standard service URLs first while preserving legacy local env names. */
function resolveDownstreamGrpcUrl(
  standardEnvKey: string,
  legacyEnvKey: string,
  fallbackUrl: string
): string | undefined {
  const standardUrl = process.env[standardEnvKey]?.trim()
  if (standardUrl) {
    return standardUrl
  }

  const legacyUrl = process.env[legacyEnvKey]?.trim()
  if (legacyUrl) {
    return legacyUrl
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return fallbackUrl
  }

  return undefined
}

/** buildHrOnboardingGrpcClients declares account bootstrap downstream clients with canonical local ports. */
export function buildHrOnboardingGrpcClients(): ClientProviderOptions[] {
  return [
    {
      name: AUTH_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: [resolveCommonProtoPath('auth_service/auth.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_AUTH_URL', 'AUTH_GRPC_URL', '127.0.0.1:50050')
      }
    },
    {
      name: IDENTITY_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'identity_service',
        protoPath: [resolveCommonProtoPath('identity_service/identity_query.proto')],
        url: resolveDownstreamGrpcUrl(
          'GRPC_SERVICE_IDENTITY_URL',
          'IDENTITY_GRPC_URL',
          '127.0.0.1:50052'
        )
      }
    },
    {
      name: PERMISSION_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'permission_service',
        protoPath: [resolveCommonProtoPath('permission_service/permission_management.proto')],
        url: resolveDownstreamGrpcUrl(
          'GRPC_SERVICE_PERMISSION_URL',
          'PERMISSION_GRPC_URL',
          '127.0.0.1:50051'
        )
      }
    }
  ]
}

/** Adds mandatory workload credentials and rejects an unresolved production target URL. */
function createMtlsClientProvider(client: ClientProviderOptions): ClientProviderOptions {
  if (
    !('transport' in client) ||
    client.transport !== Transport.GRPC ||
    !('options' in client) ||
    !('url' in client.options) ||
    !client.options.url
  ) {
    throw new Error('HR_FOUNDATION_EXECUTION_UNAVAILABLE')
  }
  return {
    ...client,
    options: { ...client.options, credentials: createGrpcClientCredentials() }
  } as ClientProviderOptions
}

/** HrOnboardingModule wires internal onboarding access compensation ports without exposing public RPCs. */
@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    ClientsModule.registerAsync(
      buildHrOnboardingGrpcClients().map((client) => ({
        name: client.name,
        useFactory: () => createMtlsClientProvider(client)
      }))
    )
  ],
  providers: [
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: PrismaEmployeeRepository
    },
    {
      provide: EMPLOYMENT_REPOSITORY,
      useClass: PrismaEmploymentRepository
    },
    {
      provide: ONBOARDING_ACCESS_REPOSITORY,
      useClass: PrismaOnboardingAccessRepository
    },
    {
      provide: IDENTITY_ACCOUNT_PROVISIONING_PORT,
      useClass: IdentityAccountProvisioningGrpcAdapter
    },
    {
      provide: AUTH_LOGIN_BOOTSTRAP_PORT,
      useClass: AuthLoginBootstrapGrpcAdapter
    },
    {
      provide: IDENTITY_EMPLOYEE_BINDING_PORT,
      useClass: IdentityEmployeeBindingGrpcAdapter
    },
    {
      provide: PERMISSION_ONBOARDING_GRANT_PORT,
      useClass: PermissionOnboardingGrantGrpcAdapter
    },
    HrOnboardingAccessService
  ],
  exports: [HrOnboardingAccessService]
})
export class HrOnboardingModule {}
