import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { MfaBindingManagementService, MfaBindingView } from '../../services/mfa/mfa-binding-management.service'
import { ListMfaBindingsQuery } from './list-mfa-bindings.query'

@QueryHandler(ListMfaBindingsQuery)
export class ListMfaBindingsHandler
  implements IQueryHandler<ListMfaBindingsQuery, MfaBindingView[]>
{
  constructor(private readonly mfaBindingManagementService: MfaBindingManagementService) {}

  async execute(query: ListMfaBindingsQuery): Promise<MfaBindingView[]> {
    return this.mfaBindingManagementService.listBindings(query.userId)
  }
}
