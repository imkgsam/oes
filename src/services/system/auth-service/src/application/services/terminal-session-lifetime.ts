import { ITokenConfig } from '@oes/common/auth'

export interface TerminalSessionLifetime {
  accessTokenValidity: number
  refreshTokenValidity: number
}

const DEFAULT_WEB_ACCESS_TOKEN_SECONDS = 900
const DEFAULT_WEB_REFRESH_TOKEN_SECONDS = 604800
const DEFAULT_PDA_ACCESS_TOKEN_SECONDS = 900
const DEFAULT_PDA_REFRESH_TOKEN_SECONDS = 1200

/** Resolves token lifetimes for terminal-aware sessions without moving session ownership out of auth-service. */
export function resolveTerminalSessionLifetime(
  terminal: string | undefined,
  config: Pick<ITokenConfig, 'accessTokenValidity' | 'refreshTokenValidity'> | undefined
): TerminalSessionLifetime {
  const normalizedTerminal = String(terminal || 'WEB').trim().toUpperCase()
  if (normalizedTerminal === 'PDA') {
    return {
      accessTokenValidity: readPositiveIntegerEnv(
        'PDA_ACCESS_TOKEN_VALIDITY_SEC',
        DEFAULT_PDA_ACCESS_TOKEN_SECONDS
      ),
      refreshTokenValidity: readPositiveIntegerEnv(
        'PDA_REFRESH_TOKEN_VALIDITY_SEC',
        DEFAULT_PDA_REFRESH_TOKEN_SECONDS
      )
    }
  }

  return {
    accessTokenValidity: config?.accessTokenValidity || DEFAULT_WEB_ACCESS_TOKEN_SECONDS,
    refreshTokenValidity: config?.refreshTokenValidity || DEFAULT_WEB_REFRESH_TOKEN_SECONDS
  }
}

/** Reads a positive integer env override while preserving safe production defaults for invalid values. */
function readPositiveIntegerEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
