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
  now?: Date | null
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
  readonly now: Date

  // Constructs a list query with conservative pagination defaults.
  constructor(input: ListTerminalDevicesQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceType = input.terminalDeviceType ?? null
    this.status = input.status ?? null
    this.presenceStatus = input.presenceStatus ?? null
    this.keyword = input.keyword?.trim() || null
    this.page = Math.max(1, input.page ?? 1)
    this.pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
    this.now = input.now ?? new Date()
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
        runtime: deriveRuntimePresence(
          await this.runtimeSnapshotRepository.findByTerminalDeviceId(device.terminalDeviceId),
          query.now
        )
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

const ONLINE_WINDOW_MS = 10 * 60 * 1000
const STALE_WINDOW_MS = 30 * 60 * 1000

// deriveRuntimePresence keeps heartbeat storage append-only while making management presence age-aware.
export function deriveRuntimePresence(
  runtime: TerminalDeviceRuntimeSnapshotEntity | null,
  now: Date
): TerminalDeviceRuntimeSnapshotEntity | null {
  if (!runtime) {
    return null
  }

  const ageMs = Math.max(0, now.getTime() - runtime.lastHeartbeatAt.getTime())
  const presenceStatus: PresenceStatus =
    ageMs <= ONLINE_WINDOW_MS
      ? 'ONLINE'
      : ageMs <= STALE_WINDOW_MS
        ? 'STALE'
        : 'OFFLINE'

  if (runtime.presenceStatus === presenceStatus) {
    return runtime
  }

  return new TerminalDeviceRuntimeSnapshotEntity({
    terminalDeviceId: runtime.terminalDeviceId,
    tenantId: runtime.tenantId,
    presenceStatus,
    lastHeartbeatAt: runtime.lastHeartbeatAt,
    lastClientTime: runtime.lastClientTime,
    appVersion: runtime.appVersion,
    androidVersion: runtime.androidVersion,
    webViewVersion: runtime.webViewVersion,
    networkStatus: runtime.networkStatus,
    networkType: runtime.networkType,
    batteryLevel: runtime.batteryLevel,
    appState: runtime.appState,
    lastReportedAccountId: runtime.lastReportedAccountId,
    lastReportedSessionId: runtime.lastReportedSessionId
  })
}
