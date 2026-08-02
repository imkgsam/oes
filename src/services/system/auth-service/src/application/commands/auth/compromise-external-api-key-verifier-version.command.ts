import { ICommand } from '@nestjs/cqrs'
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator'

const INCIDENT_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/

// Carries only safe provider-confirmed compromise evidence plus trusted workload/trace facts derived from transport context.
export class CompromiseExternalApiKeyVerifierVersionCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly verifierKeyVersion: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(INCIDENT_REFERENCE_PATTERN)
  readonly incidentReference: string

  @IsInt()
  @Min(1)
  readonly occurredAtUnixSeconds: number

  @IsString()
  @IsNotEmpty()
  readonly workloadSubject: string

  @IsString()
  @IsNotEmpty()
  readonly workloadClientId: string

  @IsOptional()
  @IsString()
  readonly requestId?: string

  @IsOptional()
  @IsString()
  readonly traceId?: string

  constructor(input: {
    verifierKeyVersion: string
    incidentReference: string
    occurredAtUnixSeconds: number
    workloadSubject: string
    workloadClientId: string
    requestId?: string
    traceId?: string
  }) {
    this.verifierKeyVersion = input.verifierKeyVersion
    this.incidentReference = input.incidentReference
    this.occurredAtUnixSeconds = input.occurredAtUnixSeconds
    this.workloadSubject = input.workloadSubject
    this.workloadClientId = input.workloadClientId
    this.requestId = input.requestId
    this.traceId = input.traceId
  }
}
