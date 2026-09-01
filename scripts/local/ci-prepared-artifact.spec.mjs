import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { restoreSharedPrismaEngine, stageSharedPrismaEngine } from './ci-prepared-artifact.mjs'

test('shared Prisma engine staging and restore deduplicate exact generated targets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-ci-prepared-'))
  const artifactRoot = path.join(root, 'artifact')
  const generatedRoots = ['one', 'two'].map((name) => {
    const target = path.join(root, 'src', name, 'prisma', 'generated', 'prisma')
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(path.join(target, 'libquery_engine-fixture.so.node'), 'same-engine')
    return target
  })
  try {
    const manifest = stageSharedPrismaEngine(root, artifactRoot, generatedRoots)
    for (const target of generatedRoots) fs.rmSync(path.join(target, manifest.engineFileName))
    assert.doesNotThrow(() => restoreSharedPrismaEngine(root, artifactRoot, generatedRoots))
    const inodes = generatedRoots.map(
      (target) => fs.statSync(path.join(target, manifest.engineFileName)).ino
    )
    assert.equal(new Set(inodes).size, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('shared Prisma engine restore rejects a changed exact target inventory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-ci-prepared-'))
  const artifactRoot = path.join(root, 'artifact')
  const generated = path.join(root, 'src', 'one', 'prisma', 'generated', 'prisma')
  fs.mkdirSync(generated, { recursive: true })
  fs.writeFileSync(path.join(generated, 'libquery_engine-fixture.so.node'), 'same-engine')
  try {
    stageSharedPrismaEngine(root, artifactRoot, [generated])
    const foreign = path.join(root, 'src', 'two', 'prisma', 'generated', 'prisma')
    fs.mkdirSync(foreign, { recursive: true })
    assert.throws(
      () => restoreSharedPrismaEngine(root, artifactRoot, [foreign]),
      /CI_PREPARED_ENGINE_MANIFEST_INVALID/
    )
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
