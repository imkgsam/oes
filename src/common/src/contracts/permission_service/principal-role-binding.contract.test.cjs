const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { describe, it } = require('node:test')
const { parse } = require('protobufjs')

/** Guards the additive PrincipalRoleBinding wire contract and its isolated legacy revoke selector. */
describe('PrincipalRoleBinding permission management contract', () => {
  const protoSource = readFileSync(join(__dirname, 'permission_management.proto'), 'utf8')
  const root = parse(protoSource).root
  const service = root.lookupService('permission_service.PermissionManagementService')

  it('exposes immutable binding identity from grant and binding-read surfaces', () => {
    const grantResponse = root.lookupType('permission_service.AssignAccountRoleResponse')
    const binding = root.lookupType('permission_service.AccountRoleBindingResponse')
    const accountBindings = root.lookupType('permission_service.ListAccountRolesResponse')
    const replacement = root.lookupType('permission_service.SetAccountRolesResponse')

    assert.equal(grantResponse.fields.bindingId?.id, 1)
    assert.equal(binding.fields.bindingId?.id, 6)
    assert.equal(accountBindings.fields.bindings?.id, 2)
    assert.equal(accountBindings.fields.bindings?.repeated, true)
    assert.equal(replacement.fields.bindings?.id, 2)
    assert.equal(replacement.fields.bindings?.repeated, true)
  })

  it('keeps canonical revoke addressable only by immutable binding identity', () => {
    const method = service.methods.RevokePrincipalRoleBinding
    const request = root.lookupType('permission_service.RevokePrincipalRoleBindingRequest')

    assert.equal(method.requestType, 'RevokePrincipalRoleBindingRequest')
    assert.equal(method.responseType, 'RevokePrincipalRoleBindingResponse')
    assert.deepEqual(Object.keys(request.fields).sort(), ['bindingId', 'reason'])
    assert.equal(request.fields.bindingId?.id, 1)
    assert.equal(request.fields.reason?.id, 2)
    assert.equal(request.fields.accountId, undefined)
    assert.equal(request.fields.roleId, undefined)
  })

  it('returns the original first-revoke facts for idempotent retries', () => {
    const response = root.lookupType('permission_service.RevokePrincipalRoleBindingResponse')
    const result = root.lookupType('permission_service.PrincipalRoleBindingRevokeResult')

    assert.equal(response.fields.result?.type, 'PrincipalRoleBindingRevokeResult')
    assert.equal(response.fields.result?.id, 1)
    assert.deepEqual(
      Object.fromEntries(Object.entries(result.fields).map(([name, field]) => [name, field.id])),
      {
        bindingId: 1,
        revokedAt: 2,
        revokedByOperatorId: 3,
        reason: 4,
        auditEventId: 5
      }
    )
  })

  it('marks account and role revoke selection as legacy compatibility only', () => {
    const legacyMethod = service.methods.RevokeAccountRole
    const legacyRequest = root.lookupType('permission_service.RevokeAccountRoleRequest')

    assert.equal(legacyMethod.options?.deprecated, true)
    assert.equal(legacyRequest.fields.accountId?.options?.deprecated, true)
    assert.equal(legacyRequest.fields.roleId?.options?.deprecated, true)
  })
})
