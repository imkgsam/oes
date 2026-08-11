import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Locks Terminal Device's trusted request tombstones and credential wire additions. */
describe('terminal device trusted grpc contract', () => {
  const proto = readFileSync(resolve(__dirname, 'terminal_device.proto'), 'utf8')

  it('reserves all removed authority fields and retains only the frozen credential additions', () => {
    expect(proto).toContain('reserved "tenant_id", "operator_context";')
    expect(proto).toContain('string device_credential = 9;')
    expect(proto).toContain('string device_credential = 11;')
    expect(proto).toContain('string rotated_device_credential = 5;')
    expect(proto).toContain('message TerminalDeviceDiagnosticLogInput')
  })
})
