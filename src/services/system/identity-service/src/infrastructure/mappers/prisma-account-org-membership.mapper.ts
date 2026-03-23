import {
  AccountOrgRelationType,
  OrgType,
  UserAccountOrgMembership
} from '../../../prisma/generated/prisma/index'
import { AccountOrgMembershipEntity } from '../../domain/entities/account-org-membership.entity'

type MembershipWithOrg = UserAccountOrgMembership & {
  org?: {
    name: string
    type: OrgType
  }
}

export class PrismaAccountOrgMembershipMapper {
  static toDomain(record: MembershipWithOrg): AccountOrgMembershipEntity {
    return new AccountOrgMembershipEntity(
      record.id,
      record.accountId,
      record.orgId,
      record.org?.name ?? null,
      record.org ? OrgType[record.org.type] : null,
      AccountOrgRelationType[record.relationType],
      record.isPrimary
    )
  }

  static toPersistent(input: {
    accountId: string
    orgId: string
    relationType: AccountOrgRelationType
    isPrimary: boolean
  }) {
    return {
      accountId: input.accountId,
      orgId: input.orgId,
      relationType: input.relationType,
      isPrimary: input.isPrimary
    }
  }
}
