import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
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

/** HrOnboardingModule wires internal onboarding access compensation ports without exposing public RPCs. */
@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    ClientsModule.register([
      {
        name: AUTH_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: 'auth_service',
          protoPath: [resolveCommonProtoPath('auth_service/auth.proto')],
          url: process.env.AUTH_GRPC_URL || 'localhost:50053'
        }
      },
      {
        name: IDENTITY_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: 'identity_service',
          protoPath: [resolveCommonProtoPath('identity_service/identity_query.proto')],
          url: process.env.IDENTITY_GRPC_URL || 'localhost:50052'
        }
      },
      {
        name: PERMISSION_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: 'permission_service',
          protoPath: [resolveCommonProtoPath('permission_service/permission_management.proto')],
          url: process.env.PERMISSION_GRPC_URL || 'localhost:50051'
        }
      }
    ])
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
