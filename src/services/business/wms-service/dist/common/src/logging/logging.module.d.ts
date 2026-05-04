import { DynamicModule } from '@nestjs/common';
import { PinoOtelLoggerOptions } from './pino-otel.logger';
export declare class LoggingModule {
    /**
     * Configure the logging module with custom options.
     *
     * @param options - Logger configuration options
     * @returns Dynamic module with configured AppLogger
     */
    static forRoot(options: Partial<PinoOtelLoggerOptions>): DynamicModule;
}
