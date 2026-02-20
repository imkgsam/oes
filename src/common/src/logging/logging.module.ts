// File: src/common/src/logging/logging.module.ts

import { Global, Module, DynamicModule } from '@nestjs/common'
import { AppLogger } from './app-logger.service'
import { PinoOtelLoggerOptions } from './pino-otel.logger'

/**
 * Token for injecting logger options.
 */
export const LOGGER_OPTIONS = Symbol('LOGGER_OPTIONS')

/**
 * Global logging module providing AppLogger throughout the application.
 *
 * @example Basic usage (uses environment variables for configuration)
 * ```typescript
 * @Module({
 *   imports: [LoggingModule]
 * })
 * export class AppModule {}
 * ```
 *
 * @example With custom configuration
 * ```typescript
 * @Module({
 *   imports: [
 *     LoggingModule.forRoot({
 *       serviceName: 'api-gateway',
 *       level: 'debug'
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * @example Using as NestJS application logger
 * ```typescript
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule, { bufferLogs: true })
 *   app.useLogger(app.get(AppLogger))
 *   await app.listen(3000)
 * }
 * ```
 */
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
        {
          provide: AppLogger,
          useFactory: () => new AppLogger(options)
        }
      ],
      exports: [AppLogger]
    }
  }
}
