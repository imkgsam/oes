import { IQuery } from '@nestjs/cqrs'

// Loads the platform-owned MFA policy snapshot for SYSTEM account governance surfaces.
export class GetPlatformMfaPolicyQuery implements IQuery {}
