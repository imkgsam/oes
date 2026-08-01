import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

/** Persists only non-recoverable Auth-owned external API-key verifier state. */
@Injectable()
export class PrismaExternalApiKeyCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByIdentifier(keyIdentifier: string) { return this.prisma.externalApiKeyCredential.findUnique({ where: { keyIdentifier } }) }
  async create(input: { id: string; integrationMachineId: string; tenantId: string; keyIdentifier: string; verifier: string; pepperVersion: string; expiresAt: Date }) {
    await this.prisma.externalApiKeyCredential.create({ data: input })
  }
  async revoke(id: string) { await this.prisma.externalApiKeyCredential.updateMany({ where: { id, status: 'ACTIVE' }, data: { status: 'REVOKED', revokedAt: new Date() } }) }
}
