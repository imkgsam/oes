import { Injectable } from '@nestjs/common'
import { TrustedExecutionGuard } from '@oes/common/authorization'

/** Binds Terminal Device ingress authorization to its exact service audience. */
@Injectable()
export class TerminalDeviceTrustedExecutionGuard extends TrustedExecutionGuard {}
