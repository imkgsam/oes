import { Controller, Inject, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import {
  ExecutionTokenServiceController,
  ExecutionTokenServiceControllerMethods,
  ExchangeExecutionTokenRequest,
  ExchangeExecutionTokenResponse,
  GetExecutionTokenJwksRequest,
  GetExecutionTokenJwksResponse
} from '@oes/common/generated/auth_service'
import {
  ExecutionTokenExchangeContextPort,
  EXECUTION_TOKEN_EXCHANGE_CONTEXT
} from '../../application/ports/execution-token-exchange-context.port'
import { ExecutionTokenExchangeService } from '../../application/services/execution-token-exchange.service'
import { ExecutionTokenJwksService } from '../../application/services/execution-token-jwks.service'

/** Maps only frozen proto inputs while obtaining all principal and workload evidence from the verified runtime port. */
@Controller()
@ExecutionTokenServiceControllerMethods()
@UseInterceptors(GrpcRequestContextInterceptor)
export class ExecutionTokenGrpcController implements ExecutionTokenServiceController {
  constructor(
    private readonly exchangeService: ExecutionTokenExchangeService,
    private readonly jwksService: ExecutionTokenJwksService,
    @Inject(EXECUTION_TOKEN_EXCHANGE_CONTEXT)
    private readonly context: ExecutionTokenExchangeContextPort
  ) {}

  /** Exchanges one exact target/permission request using trusted context unavailable to request DTOs. */
  async exchangeExecutionToken(
    request: ExchangeExecutionTokenRequest,
    _metadata?: unknown,
    call?: unknown
  ): Promise<ExchangeExecutionTokenResponse> {
    const requestedPermissionCodes = request.requestedPermissionCodes ?? []
    const trusted = await this.context.resolve(call, {
      targetAudience: request.targetAudience,
      requestedPermissionCodes
    })
    const result = await this.exchangeService.exchange({
      targetAudience: request.targetAudience,
      requestedPermissionCodes,
      ...trusted
    })
    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresAtUnixSeconds: String(result.expiresAtUnixSeconds),
      expiresInSeconds: String(result.expiresInSeconds),
      kid: result.kid,
      grantedPermissionCodes: [...result.grantedPermissionCodes],
      grantedAudience: result.grantedAudience
    }
  }

  /** Returns the generated-proto JWKS response from the issuer-bound public publication service. */
  async getExecutionTokenJwks(
    _request: GetExecutionTokenJwksRequest
  ): Promise<GetExecutionTokenJwksResponse> {
    const result = (await this.jwksService.jwks()) as any
    return {
      issuer: result.issuer,
      maxAgeSeconds: result.maxAgeSeconds,
      unknownKidRefreshLimit: result.unknownKidRefreshLimit,
      keys: result.keys,
      rotations: result.rotations
    }
  }
}
