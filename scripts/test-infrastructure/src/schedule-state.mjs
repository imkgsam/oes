#!/usr/bin/env node
import { appendFileSync } from 'node:fs'

/** Selects the newest non-expired successful FULL evidence artifact. */
export function selectLatestFullEvidence(artifacts) {
  return artifacts
    .filter((artifact) => !artifact.expired && /^full-evidence-[0-9a-f]{40}$/.test(artifact.name))
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))[0] || null
}

/** Reads every artifact page through the GitHub Actions API. */
async function readArtifacts(repository, token) {
  const result = []
  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/artifacts?per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    if (!response.ok) throw new Error(`GitHub artifacts API failed: ${response.status}`)
    const pageValue = await response.json()
    result.push(...pageValue.artifacts)
    if (pageValue.artifacts.length < 100) break
  }
  return result
}

if (process.argv[1]?.endsWith('schedule-state.mjs')) {
  const repository = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  const output = process.env.GITHUB_OUTPUT
  if (!repository || !token || !output) throw new Error('GITHUB_REPOSITORY, GITHUB_TOKEN, and GITHUB_OUTPUT are required')
  const latest = selectLatestFullEvidence(await readArtifacts(repository, token))
  const sha = latest?.name.slice('full-evidence-'.length) || ''
  const created = latest?.created_at || ''
  appendFileSync(output, `last-full-sha=${sha}\nlast-full-at=${created}\n`)
  console.log(`SCHEDULE_STATE lastFullSha=${sha || 'none'} lastFullAt=${created || 'none'}`)
}
