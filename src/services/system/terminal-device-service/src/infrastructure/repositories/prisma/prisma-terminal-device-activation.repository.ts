import { Injectable } from '@nestjs/common'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import {
  CompleteEnrollmentActivationInput,
  CompleteEnrollmentActivationResult,
  TerminalDeviceActivationRepository
} from '../../../domain/repositories/terminal-device-activation.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaTerminalDeviceMapper } from './prisma-terminal-device.mapper'

// PrismaTerminalDeviceActivationRepository atomically consumes enrollment and creates the device registry record.
@Injectable()
export class PrismaTerminalDeviceActivationRepository implements TerminalDeviceActivationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Commits activation facts in a single database transaction with optimistic enrollment checks.
  async completeEnrollmentActivation(input: CompleteEnrollmentActivationInput): Promise<CompleteEnrollmentActivationResult> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedEnrollment = await tx.terminalDeviceEnrollment.updateMany({
          where: {
            enrollmentId: input.issuedEnrollment.enrollmentId,
            codeHash: input.issuedEnrollment.codeHash,
            status: 'ISSUED'
          },
          data: PrismaTerminalDeviceMapper.toEnrollmentData(input.usedEnrollment) as any
        })

        if (updatedEnrollment.count !== 1) {
          throw new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Enrollment is no longer issued')
        }

        const device = await tx.terminalDevice.create({
          data: PrismaTerminalDeviceMapper.toDeviceData(input.terminalDevice) as any
        })
        const auditEvent = await tx.terminalDeviceAuditEvent.create({
          data: PrismaTerminalDeviceMapper.toAuditEventData(input.auditEvent) as any
        })
        const enrollment = await tx.terminalDeviceEnrollment.findUniqueOrThrow({
          where: { enrollmentId: input.usedEnrollment.enrollmentId }
        })

        return {
          terminalDevice: PrismaTerminalDeviceMapper.toDeviceEntity(device),
          enrollment: PrismaTerminalDeviceMapper.toEnrollmentEntity(enrollment),
          auditEvent: PrismaTerminalDeviceMapper.toAuditEventEntity(auditEvent)
        }
      })
      return result
    } catch (error) {
      throw mapActivationError(error)
    }
  }
}

// mapActivationError converts database conflicts into activation-domain failures.
function mapActivationError(error: unknown): TerminalDeviceError {
  if (error instanceof TerminalDeviceError) {
    return error
  }
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: string }).code) : null
  const target = typeof error === 'object' && error !== null && 'meta' in error ? (error as any).meta?.target : null
  if (code === 'P2002' && Array.isArray(target) && target.includes('enrollmentId')) {
    return new TerminalDeviceError(
      'TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED',
      'Terminal device enrollment is already linked'
    )
  }
  if (code === 'P2002') {
    return new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Enrollment activation conflict')
  }
  return new TerminalDeviceError('TERMINAL_DEVICE_PERSISTENCE_ERROR', 'Terminal device activation persistence failed')
}
