import { RecordType } from 'prisma/generated/prisma'
import { DomainRecord as PrismaDomainRecord } from 'prisma/generated/prisma'

export class DomainRecord {
  constructor(
    public readonly id: string,
    public readonly domainId: string,
    public readonly type: RecordType,
    public readonly name: string,
    public readonly value: string,
    private verified: boolean = false,
    public readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    public readonly ttl: number = 600,
    public readonly required: boolean = false,
    public readonly priority?: number
  ) {}

  isVerified(): boolean {
    return this.verified
  }
  markVerified(): void {
    this.verified = true
    this.updatedAt = new Date()
  }

  static fromPrisma(prismaDomainRecord: PrismaDomainRecord): DomainRecord {
    return new DomainRecord(
      prismaDomainRecord.id,
      prismaDomainRecord.domainId,
      prismaDomainRecord.type,
      prismaDomainRecord.name,
      prismaDomainRecord.value,
      prismaDomainRecord.verified,
      prismaDomainRecord.createdAt,
      prismaDomainRecord.updatedAt,
      prismaDomainRecord.ttl,
      prismaDomainRecord.required,
      prismaDomainRecord.priority
    )
  }
}
