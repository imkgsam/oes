import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'crm.proto'), 'utf8')

/** Locks CRM's 15-RPC trusted surface, 67 tombstones, and unchanged business numbering. */
describe('CRM trusted gRPC contract', () => {
  it('declares exactly 14 BUSINESS RPCs and one Collaboration INTERNAL RPC', () => {
    expect(proto.match(/rpc \w+\(/gu) ?? []).toHaveLength(15)
    expect(serviceRpcCount('CustomerQueryService')).toBe(4)
    expect(serviceRpcCount('CustomerManagementService')).toBe(10)
    expect(serviceRpcCount('CrmObjectReferenceService')).toBe(1)
  })

  it('reserves all 59 request authority fields plus eight nested context fields', () => {
    expect(proto.match(/reserved 1, 2, 3;/gu) ?? []).toHaveLength(7)
    expect(proto.match(/reserved 1, 2;/gu) ?? []).toHaveLength(1)
    expect(proto.match(/reserved 1, 2, 3, 4;/gu) ?? []).toHaveLength(7)
    expect(proto.match(/reserved 1, 2, 3, 4, 6;/gu) ?? []).toHaveLength(1)
    expect(proto.match(/reserved 1, 2, 3, 4, 7;/gu) ?? []).toHaveLength(1)
    expect(proto.match(/reserved 1, 2, 3, 4, 15, 26;/gu) ?? []).toHaveLength(1)
    expect(
      proto.match(/reserved "tenant_id", "operator_context", "trace_context";/gu) ?? []
    ).toHaveLength(5)
    expect(
      proto.match(
        /reserved "tenant_id", "operator_context", "trace_context", "audit_context";/gu
      ) ?? []
    ).toHaveLength(7)
    expect(messageBody('OperatorContext')).toMatch(
      /^\s*reserved 1, 2, 3;\s*reserved "operator_id", "operator_type", "org_id";\s*$/u
    )
    expect(messageBody('TraceContext')).toMatch(
      /^\s*reserved 1, 2;\s*reserved "trace_id", "request_id";\s*$/u
    )
    expect(messageBody('AuditContext')).toMatch(
      /^\s*reserved 1, 2, 3;\s*reserved "audit_id", "reason", "source";\s*$/u
    )
  })

  it('preserves every first business field and removes the four authority decisions', () => {
    const firstFields = {
      CreateLeadRequest: ['display_name', 5],
      ConvertLeadToProspectCustomerRequest: ['crm_account_id', 5],
      CheckLeadDuplicateRequest: ['display_name', 4],
      CreateDraftLeadRequest: ['display_name', 5],
      UpdateDraftLeadRequest: ['crm_account_id', 5],
      SubmitDraftLeadRequest: ['crm_account_id', 5],
      DeleteDraftLeadRequest: ['crm_account_id', 5],
      ClaimCrmAccountRequest: ['crm_account_id', 5],
      ReleaseCrmAccountRequest: ['crm_account_id', 5],
      ArchiveCrmAccountRequest: ['crm_account_id', 5],
      UpdateCrmAccountIdentifiersRequest: ['crm_account_id', 5],
      ListCrmAccountsRequest: ['keyword', 4],
      GetCrmAccountRequest: ['crm_account_id', 4],
      ListSourceRecordsRequest: ['crm_account_id', 4],
      ValidateCrmObjectReferenceRequest: ['object_type', 4]
    } as const
    for (const [message, [field, number]] of Object.entries(firstFields)) {
      expect(fieldNumber(message, field)).toBe(number)
    }
    expect(messageBody('CreateLeadRequest')).not.toMatch(/\bowner_account_id =/u)
    expect(messageBody('CreateLeadRequest')).not.toMatch(/\bclaim_for_current_user =/u)
    expect(messageBody('SubmitDraftLeadRequest')).not.toMatch(/\bclaim_for_current_user =/u)
    expect(messageBody('ConvertLeadToProspectCustomerRequest')).not.toMatch(
      /\ballow_ownerless_conversion =/u
    )
  })
})

/** Counts RPC declarations inside one proto service block. */
function serviceRpcCount(serviceName: string): number {
  const body =
    proto.match(new RegExp(`service ${serviceName} \\{([\\s\\S]*?)\\n\\}`, 'u'))?.[1] ?? ''
  return (body.match(/rpc \w+\(/gu) ?? []).length
}

/** Returns one exact proto message body for field-level contract assertions. */
function messageBody(messageName: string): string {
  return proto.match(new RegExp(`message ${messageName} \\{([\\s\\S]*?)\\n\\}`, 'u'))?.[1] ?? ''
}

/** Reads one frozen field number from a request message. */
function fieldNumber(messageName: string, fieldName: string): number {
  const match = messageBody(messageName).match(new RegExp(`\\b${fieldName} = (\\d+);`, 'u'))
  return Number(match?.[1] ?? -1)
}
