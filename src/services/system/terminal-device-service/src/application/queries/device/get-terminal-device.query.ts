import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'
import { deriveRuntimePresence } from './list-terminal-devices.query'

export interface GetTerminalDeviceQueryInput {
  tenantId: string
  terminalDeviceId: string
  includeSensitiveIdentity?: boolean | null
  now?: Date | null
}

export interface GetTerminalDeviceResult {
  device: TerminalDeviceEntity
  runtime: TerminalDeviceRuntimeSnapshotEntity | null
  includeSensitiveIdentity: boolean
}

// GetTerminalDeviceQuery carries a tenant-scoped management detail read request.
export class GetTerminalDeviceQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly includeSensitiveIdentity: boolean
  readonly now: Date

  // Constructs a detail query with sensitive identity excluded by default.
  constructor(input: GetTerminalDeviceQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
    this.includeSensitiveIdentity = input.includeSensitiveIdentity ?? false
    this.now = input.now ?? new Date()
  }
}

@Injectable()
@QueryHandler(GetTerminalDeviceQuery)
// GetTerminalDeviceHandler loads one tenant-owned device detail and current runtime snapshot.
export class GetTerminalDeviceHandler implements IQueryHandler<GetTerminalDeviceQuery, GetTerminalDeviceResult> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository
  ) {}

  // Executes a tenant-scoped detail read and rejects cross-tenant lookups.
  async execute(query: GetTerminalDeviceQuery): Promise<GetTerminalDeviceResult> {
    const device = await this.terminalDeviceRepository.findById(query.terminalDeviceId)
    if (!device || device.tenantId !== query.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    return {
      device,
      runtime: deriveRuntimePresence(
        await this.runtimeSnapshotRepository.findByTerminalDeviceId(device.terminalDeviceId),
        query.now
      ),
      includeSensitiveIdentity: query.includeSensitiveIdentity
    }
  }
}
