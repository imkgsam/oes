/** Partitions weighted items deterministically with longest-first load balancing. */
export function partitionWeighted(items, shardCount, keyOf, weightOf) {
  if (!Number.isInteger(shardCount) || shardCount < 1) throw new Error('CI_SHARD_COUNT_INVALID')
  if (!Array.isArray(items) || items.length < shardCount)
    throw new Error('CI_SHARD_EMPTY_FORBIDDEN')
  const seen = new Set()
  const ordered = [...items]
    .map((item) => {
      const key = keyOf(item)
      const weight = weightOf(item)
      if (typeof key !== 'string' || key.length === 0 || seen.has(key))
        throw new Error(`CI_SHARD_KEY_INVALID key=${key}`)
      if (!Number.isInteger(weight) || weight < 1)
        throw new Error(`CI_SHARD_WEIGHT_INVALID key=${key}`)
      seen.add(key)
      return { item, key, weight }
    })
    .sort((left, right) => right.weight - left.weight || left.key.localeCompare(right.key))
  const shards = Array.from({ length: shardCount }, (_, index) => ({ index, weight: 0, items: [] }))
  for (const candidate of ordered) {
    const shard = [...shards].sort(
      (left, right) => left.weight - right.weight || left.index - right.index
    )[0]
    shard.items.push(candidate.item)
    shard.weight += candidate.weight
  }
  for (const shard of shards) {
    shard.items.sort((left, right) => keyOf(left).localeCompare(keyOf(right)))
    if (shard.items.length === 0) throw new Error(`CI_SHARD_EMPTY index=${shard.index}`)
  }
  return Object.freeze(
    shards.map((shard) => Object.freeze({ ...shard, items: Object.freeze(shard.items) }))
  )
}

/** Selects one validated shard while retaining the complete deterministic partition. */
export function selectWeightedShard(items, shardIndex, shardCount, keyOf, weightOf) {
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount)
    throw new Error(`CI_SHARD_INDEX_INVALID index=${shardIndex} count=${shardCount}`)
  return partitionWeighted(items, shardCount, keyOf, weightOf)[shardIndex]
}

/** Parses one optional internal parallel-shard count without consuming external shard flags. */
export function parseParallelShardFlag(args) {
  const remaining = []
  let parallelShardCount = null
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value !== '--parallel-shards') {
      remaining.push(value)
      continue
    }
    if (parallelShardCount !== null) throw new Error('CI_PARALLEL_SHARD_FLAG_DUPLICATE')
    const scalar = args[index + 1]
    if (scalar === undefined || !/^\d+$/.test(scalar) || Number(scalar) < 2)
      throw new Error('CI_PARALLEL_SHARD_COUNT_INVALID')
    parallelShardCount = Number(scalar)
    index += 1
  }
  return Object.freeze({ parallelShardCount, remaining: Object.freeze(remaining) })
}

/** Parses an optional exact --shard-index/--shard-count pair and returns remaining selectors. */
export function parseShardFlags(args) {
  const remaining = []
  let shardIndex = null
  let shardCount = null
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === '--') continue
    if (value === '--shard-index' || value === '--shard-count') {
      const scalar = args[index + 1]
      if (scalar === undefined || !/^\d+$/.test(scalar))
        throw new Error(`CI_SHARD_FLAG_INVALID flag=${value}`)
      if (value === '--shard-index') shardIndex = Number(scalar)
      else shardCount = Number(scalar)
      index += 1
    } else remaining.push(value)
  }
  if ((shardIndex === null) !== (shardCount === null)) throw new Error('CI_SHARD_FLAGS_INCOMPLETE')
  return Object.freeze({ shardIndex, shardCount, remaining: Object.freeze(remaining) })
}
