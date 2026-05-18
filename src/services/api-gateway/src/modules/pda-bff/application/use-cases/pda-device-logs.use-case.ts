import { Injectable } from '@nestjs/common'
import { InMemoryPdaDeviceDiagnosticLogStore } from '../../infrastructure/in-memory-pda-device-diagnostic-log.store'
import { PdaTerminalDeviceAdapter } from '../../infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter'
import { PdaDeviceLogsDto, PdaDiagnosticLogEntryDto } from '../../interfaces/http/dtos/pda-device.dto'
import { PdaDeviceLogsViewModel } from '../../interfaces/http/view-models/pda-device.view-model'

const REDACTED_VALUE = '[REDACTED]'
const REDACTED_SCAN_VALUE = '[REDACTED_DIAGNOSTIC_MODE_REQUIRED]'
const SENSITIVE_KEY_PATTERN = /(authorization|credential|password|secret|token)/i

@Injectable()
// Accepts manually uploaded PDA diagnostics while enforcing Phase 1 redaction boundaries.
export class PdaDeviceLogsUseCase {
  constructor(
    private readonly store: InMemoryPdaDeviceDiagnosticLogStore,
    private readonly terminalDeviceAdapter: PdaTerminalDeviceAdapter
  ) {}

  async execute(dto: PdaDeviceLogsDto): Promise<PdaDeviceLogsViewModel> {
    const serverTime = new Date().toISOString()
    const records = dto.logs.map((log) => this.toRecord(dto, log, serverTime))
    const terminalDeviceId = dto.device.terminalDeviceId?.trim() || 'unbound-pda'
    const decision = await this.terminalDeviceAdapter.resolveDeviceAccessDecision({
      tenantId: normalizeNullable(dto.session?.tenantId ?? undefined),
      terminalDeviceId,
      requestPurpose: 'DIAGNOSTIC_LOG',
      device: dto.device,
      session: dto.session
        ? {
            accountId: normalizeNullable(dto.session.accountId),
            sessionId: normalizeNullable(dto.session.sessionId)
          }
        : null
    })

    this.store.saveBatch(terminalDeviceId, records)
    const tenantId = decision.resolvedTenantId ?? normalizeNullable(dto.session?.tenantId ?? undefined)
    if (tenantId && terminalDeviceId !== 'unbound-pda') {
      await this.terminalDeviceAdapter.recordDiagnosticLogs({
        tenantId,
        terminalDeviceId,
        records: records.map((record) => ({
          ...record,
          tenantId
        }))
      })
    }

    return {
      accepted: true,
      receivedCount: records.length,
      decision,
      serverTime
    }
  }

  private toRecord(dto: PdaDeviceLogsDto, log: PdaDiagnosticLogEntryDto, receivedAt: string) {
    return {
      deviceId: dto.device.terminalDeviceId ?? 'unbound-pda',
      idSource: 'TERMINAL_DEVICE_ID',
      accountId: normalizeNullable(dto.session?.accountId),
      tenantId: normalizeNullable(dto.session?.tenantId ?? undefined),
      sessionId: normalizeNullable(dto.session?.sessionId),
      clientTime: log.clientTime,
      receivedAt,
      level: log.level,
      eventType: log.eventType,
      message: log.message,
      traceId: normalizeNullable(log.traceId),
      requestId: normalizeNullable(log.requestId),
      errorCode: normalizeNullable(log.errorCode),
      diagnosticMode: log.diagnosticMode,
      details: sanitizeDetails(log.details ?? {}, log.diagnosticMode) as Record<string, unknown>
    }
  }
}

function sanitizeDetails(value: unknown, diagnosticMode: boolean, key = ''): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED_VALUE
  }

  if (key === 'scanValue' && !diagnosticMode) {
    return REDACTED_SCAN_VALUE
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDetails(item, diagnosticMode))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeDetails(entryValue, diagnosticMode, entryKey)
    ])
  )
}

function normalizeNullable(value?: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
