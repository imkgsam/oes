import { Injectable } from '@nestjs/common'
import { PageResult, QuoteVersionListInput, QuoteVersionRecord, cloneRecord } from '../../../domain/models/sales-records'
import { QuoteVersionRepository } from '../../../domain/repositories/quote-version.repository'
import { paginate } from '../../../application/support/sales-assertions'
import { SalesInMemoryStore } from '../../store/sales-in-memory-store'

/** InMemoryQuoteVersionRepository stores immutable quote versions in the process-local phase 1 skeleton store. */
@Injectable()
export class InMemoryQuoteVersionRepository implements QuoteVersionRepository {
  constructor(private readonly store: SalesInMemoryStore) {}

  async nextVersionNo(tenantId: string, quoteId: string): Promise<number> {
    return (
      [...this.store.quoteVersions.values()].filter(
        (quoteVersion) => quoteVersion.tenantId === tenantId && quoteVersion.quoteId === quoteId
      ).length + 1
    )
  }

  async findById(tenantId: string, quoteVersionId: string): Promise<QuoteVersionRecord | null> {
    const quoteVersion = this.store.quoteVersions.get(quoteVersionId)
    if (!quoteVersion || quoteVersion.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(quoteVersion)
  }

  async save(quoteVersion: QuoteVersionRecord): Promise<QuoteVersionRecord> {
    const stored = cloneRecord(quoteVersion)
    this.store.quoteVersions.set(stored.id, stored)
    return cloneRecord(stored)
  }

  async listByQuoteId(input: QuoteVersionListInput): Promise<PageResult<QuoteVersionRecord>> {
    const filtered = [...this.store.quoteVersions.values()]
      .filter((quoteVersion) => quoteVersion.tenantId === input.tenantId && quoteVersion.quoteId === input.quoteId)
      .sort((left, right) => left.versionNo - right.versionNo)
      .map((quoteVersion) => cloneRecord(quoteVersion))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }
}
