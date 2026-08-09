export type SiteMediaBindingStatus = 'LOCAL_ONLY' | 'REMOTE_CONFIGURING' | 'REMOTE_READY' | 'MIGRATING' | 'REMOTE_ACTIVE'

/** SiteMediaDeliveryBinding owns the one-way Site delivery state machine. */
export class SiteMediaDeliveryBinding {
  constructor(readonly tenantId: string, readonly siteId: string, private status: SiteMediaBindingStatus = 'LOCAL_ONLY') {}
  get deliveryStatus(): SiteMediaBindingStatus { return this.status }
  transition(next: SiteMediaBindingStatus): void {
    const order: SiteMediaBindingStatus[] = ['LOCAL_ONLY', 'REMOTE_CONFIGURING', 'REMOTE_READY', 'MIGRATING', 'REMOTE_ACTIVE']
    if (order.indexOf(next) < order.indexOf(this.status)) throw new Error('ASSET_REMOTE_DELIVERY_IRREVERSIBLE')
    this.status = next
  }
}
