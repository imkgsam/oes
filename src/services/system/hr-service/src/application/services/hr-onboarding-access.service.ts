import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  ExceptionFactory,
  OESExceptionBase,
  RpcExceptionPayload,
  VALIDATION_FAILED
} from '@oes/common/exceptions'
import { AppLogger } from '@oes/common/logging'
import { RpcException } from '@nestjs/microservices'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY,
  EmployeeRepository,
  EmploymentRepository,
  OnboardingAccessRepository
} from '../../domain/repositories'
import { OnboardingAccessStatus } from '../../domain/value-objects'
import {
  AUTH_LOGIN_BOOTSTRAP_PORT,
  IDENTITY_EMPLOYEE_BINDING_PORT,
  IDENTITY_ACCOUNT_PROVISIONING_PORT,
  AuthLoginBootstrapPort,
  IdentityEmployeeBindingPort,
  IdentityAccountProvisioningPort,
  PERMISSION_ONBOARDING_GRANT_PORT,
  PermissionOnboardingGrantPort
} from '../ports'

/** HrOnboardingAccessService orchestrates account binding and initial grant compensation status. */
@Injectable()
export class HrOnboardingAccessService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepository,
    @Inject(EMPLOYMENT_REPOSITORY)
    private readonly employmentRepository: EmploymentRepository,
    @Inject(ONBOARDING_ACCESS_REPOSITORY)
    private readonly onboardingAccessRepository: OnboardingAccessRepository,
    @Inject(IDENTITY_ACCOUNT_PROVISIONING_PORT)
    private readonly identityAccountProvisioningPort: IdentityAccountProvisioningPort,
    @Inject(AUTH_LOGIN_BOOTSTRAP_PORT)
    private readonly authLoginBootstrapPort: AuthLoginBootstrapPort,
    @Inject(IDENTITY_EMPLOYEE_BINDING_PORT)
    private readonly identityEmployeeBindingPort: IdentityEmployeeBindingPort,
    @Inject(PERMISSION_ONBOARDING_GRANT_PORT)
    private readonly permissionOnboardingGrantPort: PermissionOnboardingGrantPort,
    private readonly logger: AppLogger
  ) {}

  async completeAccess(input: {
    tenantId: string
    employeeId: string
    employmentId: string
    existingAccountId?: string
    createAccount?: {
      displayName: string
      email?: string
      phone?: string
    }
    roleIds: string[]
    reason?: string
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
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const employeeId = requireNonBlank(input.employeeId, 'employeeId')
    const employmentId = requireNonBlank(input.employmentId, 'employmentId')
    const roleIds = input.roleIds.map((roleId) => roleId.trim()).filter(Boolean)
    if (roleIds.length === 0) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'roleIds',
        reason: 'required'
      })
    }
    await this.assertEmployeeEmploymentScope(tenantId, employeeId, employmentId)

    const latestProcess = await this.onboardingAccessRepository.findLatestByEmployeeId(
      tenantId,
      employeeId
    )
    const idempotencyKey =
      latestProcess?.grantIdempotencyKey?.trim() ||
      `hr-onboarding:${employeeId}:${employmentId}:${randomUUID()}`
    const accountId = await this.resolveAccountId({
      tenantId,
      employeeId,
      employmentId,
      latestProcess,
      existingAccountId: input.existingAccountId,
      createAccount: input.createAccount,
      operatorContext: input.operatorContext,
      requestId: input.requestId,
      traceId: input.traceId
    })

    try {
      await this.identityEmployeeBindingPort.bindAccountToEmployee({
        tenantId,
        employeeId,
        accountId,
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })
    } catch (error) {
      const failure = extractFailureMetadata(error)
      this.logAccessFailure('ACCOUNT_BINDING', failure, {
        tenantId,
        employeeId,
        employmentId,
        accountId,
        idempotencyKey,
        requestId: input.requestId,
        traceId: failure.traceId ?? input.traceId
      })
      return this.onboardingAccessRepository.recordAccessStatus({
        tenantId,
        employeeId,
        employmentId,
        accountId,
        status: OnboardingAccessStatus.ACCOUNT_BINDING_PENDING,
        grantIdempotencyKey: idempotencyKey,
        failureReason: formatFailureReason(failure)
      })
    }

    try {
      await this.permissionOnboardingGrantPort.grantInitialAccessForEmployeeAccount({
        tenantId,
        accountId,
        roleIds,
        idempotencyKey,
        reason: input.reason?.trim() || undefined,
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })
    } catch (error) {
      const failure = extractFailureMetadata(error)
      this.logAccessFailure('ACCESS_GRANT', failure, {
        tenantId,
        employeeId,
        employmentId,
        accountId,
        idempotencyKey,
        requestId: input.requestId,
        traceId: failure.traceId ?? input.traceId
      })
      return this.onboardingAccessRepository.recordAccessStatus({
        tenantId,
        employeeId,
        employmentId,
        accountId,
        status: OnboardingAccessStatus.ACCESS_GRANT_PENDING,
        grantIdempotencyKey: idempotencyKey,
        failureReason: formatFailureReason(failure)
      })
    }

    return this.onboardingAccessRepository.recordAccessStatus({
      tenantId,
      employeeId,
      employmentId,
      accountId,
      status: OnboardingAccessStatus.COMPLETED,
      grantIdempotencyKey: idempotencyKey
    })
  }

  /** getLatestOnboardingAccess returns the latest employee-scoped access compensation state for member-summary reads. */
  async getLatestOnboardingAccess(input: { tenantId: string; employeeId: string }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const employeeId = requireNonBlank(input.employeeId, 'employeeId')

    return this.onboardingAccessRepository.findLatestByEmployeeId(tenantId, employeeId)
  }

  /** resolveAccountId reuses an existing account or provisions one new invite-ready account before HR completes binding and grant. */
  private async resolveAccountId(input: {
    tenantId: string
    employeeId: string
    employmentId: string
    latestProcess: Awaited<ReturnType<OnboardingAccessRepository['findLatestByEmployeeId']>>
    existingAccountId?: string
    createAccount?: {
      displayName: string
      email?: string
      phone?: string
    }
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
    const existingAccountId = input.existingAccountId?.trim() || input.latestProcess?.accountId?.trim()
    if (existingAccountId) {
      return existingAccountId
    }

    const createAccount = input.createAccount
    if (!createAccount) {
      throw new BadRequestException('Either existingAccountId or createAccount is required')
    }

    const email = createAccount.email?.trim() || undefined
    const phone = createAccount.phone?.trim() || undefined
    if (!email && !phone) {
      throw new BadRequestException('At least one login contact is required')
    }

    try {
      const account = await this.identityAccountProvisioningPort.createUserAccount({
        scopeLevel: 'TENANT',
        tenantId: input.tenantId,
        displayName: requireNonBlank(createAccount.displayName, 'createAccount.displayName'),
        email,
        phone,
        username: createAccount.displayName,
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })

      await this.authLoginBootstrapPort.bootstrapUserLoginMethods({
        userId: account.userId,
        accountId: account.accountId,
        displayName: account.displayName,
        email,
        phone,
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })

      return requireNonBlank(account.accountId, 'accountId')
    } catch (error) {
      const failure = extractFailureMetadata(error)
      this.logAccessFailure('ACCOUNT_BINDING', failure, {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        employmentId: input.employmentId,
        accountId: '',
        idempotencyKey:
          input.latestProcess?.grantIdempotencyKey?.trim() ||
          `hr-onboarding:${input.employeeId}:${input.employmentId}:create-account`,
        requestId: input.requestId,
        traceId: failure.traceId ?? input.traceId
      })
      const process = await this.onboardingAccessRepository.recordAccessStatus({
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        employmentId: input.employmentId,
        status: OnboardingAccessStatus.ACCOUNT_BINDING_PENDING,
        grantIdempotencyKey:
          input.latestProcess?.grantIdempotencyKey?.trim() ||
          `hr-onboarding:${input.employeeId}:${input.employmentId}:create-account`,
        failureReason: formatFailureReason(failure)
      })
      throw new EmployeeAccessPendingException(process)
    }
  }

  /** assertEmployeeEmploymentScope verifies the target employee and employment belong to the same tenant before access orchestration starts. */
  private async assertEmployeeEmploymentScope(
    tenantId: string,
    employeeId: string,
    employmentId: string
  ) {
    const employee = await this.employeeRepository.findById(employeeId)
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Employee ${employeeId} not found`)
    }

    const employment = await this.employmentRepository.findById(employmentId)
    if (
      !employment ||
      employment.tenantId !== tenantId ||
      employment.employeeId !== employeeId
    ) {
      throw new NotFoundException(`Employment ${employmentId} not found`)
    }
  }

  /** logAccessFailure emits one structured HR onboarding fail-path log with stage and semantic category. */
  private logAccessFailure(
    stage: 'ACCOUNT_BINDING' | 'ACCESS_GRANT',
    failure: OnboardingFailureMetadata,
    context: {
      tenantId: string
      employeeId: string
      employmentId: string
      accountId: string
      idempotencyKey: string
      requestId?: string
      traceId?: string
    }
  ) {
    this.logger.warn('Employee onboarding access handoff failed', {
      stage,
      failureCategory: failure.category,
      errorCode: failure.code,
      errorMessage: failure.message,
      tenantId: context.tenantId,
      employeeId: context.employeeId,
      employmentId: context.employmentId,
      accountId: context.accountId,
      requestId: context.requestId,
      traceId: context.traceId,
      details: {
        grantIdempotencyKey: context.idempotencyKey,
        errorDetails: failure.details
      }
    })
  }
}

/** requireNonBlank normalizes required onboarding access string inputs. */
function requireNonBlank(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      field: fieldName,
      reason: 'required'
    })
  }
  return normalized
}

interface OnboardingFailureMetadata {
  category: 'BUSINESS' | 'INFRASTRUCTURE'
  code?: string
  message: string
  traceId?: string
  details?: Record<string, unknown>
}

/** formatFailureReason compresses structured fail-path metadata into one bounded compensation string. */
function formatFailureReason(failure: OnboardingFailureMetadata): string {
  return failure.code ? `${failure.code}: ${failure.message}` : failure.message
}

/** extractFailureMetadata normalizes downstream gRPC and local exceptions into HR compensation diagnostics. */
function extractFailureMetadata(error: unknown): OnboardingFailureMetadata {
  const payload = toRpcPayload(error)
  if (payload) {
    return {
      category: payload.code.startsWith('INFRA_') ? 'INFRASTRUCTURE' : 'BUSINESS',
      code: payload.code,
      message: payload.message,
      traceId: payload.meta?.traceId,
      details: payload.details
    }
  }

  return {
    category: 'INFRASTRUCTURE',
    message: error instanceof Error ? error.message : String(error)
  }
}

/** toRpcPayload restores one standardized OES rpc payload from local or transport-layer exceptions. */
function toRpcPayload(error: unknown): RpcExceptionPayload | null {
  if (error instanceof OESExceptionBase) {
    return error.toRpcPayload()
  }

  if (error instanceof RpcException) {
    const candidate = error.getError()
    return isRpcExceptionPayload(candidate) ? candidate : null
  }

  return null
}

/** isRpcExceptionPayload checks whether one unknown error value already matches the OES gRPC payload shape. */
function isRpcExceptionPayload(value: unknown): value is RpcExceptionPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<RpcExceptionPayload>
  return (
    typeof candidate.grpcStatus === 'number' &&
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string'
  )
}

/** EmployeeAccessPendingException preserves the pending process so gRPC management callers can return it without treating it as transport failure. */
export class EmployeeAccessPendingException extends Error {
  constructor(readonly process: {
    id?: string
    tenantId: string
    employeeId: string
    employmentId: string
    accountId: string | null
    status: OnboardingAccessStatus | string
    grantIdempotencyKey: string | null
    failureReason: string | null
  }) {
    super('Employee access remains pending')
  }
}
