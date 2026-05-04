import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EmployeeAccessPendingException, HrOnboardingAccessService } from './hr-onboarding-access.service'
import { HrManagementService } from './hr-management.service'
import { HrQueryService } from './hr-query.service'
import {
  PARTY_REGISTRATION_PORT,
  PartyRegistrationPort
} from '../ports'
import {
  EmployeeSummary,
  EmploymentSummary,
  OnboardingAccessProcessSummary
} from '../../domain/repositories'

export interface EmployeeOnboardingPersonInput {
  existingPartyId?: string
  existingTenantPartyId?: string
  identifiers?: Array<{
    identifierType: string
    issuerCountryOrRegion?: string
    normalizedValue: string
    rawValue?: string
  }>
  legalName: string
}

export interface EmployeeOnboardingResult {
  access?: OnboardingAccessProcessSummary
  employee: EmployeeSummary
  employment?: EmploymentSummary
}

/** HrEmployeeOnboardingService runs the HR-owned saga for employee, employment, account binding, and account.basic access. */
@Injectable()
export class HrEmployeeOnboardingService {
  constructor(
    @Inject(PARTY_REGISTRATION_PORT)
    private readonly partyRegistrationPort: PartyRegistrationPort,
    private readonly hrManagementService: HrManagementService,
    private readonly hrQueryService: HrQueryService,
    private readonly hrOnboardingAccessService: HrOnboardingAccessService
  ) {}

  async startEmployeeOnboarding(input: {
    account?: {
      displayName: string
      email?: string
      existingAccountId?: string
      existingUserId?: string
      phone?: string
    }
    employeeCode?: string
    idempotencyKey: string
    person: EmployeeOnboardingPersonInput
    primaryEmployment?: {
      effectiveFrom: Date
      orgUnitId?: string
      positionName?: string
    }
    tenantId: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<EmployeeOnboardingResult> {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const idempotencyKey = `hr-employee-onboarding:${requireNonBlank(input.idempotencyKey, 'idempotencyKey')}`
    const partyRefs = await this.resolvePersonPartyRefs({
      tenantId,
      idempotencyKey,
      person: input.person
    })

    const employee = await this.ensureEmployee({
      tenantId,
      tenantPartyId: requireNonBlank(partyRefs.tenantPartyId, 'tenantPartyId'),
      partyId: partyRefs.partyId,
      employeeCode: input.employeeCode || await this.generateNextEmployeeCode(tenantId),
      retryGeneratedEmployeeCode: !input.employeeCode
    })
    const employment = input.primaryEmployment
      ? await this.ensurePrimaryEmployment({
          tenantId,
          employeeId: employee.id,
          orgUnitId: input.primaryEmployment.orgUnitId,
          positionName: input.primaryEmployment.positionName,
          effectiveFrom: input.primaryEmployment.effectiveFrom
        })
      : undefined
    const access = input.account && employment
      ? await this.completeAccountAccess({
          tenantId,
          employeeId: employee.id,
          employmentId: employment.id,
          account: input.account,
          idempotencyKey,
          operatorContext: input.operatorContext,
          requestId: input.requestId,
          traceId: input.traceId
        })
      : undefined

    return {
      employee,
      employment,
      access
    }
  }

  /** ensureEmployee creates the HR employee once and reuses the existing employee on idempotent retries. */
  private async ensureEmployee(input: {
    employeeCode: string
    partyId?: string
    retryGeneratedEmployeeCode: boolean
    tenantId: string
    tenantPartyId: string
  }) {
    try {
      return await this.hrQueryService.getEmployeeByTenantPartyId({
        tenantId: input.tenantId,
        tenantPartyId: input.tenantPartyId
      })
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error
      }
    }

    let employeeCode = input.employeeCode
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.hrManagementService.createEmployee({
          tenantId: input.tenantId,
          tenantPartyId: input.tenantPartyId,
          partyId: input.partyId,
          employeeCode
        })
      } catch (error) {
        if (!input.retryGeneratedEmployeeCode || !(error instanceof ConflictException) || attempt === 2) {
          throw error
        }
        employeeCode = await this.generateNextEmployeeCode(input.tenantId)
      }
    }

