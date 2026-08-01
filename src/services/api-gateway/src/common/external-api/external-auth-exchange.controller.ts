import { Body, Controller, Headers, Post, Query, Req, Res } from '@nestjs/common'

/** Handles the sole disabled-by-default external API-key exchange entry shape without logging credentials. */
@Controller('external/auth')
export class ExternalAuthExchangeController {
  constructor(private readonly auth: { exchangeExternalApiKey(input: { presentedApiKey: string }): Promise<any> }) {}
  @Post('exchange')
  async exchange(@Headers() headers: Record<string, string>, @Body() body: unknown, @Query() query: Record<string, unknown>, @Req() request: any) {
    const authorization = headers.authorization ?? headers.Authorization
    if (Object.keys(query).length || request.cookies?.authorization || !authorization || !/^ApiKey oek_live_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization) || body && Object.keys(body as object).length) throw new Error('EXTERNAL_API_AUTHENTICATION_FAILED')
    try { const result = await this.auth.exchangeExternalApiKey({ presentedApiKey: authorization.slice(7) }); return { access_token: result.accessToken, token_type: result.tokenType, expires_in: result.expiresInSeconds } } catch { throw new Error('EXTERNAL_API_AUTHENTICATION_FAILED') }
  }
}
