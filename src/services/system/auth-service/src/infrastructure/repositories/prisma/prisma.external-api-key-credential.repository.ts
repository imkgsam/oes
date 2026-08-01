import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

/** Persists only non-recoverable Auth-owned external API-key verifier state. */
@Injectable()
export class PrismaExternalApiKeyCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) { return this.prisma.externalApiKeyCredential.findUnique({ where: { id } }) }
  async findByIdentifier(keyIdentifier: string) { return this.prisma.externalApiKeyCredential.findUnique({ where: { keyIdentifier } }) }
  async create(input: { id: string; integrationMachineId: string; tenantId: string; keyIdentifier: string; verifier: string; pepperVersion: string; expiresAt: Date }) {
    await this.prisma.externalApiKeyCredential.create({ data: input })
  }
  async revoke(id: string) { await this.prisma.externalApiKeyCredential.updateMany({ where: { id, status: 'ACTIVE' }, data: { status: 'REVOKED', revokedAt: new Date() } }) }
  /** Reads masked lifecycle records only within the caller's trusted tenant-machine boundary. */
  async listByMachine(integrationMachineId: string, tenantId: string) { return this.prisma.externalApiKeyCredential.findMany({ where: { integrationMachineId, tenantId }, orderBy: { createdAt: 'asc' } }) }
  /** Atomically permits one replacement only while fewer than two credentials remain usable. */
  async rotate(input: { predecessorId: string; replacement: { id: string; integrationMachineId: string; tenantId: string; keyIdentifier: string; verifier: string; pepperVersion: string; expiresAt: Date }; overlapUntil: Date }) {
    return this.prisma.$transaction(async (tx) => {
      const predecessor = await tx.externalApiKeyCredential.findUnique({ where: { id: input.predecessorId } })
      if (!predecessor || predecessor.status !== 'ACTIVE') throw new Error('EXTERNAL_API_KEY_INVALID')
      const usable = await tx.externalApiKeyCredential.count({ where: { integrationMachineId: predecessor.integrationMachineId, tenantId: predecessor.tenantId, status: 'ACTIVE', expiresAt: { gt: new Date() } } })
      if (usable >= 2) throw new Error('EXTERNAL_API_KEY_ROTATION_LIMIT')
      await tx.externalApiKeyCredential.create({ data: { ...input.replacement, supersedesCredentialId: predecessor.id, predecessorValidUntil: input.overlapUntil } })
      return predecessor
    })
  }
}
