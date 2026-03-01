// File: src/common/src/logging/logging.module.ts

import { Global, Module, DynamicModule } from '@nestjs/common'
import { AppLogger } from './app-logger.service'
import { PinoOtelLoggerOptions } from './pino-otel.logger'
import { LOGGER_OPTIONS } from './logging.constants'

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger]
})
export class LoggingModule {
  /**
   * Configure the logging module with custom options.
   *
   * @param options - Logger configuration options
   * @returns Dynamic module with configured AppLogger
   */
  static forRoot(options: Partial<PinoOtelLoggerOptions>): DynamicModule {
    return {
      module: LoggingModule,
      providers: [
        {
          provide: LOGGER_OPTIONS,
          useValue: options
        },
        AppLogger
      ],
      exports: [AppLogger]
    }
  }
}
