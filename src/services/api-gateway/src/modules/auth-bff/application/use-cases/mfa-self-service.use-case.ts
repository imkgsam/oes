import { Injectable } from '@nestjs/common'
import { MfaBindingType } from '@oes/common/generated/auth_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { ActivateTotpBindingDto, MfaBindingTypeDto } from '../../interfaces/http/dtos/self-security.dto'
import {
  InitializeTotpViewModel,
  MfaBindingListViewModel,
  MfaBindingMutationViewModel,
  MfaBindingViewModel,
  RecoveryCodesViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

@Injectable()
// Executes authenticated self-service MFA queries and mutations for the current user.
export class MfaSelfServiceUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async listBindings(source: DownstreamRequestSource): Promise<MfaBindingListViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.listMfaBindings(self.userId, source)

    return {
      bindings: (result.bindings ?? []).map((binding) => this.toBindingViewModel(binding))
    }
  }

  async enableBinding(
    type: MfaBindingTypeDto,
    source: DownstreamRequestSource
  ): Promise<MfaBindingMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.enableMfaBinding(self.userId, this.toProtoType(type), source)
    return {
      success: Boolean(result.success),
      binding: this.toBindingViewModel(result.binding)
    }
  }

  async disableBinding(
    type: MfaBindingTypeDto,
    source: DownstreamRequestSource
  ): Promise<MfaBindingMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.disableMfaBinding(self.userId, this.toProtoType(type), source)
    return {
      success: Boolean(result.success),
      binding: this.toBindingViewModel(result.binding)
    }
  }

  async initializeTotp(source: DownstreamRequestSource): Promise<InitializeTotpViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.initializeTotpBinding(self.userId, source)
    return {
      binding: this.toBindingViewModel(result.binding),
      secret: result.secret ?? '',
      qrCodeUrl: result.qrCodeUrl ?? ''
    }
  }

  async activateTotp(
    dto: ActivateTotpBindingDto,
    source: DownstreamRequestSource
  ): Promise<MfaBindingMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.activateTotpBinding(
      self.userId,
      dto.bindingId.trim(),
      dto.code.trim(),
      source
    )
    return {
      success: Boolean(result.success),
      binding: this.toBindingViewModel(result.binding)
    }
  }

  async initializeRecoveryCodes(source: DownstreamRequestSource): Promise<RecoveryCodesViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.initializeRecoveryCodes(self.userId, source)
    return {
      binding: this.toBindingViewModel(result.binding),
      recoveryCodes: result.recoveryCodes ?? []
    }
  }

  async regenerateRecoveryCodes(source: DownstreamRequestSource): Promise<RecoveryCodesViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.regenerateRecoveryCodes(self.userId, source)
    return {
      binding: this.toBindingViewModel(result.binding),
      recoveryCodes: result.recoveryCodes ?? []
    }
  }

  private toBindingViewModel(binding?: {
    bindingId?: string
    type?: MfaBindingType
    enabled?: boolean
    available?: boolean
    destination?: string
    updatedAt?: string
  }): MfaBindingViewModel {
    return {
      bindingId: binding?.bindingId ?? '',
      type: this.fromProtoType(binding?.type),
      enabled: Boolean(binding?.enabled),
      available: Boolean(binding?.available),
      destination: binding?.destination ?? undefined,
      updatedAt: binding?.updatedAt ?? undefined
    }
  }

  private toProtoType(type: MfaBindingTypeDto): MfaBindingType {
    switch (type) {
      case MfaBindingTypeDto.EMAIL_OTP:
        return MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP
      case MfaBindingTypeDto.SMS_OTP:
        return MfaBindingType.MFA_BINDING_TYPE_SMS_OTP
      case MfaBindingTypeDto.TOTP:
        return MfaBindingType.MFA_BINDING_TYPE_TOTP
      case MfaBindingTypeDto.BACKUP_CODE:
        return MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE
      default:
        return MfaBindingType.MFA_BINDING_TYPE_UNSPECIFIED
    }
  }

  private fromProtoType(type?: MfaBindingType): MfaBindingTypeDto {
    switch (type) {
      case MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP:
        return MfaBindingTypeDto.EMAIL_OTP
      case MfaBindingType.MFA_BINDING_TYPE_SMS_OTP:
        return MfaBindingTypeDto.SMS_OTP
      case MfaBindingType.MFA_BINDING_TYPE_TOTP:
        return MfaBindingTypeDto.TOTP
      case MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE:
        return MfaBindingTypeDto.BACKUP_CODE
      default:
        return MfaBindingTypeDto.EMAIL_OTP
    }
  }
}
