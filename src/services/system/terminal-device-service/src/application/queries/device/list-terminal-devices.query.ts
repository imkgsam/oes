import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { PresenceStatus, TerminalDeviceStatus, TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'

export interface ListTerminalDevicesQueryInput {
  tenantId: string
  terminalDeviceType?: TerminalDeviceType | null
  status?: TerminalDeviceStatus | null
  presenceStatus?: PresenceStatus | null
  keyword?: string | null
  page?: number | null
  pageSize?: number | null
}

export interface TerminalDeviceSummaryProjection {
  device: TerminalDeviceEntity
  runtime: TerminalDeviceRuntimeSnapshotEntity | null
}

export interface ListTerminalDevicesResult {
  items: TerminalDeviceSummaryProjection[]
  page: number
  pageSize: number
  total: number
}

// ListTerminalDevicesQuery carries management filters for tenant-owned terminal device summaries.
export class ListTerminalDevicesQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType | null
  readonly status: TerminalDeviceStatus | null
  readonly presenceStatus: PresenceStatus | null
  readonly keyword: string | null
  readonly page: number
  readonly pageSize: number

  // Constructs a list query with conservative pagination defaults.
  constructor(input: ListTerminalDevicesQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceType = input.terminalDeviceType ?? null
    this.status = input.status ?? null
    this.presenceStatus = input.presenceStatus ?? null
    this.keyword = input.keyword?.trim() || null
    this.page = Math.max(1, input.page ?? 1)
    this.pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  }
}

@Injectable()
@QueryHandler(ListTerminalDevicesQuery)
// ListTerminalDevicesHandler builds read projections from device registry records and runtime snapshots.
export class ListTerminalDevicesHandler implements IQueryHandler<ListTerminalDevicesQuery, ListTerminalDevicesResult> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository
  ) {}

  // Executes the filtered tenant device listing without applying lifecycle governance rules.
  async execute(query: ListTerminalDevicesQuery): Promise<ListTerminalDevicesResult> {
    const allDevices = await this.terminalDeviceRepository.listByTenant(query.tenantId)
    const projections = await Promise.all(
      allDevices.map(async (device) => ({
        device,
        runtime: await this.runtimeSnapshotRepository.findByTerminalDeviceId(device.terminalDeviceId)
      }))
    )
    const filtered = projections.filter((projection) => matchesQuery(projection, query))
    const start = (query.page - 1) * query.pageSize

    return {
      items: filtered.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length
    }
  }
}

// matchesQuery evaluates management list filters against one device projection.
function matchesQuery(projection: TerminalDeviceSummaryProjection, query: ListTerminalDevicesQuery): boolean {
  if (query.terminalDeviceType && projection.device.terminalDeviceType !== query.terminalDeviceType) {
    return false
  }
  if (query.status && projection.device.status !== query.status) {
    return false
  }
  if (query.presenceStatus && (projection.runtime?.presenceStatus ?? 'UNKNOWN') !== query.presenceStatus) {
    return false
  }
  if (!query.keyword) {
    return true
  }

  const keyword = query.keyword.toLowerCase()
  return [
    projection.device.terminalDeviceId,
    projection.device.displayName,
    projection.device.manufacturer,
    projection.device.model,
    projection.device.enrollmentId
  ].some((value) => value?.toLowerCase().includes(keyword))
}
