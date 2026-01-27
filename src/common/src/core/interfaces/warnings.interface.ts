export interface WarningConst {
  subCode: string
  message: string
  messageKey: string
  category: WarningCategory
  severity: WarningSeverity
}

export interface WarningDescriptor {
  code: string
  message: string
  messageKey: string
  category: WarningCategory
  severity: WarningSeverity
  details?: any
}

type WarningSeverity = 'INFO' | 'WARN'
export type WarningCategory = 'INTEGRATION' | 'VALIDATION' | 'BUSINESS'
