export interface LoginMethodView {
  methodId: string
  userId: string
  type: string
  identifier: string
  maskedIdentifier: string
  verified: boolean
  enabled: boolean
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginMethodListView {
  loginMethods: LoginMethodView[]
  passwordSetupRequired: boolean
}

export interface PasswordRecoveryChannelOptionView {
  channel: 'EMAIL' | 'PHONE'
  maskedDestination: string
}

export interface PasswordRecoveryChannelInspectionView {
  channels: PasswordRecoveryChannelOptionView[]
  defaultChannel?: 'EMAIL' | 'PHONE'
}
