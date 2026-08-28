import assert from 'node:assert/strict'
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { projectMachineSelectors } from './machine-workload-selector-env.mjs'

const selector = (inventoryEntryKey) => ({ inventoryEntryKey, machinePrincipalId: `${inventoryEntryKey}-principal`, machineWorkloadBindingId: `${inventoryEntryKey}-binding`, machineWorkloadBindingVersion: '1' })

test('selector projection is exact, owner-only and idempotent', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'oes-selector-'))
  const selectorsPath = join(directory, 'selectors.json')
  const environmentPath = join(directory, 'compose.env')
  await writeFile(selectorsPath, JSON.stringify({ selectors: ['crm-service', 'srm-service', 'public-entry-service'].map(selector) }), { mode: 0o600 })
  await writeFile(environmentPath, "UNCHANGED='value'\n", { mode: 0o600 })
  await projectMachineSelectors({ selectorsPath, environmentPath })
  const once = await readFile(environmentPath, 'utf8')
  await projectMachineSelectors({ selectorsPath, environmentPath })
  assert.equal(await readFile(environmentPath, 'utf8'), once)
  assert.match(once, /CRM_PARTY_MACHINE_PRINCIPAL_ID='crm-service-principal'/)
  assert.match(once, /PUBLIC_ENTRY_FOUNDATION_MACHINE_WORKLOAD_BINDING_VERSION='1'/)
  assert.equal((await stat(environmentPath)).mode & 0o777, 0o600)
})

test('selector projection rejects an incomplete owner profile before write', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'oes-selector-'))
  const selectorsPath = join(directory, 'selectors.json')
  const environmentPath = join(directory, 'compose.env')
  await writeFile(selectorsPath, JSON.stringify({ selectors: [selector('crm-service')] }))
  await writeFile(environmentPath, "UNCHANGED='value'\n")
  await assert.rejects(projectMachineSelectors({ selectorsPath, environmentPath }), /MACHINE_SELECTOR_PROFILE_MISSING_SRM_SERVICE/)
  assert.equal(await readFile(environmentPath, 'utf8'), "UNCHANGED='value'\n")
})
