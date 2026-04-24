import { MfaType } from '../../common/constants'

export type ManagedMfaScenario =
  | 'LOGIN'
  | 'NEW_DEVICE_LOGIN'
  | 'CHANGE_PASSWORD'
  | 'CHANGE_CONTACT'
export type ManagedMfaFactor = MfaType.EMAIL_OTP | MfaType.SMS_OTP | MfaType.TOTP | MfaType.BACKUP_CODE
export type ManagedMfaScenarioRequirementSnapshot = Record<ManagedMfaScenario, boolean>

export interface ManagedMfaFactorPolicySnapshot {
  enabled: boolean
  factor: ManagedMfaFactor
  priority: number
  updatedAt?: Date
  updatedBy?: null | string
}

export const DEFAULT_MANAGED_MFA_FACTORS: ManagedMfaFactor[] = [
  MfaType.EMAIL_OTP,
  MfaType.SMS_OTP,
  MfaType.TOTP,
  MfaType.BACKUP_CODE
]

export const DEFAULT_MANAGED_MFA_SCENARIO_REQUIREMENTS: ManagedMfaScenarioRequirementSnapshot = {
  LOGIN: false,
  NEW_DEVICE_LOGIN: false,
  CHANGE_PASSWORD: false,
  CHANGE_CONTACT: false
}
