import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { randomUUID } from 'crypto'
import { AccountType } from '../../../domain/enums/account-type.enum'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { OnboardingGrantRequestEntity } from '../../../domain/entities/onboarding-grant-request.entity'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { OnboardingGrantRequestRepository } from '../../../domain/repositories/onboarding-grant-request.repository'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  ONBOARDING_GRANT_ACCOUNT_NOT_FOUND,
  ONBOARDING_GRANT_ACCOUNT_TENANT_MISMATCH,
  ONBOARDING_GRANT_IDEMPOTENCY_CONFLICT,
  ROLE_NOT_ASSIGNABLE,
  ROLE_NOT_FOUND,
  ROLE_TEMPLATE_NOT_FOUND
} from '../../../common/constants/exception-enums'
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT,
  IdentityAccountReferencePort
} from '../../ports/identity-account-reference.port'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'
import { syncTemplateNavigationToRole } from './template-navigation.sync'
import { GrantInitialAccessForEmployeeAccountCommand } from './grant-initial-access-for-employee-account.command'

const ACCOUNT_BASIC_ROLE_CODE = 'account.basic'

/** GrantInitialAccessForEmployeeAccountHandler validates onboarding grant inputs and persists idempotent role grants. */
@CommandHandler(GrantInitialAccessForEmployeeAccountCommand)
export class GrantInitialAccessForEmployeeAccountHandler implements ICommandHandler<
  GrantInitialAccessForEmployeeAccountCommand,
  {
    grantId: string | null
    idempotencyKey: string
    accountId: string
    roleIds: string[]
  }
> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepository: RoleRepository,
    @Inject(SYMBOLS.REPO.ONBOARDING_GRANT_REQUEST)
    private readonly onboardingGrantRequestRepository: OnboardingGrantRequestRepository,
    @Inject(IDENTITY_ACCOUNT_REFERENCE_PORT)
    private readonly identityAccountReferencePort: IdentityAccountReferencePort,
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepository: NavigationRepository
  ) {}

  async execute(command: GrantInitialAccessForEmployeeAccountCommand) {
    const tenantId = requireNonBlank(command.tenantId, 'tenantId')
    const accountId = requireNonBlank(command.accountId, 'accountId')
    const idempotencyKey = requireNonBlank(command.idempotencyKey, 'idempotencyKey')

    assertRoleScopeAccess(command.operatorScope, ScopeLevel.TENANT, tenantId, {
      requestedTenantId: tenantId
    })

    const account = await this.identityAccountReferencePort.getAccountById(accountId)
    if (!account) {
      throw ExceptionFactory.domain(ONBOARDING_GRANT_ACCOUNT_NOT_FOUND, {
        accountId
      })
    }
    if (
      account.isActive === false ||
      account.scopeLevel !== 'TENANT' ||
      account.tenantId !== tenantId
    ) {
      throw ExceptionFactory.domain(ONBOARDING_GRANT_ACCOUNT_TENANT_MISMATCH, {
        accountId,
        expectedTenantId: tenantId,
        actualTenantId: account.tenantId,
        scopeLevel: account.scopeLevel
      })
    }

    const roleIds = await this.resolveOnboardingRoleIds(tenantId, command.roleIds)
    const fingerprint = JSON.stringify({
      tenantId,
      accountId,
      roleIds
    })

    const existing =
      await this.onboardingGrantRequestRepository.findByIdempotencyKey(idempotencyKey)
    if (existing) {
      this.assertMatchingExisting(existing, fingerprint)
      if (existing.status === 'SUCCEEDED') {
        return this.toResult(existing)
      }
    }

    const pending =
      existing ??
      (await this.onboardingGrantRequestRepository.createPending({
        idempotencyKey,
        tenantId,
        accountId,
        roleIds,
        bindingIds: roleIds.map(() => randomUUID()),
        fingerprint
      }))
    const bindingIds =
      pending.bindingIds?.length === roleIds.length
        ? pending.bindingIds
        : roleIds.map(() => randomUUID())

    for (const [index, roleId] of roleIds.entries()) {
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        throw ExceptionFactory.domain(ROLE_NOT_FOUND, {
          roleId
        })
      }

      if (role.kind !== RoleKind.TENANT_INSTANCE || role.tenantId !== tenantId || !role.isEnabled) {
        throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE, {
          roleId,
          tenantId,
          roleTenantId: role.tenantId,
          roleKind: role.kind,
          roleEnabled: role.isEnabled
        })
      }

      await this.roleRepository.assignAccountRole(
        accountId,
        roleId,
        tenantId,
        ScopeLevel.TENANT,
        AccountType.USER,
        null,
        null,
        {
          operatorId: command.operatorScope?.operatorId ?? 'system',
          requestId: command.operatorScope?.requestId,
          traceId: command.operatorScope?.traceId,
          bindingId: bindingIds[index]
        }
      )
    }

    const persisted = await this.onboardingGrantRequestRepository.markSucceeded({
      idempotencyKey,
      tenantId,
      accountId,
      roleIds,
      bindingIds,
      fingerprint
    })

    return this.toResult(persisted)
  }

  /** assertMatchingExisting prevents one idempotency key from representing a different grant. */
  private assertMatchingExisting(
    existing: OnboardingGrantRequestEntity,
    fingerprint: string
  ): void {
    if (existing.fingerprint !== fingerprint) {
      throw ExceptionFactory.domain(ONBOARDING_GRANT_IDEMPOTENCY_CONFLICT, {
        idempotencyKey: existing.idempotencyKey,
        accountId: existing.accountId
      })
    }
  }

  private toResult(existing: OnboardingGrantRequestEntity) {
    return {
      grantId: existing.id,
      idempotencyKey: existing.idempotencyKey,
      accountId: existing.accountId,
      roleIds: existing.roleIds,
      bindingIds: existing.bindingIds
    }
  }

  /** resolveOnboardingRoleIds defaults employee account onboarding to the tenant account.basic role. */
  private async resolveOnboardingRoleIds(tenantId: string, roleIds: string[]): Promise<string[]> {
    const normalizedRoleIds = normalizeRoleIds(roleIds)
    if (normalizedRoleIds.length > 0) {
      return normalizedRoleIds
    }

    const accountBasicRole = await this.ensureTenantAccountBasicRole(tenantId)
    return [accountBasicRole.id]
  }

  /** ensureTenantAccountBasicRole lazily derives the protected tenant account.basic role for recoverable employee onboarding. */
  private async ensureTenantAccountBasicRole(tenantId: string): Promise<Role> {
    const existing = await this.roleRepository.findByScopeKindAndCode(
      tenantId,
      RoleKind.TENANT_INSTANCE,
      ACCOUNT_BASIC_ROLE_CODE
    )
    if (existing) {
      return existing
    }

    const templateRole = await this.roleRepository.findByScopeKindAndCode(
      '__SYSTEM_TEMPLATE__',
      RoleKind.SYSTEM_TEMPLATE,
      ACCOUNT_BASIC_ROLE_CODE
    )
    if (!templateRole || !templateRole.isEnabled) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND, {
        templateRoleCode: ACCOUNT_BASIC_ROLE_CODE,
        tenantId
      })
    }

    const role = new Role(
      randomUUID(),
      templateRole.name,
      templateRole.code,
      tenantId,
      RoleKind.TENANT_INSTANCE,
      true,
      templateRole.description,
      templateRole.id,
      [],
      templateRole.allowTenantPermissionOverride,
      templateRole.isProtected
    )

    for (const permission of templateRole.permissions) {
      role.addPermission(
        new RolePermission(role.id, permission.permissionId, permission.permissionCode)
      )
    }

    const savedRole = await this.roleRepository.save(role)
    await syncTemplateNavigationToRole(this.navigationRepository, templateRole.id, savedRole.id)
    return savedRole
  }
}

/** normalizeRoleIds deduplicates onboarding role inputs into a stable order. */
function normalizeRoleIds(roleIds: string[]): string[] {
  return Array.from(new Set(roleIds.map((roleId) => roleId.trim()).filter(Boolean))).sort()
}

/** requireNonBlank normalizes mandatory onboarding grant string fields. */
function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      field: fieldName,
      reason: 'required'
    })
  }
  return normalized
}
