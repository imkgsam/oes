import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { loadState, saveState } from './store.mjs';

export { loadState } from './store.mjs';

const ACTIVE_OWNERSHIP_STATUSES = new Set(['assigned', 'active', 'blocked']);

// Resolves the default shared Hub state path for all worktrees of the same Git repository.
export function resolveDefaultStateFile(cwd = process.cwd()) {
  if (process.env.OES_HUB_STATE) {
    return process.env.OES_HUB_STATE;
  }

  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const absoluteCommonDir = path.isAbsolute(commonDir) ? commonDir : path.resolve(cwd, commonDir);
    return path.join(absoluteCommonDir, 'oes-hub', 'state.json');
  } catch {
    return path.join(homedir(), '.oes', 'codex-command-hub', 'state.json');
  }
}

// Creates or replaces a task and ensures a matching thread identity exists.
export async function createTask(stateFile, taskInput) {
  if (!taskInput.id) {
    throw new Error('task id is required');
  }

  const state = await loadState(stateFile);
  const task = normalizeTask(taskInput);
  state.tasks[task.id] = task;
  state.threads[task.id] = {
    id: task.id,
    taskId: task.id,
    type: task.type,
    parent: task.parent,
    returnTarget: task.returnTarget,
    status: task.status,
    scope: task.scope,
    allowed: task.allowed,
    forbidden: task.forbidden,
    resumeInstruction: task.resumeInstruction,
    updatedAt: task.updatedAt,
  };
  await saveState(stateFile, state);
  return task;
}

// Returns the identity package a Codex thread receives when starting from a task.
export async function syncTask(stateFile, taskId) {
  const state = await loadState(stateFile);
  const task = state.tasks[taskId];
  if (!task) {
    throw new Error(`task not found: ${taskId}`);
  }

  const thread = state.threads[taskId] ?? {
    id: taskId,
    taskId,
    type: task.type,
    parent: task.parent,
    returnTarget: task.returnTarget,
    status: task.status,
    scope: task.scope,
    allowed: task.allowed,
    forbidden: task.forbidden,
    resumeInstruction: task.resumeInstruction,
    updatedAt: new Date().toISOString(),
  };
  state.threads[taskId] = thread;
  await saveState(stateFile, state);
  return buildSyncPayload(task, thread);
}

// Returns the identity package a Codex thread receives when resuming by thread id.
export async function syncThread(stateFile, threadId) {
  const state = await loadState(stateFile);
  const thread = state.threads[threadId];
  if (!thread) {
    throw new Error(`thread not found: ${threadId}`);
  }
  const task = state.tasks[thread.taskId] ?? thread;
  return buildSyncPayload(task, thread);
}

// Registers write ownership for a thread when no active overlapping owner exists.
export async function claimOwnership(stateFile, claimInput) {
  if (!claimInput.threadId) {
    throw new Error('thread id is required');
  }
  const write = normalizeArray(claimInput.write);
  if (write.length === 0) {
    throw new Error('at least one write path is required');
  }

  const state = await loadState(stateFile);
  ensureThread(state, claimInput.threadId);
  const conflicts = [];

  for (const requestedPath of write) {
    for (const ownership of state.ownerships) {
      if (ownership.threadId === claimInput.threadId) {
        continue;
      }
      if (!ACTIVE_OWNERSHIP_STATUSES.has(state.threads[ownership.threadId]?.status ?? ownership.status)) {
        continue;
      }
      for (const ownedPath of ownership.write) {
        if (patternsOverlap(ownedPath, requestedPath)) {
          conflicts.push({
            owner: ownership.threadId,
            ownedPath,
            requestedPath,
          });
        }
      }
    }
  }

  if (conflicts.length > 0) {
    return { allowed: false, conflicts };
  }

  const ownership = {
    threadId: claimInput.threadId,
    write,
    status: 'active',
    claimedAt: new Date().toISOString(),
  };
  state.ownerships.push(ownership);
  state.threads[claimInput.threadId].status = 'active';
  state.threads[claimInput.threadId].updatedAt = ownership.claimedAt;
  await saveState(stateFile, state);
  return { allowed: true, ownership, conflicts: [] };
}

// Lists active owners whose write claims cover the provided path.
export async function listOwnersForPath(stateFile, candidatePath) {
  const state = await loadState(stateFile);
  const normalizedPath = normalizePattern(candidatePath);
  return state.ownerships
    .filter((ownership) =>
      ownership.write.some((ownedPath) => patternMatchesPath(ownedPath, normalizedPath)),
    )
    .map((ownership) => ({
      threadId: ownership.threadId,
      write: ownership.write,
      status: state.threads[ownership.threadId]?.status ?? ownership.status,
    }));
}

// Lists messages addressed to a thread without requiring the thread to be online.
export async function listInbox(stateFile, threadId) {
  const state = await loadState(stateFile);
  return state.messages.filter((message) => {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    return recipients.includes(threadId);
  });
}

// Records a lightweight progress checkpoint without closing the thread.
export async function submitCheckpoint(stateFile, input) {
  return appendThreadEvent(stateFile, input.threadId, 'checkpoint', input.summary, 'active');
}

// Records a blocker and marks the thread as blocked for parent or command review.
export async function reportBlocker(stateFile, input) {
  return appendThreadEvent(stateFile, input.threadId, 'blocker', input.summary, 'blocked');
}

