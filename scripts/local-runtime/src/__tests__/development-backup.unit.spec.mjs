import assert from 'node:assert/strict'
import test from 'node:test'
import { fingerprint } from '../canonical.mjs'
import { restoreDevelopmentState } from '../development-backup.mjs'

test('DEV restore fails before target access without a separate exact confirmation', () => {
  const raw = { schemaVersion: 2, kind: 'OES_DEV_STATE_BACKUP', manifestFingerprint: 'manifest', devStackId: 'machine_fixture', taskKey: 'task_fixture', runId: 'run_fixture', sourcesPreserved: true, backups: [] }
  const record = { ...raw, backupFingerprint: fingerprint(raw) }
  assert.throws(() => restoreDevelopmentState('/does/not/exist', record, { kind: 'OES_DEV_RESTORE_CONFIRMATION', status: 'PENDING', backupFingerprint: record.backupFingerprint }), /DEV_RESTORE_CONFIRMATION_INVALID/u)
  assert.throws(() => restoreDevelopmentState('/does/not/exist', { ...record, runId: 'drift' }, {}), /DEV_BACKUP_FINGERPRINT_MISMATCH/u)
})
