import { AssetDeliveryPurgePort } from '../../../domain/ports/asset-delivery-purge.port'

/** CloudflareSiteMediaDeliveryPurgeAdaptor performs one immutable-file purge and fails closed on every ambiguity. */
export class CloudflareSiteMediaDeliveryPurgeAdaptor implements AssetDeliveryPurgePort {
  async purge(input: { url: string }): Promise<{ acknowledged: boolean; providerRequestId?: string }> {
    if (process.env.SITE_MEDIA_PROVIDER_PROFILE !== 'oes-managed-cloudflare') throw new Error('SITE_MEDIA_R2_PROFILE_REQUIRED')
    const zone = process.env.CLOUDFLARE_ZONE_ID?.trim(); const token = process.env.CLOUDFLARE_API_TOKEN?.trim(); const host = process.env.SITE_MEDIA_ALLOWED_HOST?.trim()
    if (!zone || !token || !host) throw new Error('CLOUDFLARE_PURGE_CONFIGURATION_REQUIRED')
    const target = new URL(input.url)
    if (target.protocol !== 'https:' || target.hostname !== host || target.search || target.hash || !target.pathname.startsWith('/v1/site-media/')) throw new Error('CLOUDFLARE_PURGE_TARGET_INVALID')
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zone)}/purge_cache`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ files: [target.toString()] }) })
    if (!response.ok) throw new Error('CLOUDFLARE_PURGE_FAILED')
    const payload = await response.json() as { success?: boolean; result?: { id?: string } }
    if (payload.success !== true) throw new Error('CLOUDFLARE_PURGE_UNCONFIRMED')
    return { acknowledged: true, ...(payload.result?.id ? { providerRequestId: payload.result.id } : {}) }
  }
}
