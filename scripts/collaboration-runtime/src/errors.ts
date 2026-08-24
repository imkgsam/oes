/** Carries a stable runtime failure code without hiding the original cause. */
export class RuntimeContractError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(`${code}: ${message}`)
    this.name = 'RuntimeContractError'
    this.code = code
  }
}

/** Fails a runtime guard with a stable code. */
export function fail(code: string, message: string): never {
  throw new RuntimeContractError(code, message)
}
