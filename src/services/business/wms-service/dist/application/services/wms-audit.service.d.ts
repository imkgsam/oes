import { WmsAuditContext, WmsOperatorContext, WmsTraceContext } from '../../domain/models/wms-records';
import { WmsAuditWriter } from '../ports/wms-audit-writer.port';
import { WmsTransactionRunner } from '../ports/wms-transaction-runner.port';
export interface RecordWmsCommandAuditInput {
    tenantId: string;
    operatorContext: WmsOperatorContext;
    traceContext: WmsTraceContext;
    auditContext: WmsAuditContext;
    commandName: string;
    resourceType: string;
    targetId: string | null;
    requestSummary: Record<string, unknown>;
}
/** WmsAuditService records one local audit envelope around each WMS management command execution. */
export declare class WmsAuditService {
    private readonly transactionRunner;
    private readonly writer;
    constructor(transactionRunner: WmsTransactionRunner, writer: WmsAuditWriter);
    /** recordCommand persists success, rejection, and failure envelopes for the WMS management surface. */
    recordCommand<T>(input: RecordWmsCommandAuditInput, execute: () => Promise<T>): Promise<T>;
    /** buildEnvelope translates explicit WMS request contexts into the shared audit envelope shape. */
    private buildEnvelope;
}
