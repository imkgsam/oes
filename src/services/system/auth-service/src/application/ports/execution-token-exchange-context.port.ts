import { ExchangeExecutionTokenInput } from '../services/execution-token-exchange.service'

/** Supplies execution facts only from verified authorization and Common transport runtime, never from the proto body. */
export interface ExecutionTokenExchangeContextPort {
  resolve(call: unknown, request: Pick<ExchangeExecutionTokenInput, 'targetAudience' | 'requestedPermissionCodes'>): Promise<Omit<ExchangeExecutionTokenInput, 'targetAudience' | 'requestedPermissionCodes'>>
}

export const EXECUTION_TOKEN_EXCHANGE_CONTEXT = 'ExecutionTokenExchangeContext'
