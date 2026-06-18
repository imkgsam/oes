export interface NonceReplayStore {
  remember(input: {
    siteId: string
    credentialId: string
    nonce: string
    now: Date
    ttlMilliseconds: number
  }): Promise<boolean>
}

/** InMemoryNonceReplayStore provides deterministic replay protection for tests and local adapters. */
export class InMemoryNonceReplayStore implements NonceReplayStore {
  private readonly entries = new Map<string, number>()

  /** remember stores one nonce until its TTL expires and returns false for replays. */
  async remember(input: {
    siteId: string
    credentialId: string
    nonce: string
    now: Date
    ttlMilliseconds: number
  }): Promise<boolean> {
    const nowMs = input.now.getTime()
    this.pruneExpired(nowMs)
    const key = `${input.siteId}:${input.credentialId}:${input.nonce}`

    if (this.entries.has(key)) {
      return false
    }

    this.entries.set(key, nowMs + input.ttlMilliseconds)
    return true
  }

  /** pruneExpired removes nonce records that are outside the replay window. */
  private pruneExpired(nowMs: number): void {
    for (const [key, expiresAt] of this.entries.entries()) {
      if (expiresAt <= nowMs) {
        this.entries.delete(key)
      }
    }
  }
}
