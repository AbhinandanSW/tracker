import type {
  ApplicationRecord,
  Job,
  JobSnapshot,
  JobStatus,
  Profile,
  SharedState,
} from '@/types';

export const EMPTY_PROFILE: Profile = {
  name: '',
  email: '',
  phone: '',
  location: '',
  headline: '',
  years: '',
  links: [],
  resume: '',
};

export function createEmptyState(): SharedState {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    records: {},
    profile: { ...EMPTY_PROFILE },
    profileUpdatedAt: new Date(0).toISOString(),
  };
}

export function snapshotFromJob(job: Job): JobSnapshot {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    url: job.url,
    source: job.source,
    day: job.day,
    exp: job.exp,
    remote: job.remote,
  };
}

/** Rebuild enough of a Job for records whose opening has left the feed. */
export function jobFromSnapshot(job: Job | JobSnapshot): Job {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    url: job.url,
    source: job.source,
    day: job.day ?? '',
    first_seen: job.day ?? '',
    exp: job.exp,
    remote: job.remote,
    skills: 'skills' in job ? (job.skills ?? []) : [],
    match: true,
  };
}

export const PIPELINE: { status: Exclude<JobStatus, 'open' | 'hidden'>; label: string }[] = [
  { status: 'saved', label: 'Saved' },
  { status: 'applied', label: 'Applied' },
  { status: 'interview', label: 'Interview' },
  { status: 'offer', label: 'Offer' },
  { status: 'rejected', label: 'Rejected' },
];

const MAX_TOMBSTONE_AGE_DAYS = 120;

function isRecord(value: unknown): value is ApplicationRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ApplicationRecord>;
  return typeof record.status === 'string' && typeof record.updatedAt === 'string';
}

function sanitizeRecords(records: unknown): Record<string, ApplicationRecord> {
  if (!records || typeof records !== 'object') return {};
  const clean: Record<string, ApplicationRecord> = {};
  for (const [id, value] of Object.entries(records)) {
    if (isRecord(value)) clean[id] = value;
  }
  return clean;
}

export function normalizeState(value: Partial<SharedState> | null | undefined): SharedState {
  if (!value) return createEmptyState();
  const profile = { ...EMPTY_PROFILE, ...(value.profile ?? {}) };
  return {
    version: 1,
    updatedAt: value.updatedAt ?? new Date(0).toISOString(),
    records: sanitizeRecords(value.records),
    profile: {
      ...profile,
      links: Array.isArray(profile.links)
        ? profile.links.filter((link) => link && typeof link.url === 'string')
        : [],
    },
    profileUpdatedAt: value.profileUpdatedAt ?? new Date(0).toISOString(),
  };
}

/** Per-record last-write-wins merge. Ties go to the local copy. */
export function mergeSharedStates(
  local: SharedState | null,
  remote: SharedState | null,
): SharedState {
  if (!local) return normalizeState(remote);
  if (!remote) return normalizeState(local);

  const left = normalizeState(local);
  const right = normalizeState(remote);
  const records: Record<string, ApplicationRecord> = { ...right.records };

  for (const [id, record] of Object.entries(left.records)) {
    const other = records[id];
    if (!other || record.updatedAt >= other.updatedAt) records[id] = record;
  }

  const cutoff = Date.now() - MAX_TOMBSTONE_AGE_DAYS * 86_400_000;
  for (const [id, record] of Object.entries(records)) {
    if (record.status === 'open' && new Date(record.updatedAt).getTime() < cutoff) {
      delete records[id];
    }
  }

  return {
    version: 1,
    updatedAt: left.updatedAt > right.updatedAt ? left.updatedAt : right.updatedAt,
    records,
    profile: left.profileUpdatedAt >= right.profileUpdatedAt ? left.profile : right.profile,
    profileUpdatedAt:
      left.profileUpdatedAt >= right.profileUpdatedAt
        ? left.profileUpdatedAt
        : right.profileUpdatedAt,
  };
}

export function statusLabel(status: JobStatus): string {
  if (status === 'open') return 'Open';
  return status[0].toUpperCase() + status.slice(1);
}

export function isActiveRecord(record?: ApplicationRecord): boolean {
  return Boolean(record && record.status !== 'open');
}

export function buildRecord(
  previous: ApplicationRecord | undefined,
  status: JobStatus,
  job: Job,
  extra: Partial<ApplicationRecord> = {},
): ApplicationRecord {
  const now = new Date().toISOString();
  const timeline = previous?.timeline ? [...previous.timeline] : [];
  if (!previous || previous.status !== status) {
    timeline.push({ status, at: now });
  }

  return {
    ...previous,
    ...extra,
    status,
    job: snapshotFromJob(job),
    updatedAt: now,
    savedAt:
      status === 'saved'
        ? (previous?.savedAt ?? now)
        : status === 'open'
          ? undefined
          : previous?.savedAt,
    appliedAt:
      status === 'applied' ||
      status === 'interview' ||
      status === 'offer' ||
      status === 'rejected'
        ? (previous?.appliedAt ?? now)
        : status === 'open'
          ? undefined
          : previous?.appliedAt,
    timeline: timeline.slice(-30),
  };
}
