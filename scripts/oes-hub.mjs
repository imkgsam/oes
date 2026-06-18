#!/usr/bin/env node
import { runCli } from './oes-hub/cli.mjs';

// Entry point for the local OES Codex Command Hub CLI.
try {
  const output = await runCli();
  process.stdout.write(output);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
