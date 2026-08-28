#!/usr/bin/env node
import { chmod, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const MAPPINGS = Object.freeze({
  'crm-service': 'CRM_PARTY',
  'srm-service': 'SRM_PARTY',
  'public-entry-service': 'PUBLIC_ENTRY_FOUNDATION'
})

/** Projects only exact provisioner-owned selector references into an existing task environment. */
export async function projectMachineSelectors({ selectorsPath, environmentPath }) {
  const profile = JSON.parse(await readFile(selectorsPath, 'utf8'))
  const selectors = new Map(profile.selectors.map((item) => [item.inventoryEntryKey, item]))
  const additions = new Map()
  for (const [entryKey, prefix] of Object.entries(MAPPINGS)) {
    const item = selectors.get(entryKey)
    if (!item) throw new Error(`MACHINE_SELECTOR_PROFILE_MISSING_${entryKey.toUpperCase().replaceAll('-', '_')}`)
    additions.set(`${prefix}_MACHINE_PRINCIPAL_ID`, item.machinePrincipalId)
    additions.set(`${prefix}_MACHINE_WORKLOAD_BINDING_ID`, item.machineWorkloadBindingId)
    additions.set(`${prefix}_MACHINE_WORKLOAD_BINDING_VERSION`, item.machineWorkloadBindingVersion)
  }
  const existing = (await readFile(environmentPath, 'utf8')).split('\n').filter(Boolean)
  const retained = existing.filter((line) => !additions.has(line.slice(0, line.indexOf('='))))
  const projected = [...retained, ...[...additions].map(([key, value]) => `${key}='${String(value).replaceAll("'", "'\\''")}'`)]
    .sort((left, right) => left.localeCompare(right)).join('\n') + '\n'
  const temporary = `${environmentPath}.${process.pid}.tmp`
  await writeFile(temporary, projected, { mode: 0o600 })
  await chmod(temporary, 0o600)
  await rename(temporary, environmentPath)
  return [...additions.keys()]
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => index % 2 ? pairs : [...pairs, [value.replace(/^--/, ''), all[index + 1]]], []))
  if (!args.selectors || !args.environment) throw new Error('MACHINE_SELECTOR_PROFILE_ARGUMENT_REQUIRED')
  projectMachineSelectors({ selectorsPath: resolve(args.selectors), environmentPath: resolve(args.environment) })
    .then((keys) => process.stdout.write(`MACHINE_SELECTOR_PROFILE_PROJECTED count=${keys.length}\n`))
    .catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