// Records a failure and marks the thread as failed for ownership routing.
export async function reportFailure(stateFile, input) {
  return appendThreadEvent(stateFile, input.threadId, 'failure', input.summary, 'failed');
}

// Records final task handoff and marks the thread as returned.
export async function submitHandoff(stateFile, input) {
  return appendThreadEvent(stateFile, input.threadId, 'handoff', input.summary, 'returned');
}

// Produces the short startup prompt humans can paste into a new Codex thread.
export async function generatePrompt(stateFile, input) {
  const target = input.taskId
    ? `node scripts/oes-hub.mjs sync --task ${input.taskId}`
    : `node scripts/oes-hub.mjs sync --thread ${input.threadId}`;
  if (!input.taskId && !input.threadId) {
    throw new Error('taskId or threadId is required');
  }

  return [
    '你是 OES Codex thread。',
    `先运行：${target}`,
    '严格按照 Hub 返回的 identity、scope、ownership、forbidden files、parent、return target 执行。',
    '修改任何文件前必须先 claim。',
    '完成、阻塞或失败时必须通过 Hub handoff / blocker / failure 上报。',
  ].join('\n');
}

// Summarizes current Hub state for Global Command and management threads.
export async function summarizeStatus(stateFile) {
  const state = await loadState(stateFile);
  return {
    tasks: Object.keys(state.tasks).length,
    threads: Object.keys(state.threads).length,
    activeThreads: Object.values(state.threads).filter((thread) => thread.status === 'active').length,
    blockedThreads: Object.values(state.threads).filter((thread) => thread.status === 'blocked').length,
    returnedThreads: Object.values(state.threads).filter((thread) => thread.status === 'returned').length,
    ownerships: state.ownerships.length,
    events: state.events.length,
  };
}

// Converts task input into the stable state shape used by sync and prompt commands.
function normalizeTask(input) {
  const now = new Date().toISOString();
  return {
    id: input.id,
    type: input.type ?? 'task',
    parent: input.parent ?? 'control-global-roadmap',
    returnTarget: normalizeArray(input.returnTarget),
    status: input.status ?? 'assigned',
    scope: input.scope ?? '',
    allowed: normalizeArray(input.allowed),
    forbidden: normalizeArray(input.forbidden),
    resumeInstruction: input.resumeInstruction ?? 'Sync complete. Continue according to the task scope.',
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

// Builds the concise identity payload displayed to a starting or resuming thread.
function buildSyncPayload(task, thread) {
  return {
    threadId: thread.id,
    taskId: thread.taskId ?? task.id,
    type: thread.type ?? task.type,
    parent: thread.parent ?? task.parent,
    returnTarget: thread.returnTarget ?? task.returnTarget,
    status: thread.status ?? task.status,
    scope: thread.scope ?? task.scope,
    allowed: thread.allowed ?? task.allowed,
    forbidden: thread.forbidden ?? task.forbidden,
    resumeInstruction: thread.resumeInstruction ?? task.resumeInstruction,
  };
}

// Ensures event-only threads can still be tracked by Hub state.
function ensureThread(state, threadId) {
  if (!state.threads[threadId]) {
    state.threads[threadId] = {
      id: threadId,
      taskId: threadId,
      type: 'unregistered',
      parent: 'unknown',
      returnTarget: [],
      status: 'active',
      scope: '',
      allowed: [],
      forbidden: [],
      resumeInstruction: 'Thread was auto-registered by Hub event.',
      updatedAt: new Date().toISOString(),
    };
  }
}

// Appends a thread-scoped event and updates the thread lifecycle status.
async function appendThreadEvent(stateFile, threadId, type, summary, status) {
  if (!threadId) {
    throw new Error('thread id is required');
  }
  const state = await loadState(stateFile);
  ensureThread(state, threadId);
  const event = {
    id: `${Date.now()}-${state.events.length + 1}`,
    threadId,
    type,
    summary: summary ?? '',
    createdAt: new Date().toISOString(),
  };
  state.events.push(event);
  state.threads[threadId].status = status;
  state.threads[threadId].updatedAt = event.createdAt;
  await saveState(stateFile, state);
  return event;
}

// Coerces CLI comma-separated input and arrays into clean string arrays.
function normalizeArray(value) {
  if (!value) {
    return [];
  }
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values.map((item) => item.trim()).filter(Boolean);
}

// Normalizes path-like patterns for deterministic overlap checks.
function normalizePattern(pattern) {
  return String(pattern).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

// Detects whether two exact-or-prefix-glob patterns can touch the same path.
function patternsOverlap(left, right) {
  const a = normalizePattern(left);
  const b = normalizePattern(right);
  if (a === b) {
    return true;
  }
  if (a.endsWith('/**')) {
    return patternMatchesPath(a, b) || b.startsWith(`${a.slice(0, -3)}/**`);
  }
  if (b.endsWith('/**')) {
    return patternMatchesPath(b, a) || a.startsWith(`${b.slice(0, -3)}/**`);
  }
  return false;
}

// Matches exact paths or simple directory prefix globs ending in /**.
function patternMatchesPath(pattern, candidatePath) {
  const normalizedPattern = normalizePattern(pattern);
  const normalizedPath = normalizePattern(candidatePath);
  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  }
  return normalizedPattern === normalizedPath;
}
