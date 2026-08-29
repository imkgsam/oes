import { SetMetadata } from '@nestjs/common'
import { GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY } from '../constants'
import {
  TRUSTED_SESSION_TERMINALS,
  type TrustedSessionTerminal
} from '../trusted-execution/trusted-execution-context'

export type GatewayRouteSessionTerminalsMetadata = readonly TrustedSessionTerminal[]

/** Declares the exact authenticated session terminals admitted by one protected Gateway route. */
export const AdmitGatewaySessionTerminals = (
  first: TrustedSessionTerminal,
  ...rest: TrustedSessionTerminal[]
) =>
  SetMetadata(
    GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY,
    normalizeGatewaySessionTerminals([first, ...rest])
  )

/** Normalizes one non-empty exact terminal declaration and rejects duplicates or unknown values. */
function normalizeGatewaySessionTerminals(
  terminals: readonly TrustedSessionTerminal[]
): GatewayRouteSessionTerminalsMetadata {
  if (
    terminals.length === 0 ||
    terminals.some((terminal) => !TRUSTED_SESSION_TERMINALS.includes(terminal)) ||
    new Set(terminals).size !== terminals.length
  ) {
    throw new Error('Gateway route session terminals must be unique canonical values')
  }
  return Object.freeze([...terminals])
}
