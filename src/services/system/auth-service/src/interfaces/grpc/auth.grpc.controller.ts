import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  EmailOtpChallengeRequest,
  EmailPasswordLoginRequest,
  EmailOtpLoginRequest,
  LoginStatus,
  LoginResponse,
  LogoutAllRequest,
  LogoutAllResponse,
  LogoutRequest,
  LogoutResponse,
  OtpChallengeResponse,
  PhoneOtpChallengeRequest,
  PhoneOtpLoginRequest,
  PhonePasswordLoginRequest,
  RefreshSessionRequest,
  RefreshSessionResponse,
  SelectAccountRequest,
  SelectAccountResponse,
  SubmitMfaChallengeRequest
} from '@oes/common/generated/auth_service'
import {
  LoginWithEmailPasswordCommand,
  LoginWithEmailOtpCommand,
  LoginWithPhoneOtpCommand,
  LoginWithPhonePasswordCommand,
  LogoutAllCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RequestEmailOtpLoginChallengeCommand,
  RequestPhoneOtpLoginChallengeCommand,
  SelectAccountCommand,
  SubmitMfaChallengeCommand
} from 'src/application/commands/auth'
import { AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED } from 'src/common/constants/exception-enums'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@AuthServiceControllerMethods()
export class AuthGrpcController implements AuthServiceController {
  constructor(private readonly commandBus: ValidatingCommandBus) {}

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const result = await this.commandBus.execute(
      new LogoutCommand(request.sessionId ?? '')
    )

    return {
      success: result.success
    }
  }

  async logoutAll(request: LogoutAllRequest): Promise<LogoutAllResponse> {
    const result = await this.commandBus.execute(
      new LogoutAllCommand(request.userId ?? '')
    )

    return {
      success: result.success,
      sessionCount: String(result.sessionCount)
    }
  }

  async submitMfaChallenge(request: SubmitMfaChallengeRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new SubmitMfaChallengeCommand(
        request.challengeId ?? '',
        request.code ?? '',
        (request.loginMethod as any) ?? ''
      )
    )

    return {
      status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
      userId: result.userId,
      challengeId: '',
      accessToken: '',
      refreshToken: '',
      expiresIn: '0',
      loginMethod: result.method,
      accounts: result.accounts.map((account) => ({
        accountId: account.accountId,
        tenantId: account.tenantId,
        displayName: account.displayName ?? ''
      }))
    }
  }

  async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    const result = await this.commandBus.execute(
      new RefreshSessionCommand(request.refreshToken ?? '')
    )

    return {
      sessionId: result.sessionId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn)
    }
  }

  async selectAccount(request: SelectAccountRequest): Promise<SelectAccountResponse> {
    const result = await this.commandBus.execute(
      new SelectAccountCommand(
        request.userId ?? '',
        request.accountId ?? '',
        (request.loginMethod as any) ?? ''
      )
    )

    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: result.userId,
      accountId: result.accountId,
      tenantId: result.tenantId,
      sessionId: result.sessionId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: String(result.expiresIn),
      displayName: result.displayName ?? '',
      nextStep: ''
    }
  }

  async loginWithEmailPassword(request: EmailPasswordLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailPasswordCommand(request.email ?? '', request.password ?? '')
    )

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: []
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
        }))
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async requestEmailOtpLoginChallenge(
    request: EmailOtpChallengeRequest
  ): Promise<OtpChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestEmailOtpLoginChallengeCommand(request.email ?? '')
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  async loginWithEmailOtp(request: EmailOtpLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithEmailOtpCommand(request.email ?? '', request.otp ?? '')
    )

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: []
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
        }))
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async loginWithPhonePassword(request: PhonePasswordLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhonePasswordCommand(request.phone ?? '', request.password ?? '')
    )

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: []
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
        }))
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }

  async requestPhoneOtpLoginChallenge(
    request: PhoneOtpChallengeRequest
  ): Promise<OtpChallengeResponse> {
    const result = await this.commandBus.execute(
      new RequestPhoneOtpLoginChallengeCommand(request.phone ?? '')
    )

    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      destination: result.destination
    }
  }

  async loginWithPhoneOtp(request: PhoneOtpLoginRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new LoginWithPhoneOtpCommand(request.phone ?? '', request.otp ?? '')
    )

    if (result.nextStep === 'MFA_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: result.userId,
        challengeId: result.challengeId ?? '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: []
      }
    }

    if (result.nextStep === 'ACCOUNT_SELECTION_REQUIRED') {
      return {
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: result.userId,
        challengeId: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0',
        loginMethod: result.method,
        accounts: result.accounts.map((account) => ({
          accountId: account.accountId,
          tenantId: account.tenantId,
          displayName: account.displayName ?? ''
        }))
      }
    }

    throw ExceptionFactory.application(AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED)
  }
}
