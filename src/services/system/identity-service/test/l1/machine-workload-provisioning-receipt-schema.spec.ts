import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const serviceRoot = resolve(__dirname, '../..')
const schema = readFileSync(resolve(serviceRoot, 'prisma/schema.prisma'), 'utf8')
const migration = readFileSync(
  resolve(
    serviceRoot,
    'prisma/migrations/20260828000000_machine_workload_inventory_receipt/migration.sql'
  ),
  'utf8'
)

// Derives the exact PostgreSQL identifier produced when an unquoted name exceeds 63 bytes.
function postgresIdentifier(name: string): string {
  return Buffer.from(name, 'utf8').subarray(0, 63).toString('utf8')
}

describe('MachineWorkloadProvisioningReceipt schema identifiers', () => {
  it.each([
    [
      'foreign key',
      'MachineWorkloadProvisioningReceipt_machineWorkloadBindingId_fkey',
      'MachineWorkloadProvisioningReceipt_machineWorkloadBindingId_fke'
    ],
    [
      'manifest index',
      'MachineWorkloadProvisioningReceipt_manifestVersion_manifestDigest_idx',
      'MachineWorkloadProvisioningReceipt_manifestVersion_manifestDige'
    ]
  ])('maps the %s to the exact persisted PostgreSQL identifier', (_label, declared, persisted) => {
    expect(migration).toContain(`"${declared}"`)
    expect(postgresIdentifier(declared)).toBe(persisted)
    expect(Buffer.byteLength(persisted, 'utf8')).toBeLessThanOrEqual(63)
    expect(schema).toContain(`map: "${persisted}"`)
  })
})
