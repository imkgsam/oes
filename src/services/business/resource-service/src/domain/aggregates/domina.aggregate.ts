import { DomainRecord } from '../entities/domain-record.entity'

export class Domian {
  private records: DomainRecord[]
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly value: string,
    private isVerified: boolean = false,
    public readonly description?: string,
    records?: DomainRecord[]
  ) {
    if (records) this.records = records
  }
}
