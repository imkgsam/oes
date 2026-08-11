import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceHeartbeatRecordEntity } from '../../../domain/entities/terminal-device-heartbeat-record.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import { AppState, NetworkStatus, NetworkType, TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'
import { DeviceAccessDecision, DeviceAccessDecisionService } from '../../services/device-access-decision.service'
import { TerminalDeviceCredentialVerifierService } from '../../services/terminal-device-credential-verifier.service'

export interface RecordHeartbeatSessionInput {
  accountId?: string | null
  sessionId?: string | null
}

export interface RecordHeartbeatResult {
  snapshot: TerminalDeviceRuntimeSnapshotEntity
  decision: DeviceAccessDecision
  rotatedDeviceCredential: string | null
  deviceCredentialExpiresAt: Date | null
  deviceCredentialVersion: number | null
}

export interface RecordHeartbeatCommandInput {
  terminalDeviceId: string
  terminalDeviceType: TerminalDeviceType
  appVersion?: string | null
  androidVersion?: string | null
  webViewVersion?: string | null
  networkStatus: NetworkStatus
  networkType: NetworkType
  batteryLevel?: number | null
  appState: AppState
  lastClientTime?: Date | null
  session?: RecordHeartbeatSessionInput | null
  traceId?: string | null
  receivedAt?: Date
}

// RecordHeartbeatCommand carries PDA runtime diagnostics received by the service boundary.
export class RecordHeartbeatCommand implements ICommand {
  readonly terminalDeviceId: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly appVersion: string | null
  readonly androidVersion: string | null
  readonly webViewVersion: string | null
  readonly networkStatus: NetworkStatus
  readonly networkType: NetworkType
  readonly batteryLevel: number | null
  readonly appState: AppState
  readonly lastClientTime: Date | null
  readonly session: RecordHeartbeatSessionInput | null
  readonly traceId: string | null
  readonly receivedAt?: Date

  // Constructs a heartbeat command with nullable runtime diagnostics normalized.
  constructor(input: RecordHeartbeatCommandInput) {
    this.terminalDeviceId = input.terminalDeviceId
    this.terminalDeviceType = input.terminalDeviceType
    this.appVersion = input.appVersion ?? null
    this.androidVersion = input.androidVersion ?? null
    this.webViewVersion = input.webViewVersion ?? null
    this.networkStatus = input.networkStatus
    this.networkType = input.networkType
    this.batteryLevel = input.batteryLevel ?? null
    this.appState = input.appState
    this.lastClientTime = input.lastClientTime ?? null
    this.session = input.session ?? null
    this.traceId = input.traceId ?? null
    this.receivedAt = input.receivedAt
  }
}

@Injectable()
@CommandHandler(RecordHeartbeatCommand)
// RecordHeartbeatHandler stores diagnostic runtime state without mutating lifecycle status.
export class RecordHeartbeatHandler implements ICommandHandler<RecordHeartbeatCommand, RecordHeartbeatResult> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository,
    private readonly deviceAccessDecisionService: DeviceAccessDecisionService,
    private readonly credentialVerifier = new TerminalDeviceCredentialVerifierService()
  ) {}

  // Executes heartbeat recording with server receive time as the authoritative heartbeat timestamp.
  async execute(command: RecordHeartbeatCommand): Promise<RecordHeartbeatResult> {
    const receivedAt = command.receivedAt ?? new Date()
    const device = await this.terminalDeviceRepository.findById(command.terminalDeviceId)
    if (!device) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    const rotation = this.credentialVerifier.rotate(device, receivedAt)
    let effectiveDevice = device
    let rotatedDeviceCredential: string | null = null
    if (rotation.issued) {
      const committed = await this.terminalDeviceRepository.compareAndSwapCredential(device, rotation.device)
      if (committed) {
        effectiveDevice = committed
        rotatedDeviceCredential = rotation.issued.credential
      } else {
        const persisted = await this.terminalDeviceRepository.findById(command.terminalDeviceId)
        if (!persisted) {
          throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
        }
        effectiveDevice = persisted
      }
    }
    const snapshot = await this.runtimeSnapshotRepository.upsert(
      new TerminalDeviceRuntimeSnapshotEntity({
        terminalDeviceId: effectiveDevice.terminalDeviceId,
        tenantId: effectiveDevice.tenantId,
        presenceStatus: 'ONLINE',
        lastHeartbeatAt: receivedAt,
        lastClientTime: command.lastClientTime,
        appVersion: command.appVersion,
        androidVersion: command.androidVersion,
        webViewVersion: command.webViewVersion,
        networkStatus: command.networkStatus,
        networkType: command.networkType,
        batteryLevel: command.batteryLevel,
        appState: command.appState,
        lastReportedAccountId: command.session?.accountId ?? null,
        lastReportedSessionId: command.session?.sessionId ?? null
      })
    )
    await this.runtimeSnapshotRepository.appendHeartbeatRecord(
      new TerminalDeviceHeartbeatRecordEntity({
        heartbeatId: randomUUID(),
        terminalDeviceId: effectiveDevice.terminalDeviceId,
        tenantId: effectiveDevice.tenantId,
        presenceStatus: 'ONLINE',
        receivedAt,
        clientTime: command.lastClientTime,
        appVersion: command.appVersion,
        androidVersion: command.androidVersion,
        webViewVersion: command.webViewVersion,
        networkStatus: command.networkStatus,
        networkType: command.networkType,
        batteryLevel: command.batteryLevel,
        appState: command.appState,
        reportedAccountId: command.session?.accountId ?? null,
        reportedSessionId: command.session?.sessionId ?? null,
        traceId: command.traceId
      })
    )

    const decision = await this.deviceAccessDecisionService.resolve({
      tenantId: effectiveDevice.tenantId,
      terminalDeviceId: effectiveDevice.terminalDeviceId,
      terminalDeviceType: command.terminalDeviceType,
      requestPurpose: 'HEARTBEAT',
      appVersion: command.appVersion,
      now: receivedAt
    })

    return {
      snapshot,
      decision,
      rotatedDeviceCredential,
      deviceCredentialExpiresAt: effectiveDevice.deviceCredentialExpiresAt,
      deviceCredentialVersion: effectiveDevice.deviceCredentialVersion
    }
  }
}
