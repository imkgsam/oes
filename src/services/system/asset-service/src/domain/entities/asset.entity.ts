export type AssetCategory = 'ACCOUNT_AVATAR' | 'EMPLOYEE_OFFICIAL_PHOTO'
export type AssetScopeLevel = 'SYSTEM' | 'TENANT'
export type AssetStatus = 'ACTIVE' | 'DELETED' | 'PENDING_BIND' | 'REPLACED'

export interface AssetProps {
  id: string
  scopeLevel: AssetScopeLevel
  tenantId: null | string
  ownerAccountId: null | string
  ownerEmployeeId: null | string
  category: AssetCategory
  storageKey: string
  mimeType: string
  size: bigint
  checksum: string
  publicUrl: string
  status: AssetStatus
  createdBy: string
  updatedBy: null | string
  createdAt: Date
  updatedAt: Date
}

// AssetEntity represents one controlled file asset owned by the asset-service lifecycle.
export class AssetEntity {
  readonly id: string
  readonly scopeLevel: AssetScopeLevel
  readonly tenantId: null | string
  readonly ownerAccountId: null | string
  readonly ownerEmployeeId: null | string
  readonly category: AssetCategory
  readonly storageKey: string
  readonly mimeType: string
  readonly size: bigint
  readonly checksum: string
  readonly publicUrl: string
  readonly status: AssetStatus
  readonly createdBy: string
  readonly updatedBy: null | string
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: AssetProps) {
    this.id = props.id
    this.scopeLevel = props.scopeLevel
    this.tenantId = props.tenantId
    this.ownerAccountId = props.ownerAccountId
    this.ownerEmployeeId = props.ownerEmployeeId
    this.category = props.category
    this.storageKey = props.storageKey
    this.mimeType = props.mimeType
    this.size = props.size
    this.checksum = props.checksum
    this.publicUrl = props.publicUrl
    this.status = props.status
    this.createdBy = props.createdBy
    this.updatedBy = props.updatedBy
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }
}
