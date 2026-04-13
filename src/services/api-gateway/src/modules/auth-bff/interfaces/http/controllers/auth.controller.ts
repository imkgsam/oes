import { Body, Controller, Get, Headers, Ip, Param, Post, Query } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  AUTH_SESSION_PERMISSION_CODES,
  PermissionCheckAll
} from '@oes/common/authorization'
import {
  AdminAuditEventQueryDto,
  AdminRevokeSessionDto
} from '../dtos/admin-security.dto'
import {
  CompleteMfaDto,
  EmailOtpChallengeDto,
  LoginDto,
  PhoneOtpChallengeDto,
  RefreshSessionDto,
  SelectAccountDto
} from '../dtos/login.dto'
import {
  ActivateTotpBindingDto,
  MfaBindingMutationDto
} from '../dtos/self-security.dto'
import {
  AuthResponseViewModel,
  OtpChallengeViewModel,
  RefreshSessionViewModel
} from '../view-models/auth-response.view-model'
import {
  InitializeTotpViewModel,
  MfaBindingListViewModel,
  MfaBindingMutationViewModel,
  RecoveryCodesViewModel,
  SelfSessionListViewModel,
  SessionMutationViewModel
} from '../view-models/self-security.view-model'
import { SessionContextViewModel } from '../view-models/session-context.view-model'
import { SessionAccessSummaryViewModel } from '../view-models/session-access-summary.view-model'
import {
  AdminAuditEventListViewModel,
  AdminSessionListViewModel,
  AdminSessionMutationViewModel
} from '../view-models/admin-security.view-model'
import { LoginUseCase } from '../../../application/use-cases/login.use-case'
import { RequestEmailOtpChallengeUseCase } from '../../../application/use-cases/request-email-otp-challenge.use-case'
import { RequestPhoneOtpChallengeUseCase } from '../../../application/use-cases/request-phone-otp-challenge.use-case'
import { CompleteMfaUseCase } from '../../../application/use-cases/complete-mfa.use-case'
import { SelectAccountUseCase } from '../../../application/use-cases/select-account.use-case'
import { RefreshSessionUseCase } from '../../../application/use-cases/refresh-session.use-case'
import { SessionSelfServiceUseCase } from '../../../application/use-cases/session-self-service.use-case'
import { MfaSelfServiceUseCase } from '../../../application/use-cases/mfa-self-service.use-case'
import { AdminSecurityUseCase } from '../../../application/use-cases/admin-security.use-case'
import { SessionAccessSummaryUseCase } from '../../../application/use-cases/session-access-summary.use-case'
import { SessionContextUseCase } from '../../../application/use-cases/session-context.use-case'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'

