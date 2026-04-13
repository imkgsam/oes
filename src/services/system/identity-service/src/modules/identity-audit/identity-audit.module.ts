import { Module } from '@nestjs/common'
import { IdentityAuditService } from '../../application/services/identity-audit.service'
import { IdentityAuditListener } from '../../infrastructure/listeners/identity-audit.listener'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaIdentityAuditRepository } from '../../infrastructure/repositories/prisma/prisma.identity-audit.repository'

@Module({
  imports: [PrismaModule],
  providers: [IdentityAuditService, IdentityAuditListener, PrismaIdentityAuditRepository],
  exports: [IdentityAuditService]
})
export class IdentityAuditModule {}
