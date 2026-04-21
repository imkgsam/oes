export interface NotificationDispatchResult {
  accepted: boolean
  dispatchId?: string
  effectiveCode?: string
  rejectionReason?: string
}

export interface NotificationDispatchPort {
  sendAccountInvitationEmail(input: {
    accountId: string
    displayName?: string
    email?: string
    recipient: string
  }): Promise<NotificationDispatchResult>

  sendAccountInvitationSms(input: {
    accountId: string
    displayName?: string
    phone?: string
    recipient: string
  }): Promise<NotificationDispatchResult>

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
