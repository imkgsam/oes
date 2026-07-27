import { DynamicModule, Module, Provider } from '@nestjs/common'

import { createSiteRuntimeFromEnv, type RuntimeEnvOverrides } from '../runtime/site-runtime'
import type { SiteCapabilityManifest } from '../types'
import {
  OesSiteRuntimeHealthController,
  OesSiteRuntimeStatusController,
  OesSiteRuntimeWebhookController
} from './oes-site-runtime.controllers'
import { OesSiteRuntimeService } from './oes-site-runtime.service'
import { OES_SITE_RUNTIME, OES_SITE_RUNTIME_MODULE_OPTIONS } from './tokens'

export interface OesSiteRuntimeModuleOptions {
  controllers?: boolean
  capabilityManifest?: SiteCapabilityManifest
  pullIntervalMs?: number
  runtimeOverrides?: RuntimeEnvOverrides
  now?: () => number
}

// OesSiteRuntimeModule wires the runtime kernel into a NestJS site backend.
@Module({})
export class OesSiteRuntimeModule {
  // forRootFromEnv creates the runtime from process env and registers default controllers.
  static forRootFromEnv(options: OesSiteRuntimeModuleOptions = {}): DynamicModule {
    const runtimeProvider: Provider = {
      provide: OES_SITE_RUNTIME,
      useFactory: async () =>
        createSiteRuntimeFromEnv(process.env, {
          ...(options.runtimeOverrides ?? {}),
          capabilityManifest:
            options.capabilityManifest ?? options.runtimeOverrides?.capabilityManifest,
          pullIntervalMs: options.pullIntervalMs ?? options.runtimeOverrides?.pullIntervalMs,
          now: options.now ?? options.runtimeOverrides?.now
        })
    }

    return {
      module: OesSiteRuntimeModule,
      providers: [
        { provide: OES_SITE_RUNTIME_MODULE_OPTIONS, useValue: options },
        runtimeProvider,
        OesSiteRuntimeService
      ],
      controllers:
        options.controllers === false
          ? []
          : [
              OesSiteRuntimeHealthController,
              OesSiteRuntimeWebhookController,
              OesSiteRuntimeStatusController
            ],
      exports: [OesSiteRuntimeService, OES_SITE_RUNTIME]
    }
  }
}
