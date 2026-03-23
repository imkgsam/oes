import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  GetAccountByIdRequest,
  GetAccountByIdResponse,
  GetAccountsByUserIdRequest,
  GetAccountsByUserIdResponse,
  IdentityQueryServiceController,
  IdentityQueryServiceControllerMethods,
  GetUserByEmailRequest,
  GetUserByEmailResponse
} from '@oes/common/generated/identity_service'
import {
  GetAccountByIdQuery,
  GetAccountsByUserIdQuery,
  GetUserByEmailQuery
} from '../../application/queries'

@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@Controller()
@IdentityQueryServiceControllerMethods()
export class IdentityQueryGrpcController implements IdentityQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getAccountById(request: GetAccountByIdRequest): Promise<GetAccountByIdResponse> {
    const account = await this.queryBus.execute(
      new GetAccountByIdQuery(request.accountId ?? '')
    )

    if (!account) {
      return {}
    }

    return {
      account: {
        id: account.id,
        userId: account.userId,
        tenantId: account.tenantId,
        displayName: account.displayName ?? '',
        isEnabled: account.isEnabled
      }
    }
  }

  async getAccountsByUserId(
    request: GetAccountsByUserIdRequest
  ): Promise<GetAccountsByUserIdResponse> {
    const accounts = await this.queryBus.execute(
      new GetAccountsByUserIdQuery(request.userId ?? '')
    )

    return {
      accounts: accounts.map((account) => ({
        accountId: account.accountId,
        tenantId: account.tenantId,
        displayName: account.displayName ?? ''
      }))
    }
  }

  async getUserByEmail(request: GetUserByEmailRequest): Promise<GetUserByEmailResponse> {
    const user = await this.queryBus.execute(
      new GetUserByEmailQuery(request.email ?? '')
    )

    if (!user) {
      return {}
    }

    return {
      user: {
        id: user.id,
        username: user.username ?? '',
        personalEmail: user.personalEmail ?? '',
        personalPhone: user.personalPhone ?? '',
        isActive: user.isActive
      }
    }
  }
}
