import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException
} from '@nestjs/common'
import type { Request } from 'express'

import type { SiteRuntimeStatusSnapshot } from '../runtime/site-runtime'
import { OesSiteRuntimeService } from './oes-site-runtime.service'

// OesSiteRuntimeHealthController exposes public liveness and readiness without secret-bearing details.
@Controller()
export class OesSiteRuntimeHealthController {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // live returns process liveness only for platform probes.
  @Get('/health/live')
  async live(): Promise<{ live: true }> {
    return this.runtimeService.getRuntime().health.live()
  }

  // ready returns traffic readiness without sync internals or credentials.
  @Get('/health/ready')
  async ready(): Promise<{ ready: boolean; status: string }> {
    return this.runtimeService.getRuntime().health.ready()
  }
}

// OesSiteRuntimeWebhookController receives OES publish notifications through the runtime verifier.
@Controller()
export class OesSiteRuntimeWebhookController {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // webhook accepts site.publish.available notifications and triggers runtime sync.
  @Post('/api/oes/webhook')
  @HttpCode(202)
  async webhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers() headers: Record<string, string | string[] | undefined>
  ): Promise<{ accepted: true; duplicate: boolean; eventId: string }> {
    if (!request.rawBody) {
      throw new UnauthorizedException('Missing raw webhook body')
    }
    return this.runtimeService.handleWebhook({
      method: request.method,
      url: localRuntimeUrl(request),
      headers,
      body: request.rawBody.toString('utf8')
    })
  }
}

// OesSiteRuntimeStatusController exposes protected detailed status for OES management polling.
@Controller()
export class OesSiteRuntimeStatusController {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // runtimeStatus returns protected runtime internals without credentials or stack traces.
  @Get('/api/oes/runtime-status')
  async runtimeStatus(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers() headers: Record<string, string | string[] | undefined>
  ): Promise<SiteRuntimeStatusSnapshot> {
    try {
      const runtime = this.runtimeService.getRuntime()
      await runtime.verifyRuntimeStatus({
        method: request.method,
        url: localRuntimeUrl(request),
        headers,
        body: request.rawBody?.toString('utf8') ?? ''
      })
      return runtime.getStatus()
    } catch {
      throw new UnauthorizedException()
    }
  }
}

// localRuntimeUrl builds the protected endpoint URL used by P1 runtime-side signature checks.
function localRuntimeUrl(request: Request): string {
  return `http://127.0.0.1${request.originalUrl || request.url}`
}
