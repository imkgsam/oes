import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { buildAuditEnvelope } from '@oes/common'
import { captureEventTraceContext } from '@oes/common/tracing'
import { AccountContactAssetEntity } from '../../domain/entities/account-contact-asset.entity'
import { ApiKeyEntity } from '../../domain/entities/api-key.entity'
import { ServiceAccountEntity } from '../../domain/entities/service-account.entity'
import {
  IdentityAuditEvent,
  IdentityAuditEventType,
  IdentityAuditModule,
  IdentityAuditOperator,
  IdentityAuditResource,
  IdentityAuditResult,
  IdentityAuditScope
} from '../events/identity-audit.event'

/**
 * IdentityAuditService emits identity-domain audit envelopes for management, machine, and contact actions.
 */
@Injectable()
export class IdentityAuditService {
  static readonly EVENT_NAME = 'identity.audit'

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * emitContactAssetEvent records contact-asset mutations as identity audit events.
   */
  emitContactAssetEvent(
    type:
      | 'ACCOUNT_WORK_EMAIL_ASSIGNED'
      | 'ACCOUNT_WORK_PHONE_ASSIGNED'
      | 'ACCOUNT_WORK_EMAIL_REVOKED'
      | 'ACCOUNT_WORK_PHONE_REVOKED'
      | 'ACCOUNT_WORK_EMAIL_STATUS_CHANGED'
      | 'ACCOUNT_WORK_PHONE_STATUS_CHANGED'
      | 'ACCOUNT_PRIMARY_WORK_EMAIL_CHANGED'
      | 'ACCOUNT_PRIMARY_WORK_PHONE_CHANGED',
    asset: AccountContactAssetEntity,
    operatorId: string
  ): void {
    this.emit(type, 'contact', {
      operator: this.humanOperator(operatorId),
      scope: {
        tenantId: asset.tenantId,
        orgId: null
      },
      resource: {
        resourceType: 'account_contact_asset',
        resourceId: asset.id
      },
      details: {
        accountId: asset.accountId,
      assetType: asset.type,
      assetValue: asset.value,
      assetStatus: asset.status,
      isPrimary: asset.isPrimary
      }
    })
  }

  /**
   * emitServiceAccountEvent records service-account lifecycle changes as identity audit events.
   */
  emitServiceAccountEvent(
    type: 'SERVICE_ACCOUNT_CREATED' | 'SERVICE_ACCOUNT_STATUS_CHANGED',
    account: ServiceAccountEntity,
    operatorId: string
  ): void {
    this.emit(type, 'machine', {
      operator: this.humanOperator(operatorId),
      scope: {
        tenantId: account.tenantId,
        orgId: null
      },
      resource: {
        resourceType: 'service_account',
        resourceId: account.id
      },
      details: {
        serviceAccountId: account.id,
        scopeLevel: account.scopeLevel,
        accountType: account.type,
        name: account.name,
        status: account.status
      }
    })
  }

  /**
   * emitApiKeyEvent records API key management actions as identity audit events.
   */
  emitApiKeyEvent(
    type: 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'API_KEY_ROTATED',
    apiKey: ApiKeyEntity,
    operatorId: string
  ): void {
    this.emit(type, 'machine', {
      operator: this.humanOperator(operatorId),
      scope: {
        tenantId: null,
        orgId: null
      },
      resource: {
        resourceType: 'api_key',
        resourceId: apiKey.id
      },
      details: {
        apiKeyId: apiKey.id,
        serviceAccountId: apiKey.serviceAccountId,
        keyCode: apiKey.keyCode,
        status: apiKey.status
      }
    })
  }

  /**
   * emitApiKeyAuthenticated records successful API key authentication activity for machine identities.
   */
  emitApiKeyAuthenticated(apiKey: ApiKeyEntity, account: ServiceAccountEntity): void {
    this.emit('API_KEY_AUTHENTICATED', 'machine', {
      operator: {
        operatorId: null,
        operatorType: 'SYSTEM'
      },
      scope: {
        tenantId: account.tenantId,
        orgId: null
      },
      resource: {
        resourceType: 'api_key',
        resourceId: apiKey.id
      },
      details: {
        apiKeyId: apiKey.id,
        serviceAccountId: apiKey.serviceAccountId,
        keyCode: apiKey.keyCode,
        serviceAccountStatus: account.status,
        serviceAccountType: account.type,
        scopeLevel: account.scopeLevel
      }
    })
  }

  /**
   * emitEnvelope exposes a generic audit emit path for controller-level failure or rejection handling.
   */
  emitEnvelope(
    type: IdentityAuditEventType,
    module: IdentityAuditModule,
    payload: {
      operator: IdentityAuditOperator
      scope: IdentityAuditScope
      resource: IdentityAuditResource
      details: Record<string, unknown>
      result?: IdentityAuditResult
    }
  ): void {
    this.emit(type, module, payload)
  }

  /**
   * emit builds a standard audit envelope and dispatches it through the local event emitter.
   */
  private emit(
    type: IdentityAuditEventType,
    module: IdentityAuditModule,
    payload: {
      operator: IdentityAuditOperator
      scope: IdentityAuditScope
      resource: IdentityAuditResource
      details: Record<string, unknown>
      result?: IdentityAuditResult
    }
  ): void {
    this.eventEmitter.emit(
      IdentityAuditService.EVENT_NAME,
      new IdentityAuditEvent(
        ...(() => {
          const traceContext = captureEventTraceContext()
          const envelope = buildAuditEnvelope({
            eventId: randomUUID(),
            service: 'identity-service',
            module,
            eventType: type,
            result: payload.result ?? 'SUCCEEDED',
            operator: payload.operator,
            scope: payload.scope,
            trace: {
              traceId: traceContext.traceId
            },
            resource: payload.resource,
            details: payload.details
          })

          return [
            envelope.eventId,
            envelope.module,
            envelope.eventType,
            envelope.occurredAt,
            envelope.result,
            envelope.operator,
            envelope.scope,
            envelope.trace,
            envelope.resource,
            envelope.details
          ] as const
        })()
      )
    )
  }

  /**
   * humanOperator builds the standard audit operator payload for user-driven management actions.
   */
  private humanOperator(operatorId: string): IdentityAuditOperator {
    return {
      operatorId,
      operatorType: 'HUMAN'
    }
  }
}
