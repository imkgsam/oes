import { createHash } from 'crypto'
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EmployeeAccessPendingException, HrOnboardingAccessService } from './hr-onboarding-access.service'
import { HrManagementService } from './hr-management.service'
import { HrQueryService } from './hr-query.service'
import { PARTY_REGISTRATION_PORT, PartyRegistrationPort } from '../ports'
import {
  EmployeeSummary,
  EmploymentSummary,
  OnboardingAccessProcessSummary
} from '../../domain/repositories'
import { parseEmployeeCodeStrict } from '../../domain/value-objects'

export interface EmployeeOnboardingPersonInput {
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
    const tenantPartyRef = await this.resolvePersonTenantPartyRef({
      tenantId,
      idempotencyKey,
      person: input.person
    })

    const employee = await this.ensureEmployee({
      tenantId,
      tenantPartyId: requireNonBlank(tenantPartyRef.tenantPartyId, 'tenantPartyId'),
      employeeCode: input.employeeCode ? parseEmployeeCodeStrict(input.employeeCode).employeeCode : undefined,
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
          tenantPartyId: requireNonBlank(employee.tenantPartyId, 'employee.tenantPartyId'),
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
    employeeCode?: string
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

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.hrManagementService.createEmployee({
          tenantId: input.tenantId,
          tenantPartyId: input.tenantPartyId,
          employeeCode: input.employeeCode
        })
      } catch (error) {
        if (!input.retryGeneratedEmployeeCode || !(error instanceof ConflictException) || attempt === 2) {
          throw error
        }
      }
    }

    throw new ConflictException('Employee code generation retry exhausted')
  }

  /** resolvePersonTenantPartyRef either reuses an existing tenant person subject or asks party-service to register one. */
  private async resolvePersonTenantPartyRef(input: {
    idempotencyKey: string
    person: EmployeeOnboardingPersonInput
    tenantId: string
  }) {
    const existingTenantPartyId = normalize(input.person.existingTenantPartyId)
    if (existingTenantPartyId) {
      return {
        tenantPartyId: existingTenantPartyId
      }
    }

    const legalName = requireNonBlank(input.person.legalName, 'person.legalName')
    const registeredParty = await this.partyRegistrationPort.registerTenantParty({
      tenantId: input.tenantId,
      legalName,
      displayName: legalName,
      identifiers: normalizeIdentifiers(input.person.identifiers),
      idempotencyKey: buildPartyRegistrationIdempotencyKey(input)
    })
    return {
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
    tenantPartyId: string
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
              tenantPartyId: requireNonBlank(input.tenantPartyId, 'tenantPartyId'),
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

}

/** buildPartyRegistrationIdempotencyKey keeps HR-originated Party writes idempotent within party-service key limits. */
function buildPartyRegistrationIdempotencyKey(input: {
  idempotencyKey: string
  person: EmployeeOnboardingPersonInput
  tenantId: string
}) {
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        operation: 'HR_EMPLOYEE_ONBOARDING_PARTY_REGISTRATION',
        tenantId: input.tenantId,
        onboardingIdempotencyKey: input.idempotencyKey,
        legalName: input.person.legalName,
        identifiers: normalizeIdentifiers(input.person.identifiers)
      })
    )
    .digest('hex')

  return `hr-employee-party:${fingerprint}`
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
