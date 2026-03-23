import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  EmailPasswordLoginRequest,
  LoginStatus,
  LoginResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
  SelectAccountRequest,
  SelectAccountResponse,
  SubmitMfaChallengeRequest
} from '@oes/common/generated/auth_service'
import {
  LoginWithEmailPasswordCommand,
  RefreshSessionCommand,
  SelectAccountCommand,
  SubmitMfaChallengeCommand
} from 'src/application/commands/auth'
import { AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED } from 'src/common/constants/exception-enums'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@AuthServiceControllerMethods()
export class AuthGrpcController implements AuthServiceController {
  constructor(private readonly commandBus: ValidatingCommandBus) {}

  async submitMfaChallenge(request: SubmitMfaChallengeRequest): Promise<LoginResponse> {
    const result = await this.commandBus.execute(
      new SubmitMfaChallengeCommand(request.challengeId ?? '', request.code ?? '')
    )

    return {
      status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
      userId: result.userId,
      challengeId: '',
      accessToken: '',
      refreshToken: '',
      expiresIn: '0',
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
      new SelectAccountCommand(request.userId ?? '', request.accountId ?? '')
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
