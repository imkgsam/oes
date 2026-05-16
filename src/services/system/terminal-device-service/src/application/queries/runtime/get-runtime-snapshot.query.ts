import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'

export interface GetRuntimeSnapshotQueryInput {
  tenantId: string
  terminalDeviceId: string
}

// GetRuntimeSnapshotQuery carries a tenant-scoped request for the latest runtime diagnostics.
export class GetRuntimeSnapshotQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceId: string

  // Constructs a runtime snapshot query for one managed terminal device.
  constructor(input: GetRuntimeSnapshotQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
  }
}

@Injectable()
@QueryHandler(GetRuntimeSnapshotQuery)
// GetRuntimeSnapshotHandler loads the current runtime snapshot after verifying device tenant ownership.
export class GetRuntimeSnapshotHandler implements IQueryHandler<GetRuntimeSnapshotQuery, TerminalDeviceRuntimeSnapshotEntity | null> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository
  ) {}

  // Executes a tenant-scoped current runtime snapshot lookup.
  async execute(query: GetRuntimeSnapshotQuery): Promise<TerminalDeviceRuntimeSnapshotEntity | null> {
    const device = await this.terminalDeviceRepository.findById(query.terminalDeviceId)
    if (!device || device.tenantId !== query.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    return this.runtimeSnapshotRepository.findByTerminalDeviceId(query.terminalDeviceId)
  }
}
