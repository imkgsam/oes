import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  AUTH_SESSION_PERMISSION_CODES,
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  RequirePermissions
} from '@oes/common/authorization'
import {
  AdminAccountDirectoryQueryDto,
  AdminAuditEventQueryDto,
  AdminLoginMethodStateMutationDto,
  AdminOnlineUserQueryDto,
  AdminPlatformMfaPolicyMutationDto,
  AdminPlatformTerminalLoginPolicyMutationDto,
  AdminPlatformTerminalMfaPolicyMutationDto,
  AdminRequirePasswordSetupDto,
  AdminTenantMfaPolicyMutationDto,
  AdminTenantTerminalMfaPolicyMutationDto,
  AdminTenantOptionQueryDto,
  CreateAdminAccountDto,
  AdminRevokeSessionDto,
  AdminUserSearchQueryDto,
  UpdateAdminAccountBasicInfoDto
} from '../dtos/admin-security.dto'
import { AccountProfileDto } from '../dtos/account-profile.dto'
import {
  CompleteMfaDto,
  EmailOtpChallengeDto,
  LoginDto,
  PhoneOtpChallengeDto,
  RefreshSessionDto,
  RequestMfaFactorChallengeDto,
  SelectAccountDto,
  SwitchContextDto
} from '../dtos/login.dto'
import { FirstLoginPasswordSetupDto } from '../dtos/first-login-password.dto'
import {
  CompletePasswordRecoveryDto,
  InspectPasswordRecoveryChannelsDto,
  RequestPasswordRecoveryChallengeDto,
  VerifyPasswordRecoveryChallengeDto
} from '../dtos/password-recovery.dto'
import {
  ActivateTotpBindingDto,
  ChangeOwnPasswordDto,
  CompleteStepUpMfaChallengeDto,
  MfaBindingMutationDto,
  OwnTerminalPinDto,
  RequestEmailContactBindingChallengeDto,
  RequestPhoneContactBindingChallengeDto,
  SelfLoginHistoryQueryDto,
  SetOwnTerminalPinEnabledDto,
  StartStepUpMfaChallengeDto,
  VerifyEmailContactBindingDto,
  VerifyPhoneContactBindingDto
} from '../dtos/self-security.dto'
import {
  AuthResponseViewModel,
  OtpChallengeViewModel,
  RefreshSessionViewModel
} from '../view-models/auth-response.view-model'
import {
  PasswordRecoveryChallengeViewModel,
  PasswordRecoveryOptionsViewModel,
  PasswordRecoveryCompletionViewModel,
  PasswordRecoveryVerificationViewModel
} from '../view-models/password-recovery.view-model'
import {
  ContactBindingMutationViewModel,
  ContactBindingVerificationViewModel,
  SelfLoginHistoryListViewModel,
  InitializeTotpViewModel,
  LoginMethodListViewModel,
  LoginMethodMutationViewModel,
  MfaBindingListViewModel,
  MfaBindingMutationViewModel,
  PasswordMutationViewModel,
  RecoveryCodesViewModel,
  SelfSessionListViewModel,
  SessionMutationViewModel,
  TerminalPinMutationViewModel
} from '../view-models/self-security.view-model'
import {
  StepUpMfaChallengeViewModel,
  StepUpMfaGrantViewModel
} from '../view-models/self-security.view-model'
import {
  TrustedDeviceListViewModel,
  TrustedDeviceMutationViewModel
} from '../view-models/self-security.view-model'
import { SessionContextViewModel } from '../view-models/session-context.view-model'
import { SessionAccessSummaryViewModel } from '../view-models/session-access-summary.view-model'
import {
  SessionContextListViewModel,
  SwitchContextViewModel
} from '../view-models/session-context-switch.view-model'
import {
  AdminAccountDirectoryListViewModel,
  AdminAccountBasicInfoViewModel,
  AdminAccountDeletionImpactViewModel,
  AdminAccountDeletionResultViewModel,
  AdminAuditEventListViewModel,
  AdminOnlineUserListViewModel,
  AdminPlatformMfaPolicyViewModel,
  AdminPlatformTerminalLoginPolicyViewModel,
  AdminPlatformTerminalMfaPolicyViewModel,
  AdminSessionListViewModel,
  AdminSessionMutationViewModel,
  AdminTenantMfaPolicyViewModel,
  AdminTenantTerminalMfaPolicyViewModel,
  AdminTenantOptionListViewModel,
  AdminUserSearchListViewModel
} from '../view-models/admin-security.view-model'
import { LoginUseCase } from '../../../application/use-cases/login.use-case'
import { RequestEmailOtpChallengeUseCase } from '../../../application/use-cases/request-email-otp-challenge.use-case'
import { RequestPhoneOtpChallengeUseCase } from '../../../application/use-cases/request-phone-otp-challenge.use-case'
import { RequestMfaFactorChallengeUseCase } from '../../../application/use-cases/request-mfa-factor-challenge.use-case'
import { CompleteMfaUseCase } from '../../../application/use-cases/complete-mfa.use-case'
import { PasswordRecoveryUseCase } from '../../../application/use-cases/password-recovery.use-case'
import { SelectAccountUseCase } from '../../../application/use-cases/select-account.use-case'
import { RefreshSessionUseCase } from '../../../application/use-cases/refresh-session.use-case'
import { CompleteFirstLoginPasswordSetupUseCase } from '../../../application/use-cases/complete-first-login-password-setup.use-case'
import { SessionSelfServiceUseCase } from '../../../application/use-cases/session-self-service.use-case'
import { MfaSelfServiceUseCase } from '../../../application/use-cases/mfa-self-service.use-case'
import { AdminSecurityUseCase } from '../../../application/use-cases/admin-security.use-case'
import { SessionAccessSummaryUseCase } from '../../../application/use-cases/session-access-summary.use-case'
import { SessionContextUseCase } from '../../../application/use-cases/session-context.use-case'
import { SessionContextsUseCase } from '../../../application/use-cases/session-contexts.use-case'
import { SwitchContextUseCase } from '../../../application/use-cases/switch-context.use-case'
import { PersonalCenterUseCase } from '../../../application/use-cases/personal-center.use-case'
import { AccountProfileUseCase } from '../../../application/use-cases/account-profile.use-case'
import {
  AccountAvatarUploadFile,
  AccountAvatarUploadUseCase
} from '../../../application/use-cases/account-avatar-upload.use-case'
import { SelfContactBindingUseCase } from '../../../application/use-cases/self-contact-binding.use-case'
import { StepUpMfaUseCase } from '../../../application/use-cases/step-up-mfa.use-case'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import {
  AccountProfileMutationViewModel,
  AvatarAssetUploadViewModel,
  PersonalCenterViewModel
} from '../view-models/personal-center.view-model'

