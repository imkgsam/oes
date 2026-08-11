/** Protects delivery-only secrets so they never enter ordinary dispatch, audit, or logging records. */
export interface NotificationDeliveryPayloadProtector {
  protect(payload: Record<string, unknown>, expiresAt: Date): string
  unprotect(ciphertext: string, now: Date): Record<string, unknown>
}
