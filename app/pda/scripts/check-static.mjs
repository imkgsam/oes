import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const manifest = readFileSync(resolve(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
const applicationTag = manifest.match(/<application\b[\s\S]*?>/)?.[0] ?? ''
assert.match(applicationTag, /android:icon="@drawable\/oes_pda_logo"/)
assert.match(applicationTag, /android:roundIcon="@drawable\/oes_pda_logo"/)
assert.ok(existsSync(resolve(root, 'android/app/src/main/res/drawable/oes_pda_logo.xml')))

const gradle = readFileSync(resolve(root, 'android/app/build.gradle.kts'), 'utf8')
const fallback = gradle.match(/System\.getenv\("PDA_BFF_BASE_URL"\)[\s\S]*?\?:\s*"([^"]+)"/)?.[1]
assert.equal(fallback, 'http://192.168.2.33:9101/api/v1')
console.log('PDA static checks passed')
