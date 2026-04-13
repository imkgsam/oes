import { SendEmailHandler } from './send-email.handler';
import { SendSmsHandler } from './send-sms.handler';
export * from './send-email.command';
export * from './send-sms.command';
export declare const NotificationCommandHandlers: (typeof SendEmailHandler | typeof SendSmsHandler)[];
