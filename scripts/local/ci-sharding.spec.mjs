import assert from 'node:assert/strict'
import test from 'node:test'
import { parseParallelShardFlag, parseShardFlags, partitionWeighted } from './ci-sharding.mjs'

test('weighted partition is deterministic, complete, disjoint, and non-empty', () => {
  const items = [
    { key: 'alpha', weight: 5 },
    { key: 'beta', weight: 3 },
    { key: 'gamma', weight: 2 }
  ]
  const partition = partitionWeighted(
    items,
    2,
    (item) => item.key,
    (item) => item.weight
  )
  assert.deepEqual(
    partitionWeighted(
      items,
      2,
      (item) => item.key,
      (item) => item.weight
    ),
    partition
  )
  assert.deepEqual(
    partition
      .flatMap((shard) => shard.items)
      .map((item) => item.key)
      .sort(),
    ['alpha', 'beta', 'gamma']
  )
  assert.equal(new Set(partition.flatMap((shard) => shard.items)).size, items.length)
  assert.throws(
    () =>
      partitionWeighted(
        items,
        4,
        (item) => item.key,
        (item) => item.weight
      ),
    /CI_SHARD_EMPTY_FORBIDDEN/
  )
})

test('parallel flag is exact and remains separate from external shard flags', () => {
  const parallel = parseParallelShardFlag([
    '--parallel-shards',
    '3',
    '--shard-index',
    '1',
    '--shard-count',
    '2'
  ])
  assert.equal(parallel.parallelShardCount, 3)
  assert.deepEqual(parseShardFlags(parallel.remaining), {
    shardIndex: 1,
    shardCount: 2,
    remaining: []
  })
  for (const args of [
    ['--parallel-shards'],
    ['--parallel-shards', '0'],
    ['--parallel-shards', '1'],
    ['--parallel-shards', 'two'],
    ['--parallel-shards', '2', '--parallel-shards', '3']
  ]) {
    assert.throws(() => parseParallelShardFlag(args), /CI_PARALLEL_SHARD/)
  }
})
