import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { createHash } from 'crypto'
import { AUTH_LOGIN_ONBOARDING_PORT, AuthLoginOnboardingPort } from '../ports/auth-login-onboarding.port'
import {
  HR_EMPLOYEE_ONBOARDING_PORT,
  HrEmployeeOnboardingPort
} from '../ports/hr-employee-onboarding.port'
import {
  IDENTITY_ACCOUNT_ONBOARDING_PORT,
  IdentityAccountOnboardingPort
} from '../ports/identity-account-onboarding.port'
import { PARTY_REGISTRATION_PORT, PartyRegistrationPort } from '../ports/party-registration.port'
import {
  PERMISSION_TENANT_ONBOARDING_PORT,
  PermissionTenantOnboardingPort
} from '../ports/permission-tenant-onboarding.port'
import {
  ORG_UNIT_REPOSITORY,
  OrgUnitRepository,
  TENANT_ONBOARDING_RUN_REPOSITORY,
  TENANT_REPOSITORY,
  TenantOnboardingExternalRefs,
  TenantOnboardingRunRecord,
  TenantOnboardingRunRepository,
  TenantOnboardingStepRecord,
  TenantRepository
} from '../../domain/repositories'
import {
  TenantOnboardingRunStatus,
  TenantOnboardingStepKey,
  TenantOnboardingStepStatus
} from '../../domain/value-objects/tenant-onboarding.enums'
import { OrgUnitType, normalizeEmployeeCodePrefix } from '../../domain/value-objects'

export interface StartTenantOnboardingInput {
  idempotencyKey: string
  tenant: { code: string; employeeCodePrefix: string; name: string }
  organizationParty: {
    legalName: string
    registeredCountry?: string
    identifiers: Array<{
      identifierType: string
      rawValue?: string
      normalizedValue?: string
      issuerCountryOrRegion?: string
    }>
  }
  rootOrg: { name: string }
  firstAdmin: {
    displayName: string
    email?: string
    existingUserId?: string
    phone?: string
    provisioningMode?: 'CREATE_NEW_USER' | 'EXISTING_USER'
    requirePasswordSetup?: boolean
  }
}

export interface TenantOnboardingResult {
  onboardingId: string
  status: string
  tenant?: { id: string; code: string; employeeCodePrefix: string; name: string; status: string; rootOrgId: string | null }
  rootOrg?: {
    id: string
    tenantId: string
    parentOrgId: string | null
    name: string
    type: string
    status: string
    path: string
    depth: number
    sortOrder: number
    organizationPartyId: string | null
  }
  organizationParty?: { partyId?: string; tenantPartyId?: string }
  firstAdmin?: { userId?: string; accountId?: string; personPartyId?: string; tenantPartyId?: string }
  firstAdminEmployee?: { employeeId?: string; employmentId?: string; accessProcessId?: string }
  access?: {
    roleCode?: string
    roleId?: string
    grantId?: string
    hrAdminRoleCode?: string
    hrAdminRoleId?: string
    hrAdminGrantId?: string
    accountBasicRoleCode?: string
    accountBasicRoleId?: string
  }
  steps: TenantOnboardingStepRecord[]
  failure?: { code: string; message: string; failedStep: string; retryable: boolean } | null
}

