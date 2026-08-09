import { S3CompatibleSiteMediaStorageAdaptor } from './s3-compatible-site-media-storage.adaptor'

/** CloudflareR2SiteMediaStorageAdaptor selects only the managed R2 profile and never exposes origin URLs. */
export class CloudflareR2SiteMediaStorageAdaptor extends S3CompatibleSiteMediaStorageAdaptor {
  override async put(input: { key: string; body: Buffer; contentType: string }) {
    if (process.env.SITE_MEDIA_PROVIDER_PROFILE !== 'oes-managed-cloudflare') throw new Error('SITE_MEDIA_R2_PROFILE_REQUIRED')
    return super.put(input)
  }
}
