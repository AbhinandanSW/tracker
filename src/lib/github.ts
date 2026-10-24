import { decodeBase64, encodeBase64 } from '@/lib/base64';
import type { ActionSettings, SyncSettings, WorkflowRun } from '@/types';

const API = 'https://api.github.com';

export class GitHubError extends Error {
  status: number;
  conflict: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.conflict = status === 409 || status === 412 || status === 422;
  }
}

function headers(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...headers(token),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // The body may not be JSON.
    }
    if (response.status === 401) message = 'Token rejected. Check that it is valid and not expired.';
    if (response.status === 403) message = 'Token lacks permission, or GitHub rate-limited the request.';
    if (response.status === 404) message = 'Not found. Check the owner, repository and file path.';
    throw new GitHubError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function filePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

export type FilePayload<T> = {
  data: T | null;
  sha: string | null;
};

export async function readJsonFile<T>(
  config: SyncSettings,
  token: string,
): Promise<FilePayload<T>> {
  const path = `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${filePath(config.path)}?ref=${encodeURIComponent(config.branch)}`;
  try {
    const body = await request<{ content: string; encoding: string; sha: string }>(path, token);
    // GitHub always returns file contents as base64 (with newlines every 60 chars).
    const text = decodeBase64(body.content);
    return { data: JSON.parse(text) as T, sha: body.sha };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) {
      return { data: null, sha: null };
    }
    throw error;
  }
}

export async function writeJsonFile<T>(
  config: SyncSettings,
  token: string,
  data: T,
  sha: string | null,
  message: string,
): Promise<string> {
  const path = `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${filePath(config.path)}`;
  const body = await request<{ content: { sha: string } }>(path, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(JSON.stringify(data, null, 2)),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  return body.content.sha;
}

export async function checkRepo(
  config: SyncSettings,
  token: string,
): Promise<{ ok: true; private: boolean; defaultBranch: string } | { ok: false; message: string }> {
  try {
    const repo = await request<{ private: boolean; default_branch: string }>(
      `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`,
      token,
    );
    return { ok: true, private: repo.private, defaultBranch: repo.default_branch };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not reach GitHub.' };
  }
}

export async function dispatchWorkflow(
  config: ActionSettings,
  token: string,
  inputs: Record<string, string | boolean> = {},
): Promise<void> {
  await request(
    `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/actions/workflows/${encodeURIComponent(config.workflow)}/dispatches`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ ref: config.branch, inputs }),
    },
  );
}

export async function listWorkflowRuns(
  config: ActionSettings,
  token: string,
): Promise<WorkflowRun[]> {
  const data = await request<{ workflow_runs: WorkflowRun[] }>(
    `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/actions/workflows/${encodeURIComponent(config.workflow)}/runs?event=workflow_dispatch&per_page=6`,
    token,
  );
  return data.workflow_runs ?? [];
}

export async function getWorkflowRun(
  config: ActionSettings,
  token: string,
  runId: number,
): Promise<WorkflowRun> {
  return request<WorkflowRun>(
    `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/actions/runs/${runId}`,
    token,
  );
}

export function repoUrl(config: { owner: string; repo: string }): string {
  return `https://github.com/${config.owner}/${config.repo}`;
}

export function newFileUrl(config: SyncSettings): string {
  return `https://github.com/${config.owner}/${config.repo}/new/${encodeURIComponent(config.branch)}?filename=${encodeURIComponent(config.path)}`;
}