/** TenantOnboardingService runs the lightweight Saga that coordinates tenant opening across owner services. */
@Injectable()
export class TenantOnboardingService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(ORG_UNIT_REPOSITORY)
    private readonly orgUnitRepository: OrgUnitRepository,
    @Inject(TENANT_ONBOARDING_RUN_REPOSITORY)
    private readonly onboardingRunRepository: TenantOnboardingRunRepository,
    @Inject(PARTY_REGISTRATION_PORT)
    private readonly partyRegistrationPort: PartyRegistrationPort,
    @Inject(IDENTITY_ACCOUNT_ONBOARDING_PORT)
    private readonly identityAccountOnboardingPort: IdentityAccountOnboardingPort,
    @Inject(AUTH_LOGIN_ONBOARDING_PORT)
    private readonly authLoginOnboardingPort: AuthLoginOnboardingPort,
    @Inject(PERMISSION_TENANT_ONBOARDING_PORT)
    private readonly permissionTenantOnboardingPort: PermissionTenantOnboardingPort,
    @Inject(HR_EMPLOYEE_ONBOARDING_PORT)
    private readonly hrEmployeeOnboardingPort: HrEmployeeOnboardingPort
  ) {}

  async start(input: StartTenantOnboardingInput): Promise<TenantOnboardingResult> {
    const normalized = normalizeInput(input)
    const requestHash = hashRequest(normalized)
    const existing = await this.onboardingRunRepository.findByIdempotencyKey(normalized.idempotencyKey)
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException(`idempotencyKey ${normalized.idempotencyKey} already belongs to a different onboarding request`)
      }
      return this.execute(existing)
    }

    const run = await this.onboardingRunRepository.create({
      idempotencyKey: normalized.idempotencyKey,
      requestHash,
      requestPayload: normalized as unknown as Record<string, unknown>,
      steps: createInitialSteps()
    })
    return this.execute(run)
  }

  async get(onboardingId: string): Promise<TenantOnboardingResult> {
    const run = await this.onboardingRunRepository.findById(requireNonBlank(onboardingId, 'onboardingId'))
    if (!run) {
      throw new NotFoundException(`Tenant onboarding ${onboardingId} not found`)
    }
    return this.toResult(run)
  }

  async retry(onboardingId: string): Promise<TenantOnboardingResult> {
    const run = await this.onboardingRunRepository.findById(requireNonBlank(onboardingId, 'onboardingId'))
    if (!run) {
      throw new NotFoundException(`Tenant onboarding ${onboardingId} not found`)
    }
    return this.execute(run)
  }

  /** execute advances the Saga from its durable refs, recording failure instead of deleting owner-service data. */
  private async execute(initialRun: TenantOnboardingRunRecord): Promise<TenantOnboardingResult> {
    let run = await this.onboardingRunRepository.update({
      id: initialRun.id,
      status: TenantOnboardingRunStatus.RUNNING,
      failure: null
    })
    const input = run.requestPayload as unknown as StartTenantOnboardingInput
    const refs: TenantOnboardingExternalRefs = { ...run.externalRefs }
    let steps = ensureOnboardingSteps(run.steps)

    try {
      await this.runStep(run.id, steps, TenantOnboardingStepKey.REGISTER_ORGANIZATION_PARTY, async () => {
        if (refs.organizationPartyId) return
        const result = await this.partyRegistrationPort.registerOrganizationParty({
          legalName: input.organizationParty.legalName,
          registeredCountry: input.organizationParty.registeredCountry,
          identifiers: input.organizationParty.identifiers.map((identifier, index) => ({
            identifierType: requireNonBlank(identifier.identifierType, `organizationParty.identifiers[${index}].identifierType`),
            rawValue: identifier.rawValue,
            normalizedValue: requireNonBlank(identifier.normalizedValue, `organizationParty.identifiers[${index}].normalizedValue`),
            issuerCountryOrRegion: identifier.issuerCountryOrRegion
          })),
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.REGISTER_ORGANIZATION_PARTY)
        })
        refs.organizationPartyId = result.partyId
        refs.organizationTenantPartyId = result.tenantPartyId
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.CREATE_TENANT_WITH_ROOT_ORG, async () => {
        if (refs.tenantId && refs.rootOrgId) return
        const result = await this.tenantRepository.createWithRootOrg({
          code: input.tenant.code,
          employeeCodePrefix: input.tenant.employeeCodePrefix,
          name: input.tenant.name,
          rootOrgName: input.rootOrg.name
        })
        refs.tenantId = result.tenant.id
        refs.rootOrgId = result.rootOrgUnit.id
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.BIND_ORGANIZATION_TENANT_PARTY, async () => {
        if (!refs.tenantId || !refs.rootOrgId || !refs.organizationPartyId) {
          throw new Error('missing tenant/root org/organization party refs before binding tenant party')
        }
        if (!refs.organizationTenantPartyId) {
          const result = await this.partyRegistrationPort.bindExistingPartyToTenant({
            tenantId: refs.tenantId,
            partyId: refs.organizationPartyId,
            localDisplayName: input.organizationParty.legalName,
            localCode: input.tenant.code,
            idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.BIND_ORGANIZATION_TENANT_PARTY)
          })
          refs.organizationTenantPartyId = result.tenantPartyId
        }
        await this.orgUnitRepository.update({
          tenantId: refs.tenantId,
          orgUnitId: refs.rootOrgId,
          type: OrgUnitType.ROOT,
          organizationPartyId: refs.organizationPartyId
        })
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.CREATE_FIRST_ADMIN_ACCOUNT, async () => {
        if (!refs.tenantId) throw new Error('missing tenant ref before first admin account')
        if (refs.firstAdminAccountId && refs.firstAdminUserId) return
        const result = await this.identityAccountOnboardingPort.createTenantUserAccount({
          tenantId: refs.tenantId,
          displayName: input.firstAdmin.displayName,
          email: input.firstAdmin.email,
          existingUserId: input.firstAdmin.existingUserId,
          phone: input.firstAdmin.phone,
          provisioningMode: input.firstAdmin.provisioningMode,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.CREATE_FIRST_ADMIN_ACCOUNT)
        })
        refs.firstAdminUserId = result.userId
        refs.firstAdminAccountId = result.accountId
        refs.firstAdminPersonPartyId = result.userPartyId
        refs.firstAdminTenantPartyId = result.userTenantPartyId
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.CREATE_FIRST_ADMIN_EMPLOYEE, async () => {
        if (
          !refs.tenantId ||
          !refs.rootOrgId ||
          !refs.firstAdminAccountId ||
          !refs.firstAdminTenantPartyId
        ) {
          throw new Error('missing first admin employee refs')
        }
        if (refs.firstAdminEmployeeId && refs.firstAdminEmploymentId) return
        const result = await this.hrEmployeeOnboardingPort.createEmployeeOnboarding({
          tenantId: refs.tenantId,
          employeeCode: `EMP-${input.tenant.employeeCodePrefix}-0001`,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.CREATE_FIRST_ADMIN_EMPLOYEE),
          person: {
            existingPartyId: refs.firstAdminPersonPartyId,
            existingTenantPartyId: refs.firstAdminTenantPartyId,
            legalName: input.firstAdmin.displayName
          },
          primaryEmployment: {
            orgUnitId: refs.rootOrgId,
            effectiveFrom: new Date(),
            positionName: 'Tenant Administrator'
          },
          account: {
            existingAccountId: refs.firstAdminAccountId
          }
        })
        refs.firstAdminEmployeeId = result.employeeId
        refs.firstAdminEmploymentId = result.employmentId
        refs.firstAdminAccessProcessId = result.accessProcessId
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.BOOTSTRAP_FIRST_ADMIN_LOGIN_METHODS, async () => {
        if (input.firstAdmin.provisioningMode === 'EXISTING_USER') return
        if (!refs.firstAdminUserId || !refs.firstAdminAccountId) throw new Error('missing first admin refs before auth bootstrap')
        await this.authLoginOnboardingPort.bootstrapUserLoginMethods({
          userId: refs.firstAdminUserId,
          accountId: refs.firstAdminAccountId,
          displayName: input.firstAdmin.displayName,
          email: input.firstAdmin.email,
          phone: input.firstAdmin.phone
        })
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.REQUIRE_FIRST_LOGIN_PASSWORD_SETUP, async () => {
        if (input.firstAdmin.provisioningMode === 'EXISTING_USER') return
        if (!input.firstAdmin.requirePasswordSetup) return
        if (!refs.firstAdminUserId) throw new Error('missing first admin user before password setup requirement')
        await this.authLoginOnboardingPort.requirePasswordSetup({
          userId: refs.firstAdminUserId,
          reason: 'tenant onboarding first admin'
        })
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.ENSURE_TENANT_ADMIN_ROLE, async () => {
        if (!refs.tenantId) throw new Error('missing tenant ref before tenant admin role ensure')
        if (refs.tenantAdminRoleId) return
        const result = await this.permissionTenantOnboardingPort.ensureTenantAdminRole({
          tenantId: refs.tenantId,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.ENSURE_TENANT_ADMIN_ROLE)
        })
        refs.tenantAdminRoleId = result.roleId
        refs.tenantAdminRoleCode = result.roleCode
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.GRANT_TENANT_ADMIN_ROLE, async () => {
        if (!refs.tenantId || !refs.firstAdminAccountId || !refs.tenantAdminRoleId) {
          throw new Error('missing tenant admin grant refs')
        }
        if (refs.tenantAdminGrantId) return
        const result = await this.permissionTenantOnboardingPort.grantTenantAdmin({
          tenantId: refs.tenantId,
          accountId: refs.firstAdminAccountId,
          roleId: refs.tenantAdminRoleId,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.GRANT_TENANT_ADMIN_ROLE)
        })
        refs.tenantAdminGrantId = result.grantId
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.ENSURE_HR_ADMIN_ROLE, async () => {
        if (!refs.tenantId) throw new Error('missing tenant ref before hr admin role ensure')
        if (refs.hrAdminRoleId) return
        const result = await this.permissionTenantOnboardingPort.ensureHrAdminRole({
          tenantId: refs.tenantId,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.ENSURE_HR_ADMIN_ROLE)
        })
        refs.hrAdminRoleId = result.roleId
        refs.hrAdminRoleCode = result.roleCode
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.GRANT_HR_ADMIN_ROLE, async () => {
        if (!refs.tenantId || !refs.firstAdminAccountId || !refs.hrAdminRoleId) {
          throw new Error('missing hr admin grant refs')
        }
        if (refs.hrAdminGrantId) return
        const result = await this.permissionTenantOnboardingPort.grantHrAdmin({
          tenantId: refs.tenantId,
          accountId: refs.firstAdminAccountId,
          roleId: refs.hrAdminRoleId,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.GRANT_HR_ADMIN_ROLE)
        })
        refs.hrAdminGrantId = result.grantId
        run = await this.persistRefs(run.id, refs, steps)
      })

      await this.runStep(run.id, steps, TenantOnboardingStepKey.ENSURE_ACCOUNT_BASIC_ROLE, async () => {
        if (!refs.tenantId) throw new Error('missing tenant ref before account basic role ensure')
        if (refs.accountBasicRoleId) return
        const result = await this.permissionTenantOnboardingPort.ensureAccountBasicRole({
          tenantId: refs.tenantId,
          idempotencyKey: stepKey(run.id, TenantOnboardingStepKey.ENSURE_ACCOUNT_BASIC_ROLE)
        })
        refs.accountBasicRoleId = result.roleId
        refs.accountBasicRoleCode = result.roleCode
        run = await this.persistRefs(run.id, refs, steps)
      })

      run = await this.onboardingRunRepository.update({
        id: run.id,
        status: TenantOnboardingRunStatus.SUCCEEDED,
        externalRefs: refs,
        steps,
        failure: null
      })
      return this.toResult(run)
    } catch (error) {
      const failedStep = steps.find((step) => step.status === TenantOnboardingStepStatus.RUNNING)?.key ?? 'UNKNOWN'
      steps = steps.map((step) =>
        step.key === failedStep
          ? { ...step, status: TenantOnboardingStepStatus.FAILED, message: error instanceof Error ? error.message : String(error) }
          : step
      )
      run = await this.onboardingRunRepository.update({
        id: run.id,
        status: TenantOnboardingRunStatus.FAILED_RETRYABLE,
        externalRefs: refs,
        steps,
        failure: {
          code: 'TENANT_ONBOARDING_STEP_FAILED',
          message: error instanceof Error ? error.message : String(error),
          failedStep,
          retryable: true
        }
      })
      return this.toResult(run)
    }
  }

  /** runStep marks a single step running/succeeded and skips already succeeded steps. */
  private async runStep(runId: string, steps: TenantOnboardingStepRecord[], key: TenantOnboardingStepKey, action: () => Promise<void>) {
    const current = steps.find((step) => step.key === key)
    if (current?.status === TenantOnboardingStepStatus.SUCCEEDED) return
    mutateStep(steps, key, { status: TenantOnboardingStepStatus.RUNNING, attemptCount: (current?.attemptCount ?? 0) + 1 })
    await this.onboardingRunRepository.update({ id: runId, steps })
    await action()
    mutateStep(steps, key, { status: TenantOnboardingStepStatus.SUCCEEDED, message: null })
    await this.onboardingRunRepository.update({ id: runId, steps })
  }

  /** persistRefs stores external owner-service references after a step succeeds. */
  private async persistRefs(runId: string, refs: TenantOnboardingExternalRefs, steps: TenantOnboardingStepRecord[]) {
    return this.onboardingRunRepository.update({ id: runId, externalRefs: refs, steps })
  }

  /** toResult resolves persisted refs into the public onboarding result shape. */
  private async toResult(run: TenantOnboardingRunRecord): Promise<TenantOnboardingResult> {
    const refs = run.externalRefs
    const tenant = refs.tenantId ? await this.tenantRepository.findById(refs.tenantId) : null
    const rootOrg = refs.tenantId && refs.rootOrgId ? await this.orgUnitRepository.findById(refs.tenantId, refs.rootOrgId) : null
    return {
      onboardingId: run.id,
      status: run.status,
      tenant: tenant ? { ...tenant, status: String(tenant.status) } : undefined,
      rootOrg: rootOrg ? { ...rootOrg, type: String(rootOrg.type), status: String(rootOrg.status) } : undefined,
      organizationParty: {
        partyId: refs.organizationPartyId,
        tenantPartyId: refs.organizationTenantPartyId
      },
      firstAdmin: {
        userId: refs.firstAdminUserId,
        accountId: refs.firstAdminAccountId,
        personPartyId: refs.firstAdminPersonPartyId,
        tenantPartyId: refs.firstAdminTenantPartyId
      },
      firstAdminEmployee: {
        employeeId: refs.firstAdminEmployeeId,
        employmentId: refs.firstAdminEmploymentId,
        accessProcessId: refs.firstAdminAccessProcessId
      },
      access: {
        roleCode: refs.tenantAdminRoleCode,
        roleId: refs.tenantAdminRoleId,
        grantId: refs.tenantAdminGrantId,
        hrAdminRoleCode: refs.hrAdminRoleCode,
        hrAdminRoleId: refs.hrAdminRoleId,
        hrAdminGrantId: refs.hrAdminGrantId,
        accountBasicRoleCode: refs.accountBasicRoleCode,
        accountBasicRoleId: refs.accountBasicRoleId
      },
      steps: run.steps,
      failure: run.failure
    }
  }
}

/** createInitialSteps creates the fixed onboarding step ledger for a new run. */
function createInitialSteps(): TenantOnboardingStepRecord[] {
  return createStepRecords(Object.values(TenantOnboardingStepKey))
}

/** ensureOnboardingSteps appends newly introduced Saga steps to older durable runs. */
function ensureOnboardingSteps(steps: TenantOnboardingStepRecord[]): TenantOnboardingStepRecord[] {
  const existingKeys = new Set(steps.map((step) => step.key))
  return [
    ...steps,
    ...createStepRecords(Object.values(TenantOnboardingStepKey).filter((key) => !existingKeys.has(key)))
  ]
}

/** createStepRecords initializes durable step records for the provided Saga keys. */
function createStepRecords(keys: TenantOnboardingStepKey[]): TenantOnboardingStepRecord[] {
  return keys.map((key) => ({
    key,
    status: TenantOnboardingStepStatus.NOT_STARTED,
    message: null,
    attemptCount: 0
  }))
}

/** mutateStep updates one in-memory step record while preserving array identity for callers. */
function mutateStep(steps: TenantOnboardingStepRecord[], key: TenantOnboardingStepKey, patch: Partial<TenantOnboardingStepRecord>) {
  const index = steps.findIndex((step) => step.key === key)
  if (index >= 0) {
    steps[index] = { ...steps[index], ...patch }
  }
}

/** stepKey creates deterministic downstream idempotency keys for owner-service handoffs. */
function stepKey(runId: string, key: TenantOnboardingStepKey): string {
  return `${runId}:${key}`
}

/** hashRequest creates a stable SHA-256 fingerprint for onboarding idempotency checks. */
function hashRequest(input: StartTenantOnboardingInput): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

/** normalizeInput validates and trims tenant onboarding input before persistence. */
function normalizeInput(input: StartTenantOnboardingInput): StartTenantOnboardingInput {
  const email = input.firstAdmin.email?.trim().toLowerCase() || undefined
  const phone = input.firstAdmin.phone?.trim() || undefined
  const existingUserId = input.firstAdmin.existingUserId?.trim() || undefined
  const provisioningMode = input.firstAdmin.provisioningMode === 'EXISTING_USER' ? 'EXISTING_USER' : 'CREATE_NEW_USER'
  const registeredCountry = input.organizationParty.registeredCountry?.trim() || undefined
  if (provisioningMode === 'EXISTING_USER' && !existingUserId) {
    throw new BadRequestException('firstAdmin.existingUserId is required')
  }
  if (provisioningMode === 'CREATE_NEW_USER' && !email && !phone) {
    throw new BadRequestException('firstAdmin.email or firstAdmin.phone is required')
  }
  if (phone && !/^\+[1-9]\d{5,19}$/.test(phone)) {
    throw new BadRequestException('firstAdmin.phone must be canonical + international format')
  }
  const identifiers = input.organizationParty.identifiers ?? []
  if (!identifiers.length) {
    throw new BadRequestException('organizationParty.identifiers is required')
  }
  return {
    idempotencyKey: requireNonBlank(input.idempotencyKey, 'idempotencyKey'),
    tenant: {
      code: requireNonBlank(input.tenant.code, 'tenant.code'),
      employeeCodePrefix: normalizeEmployeeCodePrefix(input.tenant.employeeCodePrefix, 'tenant.employeeCodePrefix'),
      name: requireNonBlank(input.tenant.name, 'tenant.name')
    },
    organizationParty: {
      legalName: requireNonBlank(input.organizationParty.legalName, 'organizationParty.legalName'),
      registeredCountry,
      identifiers: identifiers.map((identifier, index) => {
        const rawValue = identifier.rawValue?.trim() || identifier.normalizedValue?.trim()
        return {
          identifierType: requireNonBlank(identifier.identifierType, `organizationParty.identifiers[${index}].identifierType`),
          rawValue,
          normalizedValue: normalizeIdentifierValue(rawValue, `organizationParty.identifiers[${index}].rawValue`),
          issuerCountryOrRegion: requireNonBlank(
            identifier.issuerCountryOrRegion?.trim() || registeredCountry || '',
            `organizationParty.identifiers[${index}].issuerCountryOrRegion`
          )
        }
      })
    },
    rootOrg: {
      name: requireNonBlank(input.rootOrg.name, 'rootOrg.name')
    },
    firstAdmin: {
      displayName: requireNonBlank(input.firstAdmin.displayName, 'firstAdmin.displayName'),
      email,
      existingUserId,
      phone,
      provisioningMode,
      requirePasswordSetup: provisioningMode === 'EXISTING_USER' ? false : input.firstAdmin.requirePasswordSetup ?? true
    }
  }
}

/** requireNonBlank normalizes required onboarding string fields. */
function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}

/** normalizeIdentifierValue creates the stable value used by party-service uniqueness checks. */
function normalizeIdentifierValue(value: string | undefined, fieldName: string): string {
  const normalized = requireNonBlank(value ?? '', fieldName).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}
