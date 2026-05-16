import { RpcException } from '@nestjs/microservices'
import {
  AuthNextStep,
  AuthResponseViewModel,
  AuthResultStatus,
  RefreshSessionViewModel
} from '../../interfaces/http/view-models/auth-response.view-model'

const AUTH_TERMINAL_ACCESS_DENIED = 'AUTH_TERMINAL_ACCESS_DENIED'
const TERMINAL_ACCESS_DENIED = 'TERMINAL_ACCESS_DENIED'

// Converts downstream terminal policy refusals into stable auth-bff denial payloads.
export function toTerminalAccessDeniedAuthResponse(
  error: unknown
): AuthResponseViewModel | null {
  const denial = extractTerminalAccessDenial(error)
  if (!denial) {
    return null
  }

  return {
    status: AuthResultStatus.DENIED,
    nextStep: AuthNextStep.NONE,
    session: null,
    operator: null,
    challenge: null,
    accountOptions: [],
    passwordSetupRequired: false,
    reasonCode: TERMINAL_ACCESS_DENIED,
    message: denial.message,
    terminal: denial.terminal,
    allowedTerminals: denial.allowedTerminals
  }
}

// Converts downstream terminal policy refresh refusals into stable refresh denial payloads.
export function toTerminalAccessDeniedRefreshResponse(
  error: unknown
): RefreshSessionViewModel | null {
  const denial = extractTerminalAccessDenial(error)
  if (!denial) {
    return null
  }

  return {
    sessionId: '',
    accessToken: '',
    refreshToken: '',
    expiresIn: 0,
    terminal: denial.terminal,
    allowedTerminals: denial.allowedTerminals,
    reasonCode: TERMINAL_ACCESS_DENIED,
    message: denial.message
  }
}

function extractTerminalAccessDenial(error: unknown): {
  allowedTerminals: string[]
  message: string
  terminal?: string
} | null {
  if (!(error instanceof RpcException)) {
    return null
  }

  const payload = error.getError()
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as {
    code?: unknown
    details?: {
      allowedTerminals?: unknown
      effectiveAllowedTerminals?: unknown
      reasonCode?: unknown
      terminal?: unknown
    }
    message?: unknown
  }
  const reasonCode = normalize(candidate.details?.reasonCode)

  if (candidate.code !== AUTH_TERMINAL_ACCESS_DENIED && reasonCode !== TERMINAL_ACCESS_DENIED) {
    return null
  }

  return {
    allowedTerminals: normalizeStringArray(
      candidate.details?.allowedTerminals ?? candidate.details?.effectiveAllowedTerminals
    ),
    message: typeof candidate.message === 'string' && candidate.message.trim()
      ? candidate.message.trim()
      : 'Terminal access denied',
    terminal: normalize(candidate.details?.terminal)
  }
}

function normalize(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => normalize(item)).filter(Boolean) as string[]
}
