export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  exp?: string;
  skills?: string[];
  /** The day the opening was posted (or first seen). Format: YYYY-MM-DD. */
  day: string;
  first_seen: string;
  source: string;
  remote?: boolean;
  /** Present on jobs from others.json: why it did not match the tracker filters. */
  why?: string;
  /** Present when the source stopped listing the opening. Format: YYYY-MM-DD. */
  gone?: string;
  /** Added client-side: true for jobs.json, false for others.json. */
  match: boolean;
};

export type JobSearchLink = {
  name: string;
  url: string;
};

export type JobFeed = {
  updated?: string;
  jobs: Omit<Job, 'match'>[];
  links?: JobSearchLink[];
  apify_runs?: Record<string, string>;
};

/** Stages a job can be in. "open" is a tombstone used to reset and sync a job. */
export type JobStatus =
  | 'open'
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'hidden';

export type TimelineEntry = {
  status: JobStatus;
  at: string;
};

export type JobSnapshot = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  day?: string;
  exp?: string;
  remote?: boolean;
};

export type ApplicationRecord = {
  status: JobStatus;
  /** ISO timestamp of the last change. Used to merge copies from multiple devices. */
  updatedAt: string;
  savedAt?: string;
  appliedAt?: string;
  /** YYYY-MM-DD. */
  followUpAt?: string;
  notes?: string;
  coverLetter?: string;
  resumeBullets?: string;
  resumeVersion?: string;
  timeline?: TimelineEntry[];
  /** Snapshot so the tracker still works after a job leaves the feed. */
  job?: JobSnapshot;
};

export type ProfileLink = {
  label: string;
  url: string;
};

export type Profile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  years: string;
  links: ProfileLink[];
  resume: string;
};

export type SharedState = {
  version: 1;
  updatedAt: string;
  records: Record<string, ApplicationRecord>;
  profile: Profile;
  profileUpdatedAt: string;
};

export type SyncSettings = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

export type ActionSettings = {
  owner: string;
  repo: string;
  workflow: string;
  branch: string;
};

export type AiSettings = {
  baseUrl: string;
  model: string;
};

export type ThemeMode = 'system' | 'light' | 'dark';

export type Settings = {
  themeMode: ThemeMode;
  sync: SyncSettings;
  ai: AiSettings;
};

export type Secrets = {
  githubToken: string;
  aiApiKey: string;
};

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'pending' | 'error';

export type Toast = {
  message: string;
  tone?: 'default' | 'success' | 'error';
  actionLabel?: string;
  onAction?: () => void;
};

export type TabKey = 'for-you' | 'general' | 'saved' | 'applied' | 'hidden';

export type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
};
