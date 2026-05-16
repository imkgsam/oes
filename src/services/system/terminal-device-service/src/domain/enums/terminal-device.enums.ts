export type TerminalDeviceType = 'PDA' | 'KIOSK' | 'INDUSTRIAL_TABLET' | 'SHARED_MOBILE_TERMINAL'

export type TerminalDeviceStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'DISABLED' | 'LOST' | 'MAINTENANCE' | 'DECOMMISSIONED'

export type EnrollmentStatus = 'ISSUED' | 'USED' | 'EXPIRED' | 'REVOKED'

export type PresenceStatus = 'ONLINE' | 'STALE' | 'OFFLINE' | 'UNKNOWN'

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN'

export type NetworkType = 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'NONE' | 'UNKNOWN'

export type AppState = 'FOREGROUND' | 'BACKGROUND' | 'CLOSED' | 'UNKNOWN'
