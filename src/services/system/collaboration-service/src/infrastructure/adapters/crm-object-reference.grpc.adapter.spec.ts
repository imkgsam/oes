import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { ObjectReferenceCapability } from '../../application/ports/object-reference.port'
import { CrmObjectReferenceGrpcAdapter } from './crm-object-reference.grpc.adapter'

/** Proves Collaboration sends authority-free CRM input with one exact HUMAN_OBO Code. */
describe('CrmObjectReferenceGrpcAdapter trusted transport', () => {
  it('uses the dedicated client and strips tenant/operator/trace authority', async () => {
    const validateCrmObjectReference = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ exists: true, readable: true, capabilityAllowed: true })
    )
    const adapter = new CrmObjectReferenceGrpcAdapter({
      objectReference: () => ({ validateCrmObjectReference })
    } as never)
    const forInternalCall = jest.fn().mockResolvedValue(new Metadata())
    ;(adapter as unknown as { trusted: { forInternalCall: typeof forInternalCall } }).trusted = {
      forInternalCall
    }
    adapter.onModuleInit()

    await adapter.validate({
      tenantId: 'tenant-1',
      operatorAccountId: 'human-1',
      traceId: 'trace-1',
      objectRef: {
        objectOwnerService: 'crm-service',
        objectType: 'CRM_ACCOUNT',
        objectId: 'crm-1'
      },
      capability: ObjectReferenceCapability.CREATE_ANNOTATION
    })

    expect(forInternalCall).toHaveBeenCalledWith(
      'crm-service',
      'crm.internal.object_reference.validate'
    )
    expect(validateCrmObjectReference).toHaveBeenCalledWith(
      {
        objectType: 'CRM_ACCOUNT',
        objectId: 'crm-1',
        requestedCapability: 2
      },
      expect.any(Metadata)
    )
    const wire = validateCrmObjectReference.mock.calls[0][0]
    expect(wire).not.toHaveProperty('tenantId')
    expect(wire).not.toHaveProperty('operatorContext')
    expect(wire).not.toHaveProperty('traceContext')
  })
})
