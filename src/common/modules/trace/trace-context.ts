
import { AsyncLocalStorage } from 'async_hooks'

interface TraceStore {
  traceId: string
}

export const traceStorage = new AsyncLocalStorage<TraceStore>()

export function setTraceId(traceId: string) {
  traceStorage.enterWith({ traceId })
}

export function getTraceId(): string | undefined {
  return traceStorage.getStore()?.traceId
}
