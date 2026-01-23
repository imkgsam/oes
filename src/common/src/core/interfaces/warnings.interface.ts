export interface WarningConst {
  code: string
  message: string
  messageKey: string
  category: WarningCategory
  severity: WarningSeverity
  retriable?: boolean
  degraded?: boolean
}

type WarningSeverity = 'INFO' | 'WARN'
type WarningCategory = 'SYSTEM' | 'RUNTIME' | 'INTEGRATION' | 'SECURITY' | 'VALIDATION' | 'BUSINESS'
