import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../prisma/prisma.service'
import type {
  ExternalApiKeyVerifierCompromiseResult,
  ExternalApiKeyVerifierCompromiseStore
} from '../../../application/services/external-api-key-verifier-compromise.service'

type StoredIncident = {
  incidentReference: string
  verifierKeyVersion: string
  occurredAt: Date
  processedAt: Date
  stateRevision: string
  matchedCredentialCount: number
  newlyRevokedCredentialCount: number
  alreadyRevokedCredentialCount: number
}

/** Persists the Auth-owned verifier-version compromise fact, credential revocations, and safe audit records atomically. */
@Injectable()
export class PrismaExternalApiKeyVerifierCompromiseRepository implements ExternalApiKeyVerifierCompromiseStore {
  constructor(private readonly prisma: PrismaService) {}

  /** Records one exact verifier-version compromise or returns the stored result for an exact replay. */
  async record(input: {
    verifierKeyVersion: string
    incidentReference: string
    occurredAt: Date
    processedAt: Date
    stateRevision: string
    workloadSubject: string
    workloadClientId: string
    requestId?: string
    traceId?: string
  }): Promise<ExternalApiKeyVerifierCompromiseResult> {
    const prisma = this.prisma as unknown as {
      $transaction<T>(work: (tx: any) => Promise<T>): Promise<T>
    }
    try {
      return await prisma.$transaction(async (tx) => {
        const exactByReference = await tx.externalApiKeyVerifierCompromiseIncident.findUnique({
          where: { incidentReference: input.incidentReference }
        })
        if (exactByReference) {
          return this.resolveExistingIncidentOrThrow(exactByReference, input)
        }
        const exactByVersion = await tx.externalApiKeyVerifierCompromiseIncident.findUnique({
          where: { verifierKeyVersion: input.verifierKeyVersion }
        })
        if (exactByVersion) {
          return this.resolveExistingIncidentOrThrow(exactByVersion, input)
        }

        const lockedCredentials = (await tx.$queryRaw`
          SELECT "id", "integrationMachineId", "tenantId", "status", "revokedAt"
          FROM "ExternalApiKeyCredential"
          WHERE "verifierKeyVersion" = ${input.verifierKeyVersion}
          FOR UPDATE
        `) as Array<{
          id: string
          integrationMachineId: string
          tenantId: string
          status: string
          revokedAt: Date | null
        }>

        const alreadyRevoked = lockedCredentials.filter(
          (credential) => credential.status === 'REVOKED'
        )
        const newlyRevoked = lockedCredentials.filter(
          (credential) => credential.status !== 'REVOKED'
        )
        if (newlyRevoked.length > 0) {
          await tx.externalApiKeyCredential.updateMany({
            where: { id: { in: newlyRevoked.map((credential) => credential.id) } },
            data: { status: 'REVOKED', revokedAt: input.processedAt }
          })
        }

        const incident = await tx.externalApiKeyVerifierCompromiseIncident.create({
          data: {
            incidentReference: input.incidentReference,
            verifierKeyVersion: input.verifierKeyVersion,
            occurredAt: input.occurredAt,
            processedAt: input.processedAt,
            stateRevision: input.stateRevision,
            workloadSubject: input.workloadSubject,
            workloadClientId: input.workloadClientId,
            requestId: input.requestId ?? null,
            traceId: input.traceId ?? null,
            matchedCredentialCount: lockedCredentials.length,
            newlyRevokedCredentialCount: newlyRevoked.length,
            alreadyRevokedCredentialCount: alreadyRevoked.length
          }
        })

        for (const credential of newlyRevoked) {
          await tx.auditEvent.create({
            data: {
              id: randomUUID(),
              service: 'auth-service',
              module: 'external-api-key',
              eventType: 'EXTERNAL_API_KEY_REVOKED_BY_VERIFIER_COMPROMISE',
              occurredAt: input.processedAt,
              result: 'SUCCEEDED',
              operatorId: null,
              operatorType: 'SYSTEM',
              tenantId: credential.tenantId,
              orgId: null,
              traceId: input.traceId ?? null,
              resourceType: 'external_api_key_credential',
              resourceId: credential.id,
              details: {
                reasonCategory: 'VERIFIER_VERSION_COMPROMISE',
                incidentReference: input.incidentReference,
                verifierKeyVersion: input.verifierKeyVersion,
                revokedAt: input.processedAt.toISOString(),
                credentialId: credential.id,
                integrationMachineId: credential.integrationMachineId,
                tenantId: credential.tenantId,
                traceId: input.traceId ?? null,
                workloadSubject: input.workloadSubject,
                workloadClientId: input.workloadClientId,
                requestId: input.requestId ?? null
              }
            }
          })
        }

        await tx.auditEvent.create({
          data: {
            id: randomUUID(),
            service: 'auth-service',
            module: 'external-api-key',
            eventType: 'EXTERNAL_API_KEY_VERIFIER_VERSION_COMPROMISE_COMPLETED',
            occurredAt: input.processedAt,
            result: 'SUCCEEDED',
            operatorId: null,
            operatorType: 'SYSTEM',
            tenantId: null,
            orgId: null,
            traceId: input.traceId ?? null,
            resourceType: 'external_api_key_verifier_compromise_incident',
            resourceId: incident.incidentReference,
            details: {
              verifierKeyVersion: input.verifierKeyVersion,
              incidentReference: input.incidentReference,
              stateRevision: input.stateRevision,
              evidenceOccurredAt: input.occurredAt.toISOString(),
              processedAt: input.processedAt.toISOString(),
              matchedCredentialCount: lockedCredentials.length,
              newlyRevokedCredentialCount: newlyRevoked.length,
              alreadyRevokedCredentialCount: alreadyRevoked.length,
              workloadSubject: input.workloadSubject,
              workloadClientId: input.workloadClientId,
              traceId: input.traceId ?? null,
              requestId: input.requestId ?? null
            }
          }
        })

        return toCompromiseResult(incident)
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
      const persistedIncidentClient = this.prisma as any
      const exactByReference =
        await persistedIncidentClient.externalApiKeyVerifierCompromiseIncident.findUnique({
          where: { incidentReference: input.incidentReference }
        })
      if (exactByReference) {
        return this.resolveExistingIncidentOrThrow(exactByReference, input)
      }
      const exactByVersion =
        await persistedIncidentClient.externalApiKeyVerifierCompromiseIncident.findUnique({
          where: { verifierKeyVersion: input.verifierKeyVersion }
        })
      if (exactByVersion) {
        return this.resolveExistingIncidentOrThrow(exactByVersion, input)
      }
      throw error
    }
  }

  /** Resolves one stored incident as an exact replay or rejects any conflicting reuse of its unique keys. */
  private resolveExistingIncidentOrThrow(
    incident: StoredIncident,
    input: {
      verifierKeyVersion: string
      incidentReference: string
      occurredAt: Date
      stateRevision: string
    }
  ): ExternalApiKeyVerifierCompromiseResult {
    if (
      incident.incidentReference !== input.incidentReference ||
      incident.verifierKeyVersion !== input.verifierKeyVersion ||
      incident.occurredAt.getTime() !== input.occurredAt.getTime() ||
      incident.stateRevision !== input.stateRevision
    ) {
      throw new Error('EXTERNAL_API_KEY_VERIFIER_COMPROMISE_CONFLICT')
    }
    return toCompromiseResult(incident)
  }
}

/** Detects Prisma unique-constraint failures without binding the repository to generated client types. */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

/** Maps the stored incident completion fact to the safe gRPC/Auth application result. */
function toCompromiseResult(incident: StoredIncident): ExternalApiKeyVerifierCompromiseResult {
  return {
    incidentReference: incident.incidentReference,
    matchedCredentialCount: incident.matchedCredentialCount,
    newlyRevokedCredentialCount: incident.newlyRevokedCredentialCount,
    alreadyRevokedCredentialCount: incident.alreadyRevokedCredentialCount,
    completedAt: incident.processedAt
  }
}
