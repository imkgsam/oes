import { BadRequestException, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { FirstLoginPasswordSetupDto } from '../../interfaces/http/dtos/first-login-password.dto'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'

@Injectable()
// Completes the authenticated first-login password setup step before the workspace becomes available.
export class CompleteFirstLoginPasswordSetupUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(dto: FirstLoginPasswordSetupDto, source: DownstreamRequestSource) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致')
    }

    const userId = source.user?.sub?.trim()
    if (!userId) {
      throw new BadRequestException('当前会话缺少用户身份')
    }

    return this.authAdapter.completeFirstLoginPasswordSetup(
      {
        userId,
        newPassword: dto.newPassword.trim()
      },
      source
    )
  }
}
