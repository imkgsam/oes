import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DeviceCommandHandlers } from '../../application/commands/device'
import { EnrollmentCommandHandlers } from '../../application/commands/enrollment'
import { RuntimeCommandHandlers } from '../../application/commands/runtime'
import { VersionPolicyCommandHandlers } from '../../application/commands/version-policy'
import { DeviceQueryHandlers } from '../../application/queries/device'
import { EnrollmentQueryHandlers } from '../../application/queries/enrollment'
import { RuntimeQueryHandlers } from '../../application/queries/runtime'
import { VersionPolicyQueryHandlers } from '../../application/queries/version-policy'
import { ApplicationServices } from '../../application/services'
import { RedisTerminalDeviceUnavailablePublisher } from '../../infrastructure/events'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { SYMBOLS } from '../../common/constants/symbols'
import {
  PrismaTerminalDeviceActivationRepository,
  PrismaTerminalDeviceAuditEventRepository,
  PrismaTerminalDeviceEnrollmentRepository,
  PrismaTerminalDeviceRepository,
  PrismaTerminalDeviceRuntimeSnapshotRepository,
  PrismaTerminalDeviceVersionPolicyRepository
} from '../../infrastructure/repositories/prisma'
import { TerminalDeviceGrpcController } from '../../interfaces/grpc/terminal-device.grpc.controller'
import { TerminalDeviceTrustedExecutionGuard } from './terminal-device-trusted-execution.guard'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    TerminalDeviceTrustedExecutionGuard,
    {
      provide: SYMBOLS.REPO.TERMINAL_DEVICE,
      useClass: PrismaTerminalDeviceRepository
    },
    {
      provide: SYMBOLS.REPO.ACTIVATION,
      useClass: PrismaTerminalDeviceActivationRepository
    },
    {
      provide: SYMBOLS.REPO.ENROLLMENT,
      useClass: PrismaTerminalDeviceEnrollmentRepository
    },
    {
      provide: SYMBOLS.REPO.RUNTIME_SNAPSHOT,
      useClass: PrismaTerminalDeviceRuntimeSnapshotRepository
    },
    {
      provide: SYMBOLS.REPO.VERSION_POLICY,
      useClass: PrismaTerminalDeviceVersionPolicyRepository
    },
    {
      provide: SYMBOLS.REPO.AUDIT_EVENT,
      useClass: PrismaTerminalDeviceAuditEventRepository
    },
    {
      provide: SYMBOLS.EVENT_PUBLISHER.TERMINAL_DEVICE_UNAVAILABLE,
      useClass: RedisTerminalDeviceUnavailablePublisher
    },
    ...EnrollmentCommandHandlers,
    ...DeviceCommandHandlers,
    ...RuntimeCommandHandlers,
    ...VersionPolicyCommandHandlers,
    ...DeviceQueryHandlers,
    ...EnrollmentQueryHandlers,
    ...RuntimeQueryHandlers,
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
    ...DeviceQueryHandlers,
    ...EnrollmentQueryHandlers,
    ...RuntimeQueryHandlers,
    ...VersionPolicyQueryHandlers,
    ...ApplicationServices
  ]
})
// TerminalDeviceModule assembles the managed terminal device boundary with persistent repository adapters.
export class TerminalDeviceModule {}
