import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { randomUUID } from 'crypto'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { REPO } from '../../../common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { BootstrapUserLoginMethodsCommand } from './bootstrap-user-login-methods.command'

export interface BootstrapUserLoginMethodsResult {
  emailBootstrapped: boolean
  passwordBootstrapped: boolean
  phoneBootstrapped: boolean
}

@CommandHandler(BootstrapUserLoginMethodsCommand)
// Bootstraps invite-ready login methods for one newly created or newly rebound user without fabricating MFA bindings.
export class BootstrapUserLoginMethodsHandler
  implements ICommandHandler<BootstrapUserLoginMethodsCommand, BootstrapUserLoginMethodsResult>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository
  ) {}

  async execute(
    command: BootstrapUserLoginMethodsCommand
  ): Promise<BootstrapUserLoginMethodsResult> {
    const phone = command.phone?.trim()
    const email = command.email?.trim().toLowerCase()
    const existingMethods = await this.loginMethodRepository.findByUserId(command.userId)
    const sharedPasswordSecret = existingMethods
      .map((method) => method.getCredentialByType(CredentialType.PASSWORD))
      .find(Boolean)
      ?.getSecret()

    if (phone) {
      const existing = await this.loginMethodRepository.findByUserIdAndType(command.userId, LoginMethodType.PHONE)
      const loginMethod = await this.buildLoginMethod(
        command.userId,
        LoginMethodType.PHONE,
        phone,
        existing,
        sharedPasswordSecret
      )
      await this.loginMethodRepository.save(loginMethod)
    }

    if (email) {
      const existing = await this.loginMethodRepository.findByUserIdAndType(command.userId, LoginMethodType.EMAIL)
      const loginMethod = await this.buildLoginMethod(
        command.userId,
        LoginMethodType.EMAIL,
        email,
        existing,
        sharedPasswordSecret
      )
      await this.loginMethodRepository.save(loginMethod)
    }

    return {
      emailBootstrapped: Boolean(email),
      passwordBootstrapped: false,
      phoneBootstrapped: Boolean(phone)
    }
  }

  private async buildLoginMethod(
    userId: string,
    type: LoginMethodType,
    identifier: string,
    existing: LoginMethod | null,
    sharedPasswordSecret?: string
  ): Promise<LoginMethod> {
    const duplicate = await this.loginMethodRepository.findByTypeAndIdentifier(type, identifier)
    if (duplicate && duplicate.userId !== userId) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: type === LoginMethodType.PHONE ? 'phone' : 'email',
        value: identifier
      })
    }

    const loginMethod =
      !existing
        ? new LoginMethod(
            randomUUID(),
            userId,
            type,
            identifier,
            true,
            true,
            new Date(),
            new Date(),
            []
          )
        : new LoginMethod(
            existing.id,
            existing.userId,
            existing.type,
            identifier,
            true,
            true,
            existing.createdAt,
            new Date(),
            existing.getCredentials()
          )

    this.ensureOtpCredential(loginMethod)
    if (sharedPasswordSecret && !loginMethod.getCredentialByType(CredentialType.PASSWORD)) {
      loginMethod.createNewCredential(
        new Credential(randomUUID(), CredentialType.PASSWORD, sharedPasswordSecret, true)
      )
    }

    return loginMethod
  }

  private ensureOtpCredential(loginMethod: LoginMethod): void {
    const credentialType =
      loginMethod.type === LoginMethodType.EMAIL
        ? CredentialType.EMAIL_OTP
        : CredentialType.PHONE_OTP

    if (loginMethod.getCredentialByType(credentialType)) {
      return
    }

    loginMethod.createNewCredential(
      new Credential(randomUUID(), credentialType, '', true)
    )
  }
}
