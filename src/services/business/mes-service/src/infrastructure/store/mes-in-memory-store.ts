import {
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesLocationRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldInstallationRecord,
  MoldLifeCounterRecord,
  MoldMovementEventRecord,
  MoldUsageEventRecord,
  MoldWarningEventRecord,
  ProductionMoldInstanceRecord,
  ResourcePositionRecord,
  WorkCenterRecord
} from '../../domain/models/mes-mold-records'

/** MesInMemoryStore holds isolated MES mold records for L1 tests without crossing service boundaries. */
export class MesInMemoryStore {
  readonly moldDesigns = new Map<string, MoldDesignRecord>()
  readonly masterMolds = new Map<string, MasterMoldRecord>()
  readonly productionMoldInstances = new Map<string, ProductionMoldInstanceRecord>()
  readonly mesLocations = new Map<string, MesLocationRecord>()
  readonly workCenters = new Map<string, WorkCenterRecord>()
  readonly resourcePositions = new Map<string, ResourcePositionRecord>()
  readonly lifeCounters = new Map<string, MoldLifeCounterRecord>()
  readonly movementEvents: MoldMovementEventRecord[] = []
  readonly installations = new Map<string, MoldInstallationRecord>()
  readonly usageEvents: MoldUsageEventRecord[] = []
  readonly warningEvents: MoldWarningEventRecord[] = []
  readonly auditEnvelopes: MesAuditEnvelopeRecord[] = []
  readonly outboxEvents: MesOutboxEventRecord[] = []
  readonly commandIdempotencyRecords = new Map<string, MesCommandIdempotencyRecord>()
}
