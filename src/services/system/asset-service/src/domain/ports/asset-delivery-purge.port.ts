/** AssetDeliveryPurgePort represents precise immutable URL purge acknowledgement. */
export interface AssetDeliveryPurgePort { purge(input: { url: string }): Promise<{ acknowledged: boolean; providerRequestId?: string }> }
