import { Module } from '@nestjs/common'
import { SYMBOLS } from '../../common/constants/symbols'
import {
  InMemoryTerminalDeviceAuditEventRepository,
  InMemoryTerminalDeviceEnrollmentRepository,
  InMemoryTerminalDeviceRepository,
  InMemoryTerminalDeviceRuntimeSnapshotRepository,
  InMemoryTerminalDeviceVersionPolicyRepository
} from '../../infrastructure/repositories/in-memory'
import { TerminalDeviceGrpcController } from '../../interfaces/grpc/terminal-device.grpc.controller'

@Module({
  providers: [
    {
      provide: SYMBOLS.REPO.TERMINAL_DEVICE,
      useClass: InMemoryTerminalDeviceRepository
    },
    {
      provide: SYMBOLS.REPO.ENROLLMENT,
      useClass: InMemoryTerminalDeviceEnrollmentRepository
    },
    {
      provide: SYMBOLS.REPO.RUNTIME_SNAPSHOT,
      useClass: InMemoryTerminalDeviceRuntimeSnapshotRepository
    },
    {
      provide: SYMBOLS.REPO.VERSION_POLICY,
      useClass: InMemoryTerminalDeviceVersionPolicyRepository
    },
    {
      provide: SYMBOLS.REPO.AUDIT_EVENT,
      useClass: InMemoryTerminalDeviceAuditEventRepository
    }
  ],
  controllers: [TerminalDeviceGrpcController],
  exports: [
    SYMBOLS.REPO.TERMINAL_DEVICE,
    SYMBOLS.REPO.ENROLLMENT,
    SYMBOLS.REPO.RUNTIME_SNAPSHOT,
    SYMBOLS.REPO.VERSION_POLICY,
    SYMBOLS.REPO.AUDIT_EVENT
  ]
})
// TerminalDeviceModule assembles the terminal device skeleton with repository ports and in-memory adapters.
export class TerminalDeviceModule {}
