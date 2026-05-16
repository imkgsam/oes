import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DeviceCommandHandlers } from '../../application/commands/device'
import { EnrollmentCommandHandlers } from '../../application/commands/enrollment'
import { RuntimeCommandHandlers } from '../../application/commands/runtime'
import { VersionPolicyCommandHandlers } from '../../application/commands/version-policy'
import { VersionPolicyQueryHandlers } from '../../application/queries/version-policy'
import { ApplicationServices } from '../../application/services'
import { SYMBOLS } from '../../common/constants/symbols'
import {
  InMemoryTerminalDeviceAuditEventRepository,
  InMemoryTerminalDeviceActivationRepository,
  InMemoryTerminalDeviceEnrollmentRepository,
  InMemoryTerminalDeviceRepository,
  InMemoryTerminalDeviceRuntimeSnapshotRepository,
  InMemoryTerminalDeviceStore,
  InMemoryTerminalDeviceVersionPolicyRepository
} from '../../infrastructure/repositories/in-memory'
import { TerminalDeviceGrpcController } from '../../interfaces/grpc/terminal-device.grpc.controller'

@Module({
  imports: [CqrsModule],
  providers: [
    InMemoryTerminalDeviceStore,
    {
      provide: SYMBOLS.REPO.TERMINAL_DEVICE,
      useFactory: (store: InMemoryTerminalDeviceStore) => new InMemoryTerminalDeviceRepository(store),
      inject: [InMemoryTerminalDeviceStore]
    },
    {
      provide: SYMBOLS.REPO.ACTIVATION,
      useFactory: (store: InMemoryTerminalDeviceStore) => new InMemoryTerminalDeviceActivationRepository(store),
      inject: [InMemoryTerminalDeviceStore]
    },
    {
      provide: SYMBOLS.REPO.ENROLLMENT,
      useFactory: (store: InMemoryTerminalDeviceStore) => new InMemoryTerminalDeviceEnrollmentRepository(store),
      inject: [InMemoryTerminalDeviceStore]
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
      useFactory: (store: InMemoryTerminalDeviceStore) => new InMemoryTerminalDeviceAuditEventRepository(store),
      inject: [InMemoryTerminalDeviceStore]
    },
    ...EnrollmentCommandHandlers,
    ...DeviceCommandHandlers,
    ...RuntimeCommandHandlers,
    ...VersionPolicyCommandHandlers,
    ...VersionPolicyQueryHandlers,
    ...ApplicationServices
  ],
  controllers: [TerminalDeviceGrpcController],
  exports: [
    SYMBOLS.REPO.TERMINAL_DEVICE,
    SYMBOLS.REPO.ACTIVATION,
    SYMBOLS.REPO.ENROLLMENT,
    SYMBOLS.REPO.RUNTIME_SNAPSHOT,
    SYMBOLS.REPO.VERSION_POLICY,
    SYMBOLS.REPO.AUDIT_EVENT,
    ...EnrollmentCommandHandlers,
    ...DeviceCommandHandlers,
    ...RuntimeCommandHandlers,
    ...VersionPolicyCommandHandlers,
    ...VersionPolicyQueryHandlers,
    ...ApplicationServices
  ]
})
// TerminalDeviceModule assembles the terminal device skeleton with repository ports and in-memory adapters.
export class TerminalDeviceModule {}
