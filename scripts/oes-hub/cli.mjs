import {
  claimOwnership,
  createTask,
  generatePrompt,
  listOwnersForPath,
  listInbox,
  loadState,
  reportBlocker,
  reportFailure,
  resolveDefaultStateFile,
  submitCheckpoint,
  submitHandoff,
  summarizeStatus,
  syncTask,
  syncThread,
} from './core.mjs';

// Runs the Command Hub CLI and prints deterministic text for Codex threads.
export async function runCli(argv = process.argv.slice(2), options = {}) {
  const stateFile = options.stateFile ?? resolveDefaultStateFile();
  const normalizedArgv = argv[0] === '--' ? argv.slice(1) : argv;
  const [command, subcommand, ...rest] = normalizedArgv;
  const flagArgs = subcommand?.startsWith('--') ? [subcommand, ...rest] : rest;
  const flags = parseFlags(flagArgs);

  if (command === 'task' && subcommand === 'create') {
    const task = await createTask(stateFile, {
      id: required(flags.id, '--id'),
      type: flags.type,
      parent: flags.parent,
      returnTarget: split(flags.returnTarget),
      scope: flags.scope,
      allowed: split(flags.allowed),
      forbidden: split(flags.forbidden),
    });
    return formatJson({ created: task });
  }

  if (command === 'tasks' && subcommand === 'list') {
    const state = await loadState(stateFile);
    return formatJson(Object.values(state.tasks));
  }

  if (command === 'threads' && subcommand === 'list') {
    const state = await loadState(stateFile);
    return formatJson(Object.values(state.threads));
  }

  if (command === 'sync') {
    if (flags.task) {
      return formatJson(await syncTask(stateFile, flags.task));
    }
    if (flags.thread) {
      return formatJson(await syncThread(stateFile, flags.thread));
    }
    throw new Error('sync requires --task or --thread');
  }

  if (command === 'whoami') {
    return formatJson(await syncThread(stateFile, required(flags.thread, '--thread')));
  }

  if (command === 'inbox') {
    return formatJson(await listInbox(stateFile, required(flags.thread, '--thread')));
  }

  if (command === 'prompt') {
    return `${await generatePrompt(stateFile, { taskId: flags.task, threadId: flags.thread })}\n`;
  }

  if (command === 'claim') {
    const result = await claimOwnership(stateFile, {
      threadId: required(flags.thread, '--thread'),
      write: split(flags.write),
    });
    return formatJson(result);
  }

  if (command === 'owners' && subcommand === 'path') {
    const targetPath = rest[0] ?? flags.path;
    return formatJson(await listOwnersForPath(stateFile, required(targetPath, 'path')));
  }

  if (command === 'checkpoint') {
    return formatJson(
      await submitCheckpoint(stateFile, {
        threadId: required(flags.thread, '--thread'),
        summary: flags.summary,
      }),
    );
  }

  if (command === 'blocker' && subcommand === 'report') {
    return formatJson(
      await reportBlocker(stateFile, {
        threadId: required(flags.thread, '--thread'),
        summary: flags.summary,
      }),
    );
  }

  if (command === 'failure' && subcommand === 'report') {
    return formatJson(
      await reportFailure(stateFile, {
        threadId: required(flags.thread, '--thread'),
        summary: flags.summary,
      }),
    );
  }

  if (command === 'handoff' && subcommand === 'submit') {
    return formatJson(
      await submitHandoff(stateFile, {
        threadId: required(flags.thread, '--thread'),
        summary: flags.summary,
      }),
    );
  }

  if (command === 'status') {
    return formatJson(await summarizeStatus(stateFile));
  }

  return usage();
}

// Parses --kebab-case flags into camelCase values without external dependencies.
function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (!item.startsWith('--')) {
      continue;
    }
    const key = toCamelCase(item.slice(2));
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

// Splits comma-separated CLI values into arrays.
function split(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// Converts dashed flag names to camelCase object keys.
function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Fails fast with a concise CLI error when a required value is absent.
function required(value, label) {
  if (!value) {
    throw new Error(`${label} is required`);
  }
  return value;
}

// Formats CLI responses as newline-terminated JSON for humans and scripts.
function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// Describes the supported MVP commands for new Codex threads.
function usage() {
  return `OES Codex Command Hub

Commands:
  task create --id <id> [--type design] [--parent <thread>] [--return-target a,b] [--scope <text>] [--allowed a,b] [--forbidden a,b]
  tasks list
  threads list
  sync --task <task-id>
  sync --thread <thread-id>
  whoami --thread <thread-id>
  inbox --thread <thread-id>
  prompt --task <task-id>
  prompt --thread <thread-id>
  claim --thread <thread-id> --write <path-or-glob>
  owners path <path>
  checkpoint --thread <thread-id> --summary <text>
  blocker report --thread <thread-id> --summary <text>
  failure report --thread <thread-id> --summary <text>
  handoff submit --thread <thread-id> --summary <text>
  status
`;
}
