import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  ONBOARDING_GRANT_ACCOUNT_NOT_FOUND,
  ONBOARDING_GRANT_ACCOUNT_TENANT_MISMATCH,
  ONBOARDING_GRANT_IDEMPOTENCY_CONFLICT,
  ROLE_NOT_ASSIGNABLE,
  ROLE_NOT_FOUND
} from '../../../common/constants/exception-enums'
import { OnboardingGrantRequestEntity } from '../../../domain/entities/onboarding-grant-request.entity'
import { AccountType } from '../../../domain/enums/account-type.enum'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { OnboardingGrantRequestRepository } from '../../../domain/repositories/onboarding-grant-request.repository'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT,
  IdentityAccountReferencePort
} from '../../ports/identity-account-reference.port'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'
import { GrantInitialAccessForTenantAccountCommand } from './grant-initial-access-for-tenant-account.command'
import { randomUUID } from 'node:crypto'

/** GrantInitialAccessForTenantAccountHandler validates and persists first-admin tenant role grants idempotently. */
@CommandHandler(GrantInitialAccessForTenantAccountCommand)
export class GrantInitialAccessForTenantAccountHandler implements ICommandHandler<
  GrantInitialAccessForTenantAccountCommand,
  { grantId: string | null; idempotencyKey: string; accountId: string; roleIds: string[] }
> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepository: RoleRepository,
    @Inject(SYMBOLS.REPO.ONBOARDING_GRANT_REQUEST)
    private readonly onboardingGrantRequestRepository: OnboardingGrantRequestRepository,
    @Inject(IDENTITY_ACCOUNT_REFERENCE_PORT)
    private readonly identityAccountReferencePort: IdentityAccountReferencePort
  ) {}

  async execute(command: GrantInitialAccessForTenantAccountCommand) {
    const tenantId = requireNonBlank(command.tenantId, 'tenantId')
    const accountId = requireNonBlank(command.accountId, 'accountId')
    const idempotencyKey = requireNonBlank(command.idempotencyKey, 'idempotencyKey')
    const roleIds = normalizeRoleIds(command.roleIds)
    if (roleIds.length === 0) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'roleIds',
        reason: 'required'
      })
    }

    assertRoleScopeAccess(command.operatorScope, ScopeLevel.TENANT, tenantId, {
      requestedTenantId: tenantId
    })

    const account = await this.identityAccountReferencePort.getAccountById(accountId)
    if (!account) {
      throw ExceptionFactory.domain(ONBOARDING_GRANT_ACCOUNT_NOT_FOUND, { accountId })
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

    const fingerprint = JSON.stringify({ tenantId, accountId, roleIds })
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
        throw ExceptionFactory.domain(ROLE_NOT_FOUND, { roleId })
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

    return this.toResult(
      await this.onboardingGrantRequestRepository.markSucceeded({
        idempotencyKey,
        tenantId,
        accountId,
        roleIds,
        bindingIds,
        fingerprint
      })
    )
  }

  /** resolveExisting returns prior identical grant output and rejects key reuse conflicts. */
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

  /** toResult maps an onboarding grant request entity into the gRPC-facing command result. */
  private toResult(existing: OnboardingGrantRequestEntity) {
    return {
      grantId: existing.id,
      idempotencyKey: existing.idempotencyKey,
      accountId: existing.accountId,
      roleIds: existing.roleIds,
      bindingIds: existing.bindingIds
    }
  }
}

/** normalizeRoleIds deduplicates tenant onboarding role inputs into a stable order. */
function normalizeRoleIds(roleIds: string[]): string[] {
  return Array.from(new Set(roleIds.map((roleId) => roleId.trim()).filter(Boolean))).sort()
}

/** requireNonBlank normalizes mandatory tenant onboarding grant string fields. */
function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw ExceptionFactory.application(VALIDATION_FAILED, { field: fieldName, reason: 'required' })
  }
  return normalized
}