@ApiTags('auth')
@Controller('auth')
// Exposes the public auth-bff HTTP endpoints that orchestrate end-user login flows.
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly requestEmailOtpChallengeUseCase: RequestEmailOtpChallengeUseCase,
    private readonly requestPhoneOtpChallengeUseCase: RequestPhoneOtpChallengeUseCase,
    private readonly requestMfaFactorChallengeUseCase: RequestMfaFactorChallengeUseCase,
    private readonly completeMfaUseCase: CompleteMfaUseCase,
    private readonly passwordRecoveryUseCase: PasswordRecoveryUseCase,
    private readonly selectAccountUseCase: SelectAccountUseCase,
    private readonly completeFirstLoginPasswordSetupUseCase: CompleteFirstLoginPasswordSetupUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly sessionSelfServiceUseCase: SessionSelfServiceUseCase,
    private readonly mfaSelfServiceUseCase: MfaSelfServiceUseCase,
    private readonly adminSecurityUseCase: AdminSecurityUseCase,
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    private readonly sessionContextUseCase: SessionContextUseCase,
    private readonly sessionContextsUseCase: SessionContextsUseCase,
    private readonly switchContextUseCase: SwitchContextUseCase,
    private readonly personalCenterUseCase: PersonalCenterUseCase,
    private readonly accountProfileUseCase: AccountProfileUseCase,
    private readonly accountAvatarUploadUseCase: AccountAvatarUploadUseCase,
    private readonly selfContactBindingUseCase: SelfContactBindingUseCase,
    private readonly stepUpMfaUseCase: StepUpMfaUseCase
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
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ): Promise<AuthResponseViewModel> {
    return this.loginUseCase.execute(dto, source, { userAgent, ipAddress }, 'WEB')
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
    return this.requestEmailOtpChallengeUseCase.execute(dto, source)
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
    return this.requestPhoneOtpChallengeUseCase.execute(dto, source)
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
    return this.completeMfaUseCase.execute(dto, source)
  }

  @Post('mfa/challenges')
  @Public()
  @ApiOperation({
    summary: 'Request one MFA factor challenge inside a pending login MFA flow',
    description:
      'Switches the active MFA factor for an existing account-selection login MFA flow and requests a factor-specific OTP challenge when required.'
  })
  @ApiBody({ type: RequestMfaFactorChallengeDto })
  @ApiResponse({
    status: 200,
    type: OtpChallengeViewModel
  })
  async requestMfaFactorChallenge(
    @Body() dto: RequestMfaFactorChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    return this.requestMfaFactorChallengeUseCase.execute(dto, source)
  }

  @Post('password-recovery/options')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Inspect public forgot-password recovery destinations',
    description:
      'Resolves the verified recovery channels for the submitted identifier so the UI can default to one channel or let the user choose.'
  })
  @ApiBody({ type: InspectPasswordRecoveryChannelsDto })
  @ApiResponse({
    status: 200,
    type: PasswordRecoveryOptionsViewModel
  })
  async inspectPasswordRecoveryChannels(
    @Body() dto: InspectPasswordRecoveryChannelsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PasswordRecoveryOptionsViewModel> {
    return this.passwordRecoveryUseCase.inspectChannels(dto, source)
  }

  @Post('password-recovery/challenges')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Start a public forgot-password recovery challenge',
    description:
      'Creates one password recovery challenge for the selected verified recovery destination after the client-side captcha gate succeeds.'
  })
  @ApiBody({ type: RequestPasswordRecoveryChallengeDto })
  @ApiResponse({
    status: 200,
    type: PasswordRecoveryChallengeViewModel
  })
  async requestPasswordRecoveryChallenge(
    @Body() dto: RequestPasswordRecoveryChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PasswordRecoveryChallengeViewModel> {
    return this.passwordRecoveryUseCase.requestChallenge(dto, source)
  }

  @Post('password-recovery/challenges/:challengeId/verify')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify one public forgot-password challenge',
    description:
      'Verifies the OTP for an active forgot-password challenge and returns a short-lived reset token.'
  })
  @ApiParam({ name: 'challengeId' })
  @ApiBody({ type: VerifyPasswordRecoveryChallengeDto })
  @ApiResponse({
    status: 200,
    type: PasswordRecoveryVerificationViewModel
  })
  async verifyPasswordRecoveryChallenge(
    @Param('challengeId') challengeId: string,
    @Body() dto: VerifyPasswordRecoveryChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PasswordRecoveryVerificationViewModel> {
    return this.passwordRecoveryUseCase.verifyChallenge(challengeId, dto, source)
  }

  @Post('password-recovery/complete')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete the public forgot-password flow',
    description:
      'Sets the new password with a verified reset token and revokes all previous sessions for that user.'
  })
  @ApiBody({ type: CompletePasswordRecoveryDto })
  @ApiResponse({
    status: 200,
    type: PasswordRecoveryCompletionViewModel
  })
  async completePasswordRecovery(
    @Body() dto: CompletePasswordRecoveryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PasswordRecoveryCompletionViewModel> {
    return this.passwordRecoveryUseCase.complete(dto, source)
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
    return this.selectAccountUseCase.execute(dto, source, { userAgent, ipAddress }, 'WEB')
  }

  @Post('first-login/password')
  @ApiOperation({
    summary: 'Complete first-login password setup',
    description:
      'Sets the first password for an OTP-authenticated invited user before the workspace becomes available.'
  })
  async completeFirstLoginPasswordSetup(
    @Body() dto: FirstLoginPasswordSetupDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.completeFirstLoginPasswordSetupUseCase.execute(dto, source)
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
    return this.refreshSessionUseCase.execute(dto, source)
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

  @Get('personal-center')
  @ApiOperation({
    summary: 'Get the authenticated personal center summary',
    description:
      'Returns first-stage personal-center data with separate user-level profile information and current account-level work context.'
  })
  @ApiResponse({
    status: 200,
    type: PersonalCenterViewModel,
    description:
      'Returns the user profile summary, current account context, and security/common entry cards for the authenticated session.'
  })
  async getPersonalCenter(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PersonalCenterViewModel> {
    return this.personalCenterUseCase.execute(source)
  }

  @Post('personal-center/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload the authenticated current account avatar',
    description:
      'Uploads one controlled avatar candidate file for the current authenticated account context.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    type: AvatarAssetUploadViewModel,
    description: 'Returns the controlled avatar asset id and public display URL.'
  })
  async uploadAccountAvatar(
    @UploadedFile() file: AccountAvatarUploadFile | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AvatarAssetUploadViewModel> {
    return this.accountAvatarUploadUseCase.execute(file, source)
  }

  @Patch('personal-center/account-profile')
  @ApiOperation({
    summary: 'Update the authenticated current account profile',
    description:
      'Updates only the editable account-profile fields of the current authenticated account context.'
  })
  @ApiBody({ type: AccountProfileDto })
  @ApiResponse({
    status: 200,
    type: AccountProfileMutationViewModel,
    description:
      'Returns the refreshed current account context after updating avatar, display name, or bio.'
  })
  async updateAccountProfile(
    @Body() dto: AccountProfileDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AccountProfileMutationViewModel> {
    return this.accountProfileUseCase.execute(dto, source)
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
    description:
      'Returns the current account roles and effective action codes resolved by permission-service.'
  })
  async getSessionAccessSummary(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionAccessSummaryViewModel> {
    return this.sessionAccessSummaryUseCase.execute(source)
  }

  @Get('session/contexts')
  @ApiOperation({
    summary: 'List the authenticated available account contexts',
    description:
      'Returns the current account context and other switchable account contexts visible to the authenticated user.'
  })
  @ApiResponse({
    status: 200,
    type: SessionContextListViewModel,
    description:
      'Returns the authenticated user account contexts that can be displayed in the context-switch flow.'
  })
  async listSessionContexts(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionContextListViewModel> {
    return this.sessionContextsUseCase.execute(source)
  }

  @Post('session/switch-context')
  @ApiOperation({
    summary: 'Switch the authenticated account context',
    description:
      'Re-issues session tokens for another available account context that belongs to the current authenticated user.'
  })
  @ApiBody({ type: SwitchContextDto })
  @ApiResponse({
    status: 200,
    type: SwitchContextViewModel,
    description: 'Returns the switched context summary and the newly issued token pair.'
  })
  async switchContext(
    @Body() dto: SwitchContextDto,
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ): Promise<SwitchContextViewModel> {
    return this.switchContextUseCase.execute(dto, source, {
      userAgent,
      ipAddress
    })
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'List the authenticated user sessions',
    description:
      'Returns the currently authenticated user session inventory for self-service device management.'
  })
  @ApiResponse({
    status: 200,
    type: SelfSessionListViewModel
  })
  async listSessions(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SelfSessionListViewModel> {
    return this.sessionSelfServiceUseCase.listSessions(source)
  }

  @Get('security/trusted-devices')
  @ApiOperation({
    summary: 'List self trusted devices',
    description:
      'Returns the authenticated user trusted-device inventory for the current tenant security context without mixing in active session state.'
  })
  @ApiResponse({
    status: 200,
    type: TrustedDeviceListViewModel
  })
  async listTrustedDevices(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<TrustedDeviceListViewModel> {
    return this.sessionSelfServiceUseCase.listTrustedDevices(source)
  }

  @Get('login-history')
  @ApiOperation({
    summary: 'List the authenticated user login history',
    description:
      'Returns the authenticated user login attempt history derived from auth-service audit records without mixing in current session management data.'
  })
  @ApiResponse({
    status: 200,
    type: SelfLoginHistoryListViewModel
  })
  async listLoginHistory(
    @Query() query: SelfLoginHistoryQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SelfLoginHistoryListViewModel> {
    return this.sessionSelfServiceUseCase.listLoginHistory(query, source)
  }

  @Get('login-methods')
  @ApiOperation({
    summary: 'List self-service login methods',
    description: 'Returns login-method status and password setup state for the authenticated user.'
  })
  @ApiResponse({
    status: 200,
    type: LoginMethodListViewModel
  })
  async listLoginMethods(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<LoginMethodListViewModel> {
    return this.sessionSelfServiceUseCase.listLoginMethods(source)
  }

  @Post('password/change')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Changes the authenticated user password after auth-service verifies the current password.'
  })
  @ApiBody({ type: ChangeOwnPasswordDto })
  @ApiResponse({
    status: 200,
    type: PasswordMutationViewModel
  })
  async changeOwnPassword(
    @Body() dto: ChangeOwnPasswordDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PasswordMutationViewModel> {
    return this.sessionSelfServiceUseCase.changeOwnPassword(dto, source)
  }

  @Post('terminal-pin/set')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Set own terminal PIN',
    description:
      'Sets the authenticated user terminal PIN after auth-service verifies step-up proof.'
  })
  @ApiBody({ type: OwnTerminalPinDto })
  @ApiResponse({
    status: 200,
    type: TerminalPinMutationViewModel
  })
  async setOwnTerminalPin(
    @Body() dto: OwnTerminalPinDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<TerminalPinMutationViewModel> {
    return this.sessionSelfServiceUseCase.setOwnTerminalPin(dto, source)
  }

  @Post('terminal-pin/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reset own terminal PIN',
    description:
      'Resets the authenticated user terminal PIN from web account security without exposing the previous PIN.'
  })
  @ApiBody({ type: OwnTerminalPinDto })
  @ApiResponse({
    status: 200,
    type: TerminalPinMutationViewModel
  })
  async resetOwnTerminalPin(
    @Body() dto: OwnTerminalPinDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<TerminalPinMutationViewModel> {
    return this.sessionSelfServiceUseCase.resetOwnTerminalPin(dto, source)
  }

  @Post('terminal-pin/enabled')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Enable or disable own terminal PIN',
    description:
      'Toggles the authenticated user terminal PIN login method without returning credential material.'
  })
  @ApiBody({ type: SetOwnTerminalPinEnabledDto })
  @ApiResponse({
    status: 200,
    type: TerminalPinMutationViewModel
  })
  async setOwnTerminalPinEnabled(
    @Body() dto: SetOwnTerminalPinEnabledDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<TerminalPinMutationViewModel> {
    return this.sessionSelfServiceUseCase.setOwnTerminalPinEnabled(dto, source)
  }

  @Post('security/mfa/challenges')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Start one authenticated step-up MFA challenge',
    description:
      'Creates a reusable MFA challenge for one protected in-session security scenario when tenant policy requires it.'
  })
  @ApiBody({ type: StartStepUpMfaChallengeDto })
  @ApiResponse({
    status: 200,
    type: StepUpMfaChallengeViewModel
  })
  async startStepUpMfaChallenge(
    @Body() dto: StartStepUpMfaChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<StepUpMfaChallengeViewModel> {
    return this.stepUpMfaUseCase.startChallenge(dto, source)
  }

  @Post('security/mfa/complete')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete one authenticated step-up MFA challenge',
    description:
      'Verifies the selected MFA factor for a protected self-service scenario and returns a short-lived scenario grant token.'
  })
  @ApiBody({ type: CompleteStepUpMfaChallengeDto })
  @ApiResponse({
    status: 200,
    type: StepUpMfaGrantViewModel
  })
  async completeStepUpMfaChallenge(
    @Body() dto: CompleteStepUpMfaChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<StepUpMfaGrantViewModel> {
    return this.stepUpMfaUseCase.completeChallenge(dto, source)
  }

  @Post('contact-bindings/email/challenge')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request self-service email binding challenge',
    description:
      'Sends an OTP to a new email address so the authenticated user can verify and bind it.'
  })
  @ApiBody({ type: RequestEmailContactBindingChallengeDto })
  @ApiResponse({
    status: 200,
    type: ContactBindingMutationViewModel
  })
  async requestEmailBindingChallenge(
    @Body() dto: RequestEmailContactBindingChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<ContactBindingMutationViewModel> {
    return this.selfContactBindingUseCase.requestEmailChallenge(dto, source)
  }

  @Post('contact-bindings/email/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify self-service email binding',
    description: 'Verifies the submitted OTP and persists the authenticated user email binding.'
  })
  @ApiBody({ type: VerifyEmailContactBindingDto })
  @ApiResponse({
    status: 200,
    type: ContactBindingVerificationViewModel
  })
  async verifyEmailBinding(
    @Body() dto: VerifyEmailContactBindingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<ContactBindingVerificationViewModel> {
    return this.selfContactBindingUseCase.verifyEmailBinding(dto, source)
  }

  @Post('contact-bindings/phone/challenge')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request self-service phone binding challenge',
    description:
      'Sends an OTP to a new phone number so the authenticated user can verify and bind it.'
  })
  @ApiBody({ type: RequestPhoneContactBindingChallengeDto })
  @ApiResponse({
    status: 200,
    type: ContactBindingMutationViewModel
  })
  async requestPhoneBindingChallenge(
    @Body() dto: RequestPhoneContactBindingChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<ContactBindingMutationViewModel> {
    return this.selfContactBindingUseCase.requestPhoneChallenge(dto, source)
  }

  @Post('contact-bindings/phone/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify self-service phone binding',
    description: 'Verifies the submitted OTP and persists the authenticated user phone binding.'
  })
  @ApiBody({ type: VerifyPhoneContactBindingDto })
  @ApiResponse({
    status: 200,
    type: ContactBindingVerificationViewModel
  })
  async verifyPhoneBinding(
    @Body() dto: VerifyPhoneContactBindingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<ContactBindingVerificationViewModel> {
    return this.selfContactBindingUseCase.verifyPhoneBinding(dto, source)
  }

  @Post('login-methods/:methodId/enable')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Enable one self-service login method',
    description: 'Enables one login method owned by the authenticated user.'
  })
  @ApiParam({ name: 'methodId' })
  @ApiResponse({
    status: 200,
    type: LoginMethodMutationViewModel
  })
  async enableLoginMethod(
    @Param('methodId') methodId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    return this.sessionSelfServiceUseCase.setLoginMethodEnabled(methodId, true, source)
  }

  @Post('login-methods/:methodId/disable')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Disable one self-service login method',
    description:
      'Disables one login method owned by the authenticated user if another usable method remains.'
  })
  @ApiParam({ name: 'methodId' })
  @ApiResponse({
    status: 200,
    type: LoginMethodMutationViewModel
  })
  async disableLoginMethod(
    @Param('methodId') methodId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    return this.sessionSelfServiceUseCase.setLoginMethodEnabled(methodId, false, source)
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout the current session',
    description:
      'Revokes the currently authenticated session using the session context resolved from the access token.'
  })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel
  })
  async logout(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logout(source)
  }

  @Delete('security/trusted-devices/:trustedDeviceId')
  @ApiOperation({
    summary: 'Revoke one trusted device',
    description:
      'Revokes one trusted-device entry so the targeted device must pass the new-device MFA challenge again on its next login.'
  })
  @ApiParam({ name: 'trustedDeviceId' })
  @ApiResponse({
    status: 200,
    type: TrustedDeviceMutationViewModel
  })
  async revokeTrustedDevice(
    @Param('trustedDeviceId') trustedDeviceId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<TrustedDeviceMutationViewModel> {
    return this.sessionSelfServiceUseCase.revokeTrustedDevice(trustedDeviceId, source)
  }

  @Post('security/trusted-devices/revoke-others')
  @ApiOperation({
    summary: 'Revoke all other trusted devices',
    description:
      'Revokes every other trusted-device entry for the authenticated user in the current tenant while leaving the current device untouched.'
  })
  @ApiResponse({
    status: 200,
    type: TrustedDeviceMutationViewModel
  })
  async revokeOtherTrustedDevices(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<TrustedDeviceMutationViewModel> {
    return this.sessionSelfServiceUseCase.revokeOtherTrustedDevices(source)
  }

  @Post('sessions/:sessionId/logout')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Logout one other session',
    description:
      'Revokes one other active session belonging to the currently authenticated account. The active session used for this request cannot be revoked through this endpoint.'
  })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel
  })
  async logoutSession(
    @Param('sessionId') sessionId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logoutSession(sessionId, source)
  }

  @Post('logout-other-devices')
  @ApiOperation({
    summary: 'Logout all other devices',
    description:
      'Revokes every other active session belonging to the current authenticated account while keeping the active session used for this request.'
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
    description:
      'Revokes every session belonging to the current authenticated account, including the active session used for this request.'
  })
  @ApiResponse({
    status: 200,
    type: SessionMutationViewModel
  })
  async logoutAll(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionMutationViewModel> {
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
    description:
      'Confirms a previously initialized TOTP binding with the authenticator verification code.'
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

  @Get('admin/online-users')
  @RequirePermissions({ all: [AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS] })
  @ApiOperation({
    summary: 'List online users visible to the administrator',
    description:
      'Returns the scope-aware online-user overview used as the first layer of the administrator session management page.'
  })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: AdminOnlineUserListViewModel
  })
  async adminListOnlineUsers(
    @Query() query: AdminOnlineUserQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminOnlineUserListViewModel> {
    return this.adminSecurityUseCase.listOnlineUsers(query, source)
  }

  @Get('admin/accounts')
  @RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.LIST_ACCOUNT] })
  @ApiOperation({
    summary: 'List accounts for account management',
    description:
      'Returns the scope-aware administrative account directory used by the account-management page.'
  })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'scopeLevel', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: AdminAccountDirectoryListViewModel
  })
  async adminListAccounts(
    @Query() query: AdminAccountDirectoryQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminAccountDirectoryListViewModel> {
    return this.adminSecurityUseCase.listAccounts(query, source)
  }

  @Get('admin/accounts/:accountId/profile')
  @RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.LIST_ACCOUNT] })
  @ApiOperation({
    summary: 'Get one account basic-info profile',
    description:
      'Returns the account-management basic-info payload used by the account basic-info editor modal.'
  })
  @ApiParam({
    name: 'accountId',
    description: 'Target account identifier whose basic-info payload should be loaded.'
  })
  @ApiResponse({
    status: 200,
    type: AdminAccountBasicInfoViewModel
  })
  async adminGetAccountBasicInfo(
    @Param('accountId') accountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminAccountBasicInfoViewModel> {
    return this.adminSecurityUseCase.getAccountBasicInfo(accountId, source)
  }

  @Get('admin/accounts/:accountId/deletion-impact')
  @RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT] })
  @ApiOperation({
    summary: 'Get one account deletion impact preview',
    description:
      'Returns blockers and cleanup preview data before an administrator permanently deletes one account.'
  })
  @ApiParam({ name: 'accountId' })
  @ApiResponse({
    status: 200,
    type: AdminAccountDeletionImpactViewModel
  })
  async adminGetAccountDeletionImpact(
    @Param('accountId') accountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminAccountDeletionImpactViewModel> {
    return this.adminSecurityUseCase.getAccountDeletionImpact(accountId, source)
  }

  @Post('admin/accounts')
  @RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT] })
  @ApiOperation({
    summary: 'Create one admin-managed human account',
    description:
      'Creates one USER account, bootstraps login methods, dispatches an invitation, and optionally assigns initial roles.'
  })
  async adminCreateAccount(
    @Body() body: CreateAdminAccountDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.adminSecurityUseCase.createAccount(body, source)
  }

  @Patch('admin/accounts/:accountId/profile')
  @RequirePermissions({
    any: [
      IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_PROFILE,
      IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS
    ]
  })
  @ApiOperation({
    summary: 'Update one account basic-info profile',
    description:
      'Updates the account-management basic-info fields used for display name and enabled status.'
  })
  @ApiParam({
    name: 'accountId',
    description: 'Target account identifier whose basic-info payload should be updated.'
  })
  @ApiBody({ type: UpdateAdminAccountBasicInfoDto })
  @ApiResponse({
    status: 200,
    type: AdminAccountBasicInfoViewModel
  })
  async adminUpdateAccountBasicInfo(
    @Param('accountId') accountId: string,
    @Body() body: UpdateAdminAccountBasicInfoDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminAccountBasicInfoViewModel> {
    return this.adminSecurityUseCase.updateAccountBasicInfo(accountId, body, source)
  }

  @Delete('admin/accounts/:accountId')
  @RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT] })
  @ApiOperation({
    summary: 'Delete one account permanently',
    description:
      'Deletes one administrator-managed account after deletion blockers pass and downstream system-owned relations are cleaned up.'
  })
  @ApiParam({ name: 'accountId' })
  @ApiResponse({
    status: 200,
    type: AdminAccountDeletionResultViewModel
  })
  async adminDeleteAccount(
    @Param('accountId') accountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminAccountDeletionResultViewModel> {
    return this.adminSecurityUseCase.deleteAccount(accountId, source)
  }

  @Get('admin/accounts/:accountId/login-methods')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS] })
  @ApiOperation({
    summary: 'List account login methods',
    description:
      'Returns login-method status for the user behind one administrator-managed account.'
  })
  @ApiParam({ name: 'accountId' })
  @ApiResponse({
    status: 200,
    type: LoginMethodListViewModel
  })
  async adminListAccountLoginMethods(
    @Param('accountId') accountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<LoginMethodListViewModel> {
    return this.adminSecurityUseCase.listAccountLoginMethods(accountId, source)
  }

  @Post('admin/accounts/:accountId/password/setup-required')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS] })
  @ApiOperation({
    summary: 'Require account password setup',
    description:
      'Marks the user behind one administrator-managed account as needing to set a new password; the administrator never supplies plaintext password material.'
  })
  @ApiParam({ name: 'accountId' })
  @ApiBody({ type: AdminRequirePasswordSetupDto })
  @ApiResponse({
    status: 200,
    type: PasswordMutationViewModel
  })
  async adminRequireAccountPasswordSetup(
    @Param('accountId') accountId: string,
    @Body() body: AdminRequirePasswordSetupDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PasswordMutationViewModel> {
    return this.adminSecurityUseCase.requireAccountPasswordSetup(accountId, body, source)
  }

  @Post('admin/accounts/:accountId/login-methods/:methodId/enable')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS] })
  @ApiOperation({
    summary: 'Enable account login method',
    description: 'Enables one login method for the user behind an administrator-managed account.'
  })
  @ApiParam({ name: 'accountId' })
  @ApiParam({ name: 'methodId' })
  @ApiBody({ type: AdminLoginMethodStateMutationDto })
  @ApiResponse({
    status: 200,
    type: LoginMethodMutationViewModel
  })
  async adminEnableAccountLoginMethod(
    @Param('accountId') accountId: string,
    @Param('methodId') methodId: string,
    @Body() body: AdminLoginMethodStateMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    return this.adminSecurityUseCase.setAccountLoginMethodEnabled(
      accountId,
      methodId,
      true,
      body,
      source
    )
  }

  @Post('admin/accounts/:accountId/login-methods/:methodId/disable')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS] })
  @ApiOperation({
    summary: 'Disable account login method',
    description:
      'Disables one login method for the user behind an administrator-managed account if another usable method remains.'
  })
  @ApiParam({ name: 'accountId' })
  @ApiParam({ name: 'methodId' })
  @ApiBody({ type: AdminLoginMethodStateMutationDto })
  @ApiResponse({
    status: 200,
    type: LoginMethodMutationViewModel
  })
  async adminDisableAccountLoginMethod(
    @Param('accountId') accountId: string,
    @Param('methodId') methodId: string,
    @Body() body: AdminLoginMethodStateMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    return this.adminSecurityUseCase.setAccountLoginMethodEnabled(
      accountId,
      methodId,
      false,
      body,
      source
    )
  }

  @Get('admin/tenant-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_TENANT_MFA_POLICY] })
  @ApiOperation({
    summary: 'Get tenant login MFA policy',
    description:
      'Returns the tenant-scoped login MFA requirement and factor priority used after account selection.'
  })
  @ApiResponse({
    status: 200,
    type: AdminTenantMfaPolicyViewModel
  })
  async adminGetTenantMfaPolicy(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminTenantMfaPolicyViewModel> {
    return this.adminSecurityUseCase.getTenantMfaPolicy(source)
  }

  @Get('admin/platform-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY] })
  @ApiOperation({
    summary: 'Get platform MFA policy',
    description:
      'Returns the platform-scoped MFA requirement and factor priority used by system-level accounts.'
  })
  @ApiResponse({
    status: 200,
    type: AdminPlatformMfaPolicyViewModel
  })
  async adminGetPlatformMfaPolicy(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminPlatformMfaPolicyViewModel> {
    return this.adminSecurityUseCase.getPlatformMfaPolicy(source)
  }

  @Put('admin/tenant-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_TENANT_MFA_POLICY] })
  @ApiOperation({
    summary: 'Update tenant login MFA policy',
    description:
      'Updates the tenant-scoped login MFA requirement and global factor priority order used after account selection.'
  })
  @ApiBody({ type: AdminTenantMfaPolicyMutationDto })
  @ApiResponse({
    status: 200,
    type: AdminTenantMfaPolicyViewModel
  })
  async adminUpdateTenantMfaPolicy(
    @Body() body: AdminTenantMfaPolicyMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminTenantMfaPolicyViewModel> {
    return this.adminSecurityUseCase.updateTenantMfaPolicy(body, source)
  }

  @Put('admin/platform-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY] })
  @ApiOperation({
    summary: 'Update platform MFA policy',
    description:
      'Updates the platform-scoped MFA requirement and global factor priority order used by system-level accounts.'
  })
  @ApiBody({ type: AdminPlatformMfaPolicyMutationDto })
  @ApiResponse({
    status: 200,
    type: AdminPlatformMfaPolicyViewModel
  })
  async adminUpdatePlatformMfaPolicy(
    @Body() body: AdminPlatformMfaPolicyMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminPlatformMfaPolicyViewModel> {
    return this.adminSecurityUseCase.updatePlatformMfaPolicy(body, source)
  }

  @Get('admin/platform-terminal-login-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY] })
  @ApiOperation({
    summary: 'Get platform terminal login policy',
    description: 'Returns platform-owned login-flow allowlists for each terminal entry.'
  })
  @ApiResponse({
    status: 200,
    type: AdminPlatformTerminalLoginPolicyViewModel
  })
  async adminGetPlatformTerminalLoginPolicy(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalLoginPolicyViewModel> {
    return this.adminSecurityUseCase.getPlatformTerminalLoginPolicy(source)
  }

  @Put('admin/platform-terminal-login-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY] })
  @ApiOperation({
    summary: 'Update platform terminal login policy',
    description: 'Updates platform-owned login-flow allowlists for fixed terminal entries.'
  })
  @ApiBody({ type: AdminPlatformTerminalLoginPolicyMutationDto })
  @ApiResponse({
    status: 200,
    type: AdminPlatformTerminalLoginPolicyViewModel
  })
  async adminUpdatePlatformTerminalLoginPolicy(
    @Body() body: AdminPlatformTerminalLoginPolicyMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalLoginPolicyViewModel> {
    return this.adminSecurityUseCase.updatePlatformTerminalLoginPolicy(body, source)
  }

  @Get('admin/platform-terminal-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY] })
  @ApiOperation({
    summary: 'Get platform default terminal MFA policy',
    description:
      'Returns platform default terminal MFA settings without treating them as tenant baselines.'
  })
  @ApiResponse({
    status: 200,
    type: AdminPlatformTerminalMfaPolicyViewModel
  })
  async adminGetPlatformTerminalMfaPolicy(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalMfaPolicyViewModel> {
    return this.adminSecurityUseCase.getPlatformTerminalMfaPolicy(source)
  }

  @Put('admin/platform-terminal-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY] })
  @ApiOperation({
    summary: 'Update platform default terminal MFA policy',
    description:
      'Updates platform default terminal MFA settings used when no tenant override exists.'
  })
  @ApiBody({ type: AdminPlatformTerminalMfaPolicyMutationDto })
  @ApiResponse({
    status: 200,
    type: AdminPlatformTerminalMfaPolicyViewModel
  })
  async adminUpdatePlatformTerminalMfaPolicy(
    @Body() body: AdminPlatformTerminalMfaPolicyMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalMfaPolicyViewModel> {
    return this.adminSecurityUseCase.updatePlatformTerminalMfaPolicy(body, source)
  }

  @Get('admin/tenant-terminal-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_TENANT_MFA_POLICY] })
  @ApiOperation({
    summary: 'Get tenant terminal MFA policy',
    description: 'Returns effective terminal MFA settings for the tenant visible to the operator.'
  })
  @ApiResponse({
    status: 200,
    type: AdminTenantTerminalMfaPolicyViewModel
  })
  async adminGetTenantTerminalMfaPolicy(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminTenantTerminalMfaPolicyViewModel> {
    return this.adminSecurityUseCase.getTenantTerminalMfaPolicy(source)
  }

  @Put('admin/tenant-terminal-mfa-policy')
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_TENANT_MFA_POLICY] })
  @ApiOperation({
    summary: 'Update tenant terminal MFA policy',
    description: 'Updates tenant-owned terminal MFA overrides for each fixed terminal entry.'
  })
  @ApiBody({ type: AdminTenantTerminalMfaPolicyMutationDto })
  @ApiResponse({
    status: 200,
    type: AdminTenantTerminalMfaPolicyViewModel
  })
  async adminUpdateTenantTerminalMfaPolicy(
    @Body() body: AdminTenantTerminalMfaPolicyMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminTenantTerminalMfaPolicyViewModel> {
    return this.adminSecurityUseCase.updateTenantTerminalMfaPolicy(body, source)
  }

  @Get('admin/account-tenant-options')
  @RequirePermissions({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT] })
  @ApiOperation({
    summary: 'List tenant options for account creation selectors',
    description: 'Returns tenant selector rows for system-scope account creation flows.'
  })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: AdminTenantOptionListViewModel
  })
  async adminListAccountTenantOptions(
    @Query() query: AdminTenantOptionQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminTenantOptionListViewModel> {
    return this.adminSecurityUseCase.listTenantOptions(query, source)
  }

  @Get('admin/users/search')
  @RequirePermissions({ all: [AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS] })
  @ApiOperation({
    summary: 'Search users for admin session management',
    description:
      'Returns a small scope-aware user candidate set for administrator session inspection.'
  })
  @ApiQuery({ name: 'keyword', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: AdminUserSearchListViewModel
  })
  async adminSearchUsers(
    @Query() query: AdminUserSearchQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AdminUserSearchListViewModel> {
    return this.adminSecurityUseCase.searchUsers(query, source)
  }

  @Get('admin/users/:userId/sessions')
  @RequirePermissions({ all: [AUTH_SESSION_PERMISSION_CODES.ADMIN_VIEW_USER_SESSIONS] })
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
  @RequirePermissions({ all: [AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION] })
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
  @RequirePermissions({ all: [AUTH_MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT] })
  @ApiOperation({
    summary: 'List auth audit events',
    description:
      'Returns the auth-domain audit events visible to the authorized administrative caller.'
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
