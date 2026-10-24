import type { ApplicationRecord, Job, JobStatus, TabKey } from '@/types';
import { matchesQuery } from '@/lib/format';

export type RoleFilter = 'all' | 'frontend' | 'fullstack' | 'software' | 'backend' | 'other';
export type RegionFilter = 'all' | 'india' | 'abroad' | 'anywhere';
export type ModeFilter = 'all' | 'wfh' | 'wfo';

export type JobFilters = {
  tab: TabKey;
  query: string;
  role: RoleFilter;
  region: RegionFilter;
  mode: ModeFilter;
  source: string;
  newOnly: boolean;
};

export const DEFAULT_FILTERS: JobFilters = {
  tab: 'for-you',
  query: '',
  role: 'all',
  region: 'all',
  mode: 'all',
  source: '',
  newOnly: false,
};

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'for-you', label: 'For you' },
  { key: 'general', label: 'General' },
  { key: 'saved', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'hidden', label: 'Hidden' },
];

export const ROLE_OPTIONS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All roles' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'fullstack', label: 'Full stack' },
  { key: 'software', label: 'Software / SDE' },
  { key: 'backend', label: 'Backend' },
  { key: 'other', label: 'Other' },
];

export const REGION_OPTIONS: { key: RegionFilter; label: string }[] = [
  { key: 'all', label: 'All locations' },
  { key: 'india', label: 'India' },
  { key: 'abroad', label: 'Outside India' },
  { key: 'anywhere', label: 'Remote anywhere' },
];

export const MODE_OPTIONS: { key: ModeFilter; label: string }[] = [
  { key: 'all', label: 'Any mode' },
  { key: 'wfh', label: 'Remote' },
  { key: 'wfo', label: 'Office' },
];

const INDIA_RE =
  /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|ahmedabad|jaipur|kochi|cochin|indore|chandigarh|mohali|coimbatore|nagpur|lucknow|vadodara|surat|bhubaneswar|thiruvananthapuram|mysuru|mysore|\bncr\b|karnataka|maharashtra|telangana|tamil nadu|haryana|uttar pradesh/i;

const ROLE_RE: Record<Exclude<RoleFilter, 'all' | 'other'>, RegExp> = {
  frontend:
    /front[\s-]?end|react|next[\s.]?js|\bui\b|ui\/ux|angular|\bvue|svelte|web (developer|engineer)|javascript|\bjs\b/i,
  fullstack: /full[\s-]?stack|\bmern\b|\bmean\b/i,
  software: /software|\bsde\b|\bswe\b/i,
  backend: /back[\s-]?end|\bjava\b|python|golang|node/i,
};

const REMOTE_RE = /remote|work from home|wfh|anywhere|worldwide/i;

export function roleOf(job: Pick<Job, 'title'>): Exclude<RoleFilter, 'all'>[] {
  const roles = (Object.keys(ROLE_RE) as Exclude<RoleFilter, 'all' | 'other'>[]).filter((key) =>
    ROLE_RE[key].test(job.title),
  );
  return roles.length ? roles : ['other'];
}

export function isRemote(job: Pick<Job, 'remote' | 'location'>): boolean {
  return Boolean(job.remote) || REMOTE_RE.test(job.location || '');
}

export function regionOf(job: Pick<Job, 'location'>): Exclude<RegionFilter, 'all'> {
  const location = job.location || '';
  if (INDIA_RE.test(location)) return 'india';
  if (
    !location.trim() ||
    /anywhere|worldwide|global|everywhere|^\s*remote\s*$/i.test(location)
  ) {
    return 'anywhere';
  }
  return 'abroad';
}

export function statusOf(record?: ApplicationRecord): JobStatus | 'open' {
  return record?.status ?? 'open';
}

export function tabForJob(job: Job, record?: ApplicationRecord): TabKey {
  const status = statusOf(record);
  if (status === 'hidden') return 'hidden';
  if (status === 'saved') return 'saved';
  if (status === 'applied' || status === 'interview' || status === 'offer' || status === 'rejected') {
    return 'applied';
  }
  return job.match ? 'for-you' : 'general';
}

function matchesNonTabFilters(job: Job, filters: JobFilters): boolean {
  if (filters.source && job.source !== filters.source) return false;
  if (filters.newOnly && !isNewWithin(job.first_seen, 3)) return false;
  if (filters.role !== 'all' && !roleOf(job).includes(filters.role)) return false;
  if (filters.region !== 'all' && regionOf(job) !== filters.region) return false;
  if (filters.mode !== 'all' && (filters.mode === 'wfh') !== isRemote(job)) return false;
  if (job.gone && filters.tab !== 'applied' && filters.tab !== 'hidden') {
    // Gone jobs stay available in the archive tabs only; hide them from the feed.
    return false;
  }
  return matchesQuery(filters.query, [
    job.title,
    job.company,
    job.location,
    job.exp,
    job.source,
    ...(job.skills ?? []),
  ]);
}

function isNewWithin(day: string, days: number): boolean {
  const then = new Date(`${day}T00:00:00`).getTime();
  const diff = Date.now() - then;
  return diff >= 0 && diff <= days * 86_400_000;
}

export function filterJobs(
  jobs: Job[],
  records: Record<string, ApplicationRecord>,
  filters: JobFilters,
): Job[] {
  return jobs.filter(
    (job) =>
      tabForJob(job, records[job.id]) === filters.tab && matchesNonTabFilters(job, filters),
  );
}

export function countByTab(
  jobs: Job[],
  records: Record<string, ApplicationRecord>,
  filters: JobFilters,
): Record<TabKey, number> {
  const counts: Record<TabKey, number> = {
    'for-you': 0,
    general: 0,
    saved: 0,
    applied: 0,
    hidden: 0,
  };
  const base = { ...filters };
  for (const job of jobs) {
    if (!matchesNonTabFilters(job, base)) continue;
    counts[tabForJob(job, records[job.id])] += 1;
  }
  return counts;
}

export function countByOption<T extends string>(
  jobs: Job[],
  records: Record<string, ApplicationRecord>,
  filters: JobFilters,
  group: 'role' | 'region' | 'mode',
  option: T,
): number {
  return jobs.filter((job) => {
    if (tabForJob(job, records[job.id]) !== filters.tab) return false;
    if (!matchesNonTabFilters(job, { ...filters, [group]: 'all' })) return false;
    if (option === 'all') return true;
    if (group === 'role') return roleOf(job).includes(option as Exclude<RoleFilter, 'all'>);
    if (group === 'region') return regionOf(job) === option;
    return (option === 'wfh') === isRemote(job);
  }).length;
}

export function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const day = (b.day || '').localeCompare(a.day || '');
    if (day !== 0) return day;
    const first = (b.first_seen || '').localeCompare(a.first_seen || '');
    if (first !== 0) return first;
    return a.title.localeCompare(b.title);
  });
}

export function groupJobsByDay(jobs: Job[]): { day: string; jobs: Job[] }[] {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = job.day || job.first_seen || '';
    const list = groups.get(key);
    if (list) list.push(job);
    else groups.set(key, [job]);
  }
  return [...groups.entries()].map(([day, list]) => ({ day, jobs: list }));
}

export function sourcesOf(jobs: Job[]): string[] {
  return [...new Set(jobs.map((job) => job.source).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}
