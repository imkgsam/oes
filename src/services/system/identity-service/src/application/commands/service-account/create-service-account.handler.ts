import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT,
  IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT,
  IDENTITY_TENANT_NOT_FOUND,
  MACHINE_PRINCIPAL_SCOPE_LEVELS,
  SYMBOLS
} from '../../../common/constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import {
  TENANT_REFERENCE_PORT,
  TenantReferencePort
} from '../../ports/tenant-reference.port'
import { CreateServiceAccountCommand } from './create-service-account.command'

@CommandHandler(CreateServiceAccountCommand)
export class CreateServiceAccountHandler
  implements ICommandHandler<CreateServiceAccountCommand, ServiceAccountEntity>
{
  constructor(
    @Inject(TENANT_REFERENCE_PORT)
    private readonly tenantReferencePort: TenantReferencePort,
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: CreateServiceAccountCommand): Promise<ServiceAccountEntity> {
    if (
      command.scopeLevel === MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT &&
      !command.tenantId
    ) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT)
    }

    if (
      command.scopeLevel === MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM &&
      command.tenantId
    ) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT, {
        tenantId: command.tenantId
      })
    }

    if (command.tenantId) {
      const tenant = await this.tenantReferencePort.findById(command.tenantId)
      if (!tenant) {
        throw ExceptionFactory.domain(IDENTITY_TENANT_NOT_FOUND, {
          tenantId: command.tenantId
        })
      }

      this.checkResourceService.checkTenant(command.operatorScope, {
        resourceId: tenant.id,
        tenantId: tenant.id
      })
    } else if (command.operatorScope && !command.operatorScope.isSystemScope) {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        resourceType: 'service_account',
        resourceId: null,
        tenantId: null,
        operatorTenantId: command.operatorScope.tenantId
      })
    }

    return this.serviceAccountRepository.create({
      tenantId: command.tenantId,
      scopeLevel: command.scopeLevel,
      type: command.type,
      name: command.name,
      description: command.description,
      createdBy: command.operatorId
    })
  }
}
