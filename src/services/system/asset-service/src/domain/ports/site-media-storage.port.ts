import type { Readable } from 'node:stream'

/** SiteMediaStoragePort streams verified bytes to object storage without accepting an in-memory payload. */
export interface SiteMediaStoragePort {
  put(input: { key: string; body: Readable | AsyncIterable<Uint8Array>; size: number; checksum: string; contentType: string }): Promise<{ checksum: string; size: number }>
}
