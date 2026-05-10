import { ProductionSpecRecord } from '../../domain/models/production-spec-records'
import {
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldLifeCounterRecord,
  MoldMovementRecord,
  MoldUsageRecord,
  ProductionMoldRecord,
  ToolingInstallationRecord
} from '../../domain/models/mes-mold-records'

/** MesInMemoryStore holds isolated current MES records for repository tests without crossing service boundaries. */
export class MesInMemoryStore {
  readonly productionSpecs = new Map<string, ProductionSpecRecord>()
  readonly moldDesigns = new Map<string, MoldDesignRecord>()
  readonly masterMolds = new Map<string, MasterMoldRecord>()
  readonly productionMolds = new Map<string, ProductionMoldRecord>()
  readonly lifeCounters = new Map<string, MoldLifeCounterRecord>()
  readonly movements: MoldMovementRecord[] = []
  readonly toolingInstallations = new Map<string, ToolingInstallationRecord>()
  readonly usageRecords: MoldUsageRecord[] = []
  readonly auditEnvelopes: MesAuditEnvelopeRecord[] = []
  readonly outboxEvents: MesOutboxEventRecord[] = []
  readonly commandIdempotencyRecords = new Map<string, MesCommandIdempotencyRecord>()
}
