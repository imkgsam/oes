// src/common/src/modules/moduleAuth/module.token.provider.ts
import { Injectable } from '@nestjs/common'
import { InjectServiceClient } from '../clients/client.decorator'
import { ServiceKeys } from '../clients/service-map'
import { ClientProxy } from '@nestjs/microservices'
import { IDENTITY_MESSAGES } from '../../constants/messages/identity.message'
import { safeRpcCall2 } from '../../helpers/rpc.helper'
import {
  AuthModuleRequestDto,
  AuthModuleResponseDto
} from '../../dtos/identity-service/module.auth.dto'

@Injectable()
export class ModuleTokenProvider {
  private token?: { value: string; expiresAt: number }
  private refreshing?: Promise<string>

  constructor(
    @InjectServiceClient(ServiceKeys.IDENTITY_TCP)
    private readonly identityServiceClient: ClientProxy
  ) {}

  async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 10_000) {
      return this.token.value
    }
    if (!this.refreshing) {
      this.refreshing = this.refresh()
    }
    return this.refreshing
  }

  private async refresh(): Promise<string> {
    const res = await safeRpcCall2<AuthModuleRequestDto, AuthModuleResponseDto>(
      this.identityServiceClient,
      IDENTITY_MESSAGES.GEN_SERVICE_TOKEN,
      {
        clientId: process.env.CLIENT_ID!,
        clientSecret: process.env.CLIENT_SECRET!
      }
    )
    this.token = {
      value: res.accessToken,
      expiresAt: Date.now() + res.expiresIn * 1000
    }
    this.refreshing = undefined
    return this.token.value
  }
}
