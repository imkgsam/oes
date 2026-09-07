import { spawn, spawnSync } from 'node:child_process'

/** Executes a command and returns literal output without printing secret-bearing arguments. */
export function runChecked(command, args, { cwd, env = process.env, input, timeout = 120000 } = {}) {
  const result = spawnSync(command, args, { cwd, env, input, encoding: 'utf8', timeout, maxBuffer: 20 * 1024 * 1024 })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const error = new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
    error.stdout = result.stdout
    error.stderr = result.stderr
    error.status = result.status
    throw error
  }
  return { stdout: result.stdout, stderr: result.stderr, status: result.status }
}

/** Spawns one host process with an explicit environment and no inherited launcher bindings. */
export function spawnHost(command, args, { cwd, environment, stdio = 'inherit' } = {}) {
  return spawn(command, args, { cwd, env: environment, stdio })
}
