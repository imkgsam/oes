import { AuditEnvelope } from '@oes/common';
import { GrpcRequestContextStore } from '@oes/common/authorization';
import { ItemMasterAuditWriter } from '../ports/item-master-audit-writer.port';
import { ItemMasterTransactionRunner } from '../ports/item-master-transaction-runner.port';
export interface RecordCommandAuditInput {
    tenantId: string;
    commandName: string;
    targetId: string | null;
    requestSummary: Record<string, unknown>;
}
/** ItemMasterAuditService records the local phase 1 command audit envelope around management execution. */
export declare class ItemMasterAuditService {
    private readonly requestContextStore;
    private readonly transactionRunner;
    private readonly writer;
    constructor(requestContextStore: GrpcRequestContextStore, transactionRunner: ItemMasterTransactionRunner, writer: ItemMasterAuditWriter);
    /** recordCommand wraps one management callback and persists a success, rejection, or failure envelope. */
    recordCommand<T>(input: RecordCommandAuditInput, execute: () => Promise<T>): Promise<T>;
    /** buildEnvelope translates the current gRPC request context into the shared audit shape. */
    private buildEnvelope;
}
/** toFlatAuditLogRecord exposes a debug-friendly audit shape for infrastructure logging. */
export declare function toFlatAuditLogRecord(envelope: AuditEnvelope): Record<string, unknown>;
