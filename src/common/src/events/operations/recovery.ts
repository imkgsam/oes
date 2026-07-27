import { parseMaxDeliveryAdvisory, type MaxDeliveryAdvisory } from './advisory'

/** Records that an advisory has no broker-issued source delivery token and must remain unresolved. */
export async function recoverMaxDeliveryToDlq(input: {
  readonly advisory: unknown
}): Promise<{
  readonly kind: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED'
  readonly advisory: MaxDeliveryAdvisory
}> {
  const advisory = parseMaxDeliveryAdvisory(input.advisory)
  return { kind: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED', advisory }
}
