#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const WORKLOAD_AUDIENCE = /^urn:oes:service:[a-z0-9]+(?:-[a-z0-9]+)*$/u
const INTERNAL_PERMISSION_CODE = /^[a-z0-9_-]+\.internal\.[a-z0-9_.-]+$/u

export const WORKLOAD_POLICY_VERSION = 'auth-login-owner-facts-v1'

/** Loads one versioned JSON input without accepting runtime authority from arguments. */
function load(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
}

/** Produces shell-safe task-owned registry projection without credential material. */
export function renderWorkloadPolicyEnvironment(repositoryRoot = root) {
  const auth = loadFrom(
    repositoryRoot,
    'scripts/local/runtime-config/auth-execution-workload-policies.json'
  )
  const permission = loadFrom(
    repositoryRoot,
    'scripts/local/runtime-config/permission-workload-issuance-policies.json'
  )
  validate(auth, permission)
  return (
    [
      `AUTH_EXECUTION_WORKLOAD_POLICIES='${JSON.stringify(auth)}'`,
      `PERMISSION_WORKLOAD_ISSUANCE_POLICIES='${JSON.stringify(permission)}'`,
      `AUTH_PERMISSION_WORKLOAD_ISSUANCE_POLICY_VERSION=${WORKLOAD_POLICY_VERSION}`
    ].join('\n') + '\n'
  )
}

function loadFrom(repositoryRoot, relative) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relative), 'utf8'))
}

/** Rejects duplicate, wildcard, tenant-bearing, undeclared, or unregistered policy tuples. */
export function validate(auth, permission) {
  if (!Array.isArray(auth) || !Array.isArray(permission) || !auth.length || !permission.length)
    throw new Error('WORKLOAD_POLICY_EMPTY')
  const workloads = new Map()
  for (const record of auth) {
    if (
      Object.keys(record).sort().join(',') !== 'audiences,spiffeId' ||
      record.spiffeId.includes('*') ||
      !Array.isArray(record.audiences) ||
      !record.audiences.length ||
      record.audiences.some((audience) => !WORKLOAD_AUDIENCE.test(audience))
    )
      throw new Error('WORKLOAD_POLICY_AUTH_SHAPE_INVALID')
    if (
      workloads.has(record.spiffeId) ||
      new Set(record.audiences).size !== record.audiences.length
    )
      throw new Error('WORKLOAD_POLICY_AUTH_DUPLICATE')
    workloads.set(record.spiffeId, new Set(record.audiences))
  }
  const tuples = new Set()
  for (const record of permission) {
    if (
      Object.keys(record).sort().join(',') !==
        'originalWorkloadSpiffeId,permissionCodes,policyVersion,scopeLevel,targetAudience' ||
      record.scopeLevel !== 'SYSTEM' ||
      record.originalWorkloadSpiffeId.includes('*') ||
      !WORKLOAD_AUDIENCE.test(record.targetAudience) ||
      record.policyVersion !== WORKLOAD_POLICY_VERSION
    )
      throw new Error('WORKLOAD_POLICY_PERMISSION_AUTHORITY_INVALID')
    const tuple = `${record.originalWorkloadSpiffeId}|${record.targetAudience}`
    if (tuples.has(tuple)) throw new Error('WORKLOAD_POLICY_PERMISSION_DUPLICATE')
    tuples.add(tuple)
    if (!workloads.get(record.originalWorkloadSpiffeId)?.has(record.targetAudience))
      throw new Error('WORKLOAD_POLICY_PERMISSION_NOT_REGISTERED')
    if (
      !Array.isArray(record.permissionCodes) ||
      !record.permissionCodes.length ||
      new Set(record.permissionCodes).size !== record.permissionCodes.length ||
      record.permissionCodes.some((code) => !INTERNAL_PERMISSION_CODE.test(code))
    )
      throw new Error('WORKLOAD_POLICY_PERMISSION_CODE_INVALID')
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.stdout.write(renderWorkloadPolicyEnvironment())
