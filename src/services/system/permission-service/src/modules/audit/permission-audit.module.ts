import { Module } from '@nestjs/common'
import { PermissionAuditService } from '../../application/services/permission-audit.service'
import { SYMBOLS } from '../../common/constants/symbols'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PermissionAuditListener } from '../../infrastructure/listeners/permission-audit.listener'
import { PrismaPermissionAuditRepository } from '../../infrastructure/repositories/prisma/prisma.permission-audit.repository'

@Module({
  imports: [PrismaModule],
  providers: [
    PermissionAuditService,
    PermissionAuditListener,
    PrismaPermissionAuditRepository,
    {
      provide: SYMBOLS.REPO.AUDIT_EVENT,
      useExisting: PrismaPermissionAuditRepository
    }
  ],
  exports: [PermissionAuditService, PrismaPermissionAuditRepository, SYMBOLS.REPO.AUDIT_EVENT]
})
export class PermissionAuditModule {}
