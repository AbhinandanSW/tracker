import type { ActionSettings, Settings } from '@/types';

/**
 * The feed is published by the job_board Actions workflow. Both files are
 * plain JSON on GitHub Pages, so the app can read them directly.
 */
export const JOBS_URL = 'https://abhinandansw.github.io/job_board/jobs.json';

/** The workflow that refreshes JOBS_URL. Read-only in the app. */
export const JOB_BOARD_ACTIONS: ActionSettings = {
  owner: 'AbhinandanSW',
  repo: 'job_board',
  workflow: 'job-tracker.yml',
  branch: 'main',
};

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  sync: {
    owner: 'AbhinandanSW',
    repo: 'job-hunt-data',
    branch: 'main',
    path: 'state.json',
  },
  ai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
  },
};

function clean(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function mergeSettings(saved: Partial<Settings> | null | undefined): Settings {
  if (!saved) return DEFAULT_SETTINGS;
  return {
    themeMode:
      saved.themeMode === 'light' || saved.themeMode === 'dark' || saved.themeMode === 'system'
        ? saved.themeMode
        : DEFAULT_SETTINGS.themeMode,
    sync: {
      owner: clean(saved.sync?.owner, DEFAULT_SETTINGS.sync.owner),
      repo: clean(saved.sync?.repo, DEFAULT_SETTINGS.sync.repo),
      branch: clean(saved.sync?.branch, DEFAULT_SETTINGS.sync.branch) || 'main',
      path: clean(saved.sync?.path, DEFAULT_SETTINGS.sync.path) || 'state.json',
    },
    ai: {
      baseUrl: clean(saved.ai?.baseUrl, DEFAULT_SETTINGS.ai.baseUrl) || DEFAULT_SETTINGS.ai.baseUrl,
      model: clean(saved.ai?.model, DEFAULT_SETTINGS.ai.model) || DEFAULT_SETTINGS.ai.model,
    },
  };
}

export function othersUrlFrom(jobsUrl: string): string {
  if (/jobs\.json(\?.*)?$/.test(jobsUrl)) {
    return jobsUrl.replace(/jobs\.json(\?.*)?$/, (match) =>
      match.replace('jobs.json', 'others.json'),
    );
  }
  try {
    const url = new URL(jobsUrl);
    url.pathname = url.pathname.replace(/[^/]*$/, 'others.json');
    return url.toString();
  } catch {
    return jobsUrl;
  }
}

export function repoSlug(config: { owner: string; repo: string }): string {
  return `${config.owner}/${config.repo}`;
}

export function hasSyncConfig(config: { owner: string; repo: string }): boolean {
  return Boolean(config.owner.trim() && config.repo.trim());
}
