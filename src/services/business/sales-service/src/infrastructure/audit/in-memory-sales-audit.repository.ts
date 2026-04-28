import { Injectable } from '@nestjs/common'
import { AuditEnvelope } from '@oes/common'
import { SalesAuditWriter } from '../../application/ports/sales-audit-writer.port'
import { SalesInMemoryStore } from '../store/sales-in-memory-store'

/** InMemorySalesAuditRepository keeps local command audit envelopes inside the phase 1 process-local skeleton store. */
@Injectable()
export class InMemorySalesAuditRepository implements SalesAuditWriter {
  constructor(private readonly store: SalesInMemoryStore) {}

  async append(envelope: AuditEnvelope): Promise<void> {
    this.store.auditEnvelopes.push(structuredClone(envelope))
  }
}