    throw new ConflictException('Employee code generation retry exhausted')
  }

  /** resolvePersonPartyRefs either reuses identity-owned person refs or asks party-service to register a person. */
  private async resolvePersonPartyRefs(input: {
    idempotencyKey: string
    person: EmployeeOnboardingPersonInput
    tenantId: string
  }) {
    const existingTenantPartyId = normalize(input.person.existingTenantPartyId)
    if (existingTenantPartyId) {
      return {
        partyId: normalize(input.person.existingPartyId),
        tenantPartyId: existingTenantPartyId
      }
    }

    const legalName = requireNonBlank(input.person.legalName, 'person.legalName')
    const registeredParty = await this.partyRegistrationPort.registerPersonParty({
      tenantId: input.tenantId,
      legalName,
      localDisplayName: legalName,
      identifiers: normalizeIdentifiers(input.person.identifiers),
      idempotencyKey: `${input.idempotencyKey}:party`
    })
    return {
      partyId: registeredParty.partyId,
      tenantPartyId: registeredParty.tenantPartyId
    }
  }

  /** ensurePrimaryEmployment creates the primary employment once and reuses the active employment on retries. */
  private async ensurePrimaryEmployment(input: {
    effectiveFrom: Date
    employeeId: string
    orgUnitId?: string
    positionName?: string
    tenantId: string
  }) {
    try {
      return await this.hrQueryService.getActiveEmployment(input.employeeId)
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error
      }
    }

    const orgUnitId = requireNonBlank(input.orgUnitId, 'primaryEmployment.orgUnitId')
    const result = await this.hrManagementService.createEmployment({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      orgUnitId,
      positionName: normalize(input.positionName),
      effectiveFrom: input.effectiveFrom
    })
    return result.employment
  }

  /** completeAccountAccess delegates default account.basic grant semantics to the permission onboarding boundary. */
  private async completeAccountAccess(input: {
    account: {
      displayName: string
      email?: string
      existingAccountId?: string
      existingUserId?: string
      phone?: string
    }
    employeeId: string
    employmentId: string
    idempotencyKey: string
    tenantId: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }) {
    try {
      return await this.hrOnboardingAccessService.completeAccess({
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        employmentId: input.employmentId,
        existingAccountId: normalize(input.account.existingAccountId),
        createAccount: normalize(input.account.existingAccountId)
          ? undefined
          : {
              displayName: requireNonBlank(input.account.displayName, 'account.displayName'),
              email: normalize(input.account.email),
              existingUserId: normalize(input.account.existingUserId),
              phone: normalize(input.account.phone)
            },
        roleIds: [],
        reason: 'employee_onboarding_account_basic',
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })
    } catch (error) {
      if (error instanceof EmployeeAccessPendingException) {
        return error.process
      }
      throw error
    }
  }

  /** generateNextEmployeeCode keeps employee code system-owned when HR creates employees from the UI. */
  private async generateNextEmployeeCode(tenantId: string) {
    const result = await this.hrQueryService.listEmployees({
      tenantId,
      page: 1,
      pageSize: 1
    })
    return `EMP-${String(Number(result.total ?? 0) + 1).padStart(4, '0')}`
  }
}

/** normalizeIdentifiers prepares person identifiers for the party-service strong-match contract. */
function normalizeIdentifiers(identifiers?: EmployeeOnboardingPersonInput['identifiers']) {
  return (identifiers ?? []).map((identifier) => ({
    identifierType: requireNonBlank(identifier.identifierType, 'person.identifiers.identifierType'),
    issuerCountryOrRegion: normalize(identifier.issuerCountryOrRegion),
    normalizedValue: requireNonBlank(identifier.normalizedValue, 'person.identifiers.normalizedValue'),
    rawValue: normalize(identifier.rawValue)
  }))
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function requireNonBlank(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}
