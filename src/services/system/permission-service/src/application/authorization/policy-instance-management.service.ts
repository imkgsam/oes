import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { SYMBOLS } from '../../common/constants/symbols'
import {
  PolicyTemplateInstanceManagementListQuery,
  PolicyTemplateInstanceManagementListResult,
  PolicyTemplateInstanceRepository
} from '../../domain/repositories/policy-template-instance.repository'
import { PolicyInstance, PolicyInstanceEffect, SubjectSelector } from './resource-policy'

export interface CreatePolicyInstanceInput {
  tenantId: string
  subjectSelector: SubjectSelector
  permissionCode: string
  resourceType?: string
  templateCode: string
  effect: PolicyInstanceEffect
  params: Record<string, unknown>
  enabled?: boolean
  priority?: number
  operatorId: string
}

export interface SetPolicyInstanceEnabledInput {
  id: string
  enabled: boolean
  operatorId: string
}

/** PolicyInstanceManagementService governs template-based PolicyInstance facts without exposing legacy AST mutation. */
@Injectable()
export class PolicyInstanceManagementService {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE)
    private readonly repository: PolicyTemplateInstanceRepository
  ) {}

  /** create persists one new PolicyInstance fact with operator attribution. */
  async create(input: CreatePolicyInstanceInput): Promise<PolicyInstance> {
    const now = new Date().toISOString()

    return this.repository.save({
      id: randomUUID(),
      tenantId: input.tenantId,
      subjectSelector: input.subjectSelector,
      permissionCode: input.permissionCode,
      resourceType: input.resourceType,
      templateCode: input.templateCode,
      effect: input.effect,
      params: input.params,
      enabled: input.enabled ?? true,
      priority: input.priority ?? 0,
      createdBy: input.operatorId,
      updatedBy: input.operatorId,
      createdAt: now,
      updatedAt: now
    })
  }

  /** getById loads one PolicyInstance without exposing legacy Policy AST semantics. */
  async getById(id: string): Promise<PolicyInstance> {
    const policyInstance = await this.repository.findById(id)

    if (!policyInstance) {
      throw new Error('POLICY_INSTANCE_NOT_FOUND')
    }

    return policyInstance
  }

  /** list returns paged PolicyInstance rows for management governance views. */
  async list(
    query: PolicyTemplateInstanceManagementListQuery
  ): Promise<PolicyTemplateInstanceManagementListResult> {
    return this.repository.listForManagement(query)
  }

  /** setEnabled toggles one PolicyInstance fact while preserving original creation attribution. */
  async setEnabled(input: SetPolicyInstanceEnabledInput): Promise<PolicyInstance> {
    const existing = await this.repository.findById(input.id)

    if (!existing) {
      throw new Error('POLICY_INSTANCE_NOT_FOUND')
    }

    return this.repository.save({
      ...existing,
      enabled: input.enabled,
      updatedBy: input.operatorId,
      updatedAt: new Date().toISOString()
    })
  }
}
