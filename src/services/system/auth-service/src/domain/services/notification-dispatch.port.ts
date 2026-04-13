export interface NotificationDispatchResult {
  accepted: boolean
  dispatchId?: string
  effectiveCode?: string
  rejectionReason?: string
}

export interface NotificationDispatchPort {
  sendAuthOtpEmail(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): Promise<NotificationDispatchResult>

  sendAuthOtpSms(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): Promise<NotificationDispatchResult>
}
