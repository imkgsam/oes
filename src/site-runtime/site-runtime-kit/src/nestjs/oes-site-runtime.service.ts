import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

import type { SiteRuntime, WebhookHandleInput, WebhookHandleResult } from '../runtime/site-runtime'
import { OES_SITE_RUNTIME } from './tokens'

// OesSiteRuntimeService is the NestJS injectable facade for site business code.
@Injectable()
export class OesSiteRuntimeService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(OES_SITE_RUNTIME) private readonly runtime: SiteRuntime) {}

  // onModuleInit starts the runtime store and pull fallback when the Nest app boots.
  async onModuleInit(): Promise<void> {
    await this.runtime.start()
  }

  // onModuleDestroy gracefully stops timers and closes the local store.
  async onModuleDestroy(): Promise<void> {
    await this.runtime.stop()
  }

  // getRuntime returns the underlying runtime for advanced server-side integration.
  getRuntime(): SiteRuntime {
    return this.runtime
  }

  // handleWebhook delegates signed webhook verification and sync triggering to the runtime kernel.
  async handleWebhook(input: WebhookHandleInput): Promise<WebhookHandleResult> {
    return this.runtime.handleWebhook(input)
  }
}
