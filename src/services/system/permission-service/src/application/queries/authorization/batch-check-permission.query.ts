import { IQuery } from '@nestjs/cqrs'

export interface BatchCheckPermissionItemInput {
  requestId?: string
  accountId: string
  permissionCode: string
  tenantId?: string
}

export interface BatchAuthorizationDecisionItemResult {
  requestId?: string
  allowed: boolean
  evaluationMode: 'RBAC'
  matchedPolicy?: string
  reason?: string
  explainCode?: string
}

export class BatchCheckPermissionQuery implements IQuery {
  readonly items: BatchCheckPermissionItemInput[]

  constructor(items: BatchCheckPermissionItemInput[]) {
    this.items = items
  }
}
