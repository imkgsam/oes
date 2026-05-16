import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceVersionPolicyEntity } from '../../../domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { TerminalDeviceVersionPolicyRepository } from '../../../domain/repositories/terminal-device-version-policy.repository'

export interface UpsertVersionPolicyOperatorContext {
  operatorAccountId: string
  operatorOrgId?: string | null
  traceId?: string | null
}

export interface UpsertVersionPolicyCommandInput {
  tenantId: string
  terminalDeviceType: TerminalDeviceType
  minSupportedAppVersion: string
  latestAppVersion: string
  upgradeRequired: boolean
  upgradeRecommended: boolean
  apkDownloadUrl?: string | null
  releaseNotesUrl?: string | null
  reason?: string | null
  operatorContext: UpsertVersionPolicyOperatorContext
  now?: Date
}

// UpsertVersionPolicyCommand carries an administrator request to create or replace tenant PDA version policy.
export class UpsertVersionPolicyCommand implements ICommand {
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly minSupportedAppVersion: string
  readonly latestAppVersion: string
  readonly upgradeRequired: boolean
  readonly upgradeRecommended: boolean
  readonly apkDownloadUrl: string | null
  readonly releaseNotesUrl: string | null
  readonly reason: string | null
  readonly operatorContext: UpsertVersionPolicyOperatorContext
  readonly now?: Date

  // Constructs a version policy command with nullable URLs and audit reason normalized.
  constructor(input: UpsertVersionPolicyCommandInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceType = input.terminalDeviceType
    this.minSupportedAppVersion = input.minSupportedAppVersion
    this.latestAppVersion = input.latestAppVersion
    this.upgradeRequired = input.upgradeRequired
    this.upgradeRecommended = input.upgradeRecommended
    this.apkDownloadUrl = input.apkDownloadUrl ?? null
    this.releaseNotesUrl = input.releaseNotesUrl ?? null
    this.reason = input.reason?.trim() || null
    this.operatorContext = input.operatorContext
    this.now = input.now
  }
}

@Injectable()
@CommandHandler(UpsertVersionPolicyCommand)
// UpsertVersionPolicyHandler persists tenant terminal version policy and records the governance audit fact.
export class UpsertVersionPolicyHandler implements ICommandHandler<UpsertVersionPolicyCommand, TerminalDeviceVersionPolicyEntity> {
  constructor(
    @Inject(SYMBOLS.REPO.VERSION_POLICY)
    private readonly versionPolicyRepository: TerminalDeviceVersionPolicyRepository,
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository
  ) {}

  // Executes version policy upsert while preserving the original createdAt when policy already exists.
  async execute(command: UpsertVersionPolicyCommand): Promise<TerminalDeviceVersionPolicyEntity> {
    if (command.terminalDeviceType !== 'PDA') {
      throw new TerminalDeviceError('UNSUPPORTED_TERMINAL_DEVICE_TYPE', 'Only PDA version policy is supported in Phase 2')
    }

    const now = command.now ?? new Date()
    const existing = await this.versionPolicyRepository.findByTenantAndType(command.tenantId, command.terminalDeviceType)
    if (existing && !command.reason) {
      throw new TerminalDeviceError(
        'TERMINAL_DEVICE_VERSION_POLICY_REASON_REQUIRED',
        'Version policy update reason is required'
      )
    }

    const policy = await this.versionPolicyRepository.upsert(
      new TerminalDeviceVersionPolicyEntity({
        versionPolicyId: existing?.versionPolicyId ?? randomUUID(),
        tenantId: command.tenantId,
        terminalDeviceType: command.terminalDeviceType,
        minSupportedAppVersion: command.minSupportedAppVersion,
        latestAppVersion: command.latestAppVersion,
        upgradeRequired: command.upgradeRequired,
        upgradeRecommended: command.upgradeRecommended,
        apkDownloadUrl: command.apkDownloadUrl,
        releaseNotesUrl: command.releaseNotesUrl,
        updatedBy: command.operatorContext.operatorAccountId,
        updatedAt: now,
        createdAt: existing?.createdAt ?? now
      })
    )

    await this.auditEventRepository.create(
      new TerminalDeviceAuditEventEntity({
        auditEventId: randomUUID(),
        tenantId: command.tenantId,
        operatorAccountId: command.operatorContext.operatorAccountId,
        operatorOrgId: command.operatorContext.operatorOrgId ?? null,
        action: 'VERSION_POLICY_UPSERTED',
        targetTerminalDeviceId: `VERSION_POLICY:${command.terminalDeviceType}`,
        beforeJson: existing ? versionPolicyAuditJson(existing) : null,
        afterJson: versionPolicyAuditJson(policy),
        reason: command.reason,
        traceId: command.operatorContext.traceId ?? null,
        occurredAt: now
      })
    )

    return policy
  }
}

// versionPolicyAuditJson creates a compact audit payload for version policy changes.
function versionPolicyAuditJson(policy: TerminalDeviceVersionPolicyEntity): Record<string, unknown> {
  return {
    versionPolicyId: policy.versionPolicyId,
    terminalDeviceType: policy.terminalDeviceType,
    minSupportedAppVersion: policy.minSupportedAppVersion,
    latestAppVersion: policy.latestAppVersion,
    upgradeRequired: policy.upgradeRequired,
    upgradeRecommended: policy.upgradeRecommended
  }
}
