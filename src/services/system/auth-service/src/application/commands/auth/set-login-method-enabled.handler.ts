import { BadRequestException, Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { randomUUID } from 'crypto'
import { REPO } from '../../../common/constants'
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LoginMethodView } from '../../queries/login-method'
import { SetLoginMethodEnabledCommand } from './set-login-method-enabled.command'

@CommandHandler(SetLoginMethodEnabledCommand)
// Enables or disables one login method while protecting the user's final verified method.
export class SetLoginMethodEnabledHandler
  implements
    ICommandHandler<
      SetLoginMethodEnabledCommand,
      { loginMethod: LoginMethodView; success: boolean }
    >
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: SetLoginMethodEnabledCommand) {
    const capability = parseCapabilityRef(command.methodId)
    const method = await this.loginMethodRepository.findByUserIdAndId(
      command.userId,
      capability.loginMethodId
    )
    if (!method) {
      throw new NotFoundException('Login method not found')
    }

    const methods = await this.loginMethodRepository.findByUserId(command.userId)

    if (!command.enabled) {
      if (countEnabledCapabilities(methods) <= 1) {
        throw new BadRequestException('Cannot disable the last available login method')
      }
      disableCapability(method, capability.kind)
    } else {
      method.enable()
      await enableCapability(method, capability.kind, methods)
    }

    await this.loginMethodRepository.save(method)
    this.authAuditService.emitLoginMethodEnabledChanged(
      command.operatorId,
      command.userId,
      command.methodId,
      command.enabled,
      command.reason
    )
    return { success: true, loginMethod: toLoginMethodView(method, capability.kind) }
  }
}

type LoginCapabilityKind = 'OTP' | 'PASSWORD'

function parseCapabilityRef(methodId: string): {
  kind: LoginCapabilityKind
  loginMethodId: string
} {
  const [loginMethodId, rawKind] = methodId.split(':')

  if (!loginMethodId || (rawKind !== 'PASSWORD' && rawKind !== 'OTP')) {
    throw new BadRequestException('Unsupported login method capability id')
  }

  return {
    loginMethodId,
    kind: rawKind
  }
}

function countEnabledCapabilities(methods: LoginMethod[]): number {
  return methods.reduce((count, method) => {
    if (!method.isVerified() || !method.isEnabled()) {
      return count
    }

    const otpCredential = method.getCredentialByType(resolveOtpCredentialType(method.type))
    const passwordCredential = method.getCredentialByType(CredentialType.PASSWORD)

    return (
      count +
      (otpCredential ? Number(otpCredential.isEnabled()) : 1) +
      Number(passwordCredential?.isEnabled())
    )
  }, 0)
}

async function enableCapability(
  method: LoginMethod,
  kind: LoginCapabilityKind,
  methods: LoginMethod[]
): Promise<void> {
  if (kind === 'PASSWORD') {
    const existing = method.getCredentialByType(CredentialType.PASSWORD)
    if (existing) {
      existing.enable()
      return
    }

    const sourcePassword = methods
      .filter((candidate) => candidate.id !== method.id)
      .map((candidate) => candidate.getCredentialByType(CredentialType.PASSWORD))
      .find(Boolean)

    if (!sourcePassword) {
      throw new BadRequestException('Password is not configured for this login method')
    }

    method.createNewCredential(
      new Credential(
        randomUUID(),
        CredentialType.PASSWORD,
        sourcePassword.getSecret(),
        true
      )
    )
    return
  }

  const credentialType = resolveOtpCredentialType(method.type)
  const existing = method.getCredentialByType(credentialType)
  if (existing) {
    existing.enable()
    return
  }

  method.createNewCredential(new Credential(randomUUID(), credentialType, '', true))
}

function disableCapability(method: LoginMethod, kind: LoginCapabilityKind): void {
  if (kind === 'PASSWORD') {
    const passwordCredential = method.getCredentialByType(CredentialType.PASSWORD)
    if (!passwordCredential) {
      throw new BadRequestException('Password login is not configured for this method')
    }

    passwordCredential.disable()
    return
  }

  const credentialType = resolveOtpCredentialType(method.type)
  const otpCredential = method.getCredentialByType(credentialType)
  if (otpCredential) {
    otpCredential.disable()
    return
  }

  method.createNewCredential(new Credential(randomUUID(), credentialType, '', false))
}

function resolveOtpCredentialType(type: LoginMethodType): CredentialType {
  return type === LoginMethodType.EMAIL ? CredentialType.EMAIL_OTP : CredentialType.PHONE_OTP
}

function toLoginMethodView(method: LoginMethod, kind: LoginCapabilityKind): LoginMethodView {
  const passwordCredential = method.getCredentialByType(CredentialType.PASSWORD)
  const otpCredential = method.getCredentialByType(resolveOtpCredentialType(method.type))

  return {
    methodId: `${method.id}:${kind}`,
    userId: method.userId,
    type:
      kind === 'PASSWORD'
        ? method.type === LoginMethodType.EMAIL
          ? 'EMAIL_PASSWORD'
          : 'PHONE_PASSWORD'
        : method.type === LoginMethodType.EMAIL
          ? 'EMAIL_OTP'
          : 'PHONE_OTP',
    identifier: method.identifier,
    maskedIdentifier: method.identifier,
    verified: method.isVerified(),
    enabled:
      kind === 'PASSWORD'
        ? Boolean(passwordCredential?.isEnabled())
        : method.isEnabled() && method.isVerified() && (otpCredential ? otpCredential.isEnabled() : true),
    hasPassword: Boolean(passwordCredential),
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString()
  }
}
