import { LogMeta } from './oes-logger.interface';
declare const REDACTED = "[REDACTED]";
export declare function sanitizeLogMeta(meta?: LogMeta): Record<string, unknown>;
export { REDACTED };