@ApiTags('auth')
@Controller('auth')
// Exposes the public auth-bff HTTP endpoints that orchestrate end-user login flows.
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly requestEmailOtpChallengeUseCase: RequestEmailOtpChallengeUseCase,
    private readonly requestPhoneOtpChallengeUseCase: RequestPhoneOtpChallengeUseCase,
    private readonly completeMfaUseCase: CompleteMfaUseCase,
    private readonly selectAccountUseCase: SelectAccountUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly sessionSelfServiceUseCase: SessionSelfServiceUseCase,
    private readonly mfaSelfServiceUseCase: MfaSelfServiceUseCase,
    private readonly adminSecurityUseCase: AdminSecurityUseCase,
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    private readonly sessionContextUseCase: SessionContextUseCase
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'Primary authentication entry point',
    description:
      'Starts the end-user login orchestration. The same endpoint supports password and OTP login methods and may return MFA, account selection, or final session tokens depending on the downstream auth flow result.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    type: AuthResponseViewModel,
    description:
      'Returns the current login step result. Depending on status, the caller may need to complete MFA, select an account, or continue with the issued session tokens.'
  })
  async login(
    @Body() dto: LoginDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AuthResponseViewModel> {
    return this.loginUseCase.execute(dto, {
      requestId: source.requestId,
      traceId: source.traceId
    })
  }

  @Post('challenges/email-otp')
  @Public()
  @ApiOperation({
    summary: 'Start an email OTP login challenge',
    description:
      'Generates and sends a one-time password challenge to the supplied email address for a subsequent OTP login.'
  })
  @ApiBody({ type: EmailOtpChallengeDto })
  @ApiResponse({
    status: 200,
    type: OtpChallengeViewModel,
    description: 'Returns the challenge identifier and destination metadata for the email OTP flow.'
  })
  async requestEmailOtpChallenge(
    @Body() dto: EmailOtpChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    return this.requestEmailOtpChallengeUseCase.execute(dto, {
      requestId: source.requestId,
      traceId: source.traceId
    })
  }

  @Post('challenges/phone-otp')
  @Public()
  @ApiOperation({
    summary: 'Start a phone OTP login challenge',
    description:
      'Generates and sends a one-time password challenge to the supplied phone number for a subsequent OTP login.'
  })
  @ApiBody({ type: PhoneOtpChallengeDto })
  @ApiResponse({
    status: 200,
    type: OtpChallengeViewModel,
    description: 'Returns the challenge identifier and destination metadata for the phone OTP flow.'
  })
  async requestPhoneOtpChallenge(
    @Body() dto: PhoneOtpChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    return this.requestPhoneOtpChallengeUseCase.execute(dto, {
      requestId: source.requestId,
      traceId: source.traceId
    })
  }

  @Post('mfa/complete')
  @Public()
  @ApiOperation({
    summary: 'Complete a pending MFA challenge',
    description:
      'Submits the MFA verification code for a previously returned challenge and continues the login flow.'
  })
  @ApiBody({ type: CompleteMfaDto })
  @ApiResponse({
    status: 200,
    type: AuthResponseViewModel,
    description:
      'Returns the updated login flow state, which may still require account selection or may already include final session tokens.'
  })
  async completeMfa(
    @Body() dto: CompleteMfaDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AuthResponseViewModel> {
    return this.completeMfaUseCase.execute(dto, {
      requestId: source.requestId,
      traceId: source.traceId
    })
  }

  @Post('account-selection')
  @Public()
  @ApiOperation({
    summary: 'Select the target account after multi-account authentication',
    description:
      'Finalizes authentication by selecting one candidate account and establishing the resulting user session.'
  })
  @ApiBody({ type: SelectAccountDto })
  @ApiResponse({
    status: 200,
    type: AuthResponseViewModel,
    description: 'Returns the final session payload or the next auth step after account selection.'
  })
  async selectAccount(
    @Body() dto: SelectAccountDto,
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ): Promise<AuthResponseViewModel> {
    return this.selectAccountUseCase.execute(
      dto,
      {
        requestId: source.requestId,
        traceId: source.traceId
      },
      { userAgent, ipAddress }
    )
  }

  @Post('session/refresh')
  @Public()
  @ApiOperation({
    summary: 'Refresh a user session',
    description: 'Renews the access and refresh tokens for an existing authenticated session.'
  })
  @ApiBody({ type: RefreshSessionDto })
  @ApiResponse({
    status: 200,
    type: RefreshSessionViewModel,
    description: 'Returns the renewed token pair and associated session identifier.'
  })
  async refreshSession(
    @Body() dto: RefreshSessionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<RefreshSessionViewModel> {
    return this.refreshSessionUseCase.execute(dto, {
      requestId: source.requestId,
      traceId: source.traceId
    })
  }

  @Get('session/context')
  @ApiOperation({
    summary: 'Get the authenticated shell initialization context',
    description:
      'Returns the minimal authenticated session context the front-end needs to enter the workbench after login completes.'
  })
  @ApiResponse({
    status: 200,
    type: SessionContextViewModel,
    description:
      'Returns the current operator, account, tenant, optional org, and stage-one navigation/access placeholders.'
  })
  async getSessionContext(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionContextViewModel> {
    return this.sessionContextUseCase.execute(source)
  }

  @Get('session/access-summary')
  @ApiOperation({
    summary: 'Get the authenticated access summary',
    description:
      'Returns effective display roles and action codes for the selected account context. Roles are informational; action codes are used for front-end button/action gating.'
  })
  @ApiResponse({
    status: 200,
    type: SessionAccessSummaryViewModel,
    description: 'Returns the current account roles and effective action codes resolved by permission-service.'
  })
  async getSessionAccessSummary(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionAccessSummaryViewModel> {
    return this.sessionAccessSummaryUseCase.execute(source)
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'List the authenticated user sessions',
    description: 'Returns the currently authenticated user session inventory for self-service device management.'
  })
  @ApiResponse({
    status: 200,
    type: SelfSessionListViewModel
  })
  async listSessions(@DownstreamSource() source: DownstreamRequestSource): Promise<SelfSessionListViewModel> {
    return this.sessionSelfServiceUseCase.listSessions(source)
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout the current session',
    description: 'Revokes the currently authenticated session using the session context resolved from the access token.'
  })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel
  })
  async logout(@DownstreamSource() source: DownstreamRequestSource): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logout(source)
  }

  @Post('logout-other-devices')
  @ApiOperation({
    summary: 'Logout all other devices',
    description: 'Revokes every session belonging to the current user except the active session used for this request.'
  })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel
  })
  async logoutOtherDevices(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logoutOtherDevices(source)
  }

  @Post('logout-all')
  @ApiOperation({
    summary: 'Logout all sessions',
    description: 'Revokes every session belonging to the currently authenticated user.'
  })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel
  })
  async logoutAll(@DownstreamSource() source: DownstreamRequestSource): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logoutAll(source)
  }

  @Get('mfa-bindings')
  @ApiOperation({
    summary: 'List self-service MFA bindings',
    description: 'Returns the MFA binding state visible to the currently authenticated user.'
  })
  @ApiResponse({
    status: 200,
    type: MfaBindingListViewModel
  })
  async listMfaBindings(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<MfaBindingListViewModel> {
    return this.mfaSelfServiceUseCase.listBindings(source)
  }

  @Post('mfa/bindings/enable')
  @ApiOperation({
    summary: 'Enable an MFA binding',
    description: 'Enables one self-service MFA binding for the currently authenticated user.'
  })
  @ApiBody({ type: MfaBindingMutationDto })
  @ApiResponse({
    status: 200,
    type: MfaBindingMutationViewModel
  })
  async enableMfaBinding(
    @Body() dto: MfaBindingMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<MfaBindingMutationViewModel> {
    return this.mfaSelfServiceUseCase.enableBinding(dto.type, source)
  }

  @Post('mfa/bindings/disable')
  @ApiOperation({
    summary: 'Disable an MFA binding',
    description: 'Disables one self-service MFA binding for the currently authenticated user.'
  })
  @ApiBody({ type: MfaBindingMutationDto })
  @ApiResponse({
    status: 200,
    type: MfaBindingMutationViewModel
  })
  async disableMfaBinding(
    @Body() dto: MfaBindingMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<MfaBindingMutationViewModel> {
    return this.mfaSelfServiceUseCase.disableBinding(dto.type, source)
  }

  @Post('mfa/totp/initialize')
  @ApiOperation({
    summary: 'Initialize TOTP binding',
    description: 'Generates the secret and QR code payload required to enroll a TOTP authenticator.'
  })
  @ApiResponse({
    status: 200,
    type: InitializeTotpViewModel
  })
  async initializeTotpBinding(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<InitializeTotpViewModel> {
    return this.mfaSelfServiceUseCase.initializeTotp(source)
  }

  @Post('mfa/totp/activate')
  @ApiOperation({
    summary: 'Activate TOTP binding',
    description: 'Confirms a previously initialized TOTP binding with the authenticator verification code.'
  })
  @ApiBody({ type: ActivateTotpBindingDto })
  @ApiResponse({
    status: 200,
    type: MfaBindingMutationViewModel
  })
  async activateTotpBinding(
    @Body() dto: ActivateTotpBindingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<MfaBindingMutationViewModel> {
    return this.mfaSelfServiceUseCase.activateTotp(dto, source)
  }

  @Post('mfa/recovery-codes/initialize')
  @ApiOperation({
    summary: 'Initialize recovery codes',
    description: 'Generates the first recovery code set for the currently authenticated user.'
  })
  @ApiResponse({
    status: 200,
    type: RecoveryCodesViewModel
  })
  async initializeRecoveryCodes(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<RecoveryCodesViewModel> {
    return this.mfaSelfServiceUseCase.initializeRecoveryCodes(source)
  }

  @Post('mfa/recovery-codes/regenerate')
  @ApiOperation({
    summary: 'Regenerate recovery codes',
    description: 'Rotates the recovery code set for the currently authenticated user.'
  })
  @ApiResponse({
    status: 200,
    type: RecoveryCodesViewModel
  })
  async regenerateRecoveryCodes(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<RecoveryCodesViewModel> {
    return this.mfaSelfServiceUseCase.regenerateRecoveryCodes(source)
  }

  @Get('admin/users/:userId/sessions')
  @PermissionCheckAll([AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS])
  @ApiOperation({
    summary: 'List another user session inventory',
    description: 'Returns the sessions visible to an authorized administrator for the target user.'
  })
  @ApiParam({
    name: 'userId',
    description: 'Target user identifier whose session inventory should be inspected.'
  })
  @ApiResponse({
    status: 200,
    type: AdminSessionListViewModel
  })
  async adminListUserSessions(
    @Param('userId') userId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminSessionListViewModel> {
    return this.adminSecurityUseCase.listUserSessions(userId, source)
  }

  @Post('admin/sessions/:sessionId/revoke')
  @PermissionCheckAll([AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION])
  @ApiOperation({
    summary: 'Revoke one concrete user session',
    description: 'Performs an administrator-driven session revocation for the target session.'
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Target session identifier to revoke.'
  })
  @ApiBody({ type: AdminRevokeSessionDto })
  @ApiResponse({
    status: 200,
    type: AdminSessionMutationViewModel
  })
  async adminRevokeSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: AdminRevokeSessionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminSessionMutationViewModel> {
    return this.adminSecurityUseCase.revokeSession(sessionId, dto, source)
  }

  @Get('admin/audit-events')
  @PermissionCheckAll([AUTH_MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT])
  @ApiOperation({
    summary: 'List auth audit events',
    description: 'Returns the auth-domain audit events visible to the authorized administrative caller.'
  })
  @ApiQuery({ name: 'service', required: false })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'result', required: false })
  @ApiQuery({ name: 'operatorId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'occurredAtFrom', required: false })
  @ApiQuery({ name: 'occurredAtTo', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: AdminAuditEventListViewModel
  })
  async adminListAuditEvents(
    @Query() query: AdminAuditEventQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminAuditEventListViewModel> {
    return this.adminSecurityUseCase.listAuditEvents(query, source)
  }
}
