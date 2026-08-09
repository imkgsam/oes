/** SiteMediaStoragePort hides object-origin writes from the Asset domain. */
export interface SiteMediaStoragePort { put(input: { key: string; body: Buffer; contentType: string }): Promise<{ checksum: string; size: number }> }
