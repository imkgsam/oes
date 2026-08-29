import { BadRequestException, Body, Controller, Get, Headers, Ip, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { LoginTerminal, LoginUseCase } from '../../../application/use-cases/login.use-case'
import { SelectAccountUseCase } from '../../../application/use-cases/select-account.use-case'
import { CompleteMfaUseCase } from '../../../application/use-cases/complete-mfa.use-case'
import { RequestMfaFactorChallengeUseCase } from '../../../application/use-cases/request-mfa-factor-challenge.use-case'
import { RefreshSessionUseCase } from '../../../application/use-cases/refresh-session.use-case'
import { SessionAccessSummaryUseCase } from '../../../application/use-cases/session-access-summary.use-case'
import { SessionContextUseCase } from '../../../application/use-cases/session-context.use-case'
import { SessionContextsUseCase } from '../../../application/use-cases/session-contexts.use-case'
import { SessionSelfServiceUseCase } from '../../../application/use-cases/session-self-service.use-case'
import { SwitchContextUseCase } from '../../../application/use-cases/switch-context.use-case'
import {
  CompleteMfaDto,
  EmployeeCodePinPreflightDto,
  LoginDto,
  RefreshSessionDto,
  RequestMfaFactorChallengeDto,
  SelectAccountDto,
  SwitchContextDto
} from '../dtos/login.dto'
import {
  AuthResponseViewModel,
  EmployeeCodePinPreflightViewModel,
  OtpChallengeViewModel,
  RefreshSessionViewModel
} from '../view-models/auth-response.view-model'
import { SessionAccessSummaryViewModel } from '../view-models/session-access-summary.view-model'
import { SessionContextViewModel } from '../view-models/session-context.view-model'
import {
  SessionContextListViewModel,
  SwitchContextViewModel
} from '../view-models/session-context-switch.view-model'
import { SessionMutationViewModel } from '../view-models/self-security.view-model'

// Exposes one terminal-scoped public auth surface whose terminal value is fixed by the BFF route.
abstract class TerminalAuthControllerBase {
  protected abstract readonly terminal: LoginTerminal

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly selectAccountUseCase: SelectAccountUseCase,
    private readonly completeMfaUseCase: CompleteMfaUseCase,
    private readonly requestMfaFactorChallengeUseCase: RequestMfaFactorChallengeUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    private readonly sessionContextUseCase: SessionContextUseCase,
    private readonly sessionContextsUseCase: SessionContextsUseCase,
    private readonly switchContextUseCase: SwitchContextUseCase,
    private readonly sessionSelfServiceUseCase: SessionSelfServiceUseCase
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Terminal-scoped primary authentication entry point' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseViewModel })
  async login(
    @Body() dto: LoginDto,
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
    @Headers('x-oes-terminal-device-credential') deviceCredential?: string
  ): Promise<AuthResponseViewModel> {
    return this.loginUseCase.execute(
      dto,
      source,
      { userAgent, ipAddress },
      this.terminal,
      deviceCredential
    )
  }

  @Post('employee-code/preflight')
  @Public()
  @ApiOperation({ summary: 'Preflight a terminal-scoped employee-code login before PIN entry' })
  @ApiBody({ type: EmployeeCodePinPreflightDto })
  async preflightEmployeeCodePin(
    @Body() dto: EmployeeCodePinPreflightDto,
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
    @Headers('x-oes-terminal-device-credential') deviceCredential?: string
  ): Promise<EmployeeCodePinPreflightViewModel> {
    return this.loginUseCase.preflightEmployeeCodePin(
      dto,
      source,
      { userAgent, ipAddress },
      this.terminal,
      deviceCredential
    )
  }

  @Post('account-selection')
  @Public()
  @ApiOperation({ summary: 'Terminal-scoped account selection' })
  @ApiBody({ type: SelectAccountDto })
  @ApiResponse({ status: 200, type: AuthResponseViewModel })
  async selectAccount(
    @Body() dto: SelectAccountDto,
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ): Promise<AuthResponseViewModel> {
    return this.selectAccountUseCase.execute(dto, source, { userAgent, ipAddress }, this.terminal)
  }

  @Post('mfa/complete')
  @Public()
  @ApiOperation({ summary: 'Complete terminal-scoped login MFA challenge' })
  @ApiBody({ type: CompleteMfaDto })
  @ApiResponse({ status: 200, type: AuthResponseViewModel })
  async completeMfa(
    @Body() dto: CompleteMfaDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<AuthResponseViewModel> {
    return this.completeMfaUseCase.execute(dto, source)
  }

  @Post('mfa/challenges')
  @Public()
  @ApiOperation({ summary: 'Request one MFA factor challenge inside a terminal-scoped login flow' })
  @ApiBody({ type: RequestMfaFactorChallengeDto })
  @ApiResponse({ status: 200, type: OtpChallengeViewModel })
  async requestMfaFactorChallenge(
    @Body() dto: RequestMfaFactorChallengeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    return this.requestMfaFactorChallengeUseCase.execute(dto, source)
  }

  @Post('session/refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh a terminal-bound user session' })
  @ApiBody({ type: RefreshSessionDto })
  @ApiResponse({ status: 200, type: RefreshSessionViewModel })
  async refreshSession(
    @Body() dto: RefreshSessionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<RefreshSessionViewModel> {
    return this.refreshSessionUseCase.execute(dto, source)
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout the current terminal-bound authenticated session' })
  @ApiResponse({ status: 200, type: SessionMutationViewModel })
  async logout(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionMutationViewModel> {
    return this.sessionSelfServiceUseCase.logout(source)
  }

  @Get('session/context')
  @ApiOperation({ summary: 'Get the terminal-bound authenticated shell context' })
  @ApiResponse({ status: 200, type: SessionContextViewModel })
  async getSessionContext(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionContextViewModel> {
    return this.sessionContextUseCase.execute(source)
  }

  @Get('session/access-summary')
  @ApiOperation({ summary: 'Get the terminal-bound authenticated access summary' })
  @ApiResponse({ status: 200, type: SessionAccessSummaryViewModel })
  async getSessionAccessSummary(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionAccessSummaryViewModel> {
    return this.sessionAccessSummaryUseCase.execute(source)
  }

  @Get('session/contexts')
  @ApiOperation({ summary: 'List terminal-bound switchable account contexts' })
  @ApiResponse({ status: 200, type: SessionContextListViewModel })
  async listSessionContexts(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<SessionContextListViewModel> {
    return this.sessionContextsUseCase.execute(source)
  }

  @Post('session/switch-context')
  @ApiOperation({ summary: 'Switch account context inside the fixed terminal session' })
  @ApiBody({ type: SwitchContextDto })
  @ApiResponse({ status: 200, type: SwitchContextViewModel })
  async switchContext(
    @Body() dto: SwitchContextDto,
    @DownstreamSource() source: DownstreamRequestSource,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ): Promise<SwitchContextViewModel> {
    return this.switchContextUseCase.execute(
      dto,
      source,
      {
        userAgent,
        ipAddress
      },
      this.terminal
    )
  }
}

@ApiTags('pda-auth')
@Controller('pda/auth')
export class PdaAuthController extends TerminalAuthControllerBase {
  protected readonly terminal = 'PDA' as const

  constructor(
    loginUseCase: LoginUseCase,
    selectAccountUseCase: SelectAccountUseCase,
    completeMfaUseCase: CompleteMfaUseCase,
    requestMfaFactorChallengeUseCase: RequestMfaFactorChallengeUseCase,
    refreshSessionUseCase: RefreshSessionUseCase,
    sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    sessionContextUseCase: SessionContextUseCase,
    sessionContextsUseCase: SessionContextsUseCase,
    switchContextUseCase: SwitchContextUseCase,
    sessionSelfServiceUseCase: SessionSelfServiceUseCase
  ) {
    super(
      loginUseCase,
      selectAccountUseCase,
      completeMfaUseCase,
      requestMfaFactorChallengeUseCase,
      refreshSessionUseCase,
      sessionAccessSummaryUseCase,
      sessionContextUseCase,
      sessionContextsUseCase,
      switchContextUseCase,
      sessionSelfServiceUseCase
    )
  }

  @Post('account-selection')
  @Public()
  @ApiOperation({
    summary: 'PDA account selection is unavailable because PDA tenant is device-bound'
  })
  async selectAccount(
    @Body() _dto: SelectAccountDto,
    @DownstreamSource() _source: DownstreamRequestSource,
    @Headers('user-agent') _userAgent?: string,
    @Ip() _ipAddress?: string
  ): Promise<never> {
    throw new BadRequestException('PDA account selection is not available')
  }
}

@ApiTags('kiosk-auth')
@Controller('kiosk/auth')
export class KioskAuthController extends TerminalAuthControllerBase {
  protected readonly terminal = 'KIOSK' as const

  constructor(
    loginUseCase: LoginUseCase,
    selectAccountUseCase: SelectAccountUseCase,
    completeMfaUseCase: CompleteMfaUseCase,
    requestMfaFactorChallengeUseCase: RequestMfaFactorChallengeUseCase,
    refreshSessionUseCase: RefreshSessionUseCase,
    sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    sessionContextUseCase: SessionContextUseCase,
    sessionContextsUseCase: SessionContextsUseCase,
    switchContextUseCase: SwitchContextUseCase,
    sessionSelfServiceUseCase: SessionSelfServiceUseCase
  ) {
    super(
      loginUseCase,
      selectAccountUseCase,
      completeMfaUseCase,
      requestMfaFactorChallengeUseCase,
      refreshSessionUseCase,
      sessionAccessSummaryUseCase,
      sessionContextUseCase,
      sessionContextsUseCase,
      switchContextUseCase,
      sessionSelfServiceUseCase
    )
  }
}

@ApiTags('extension-auth')
@Controller('extension/auth')
export class ExtensionAuthController extends TerminalAuthControllerBase {
  protected readonly terminal = 'BROWSER_EXTENSION' as const

  constructor(
    loginUseCase: LoginUseCase,
    selectAccountUseCase: SelectAccountUseCase,
    completeMfaUseCase: CompleteMfaUseCase,
    requestMfaFactorChallengeUseCase: RequestMfaFactorChallengeUseCase,
    refreshSessionUseCase: RefreshSessionUseCase,
    sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    sessionContextUseCase: SessionContextUseCase,
    sessionContextsUseCase: SessionContextsUseCase,
    switchContextUseCase: SwitchContextUseCase,
    sessionSelfServiceUseCase: SessionSelfServiceUseCase
  ) {
    super(
      loginUseCase,
      selectAccountUseCase,
      completeMfaUseCase,
      requestMfaFactorChallengeUseCase,
      refreshSessionUseCase,
      sessionAccessSummaryUseCase,
      sessionContextUseCase,
      sessionContextsUseCase,
      switchContextUseCase,
      sessionSelfServiceUseCase
    )
  }
}
